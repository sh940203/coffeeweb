-- 手動驗證使用者 Email (解決無法收到信或 Rate Limit 問題)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'huhu9402032@gmail.com';
