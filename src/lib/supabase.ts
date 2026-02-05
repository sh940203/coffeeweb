import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase Environment Variables. \n' +
        'Please verify that "NEXT_PUBLIC_SUPABASE_URL" and "NEXT_PUBLIC_SUPABASE_ANON_KEY" are set in your .env.local file (for local development) or Vercel Project Settings (for production).'
    )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
