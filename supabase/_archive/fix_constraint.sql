-- 1. Remove the strict constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add the correct constraint (Allowing both 'customer' and 'admin')
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'admin'));

-- 3. Backfill existing users again (Safe to run)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Set Admin (I will try both potential email spellings to be safe based on your logs)
UPDATE public.profiles
SET role = 'admin'
WHERE email IN ('huhu9402032@gmail.com', 'huhu940203@gmail.com');
