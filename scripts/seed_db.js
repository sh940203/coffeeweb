const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SAMPLE_COFFEES = [
    {
        name: "衣索比亞 耶加雪菲",
        origin: "Ethiopia Yirgacheffe",
        process: "水洗 Washed",
        roast_level: "淺烘焙 Light Roast",
        flavor: "檸檬、柑橘、茉莉花香，口感清爽明亮。",
        features: "G1 等級",
        price_display: "NT$ 450",
        is_available: true,
        image_url: "https://images.unsplash.com/photo-1611854779393-1b2ae54a1993?auto=format&fit=crop&q=80&w=800",
        stock: 20,
        acid: 5,
        aroma: 5,
        bitter: 1,
        body: 2,
        sort_order: 1
    },
    {
        name: "哥倫比亞 薇拉",
        origin: "Colombia Huila",
        process: "日曬 Natural",
        roast_level: "中深烘焙 Medium-Dark",
        flavor: "堅果、焦糖、黑巧克力，醇厚度高。",
        features: "Supremo 等級",
        price_display: "NT$ 380",
        is_available: true,
        image_url: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800",
        stock: 8, // Low stock test
        acid: 2,
        aroma: 3,
        bitter: 4,
        body: 5,
        sort_order: 2
    },
    {
        name: "肯亞 AA",
        origin: "Kenya AA",
        process: "水洗 Washed",
        roast_level: "中烘焙 Medium Roast",
        flavor: "烏梅、黑醋栗、紅酒酸質。",
        features: "TOP 級",
        price_display: "NT$ 500",
        is_available: false, // Out of stock test
        image_url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800",
        stock: 0,
        acid: 5,
        aroma: 4,
        bitter: 2,
        body: 4,
        sort_order: 3
    }
];

async function seed() {
    console.log("🌱 Seeding data...");

    // Check if data exists
    const { count } = await supabase.from('coffees').select('*', { count: 'exact', head: true });

    if (count > 0) {
        console.log(`Table already has ${count} records. Skipping seed.`);
        return;
    }

    const { data, error } = await supabase.from('coffees').insert(SAMPLE_COFFEES).select();

    if (error) {
        console.error("❌ Seeding failed:", error.message);
        console.error("Reason: Likely RLS policy preventing INSERT. Please run the SQL manually.");
    } else {
        console.log(`✅ Successfully inserted ${data.length} records.`);
    }
}

seed();
