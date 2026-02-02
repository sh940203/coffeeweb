const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might not be installed
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
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Error loading .env.local", e);
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase environment variables. Make sure .env.local exists.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log("--- Supabase Diagnostics ---");
    console.log("URL:", SUPABASE_URL);

    // 1. Check Connection & RLS (read all)
    console.log("\n1. Fetching ALL coffees (ignoring is_available)...");
    const { data: allCoffees, error: allError } = await supabase
        .from('coffees')
        .select('id, name, is_available, created_at');

    if (allError) {
        console.error("❌ Error fetching all coffees:", allError.message);
        if (allError.code === '42501') {
            console.error("   Hint: RLS policy might be blocking read access.");
        }
        return;
    }

    console.log(`✅ Found ${allCoffees.length} total records.`);

    if (allCoffees.length === 0) {
        console.warn("   ⚠️ Table 'coffees' is empty. Please insert data.");
    } else {
        // 2. Check is_available filter
        const availableCount = allCoffees.filter(c => c.is_available).length;
        console.log(`   Detailed Status:`);
        // console.table(allCoffees); 
        allCoffees.forEach(c => console.log(`   - ${c.name}: is_available=${c.is_available}`));

        console.log(`\n   Available (is_available=true): ${availableCount}`);

        if (availableCount === 0) {
            console.warn("   ⚠️ No coffees are marked as 'is_available'.");
        } else {
            console.log("   ✅ Data should be visible on the website.");
        }
    }
}

diagnose();
