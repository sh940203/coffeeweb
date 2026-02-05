-- Seed Sample Coffee Data
-- This script inserts sample data into the 'coffees' table if it is empty.

INSERT INTO public.coffees (
    name, 
    origin, 
    process, 
    roast_level, 
    flavor, 
    features, 
    price_display, 
    is_available, 
    sort_order
)
SELECT 
    '衣索比亞 耶加雪菲', 
    '衣索比亞', 
    '水洗', 
    '淺焙', 
    '花香、柑橘、檸檬', 
    '經典的花香與柑橘調性，口感乾淨明亮。', 
    'NT$450', 
    true, 
    1
WHERE NOT EXISTS (SELECT 1 FROM public.coffees WHERE name = '衣索比亞 耶加雪菲');

INSERT INTO public.coffees (
    name, 
    origin, 
    process, 
    roast_level, 
    flavor, 
    features, 
    price_display, 
    is_available, 
    sort_order
)
SELECT 
    '肯亞 AA', 
    '肯亞', 
    '水洗', 
    '中淺焙', 
    '黑醋栗、烏梅、葡萄柚', 
    '豐富的莓果酸質，回甘強烈。', 
    'NT$500', 
    true, 
    2
WHERE NOT EXISTS (SELECT 1 FROM public.coffees WHERE name = '肯亞 AA');

INSERT INTO public.coffees (
    name, 
    origin, 
    process, 
    roast_level, 
    flavor, 
    features, 
    price_display, 
    is_available, 
    sort_order
)
SELECT 
    '哥倫比亞 手沖精選', 
    '哥倫比亞', 
    '日曬', 
    '中焙', 
    '堅果、焦糖、巧克力', 
    '溫潤的口感，適合喜歡平衡風味的你。', 
    'NT$400', 
    true, 
    3
WHERE NOT EXISTS (SELECT 1 FROM public.coffees WHERE name = '哥倫比亞 手沖精選');
