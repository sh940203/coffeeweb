-- =====================================================================
-- 家庭烘焙咖啡 — 整併後的單一可信 Schema (Single Source of Truth)
-- 取代 supabase/_archive/ 內早期零散且互相覆蓋的 SQL 檔。
-- 本檔為「冪等(idempotent)」設計，可在現有資料庫上安全重複執行。
-- 執行順序由上而下；建議在 Supabase SQL Editor 一次貼上執行。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. is_admin() — 判斷目前使用者是否為 admin
--    用 SECURITY DEFINER 繞過 RLS，避免「profiles 政策查 profiles」造成的
--    無限遞迴 (infinite recursion detected in policy)。所有需要 admin 判斷
--    的 RLS 政策都改用此函式。
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------
-- 1. coffees（商品）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coffees (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name          TEXT NOT NULL,
    origin        TEXT,
    process       TEXT,
    roast_level   TEXT,
    flavor        TEXT,
    features      TEXT,
    price_display TEXT,                       -- 顯示用字串，例如 "NT$ 450"
    price         INTEGER NOT NULL DEFAULT 0, -- 數值價格（伺服器端結帳以此為準）
    myship_url    TEXT,
    image_url     TEXT,
    is_available  BOOLEAN DEFAULT true,
    stock         INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER DEFAULT 0,
    acid          INTEGER DEFAULT 3,
    aroma         INTEGER DEFAULT 3,
    bitter        INTEGER DEFAULT 3,
    body          INTEGER DEFAULT 3,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- 補齊既有資料庫可能缺少的欄位（schema drift 修復）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='stock') THEN
        ALTER TABLE public.coffees ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='price') THEN
        ALTER TABLE public.coffees ADD COLUMN price INTEGER NOT NULL DEFAULT 0;
    END IF;
    -- 風味雷達欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='acid')   THEN ALTER TABLE public.coffees ADD COLUMN acid   INTEGER DEFAULT 3; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='aroma')  THEN ALTER TABLE public.coffees ADD COLUMN aroma  INTEGER DEFAULT 3; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='bitter') THEN ALTER TABLE public.coffees ADD COLUMN bitter INTEGER DEFAULT 3; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffees' AND column_name='body')   THEN ALTER TABLE public.coffees ADD COLUMN body   INTEGER DEFAULT 3; END IF;
END $$;

-- 從 price_display 回填 price（僅對 price 仍為 0 者），把 "NT$ 450" 之類字串取數字
UPDATE public.coffees
SET price = COALESCE(NULLIF(regexp_replace(price_display, '\D', '', 'g'), '')::INTEGER, 0)
WHERE price = 0 AND price_display IS NOT NULL;

ALTER TABLE public.coffees ENABLE ROW LEVEL SECURITY;

-- 公開可讀
DROP POLICY IF EXISTS "coffees_public_read" ON public.coffees;
CREATE POLICY "coffees_public_read" ON public.coffees FOR SELECT USING (true);

-- 僅 admin 可新增/修改/刪除
DROP POLICY IF EXISTS "coffees_admin_write" ON public.coffees;
CREATE POLICY "coffees_admin_write" ON public.coffees FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. profiles（會員）— 修正先前 "USING (true)" 導致全表 email/role 外洩
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email      TEXT,
    full_name  TEXT,
    phone      TEXT,
    address    TEXT,
    role       TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN ALTER TABLE public.profiles ADD COLUMN full_name TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone')     THEN ALTER TABLE public.profiles ADD COLUMN phone TEXT;     END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address')   THEN ALTER TABLE public.profiles ADD COLUMN address TEXT;   END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 移除舊的過度寬鬆政策
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 使用者只能看自己的 profile
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- admin 可看所有 profile（後台會員列表）
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
CREATE POLICY "profiles_admin_read" ON public.profiles FOR SELECT
    USING (public.is_admin());

