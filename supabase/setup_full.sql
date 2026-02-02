-- 1. Create 'coffees' table if not exists
CREATE TABLE IF NOT EXISTS public.coffees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    origin TEXT,
    process TEXT,
    roast_level TEXT,
    flavor TEXT,
    features TEXT, -- Ensure this column exists
    price_display TEXT,
    myship_url TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add new columns if they don't exist (Idempotent)
DO $$
BEGIN
    -- Core Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='origin') THEN
        ALTER TABLE public.coffees ADD COLUMN origin TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='process') THEN
        ALTER TABLE public.coffees ADD COLUMN process TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='roast_level') THEN
        ALTER TABLE public.coffees ADD COLUMN roast_level TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='flavor') THEN
        ALTER TABLE public.coffees ADD COLUMN flavor TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='features') THEN
        ALTER TABLE public.coffees ADD COLUMN features TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='price_display') THEN
        ALTER TABLE public.coffees ADD COLUMN price_display TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='myship_url') THEN
        ALTER TABLE public.coffees ADD COLUMN myship_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='image_url') THEN
        ALTER TABLE public.coffees ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='is_available') THEN
        ALTER TABLE public.coffees ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='sort_order') THEN
        ALTER TABLE public.coffees ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    -- New Features
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='stock') THEN
        ALTER TABLE public.coffees ADD COLUMN stock INTEGER DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='acid') THEN
        ALTER TABLE public.coffees ADD COLUMN acid INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='aroma') THEN
        ALTER TABLE public.coffees ADD COLUMN aroma INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='bitter') THEN
        ALTER TABLE public.coffees ADD COLUMN bitter INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='body') THEN
        ALTER TABLE public.coffees ADD COLUMN body INTEGER DEFAULT 3;
    END IF;
END $$;

-- 3. Create 'reviews' table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coffee_id UUID REFERENCES public.coffees(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.coffees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.coffees;
CREATE POLICY "Enable read access for all users" ON public.coffees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.reviews;
CREATE POLICY "Enable insert for all users" ON public.reviews FOR INSERT WITH CHECK (true);

-- 6. Insert Sample Data (Only if empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.coffees) THEN
        INSERT INTO public.coffees (name, origin, process, roast_level, flavor, features, price_display, image_url, is_available, stock, acid, aroma, bitter, body, sort_order)
        VALUES
        (
            '衣索比亞 耶加雪菲', 
            'Ethiopia Yirgacheffe', 
            '水洗 Washed', 
            '淺烘焙 Light Roast', 
            '檸檬、柑橘、茉莉花香，口感清爽明亮。', 
            'G1 等級', 
            'NT$ 450', 
            'https://images.unsplash.com/photo-1611854779393-1b2ae54a1993?auto=format&fit=crop&q=80&w=800',
            true, 
            20, 
            5, 5, 1, 2, 
            1
        ),
        (
            '哥倫比亞 薇拉', 
            'Colombia Huila', 
            '日曬 Natural', 
            '中深烘焙 Medium-Dark', 
            '堅果、焦糖、黑巧克力，醇厚度高。', 
            'Supremo 等級', 
            'NT$ 380', 
            'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800', 
            true, 
            8, 
            2, 3, 4, 5, 
            2
        ),
        (
            '肯亞 AA', 
            'Kenya AA', 
            '水洗 Washed', 
            '中烘焙 Medium Roast', 
            '烏梅、黑醋栗、紅酒酸質。', 
            'TOP 級', 
            'NT$ 500', 
            'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800',
            false, 
            0, 
            5, 4, 2, 4, 
            3
        );
    END IF;
END $$;
