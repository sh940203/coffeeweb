const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables manually
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
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
// We need SERVICE_ROLE_KEY to bypass RLS and update roles, but usually we only have ANON_KEY in frontend .env
// We will try with ANON_KEY first, but if RLS blocks update (which it should), we might need the user to run SQL.
// However, for *viewing* profiles, we might be able to seeing them if we are admin, but we are not admin yet.
// Wait, the 'profiles' policy "Public profiles are viewable by everyone" allows select.

const supabase = createClient(SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function manageAdmin() {
    console.log("🔍 Checking registered users...");

    // Fetch all profiles
    const { data: profiles, error } = await supabase
        .from('profiles') // Querying public.profiles
        .select('*');

    if (error) {
        console.error("Error fetching profiles:", error.message);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log("❌ No users found. Please register an account on the website first.");
        return;
    }

    console.log(`Found ${profiles.length} users:`);
    profiles.forEach((p, index) => {
        console.log(`${index + 1}. ${p.email} [Role: ${p.role}]`);
    });

    console.log("\n⚠️ Note: To update the role to 'admin', you usually need to run a SQL command in Supabase Dashboard because the frontend API key cannot bypass security rules.");
    console.log("   However, I can generate the SQL for you.");

    if (profiles.length > 0) {
        // Just take the first one or ask user? 
        // Since I cannot interactively ask in this script easily without blocking the agent, 
        // I will just output the SQL for the found users.
        console.log("\n📋 Copy and run this SQL in Supabase SQL Editor to make the first user an admin:");
        console.log(`\nUPDATE public.profiles SET role = 'admin' WHERE email = '${profiles[0].email}';\n`);
    }
}

manageAdmin();