-- 使用者只能改自己的 profile，且不可自行升級 role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 新使用者註冊時自動建立 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'customer')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 回填既有使用者
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. app_settings（全站設定：運費規則等，供後台調整）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.app_settings (key, value)
VALUES ('shipping', '{"fee": 60, "free_threshold": 3000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON public.app_settings;
CREATE POLICY "settings_public_read" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin_write" ON public.app_settings;
CREATE POLICY "settings_admin_write" ON public.app_settings FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. orders / order_items
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number      TEXT UNIQUE,
    status            TEXT CHECK (status IN ('pending','paid','shipped','completed','cancelled')) DEFAULT 'pending',
    total_amount      INTEGER NOT NULL,
    subtotal_amount   INTEGER,
    shipping_amount   INTEGER DEFAULT 0,
    recipient_name    TEXT NOT NULL,
    recipient_phone   TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_email   TEXT,
    payment_method    TEXT DEFAULT 'ATM',
    shipping_method   TEXT DEFAULT 'HOME',
    tracking_number   TEXT,          -- 出貨/物流單號（賣貨便手動或 ECPay 物流回寫）
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 補欄位（drift 修復）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_number')    THEN ALTER TABLE public.orders ADD COLUMN order_number TEXT UNIQUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal_amount') THEN ALTER TABLE public.orders ADD COLUMN subtotal_amount INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_amount') THEN ALTER TABLE public.orders ADD COLUMN shipping_amount INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='recipient_email') THEN ALTER TABLE public.orders ADD COLUMN recipient_email TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_method') THEN ALTER TABLE public.orders ADD COLUMN shipping_method TEXT DEFAULT 'HOME'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN ALTER TABLE public.orders ADD COLUMN tracking_number TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='paid_at')         THEN ALTER TABLE public.orders ADD COLUMN paid_at TIMESTAMPTZ; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_items (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    coffee_id     UUID REFERENCES public.coffees(id) ON DELETE SET NULL,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time INTEGER NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- orders 政策
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "orders_self_read" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "orders_admin_read" ON public.orders FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE
    USING (public.is_admin());
-- 注意：一般使用者「不可」直接 INSERT 訂單，必須透過 handle_checkout RPC（SECURITY DEFINER）。

-- order_items 政策
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "order_items_self_read" ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.orders WHERE id = public.order_items.order_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "order_items_admin_read" ON public.order_items FOR SELECT
    USING (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. reviews / wishlists
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coffee_id  UUID REFERENCES public.coffees(id) ON DELETE CASCADE,
    user_name  TEXT NOT NULL,
    rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON public.reviews;
CREATE POLICY "reviews_auth_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.wishlists (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.coffees(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;
CREATE POLICY "wishlist_self_read" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert into their own wishlist" ON public.wishlists;
CREATE POLICY "wishlist_self_insert" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete from their own wishlist" ON public.wishlists;
CREATE POLICY "wishlist_self_delete" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS wishlist_user_id_idx ON public.wishlists(user_id);

-- ---------------------------------------------------------------------
-- 6. handle_checkout RPC v2 — 伺服器端重算價格（防止前端竄改）
--    前端只傳 coffee_id + quantity；價格、運費、總額一律由 DB 計算。
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.handle_checkout(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.handle_checkout(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.handle_checkout(
    p_user_id         UUID,
    p_recipient_name  TEXT,
    p_recipient_phone TEXT,
    p_recipient_address TEXT,
    p_items           JSONB,   -- [{ "coffee_id": "...", "quantity": 2 }]
    p_payment_method  TEXT DEFAULT 'ATM',
    p_shipping_method TEXT DEFAULT 'HOME',
    p_recipient_email TEXT DEFAULT NULL,
    p_client_total    INTEGER DEFAULT NULL  -- 僅供對帳記錄，不參與計算
) RETURNS JSONB AS $$
DECLARE
    v_order_id      UUID;
    v_order_number  TEXT;
    v_item          JSONB;
    v_coffee        public.coffees%ROWTYPE;
    v_qty           INTEGER;
    v_subtotal      INTEGER := 0;
    v_shipping      INTEGER := 0;
    v_ship_cfg      JSONB;
    v_updated       INTEGER;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;

    -- 產生訂單編號：TW + YYMMDD + 4 碼
    v_order_number := 'TW' || to_char(now(), 'YYMMDD') || upper(substring(md5(random()::text) from 1 for 4));

    -- 先建立訂單骨架（金額稍後更新）
    INSERT INTO public.orders (
        user_id, order_number, status, total_amount,
        recipient_name, recipient_phone, recipient_address, recipient_email,
        payment_method, shipping_method
    ) VALUES (
        p_user_id, v_order_number, 'pending', 0,
        p_recipient_name, p_recipient_phone, p_recipient_address, p_recipient_email,
        p_payment_method, p_shipping_method
    ) RETURNING id INTO v_order_id;

    -- 逐項：以 DB 價格計算 + 原子扣庫存
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::INTEGER;
        IF v_qty IS NULL OR v_qty < 1 THEN
            RAISE EXCEPTION 'Invalid quantity';
        END IF;

        -- 鎖定該商品列，取得當下價格與庫存
        SELECT * INTO v_coffee FROM public.coffees
        WHERE id = (v_item->>'coffee_id')::UUID FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coffee % not found', (v_item->>'coffee_id');
        END IF;
        IF NOT v_coffee.is_available THEN
            RAISE EXCEPTION 'Coffee % is not available', v_coffee.name;
        END IF;

        -- 原子扣庫存：庫存足夠才扣
        UPDATE public.coffees
        SET stock = stock - v_qty
        WHERE id = v_coffee.id AND stock >= v_qty;
        GET DIAGNOSTICS v_updated = ROW_COUNT;
        IF v_updated = 0 THEN
            RAISE EXCEPTION 'Stock not sufficient for %', v_coffee.name;
        END IF;

        -- 以「伺服器端」價格寫入明細
        INSERT INTO public.order_items (order_id, coffee_id, quantity, price_at_time)
        VALUES (v_order_id, v_coffee.id, v_qty, v_coffee.price);

        v_subtotal := v_subtotal + (v_coffee.price * v_qty);
    END LOOP;

    -- 運費規則（後台 app_settings 可調）
    SELECT value INTO v_ship_cfg FROM public.app_settings WHERE key = 'shipping';
    IF v_ship_cfg IS NULL THEN
        v_ship_cfg := '{"fee": 60, "free_threshold": 3000}'::jsonb;
    END IF;
    IF v_subtotal >= (v_ship_cfg->>'free_threshold')::INTEGER THEN
        v_shipping := 0;
    ELSE
        v_shipping := (v_ship_cfg->>'fee')::INTEGER;
    END IF;

    -- 更新訂單金額
    UPDATE public.orders
    SET subtotal_amount = v_subtotal,
        shipping_amount = v_shipping,
        total_amount    = v_subtotal + v_shipping,
        updated_at      = now()
    WHERE id = v_order_id;

    RETURN jsonb_build_object(
        'order_id',      v_order_id,
        'order_number',  v_order_number,
        'subtotal',      v_subtotal,
        'shipping',      v_shipping,
        'total',         v_subtotal + v_shipping,
        'client_total',  p_client_total,
        'status',        'success'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 限制：僅允許前端角色呼叫此 RPC（已登入或匿名訪客），其餘照 RLS。
REVOKE ALL ON FUNCTION public.handle_checkout(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_checkout(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. mark_order_paid RPC — 供 ECPay callback（service role）標記付款成功
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_number TEXT)
RETURNS public.orders AS $$
DECLARE
    v_order public.orders%ROWTYPE;
BEGIN
    UPDATE public.orders
    SET status = 'paid', paid_at = now(), updated_at = now()
    WHERE order_number = p_order_number AND status = 'pending'
    RETURNING * INTO v_order;
    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
