-- 將現有價格除以 2，將原本的「一磅價格」轉換為「半磅價格」
UPDATE public.coffees 
SET price_half_lb = price_half_lb / 2
WHERE price_half_lb > 0;
