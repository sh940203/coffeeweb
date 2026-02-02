-- 將指定用戶提升為管理員
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'huhu9402032@gmail.com';
