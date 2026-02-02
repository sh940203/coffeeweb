-- 自動加入缺少的欄位 (Schema Migration)
ALTER TABLE public.coffees ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.coffees ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.coffees ADD COLUMN IF NOT EXISTS cost_per_kg INTEGER;

-- 清空現有展示用資料
TRUNCATE TABLE public.coffees CASCADE;

-- 插入新資料 (使用已驗證有效的 Unsplash 圖片)
INSERT INTO public.coffees 
(name, origin, region, variety, processing_method, grade, roast_level, price_half_lb, cost_per_kg, stock, flavor_notes, image_url)
VALUES
-- 1. 衣索比亞
(
    '衣索比亞 谷吉 夏奇索 鄧比臘多 日曬',
    '衣索比亞',
    '谷吉 夏奇索',
    'Heirloom',
    '日曬',
    'G1',
    '淺焙',
    500, 340, 120,
    '熱帶水果、莓果甜感、花香',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop'
),
-- 2. 衣索比亞
(
    '衣索比亞 谷吉 夏奇索 迪巴貝特 日曬',
    '衣索比亞',
    '谷吉 夏奇索',
    'Heirloom',
    '日曬',
    'G1',
    '淺焙',
    480, 320, 120,
    '藍莓、葡萄、蜂蜜',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop'
),
-- 4. 衣索比亞
(
    '衣索比亞 谷吉 罕貝拉 果栗 日曬',
    '衣索比亞',
    '谷吉 罕貝拉',
    'Heirloom',
    '日曬',
    'G1',
    '淺焙',
    450, 300, 120,
    '草莓、水蜜桃、奶油觸感',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop'
),
-- 5. 哥斯大黎加
(
    '哥斯大黎加 奇里波山谷 芒果 黑蜜',
    '哥斯大黎加',
    '布蘭卡/奇里波山谷',
    'Caturra/Catuai',
    '黑蜜',
    NULL,
    '中焙',
    680, 450, 20,
    '芒果、熱帶水果、焦糖甜',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop'
),
-- 6. 哥斯大黎加
(
    '哥斯大黎加 奇里波山谷 黑瓦斯人 黑蜜',
    '哥斯大黎加',
    '布蘭卡/奇里波山谷',
    'Caturra/Catuai',
    '黑蜜',
    NULL,
    '中焙',
    600, 400, 20,
    '黑莓、紅酒、深色水果',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop'
),
-- 7. 肯亞
(
    '肯亞 奇安布 瓦姆古瑞 水洗 AA',
    '肯亞',
    '奇安布',
    'SL28/SL34',
    '水洗',
    'AA',
    '淺中焙',
    650, 430, 20,
    '黑醋栗、烏梅、明亮酸值',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop'
),
-- 10. 衣索比亞
(
    '衣索比亞 西達摩 班莎 波那村 水洗',
    '衣索比亞',
    '西達摩 班莎',
    'Heirloom',
    '水洗',
    'G1',
    '淺焙',
    450, 300, 40,
    '檸檬、花香、柑橘',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop'
),
-- 11. 衣索比亞
(
    '衣索比亞 谷吉 齊蕾泊處理廠 水洗',
    '衣索比亞',
    '谷吉 科爾夏鎮',
    'Heirloom',
    '水洗',
    'G1',
    '淺焙',
    450, 300, 40,
    '白花、水蜜桃、綠茶',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop'
),
-- 12. 衣索比亞 藝妓
(
    '衣索比亞 藝妓 北北卡猛虎豔妓 (波那村) 日曬',
    '衣索比亞',
    '班莎 波那村',
    'Geisha',
    '日曬',
    'G1',
    '淺焙',
    700, 470, 84,
    '茉莉花、佛手柑、荔枝甜',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop'
),
-- 13. 瓜地馬拉
(
    '瓜地馬拉 熔岩巧克力 水洗',
    '瓜地馬拉',
    'Unknown',
    'Bourbon/Caturra',
    '水洗',
    NULL,
    '中深焙',
    470, 310, 40,
    '黑巧克力、堅果、奶油',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop'
),
-- 16. 哥斯大黎加
(
    '哥斯大黎加 音樂家系列 莫札特 厭氧蜜處理',
    '哥斯大黎加',
    '塔拉珠',
    'Catuai',
    '厭氧蜜處理',
    NULL,
    '淺中焙',
    900, 610, 44,
    '草莓果醬、玫瑰花、發酵酒香',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop'
);

-- 自動產生風味雷達圖數據
UPDATE public.coffees SET
    acid = floor(random() * 3 + 2)::int,
    bitter = floor(random() * 3 + 1)::int,
    aroma = floor(random() * 2 + 3)::int,
    body = floor(random() * 3 + 2)::int,
    stock_half_lb = stock
WHERE acid IS NULL;
