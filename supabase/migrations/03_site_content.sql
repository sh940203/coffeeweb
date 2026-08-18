-- =====================================================================
-- 可自訂網站內容：公告跑馬燈、關於我們
-- 存於 app_settings（已於 00_consolidated_schema.sql 建立，含 RLS）。
-- 可在 Supabase SQL Editor 直接執行（冪等）。
-- =====================================================================

-- 公告（預設關閉）
INSERT INTO public.app_settings (key, value)
VALUES ('announcement', '{"enabled": false, "text": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 關於我們（預設空字串 → 前台沿用內建預設故事）
INSERT INTO public.app_settings (key, value)
VALUES ('about', '{"body": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
