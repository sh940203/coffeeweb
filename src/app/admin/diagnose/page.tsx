"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DiagnosePage() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        addLog("開始診斷...");

        // 1. Auth Check
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            addLog("❌ 未登入 (No Session)");
            return;
        }
        addLog(`✅ 已登入 User ID: ${session.user.id}`);
        addLog(`📧 Email: ${session.user.email}`);

        // 2. Profile Check
        addLog("正在檢查 Profile 權限...");
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            addLog(`❌ Profile 讀取失敗: ${JSON.stringify(profileError)}`);
            // Check if table exists by trying to select without ID? No, strictly RLS.
        } else {
            addLog(`✅ Profile 讀取成功。 Role: ${profile.role}`);
            if (profile.role !== 'admin') {
                addLog("⚠️ 警告: 您不是 admin，可能會導致讀取訂單失敗 (Admins Only Policy)");
            }
        }

        // 3. Orders Access (Simple)
        addLog("正在檢查 Orders (單純讀取)...");
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('count')
            .limit(1);

        if (ordersError) {
            addLog(`❌ Orders 讀取失敗: ${JSON.stringify(ordersError)}`);
        } else {
            addLog(`✅ Orders 讀取成功 (Count query works)`);
        }

        // 4. Orders Relationship Check
        addLog("正在檢查 Orders + Items 關聯...");
        const { data: relOrders, error: relError } = await supabase
            .from('orders')
            .select(`
                id,
                items:order_items ( id )
            `)
            .limit(1);

        if (relError) {
            addLog(`❌ Orders 關聯讀取失敗: ${JSON.stringify(relError)}`);
            addLog("提示: 可能是 Foreign Key 關聯名稱錯誤，或 order_items RLS 權限問題");
        } else {
            addLog(`✅ Orders 關聯讀取成功`);
        }

        addLog("診斷結束");
    };

    return (
        <div className="p-10 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">系統診斷頁面 (System Diagnosis)</h1>
            <div className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap border border-gray-300">
                {logs.join('\n')}
            </div>
            <button
                onClick={() => { setLogs([]); runDiagnostics(); }}
                className="mt-4 px-4 py-2 bg-black text-white rounded"
            >
                重新執行
            </button>
        </div>
    );
}
