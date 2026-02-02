-- Super Fix Script for Coffee Website
-- 1. Reset Profiles Table (Keep data if possible, but relax constraints)
DO $$ 
BEGIN
    -- Drop constraint if exists
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add loose constraint
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('customer', 'admin'));
    
EXCEPTION
    WHEN undefined_table THEN
        -- If table missing, create it
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            role TEXT DEFAULT 'customer',
            created_at TIMESTAMPTZ DEFAULT now()
        );
END $$;

-- 2. Ensure RLS is ON
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Reset Policies (Prevent recursion or blocking)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Ensure Orders Policies DO NOT use recursive checks
-- Simplify Admin Check to just "Is there an admin profile for this ID?"
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders 
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders 
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 5. Backfill Missing Profiles
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. Set Admin (Force update for both email formats)
UPDATE public.profiles
SET role = 'admin'
WHERE email LIKE 'huhu940203%'; -- Matches both huhu940203, huhu9402032, etc.

-- 7. Grant Permissions to authenticated role for custom types/tables just in case
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
