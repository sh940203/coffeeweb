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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkImages() {
    const { data: coffees, error } = await supabase
        .from('coffees')
        .select('name, image_url');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Checking " + coffees.length + " coffees...");
    coffees.forEach(c => {
        if (!c.image_url) {
            console.log(`[MISSING] ${c.name} has NO image_url`);
        } else {
            console.log(`[OK] ${c.name}: ${c.image_url.substring(0, 30)}...`);
        }
    });
}

checkImages();
