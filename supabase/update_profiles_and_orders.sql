-- 1. Add columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Update handle_checkout function to include payment_method
-- Drop the old function signature if needed (optional, but good practice if names clash)
-- DROP FUNCTION IF EXISTS public.handle_checkout(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.handle_checkout(
    p_user_id UUID,
    p_total_amount INTEGER,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_recipient_address TEXT,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cod' -- Added default for backward compatibility if needed
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_coffee_stock INTEGER;
BEGIN
    -- 1. Create Order
    INSERT INTO public.orders (
        user_id, 
        total_amount, 
        recipient_name, 
        recipient_phone, 
        recipient_address, 
        payment_method, -- New field
        status 
    )
    VALUES (
        p_user_id, 
        p_total_amount, 
        p_recipient_name, 
        p_recipient_phone, 
        p_recipient_address, 
        p_payment_method,
        CASE WHEN p_payment_method = 'ECPAY' THEN 'pending' ELSE 'pending' END -- Default status
    )
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
