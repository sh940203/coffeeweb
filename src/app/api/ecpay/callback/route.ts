import { NextRequest, NextResponse } from 'next/server';
import { verifyCheckMacValue, ECPayParams } from '@/lib/ecpay';
import { createAdminClient } from '@/lib/supabaseAdmin';

// 綠界 server-to-server 付款結果通知 (ReturnURL)。
// 必須驗證 CheckMacValue，驗章通過且 RtnCode==1 才將訂單標記為 paid。
// 回應必須是純文字 "1|OK"，否則綠界會持續重送。
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const params: ECPayParams = {};
        for (const [key, value] of formData.entries()) {
            params[key] = value.toString();
        }

        // 1. 驗證簽章（防止偽造付款通知）
        if (!verifyCheckMacValue(params)) {
            console.error('ECPay callback: invalid CheckMacValue', params);
            return new Response('0|CheckMacValue Error', {
                status: 400,
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        const rtnCode = String(params.RtnCode || '');
        const merchantTradeNo = String(params.MerchantTradeNo || '');

        // 2. 僅在付款成功 (RtnCode=1) 時更新訂單
        if (rtnCode === '1' && merchantTradeNo) {
            const admin = createAdminClient();
            const { error } = await admin.rpc('mark_order_paid', {
                p_order_number: merchantTradeNo,
            });
            if (error) {
                console.error('ECPay callback: mark_order_paid failed', error);
                // 回非 1|OK 讓綠界重送
                return new Response('0|DB Error', {
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' },
                });
            }
        }

        // 3. 回應綠界（即使非成功狀態，簽章正確也要回 1|OK 表示已收到）
        return new Response('1|OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (error) {
        console.error('ECPay callback error:', error);
        return new Response('0|Exception', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// 綠界僅以 POST 通知；GET 用於健康檢查
export async function GET() {
    return NextResponse.json({ ok: true, message: 'ECPay callback endpoint' });
}
