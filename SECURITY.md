# 資安評分與風險拆解 (Security Scorecard)

評分方法：每項風險以 **嚴重度 Severity (1–5) × 可能性 Likelihood (1–5) = 風險分 (1–25)**。
分數越高越危險。修復後重新評估，產出「修復前/後」對照。
參照基準：OWASP Top 10 (2021)、OWASP ASVS。

> 本檔隨每批次更新。下表為**批次 0（地基修復）**完成後的狀態。

## 風險對照表

| # | 風險項目 | OWASP | 修復前 (S×L=R) | 修復後 (S×L=R) | 狀態 | 對應修復 |
|---|----------|-------|----------------|----------------|------|----------|
| 1 | **價格竄改**：前端決定價格/總額下單 | A04 設計缺陷 | 5×5=**25** | 5×1=**5** | ✅ 已修 | `handle_checkout` v2 改為 DB 端重算價格與運費，前端只傳 `coffee_id+quantity`（`supabase/migrations/00_consolidated_schema.sql`、`CheckoutModal.tsx`） |
| 2 | **金流回調偽造/缺失**：ReturnURL 指向不存在路由，付款狀態不可信 | A08 軟體完整性 | 5×4=**20** | 5×1=**5** | ✅ 已修 | 新增 `/api/ecpay/callback` 並驗證 CheckMacValue + `timingSafeEqual`，驗章通過且 RtnCode=1 才標記 paid（`lib/ecpay.ts`、`api/ecpay/callback/route.ts`） |
| 3 | **機密外洩**：ECPay 金鑰寫死在程式碼 | A05 設定錯誤 | 3×3=**9** | 3×1=**3** | ✅ 已修 | 金鑰移至環境變數（`lib/ecpay.ts`、`.env.example`） |
| 4 | **反射型 XSS**：CVS callback 字串拼接門市資料 | A03 注入 | 4×3=**12** | 4×1=**4** | ✅ 已修 | 改用 JSON 序列化 + `<` 跳脫 + `textContent`（`api/cvs/callback/route.ts`） |
| 5 | **資料外洩**：profiles 政策 `USING(true)` 全表 email/role 可讀 | A01 存取控制 | 4×5=**20** | 4×1=**4** | ✅ 已修 | 改為「本人或 admin 才可讀」，並禁止自行升級 role（consolidated schema） |
| 6 | **權限繞過**：admin 角色僅前端檢查、middleware 用未驗簽的 getSession | A01 存取控制 | 4×3=**12** | 4×1=**4** | ✅ 已修 | middleware 改 `getUser()` 並伺服器端查 role 擋非 admin（`middleware.ts`） |
| 7 | **缺少安全標頭**：無 HSTS / X-Frame-Options / nosniff 等 | A05 設定錯誤 | 2×3=**6** | 2×1=**2** | ✅ 已修 | `next.config.ts` 加上安全標頭 |
| 8 | **超賣**：庫存非原子扣減 | A04 設計缺陷 | 3×3=**9** | 3×1=**3** | ✅ 已修 | `UPDATE ... WHERE stock>=qty` + `FOR UPDATE` 原子操作 |

## 綜合資安姿態 (Security Posture)

- 修復前總風險分：**113**
- 修復後總風險分：**30**（降幅 73%）
- 概念分數（100 為最佳）：**修復前 ≈ 38 / 100 → 修復後 ≈ 85 / 100**

## 依賴漏洞 (npm audit) — 2026-06 處理紀錄

- ✅ **Next.js 16.1.4 → 16.2.9**：修復多個 high 等級的 **Middleware/Proxy bypass** 漏洞（GHSA-26hh-7cqf-hhc6 等）。本站 admin 權限把關仰賴 middleware，屬直接相關，已升級。
- ✅ **`ws`（Supabase realtime 傳遞依賴）**：透過 `npm update @supabase/*` 升級後已消除。
- ⚠️ **`xlsx`（SheetJS）high 未解**：npm 上版本無官方修補（prototype pollution / ReDoS）。僅用於**後台**商品 Excel 匯入/匯出，輸入來源為管理員、非公開攻擊面，風險受限。建議改裝官方 CDN 版：`npm i https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`（待評估）。
- 其餘 moderate 多為 dev/建置工具傳遞依賴，不進入正式執行環境。

## 安全標頭 (next.config.ts) — 已強化

- ✅ **Content-Security-Policy** 已啟用，依實際來源設白名單：
  `img-src` 含 Unsplash / Supabase / QR 的 `data:` / placehold.co；`media-src 'self'`（hero.mp4）；
  `connect-src` 含 Supabase REST/Auth/Realtime(wss)；`form-action` 含 ECPay / ezship；
  `frame-ancestors 'self'`、`object-src 'none'`、`base-uri 'self'`。
  > 取捨：因 Next.js 與 framer-motion 需要、且超商選店 callback 回傳內嵌 `<script>`，`script-src`/`style-src` 保留 `'unsafe-inline'`。若日後要再強化可改 nonce-based CSP（需於 middleware 注入 nonce）。
- ✅ HSTS、X-Frame-Options、X-Content-Type-Options(nosniff)、Referrer-Policy、Permissions-Policy。

## 尚待處理（後續批次）

- [ ] xlsx 改用官方 CDN 版本（或改寫匯入/匯出避用 xlsx）。
- [ ] nonce-based CSP（移除 script-src 的 'unsafe-inline'）。
- [ ] 後台寫入（商品/訂單/會員）改走 service role 的 Route Handler，目前仍依賴 RLS。
- [ ] 速率限制 / CSRF token（表單與 RPC）評估。
- [ ] 訪客下單訂單查詢需 email + 訂單編號雙因素，避免遍歷。

## 必要環境變數（正式上線）

| 變數 | 用途 | 備註 |
|------|------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | 金流 callback 標記付款、後台寫入 | 僅伺服器端，嚴禁外洩 |
| `ECPAY_MERCHANT_ID/HASH_KEY/HASH_IV` | 綠界正式收款 | 需申請正式商店代號 |
| `NEXT_PUBLIC_SITE_URL` | callback / 導回網址 | 正式網域 |
