# COFFEE_SUMMARY — 專案確認報告

> 依程式碼、git 紀錄與專案文件查證。查不到者標「待確認」。產出日期：2026-11-01。

## 1. Commit 日期
- 第一筆：**2026-01-25**（Initial commit from Create Next App）
- 最新一筆：**2026-09-16**（fix: 頁尾文字改為 Produced by @SH Studio）
- 總 commit 數：30

## 2. 功能確認

| 功能 | 存在 | 完成度 | 依據 |
|---|---|---|---|
| 購物車 | ✅ | 完成 | `CartSidebar.tsx`、`cart/page.tsx`、`CartStore.ts`（zustand + localStorage 持久化） |
| 會員 | ✅ | 完成 | Supabase Auth、`profiles` 表、`account/profile`、`AdminMemberTable.tsx` |
| 願望清單 | ✅ | 完成 | `WishlistButton.tsx`、`account/wishlist`、`wishlists` 表（含 RLS） |
| 商品評論 | ✅ | 完成（功能面） | `ReviewSection.tsx`、`reviews` 表。註：評論 INSERT 僅需登入，無防洗版/審核機制 |
| 綠界金流（簽章 + CheckMacValue 驗證） | ✅ | 完成（測試環境） | `lib/ecpay.ts` 有 `generateCheckMacValue`（送單簽章）與 `verifyCheckMacValue`（含 `crypto.timingSafeEqual`）；`api/ecpay/callback` 驗章通過且 `RtnCode=1` 才標記付款。正式商店代號**待確認**（目前用官方測試碼預設值） |
| 7-11 賣貨便寄件 QR Code | ✅ | 完成 | `AdminOrderTable.tsx` 用 `qrcode` 套件 `QRCode.toDataURL` 由寄件代碼/連結生成 QR，供賣家到 7-11 掃描 |
| 後台商品管理 | ✅ | 完成 | `AdminProductTable.tsx`：新增/編輯/上下架/刪除、庫存、圖片上傳、Excel 匯入匯出 |
| 後台訂單管理 | ✅ | 完成 | `AdminOrderTable.tsx`：狀態推進、寄件 QR、複製出貨資訊；`AdminOrderForm.tsx` 可代客建單 |

### 訂單狀態流程（實際值）
- 資料庫 CHECK 允許（`02_order_pipeline.sql`）：`pending, confirmed, roasting, packing, paid, shipped, completed, cancelled`
- 前端流程順序（`constants.ts` 的 `ORDER_FLOW`）：**訂購 pending → 確認 confirmed → 烘焙 roasting → 挑豆封裝 packing → 已寄出 shipped → 完成 completed**（另有 `paid` 金流狀態與 `cancelled` 取消）
- 註：`00_consolidated_schema.sql` 原始 CHECK 僅 5 種狀態，由 `02_order_pipeline.sql` 放寬為 8 種。

## 3. RLS 政策與資料庫函式（白話）
- **RLS**（`00_consolidated_schema.sql` 共 17 條 policy）：商品公開可讀、僅 admin 可寫；profiles 僅本人或 admin 可讀、且禁止自行把自己升為 admin；訂單/明細僅本人或 admin 可讀；願望清單僅本人可讀寫。
- **`is_admin()`**：以 `SECURITY DEFINER` 判斷目前使用者是否為 admin，避免 profiles 政策查 profiles 造成的無限遞迴。
- **`handle_checkout()`**：結帳核心。前端只傳 `coffee_id + quantity`，函式以 DB 當下價格重算金額與運費、原子扣庫存（`WHERE stock>=qty`），防止前端竄改價格與超賣。
- **`mark_order_paid()`**：供金流 callback（service role）在驗章成功後把訂單標記為已付款。
- **`handle_new_user()`**：新使用者註冊時自動建立 profile。

## 4. OWASP 安全評估文件
- 檔名：**`SECURITY.md`**
- 基準：OWASP Top 10 (2021) + OWASP ASVS，含「修復前/後」風險評分（嚴重度×可能性）
- 涵蓋項目：價格竄改(A04)、金流回調偽造/缺失(A08)、金鑰外洩(A05)、反射型 XSS(A03)、profiles 資料外洩(A01)、權限繞過(A01)、缺安全標頭(A05)、超賣(A04)；另記錄 CSP 標頭、`npm audit`（含 Next.js middleware bypass 升級至 16.2.9）與殘留的 `xlsx` 風險。

## 5. 自動化測試
- **無**。package.json 無 test script，repo 內無 jest/vitest/playwright/cypress 設定或 `*.test.*`／`*.spec.*` 檔案。

## 6. 履歷上可能沒寫、但值得寫的功能／技術決策
- **伺服器端價格重算 + 原子庫存扣減**：以 DB RPC 杜絕前端竄改價格與超賣（而非前端信任）。
- **金流 callback 以 `timingSafeEqual` 做常數時間驗章**：防偽造付款通知與時序側信道。
- **RLS 無限遞迴的實務解法**：抽出 `is_admin()` SECURITY DEFINER 函式。
- **單一可信 schema + migration 管理**：整併早期零散 SQL 為 `migrations/`，並保留 `_archive/`。
- **全站可自訂內容系統**：以 `app_settings`（JSONB）驅動運費、公告跑馬燈、關於我們，前台共用一個 zustand store。
- **實際營運流程數位化**：訂單狀態對應真實手烘流程（烘焙→挑豆→封裝），後台生成賣貨便寄件 QR、代客建單（賴群組訂單）。
- **依賴漏洞主動處理**：發現並升級 Next.js middleware bypass 漏洞（直接影響 admin 權限把關）。
- **CSP 內容安全政策**：依實際載入來源設白名單（Unsplash/Supabase/QR data:/ECPay/ezship）。

---
### 待確認項目
- ECPay 是否已申請正式商店代號（目前程式預設為官方測試碼）。
- 線上 Supabase 是否已套用全部 migration（`01`~`03`）與設定 `SUPABASE_SERVICE_ROLE_KEY`。
