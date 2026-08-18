-- Enable RLS (Should be enabled already, but good to ensure)
ALTER TABLE public.coffees ENABLE ROW LEVEL SECURITY;

-- 1. Admins can INSERT coffees
DROP POLICY IF EXISTS "Admins can insert coffees" ON public.coffees;
CREATE POLICY "Admins can insert coffees" ON public.coffees 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. Admins can UPDATE coffees
DROP POLICY IF EXISTS "Admins can update coffees" ON public.coffees;
CREATE POLICY "Admins can update coffees" ON public.coffees 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Admins can DELETE coffees
DROP POLICY IF EXISTS "Admins can delete coffees" ON public.coffees;
CREATE POLICY "Admins can delete coffees" ON public.coffees 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Note: "Enable read access for all users" policy should already exist for SELECT.
