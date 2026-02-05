'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // When this component mounts, Supabase JS client automatically
        // detects the hash fragment (#access_token=...) and processes it.
        // We just need to give it a moment to update the session state.

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                // Login successful, redirect to home
                router.push('/');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 tracking-widest">正在驗證登入...</p>
            </div>
        </div>
    );
}
