import { NextRequest, NextResponse } from 'next/server';
import { ECPAY_CONFIG, ECPayParams, generateCheckMacValue } from '@/lib/ecpay';

const { MERCHANT_ID, CHECKOUT_URL: ECPAY_URL } = ECPAY_CONFIG;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, amount, itemName, recipientEmail } = body;

        if (!orderId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const date = new Date();
        // Format date as YYYY/MM/DD HH:mm:ss
        const formattedDate = date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '/'); // Ensure slashes if locale varies

        // For consistency in Node/Next environments, manual formatting might be safer
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const tradeDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

        // Basic Parameters
        const params: ECPayParams = {
            MerchantID: MERCHANT_ID,
            MerchantTradeNo: orderId.replace(/-/g, '').substring(0, 20), // ECPay limit 20 chars, remove dashes
            MerchantTradeDate: tradeDate,
            PaymentType: 'aio',
            TotalAmount: Math.round(amount), // Must be integer
            TradeDesc: 'Coffee Order',
            ItemName: itemName || 'Coffee Products',
            ReturnURL: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/ecpay/callback`, // Server-to-Server callback
            ChoosePayment: 'ALL', // Allow Credit, ATM, CVS
            EncryptType: 1,
            // ClientBackURL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cart`, // Redirect back to shop after payment
            OrderResultURL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/orders`, // Redirect to orders page
        };

        // Generate CheckMacValue
        const checkMacValue = generateCheckMacValue(params);

        // Return all data needed for the form
        return NextResponse.json({
            action: ECPAY_URL,
            params: { ...params, CheckMacValue: checkMacValue }
        });

    } catch (error: any) {
        console.error("ECPay API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
