import { createClient } from '@supabase/supabase-js';

// 伺服器端專用：使用 Service Role Key，可繞過 RLS。
// 僅能在 Route Handler / Server 環境匯入，絕不可在 client component 使用。
// SERVICE_ROLE_KEY 只放伺服器環境變數，不可加 NEXT_PUBLIC_ 前綴。
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            'Missing Supabase admin env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (server-only).'
        );
    }

    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
