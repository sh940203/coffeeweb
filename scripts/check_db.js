const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
    console.log("Checking Supabase connection...");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase
        .from('coffees')
        .select('*');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} items.`);
        if (data.length > 0) {
            console.log("First item:", data[0]);
        } else {
            console.log("Table is empty.");
        }
    }
}

checkData();
