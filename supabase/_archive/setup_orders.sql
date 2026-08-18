-- 1. Create 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow guest checkout if nullable, but we'll focus on members first
    status TEXT CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')) DEFAULT 'pending',
    total_amount INTEGER NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cod', -- Cash on Delivery
    shipping_method TEXT DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create 'order_items' table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    coffee_id UUID REFERENCES public.coffees(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time INTEGER NOT NULL, -- Snapshot price
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Orders
-- Users can see their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders 
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can update orders
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Create Policies for Order Items
-- Users can view their own order items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = public.order_items.order_id AND user_id = auth.uid())
    );

-- Admins can view all order items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Create or Update 'handle_checkout' RPC
-- This function handles the transaction: create order -> create items -> deduct stock
CREATE OR REPLACE FUNCTION public.handle_checkout(
    p_user_id UUID,
    p_total_amount INTEGER,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_recipient_address TEXT,
    p_items JSONB -- Array of objects: { coffee_id, quantity, price }
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_coffee_stock INTEGER;
BEGIN
    -- 1. Create Order
    INSERT INTO public.orders (user_id, total_amount, recipient_name, recipient_phone, recipient_address)
    VALUES (p_user_id, p_total_amount, p_recipient_name, p_recipient_phone, p_recipient_address)
    RETURNING id INTO v_order_id;

    -- 2. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Check Stock
        SELECT stock INTO v_coffee_stock FROM public.coffees WHERE id = (v_item->>'coffee_id')::UUID;
        
        IF v_coffee_stock < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Stock not sufficient for coffee %', (v_item->>'coffee_id');
        END IF;

        -- Insert Order Item
        INSERT INTO public.order_items (order_id, coffee_id, quantity, price_at_time)
        VALUES (
            v_order_id,
            (v_item->>'coffee_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::INTEGER
        );

        -- Deduct Stock
        UPDATE public.coffees 
        SET stock = stock - (v_item->>'quantity')::INTEGER
        WHERE id = (v_item->>'coffee_id')::UUID;
    END LOOP;

    RETURN jsonb_build_object('order_id', v_order_id, 'status', 'success');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
