
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ECPay Stage (Test) Credentials
const MERCHANT_ID = "2000132";
const HASH_KEY = "5294y06JbISpM5x9";
const HASH_IV = "v77hoKGq4kWxNNIS";
const ECPAY_URL = "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

// Interface for ECPay Parameters
interface ECPayParams {
    MerchantID: string;
    MerchantTradeNo: string;
    MerchantTradeDate: string;
    PaymentType: string;
    TotalAmount: number;
    TradeDesc: string;
    ItemName: string;
    ReturnURL: string;
    ChoosePayment: string;
    EncryptType: number;
    ClientBackURL?: string;
    OrderResultURL?: string;
    [key: string]: string | number | undefined;
}

// Function to generate CheckMacValue
function generateCheckMacValue(params: ECPayParams): string {
    // 1. Filter out CheckMacValue itself if present and sort keys
    const keys = Object.keys(params).filter(k => k !== 'CheckMacValue').sort();

    // 2. Concatenate into query string format
    let raw = keys.map(k => `${k}=${params[k]}`).join('&');

    // 3. Add HashKey and HashIV
    raw = `HashKey=${HASH_KEY}&${raw}&HashIV=${HASH_IV}`;

    // 4. URL Encode
    let encoded = encodeURIComponent(raw).toLowerCase();

    // 5. Replace special characters as per ECPay specs
    // Note: JS encodeURIComponent differs slightly from .NET/PHP logic ECPay expects
    // We need to fix specific characters to match ECPay's requirement
    encoded = encoded
        .replace(/%2d/g, '-')
        .replace(/%5f/g, '_')
        .replace(/%2e/g, '.')
        .replace(/%21/g, '!')
        .replace(/%2a/g, '*')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%20/g, '+');

    // 6. SHA256 Encryption
    const shasum = crypto.createHash('sha256');
    shasum.update(encoded);
    const hash = shasum.digest('hex');

    // 7. Uppercase
    return hash.toUpperCase();
}

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
