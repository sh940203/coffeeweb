-- =====================================================================
-- 訂單流程狀態擴充 — 對應實際手烘流程
-- 訂購(pending) → 確認數量(confirmed) → 統一烘焙(roasting)
--   → 挑豆封裝(packing) → 開賣貨便寄出(shipped) → 完成(completed)
-- 另保留 paid（ECPay 金流線）與 cancelled。
-- 可在 Supabase SQL Editor 直接執行（冪等）。
-- =====================================================================

-- 放寬 orders.status 的 CHECK 限制
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending','confirmed','roasting','packing','paid','shipped','completed','cancelled'));

-- tracking_number 在此流程用來存放「賣貨便寄件代碼 / 寄件連結」
-- （00_consolidated_schema.sql 已建立此欄位，這裡僅補上註解）
COMMENT ON COLUMN public.orders.tracking_number IS '賣貨便寄件代碼或寄件連結；後台產生 QR 供賣家到 7-11 掃描寄件';
