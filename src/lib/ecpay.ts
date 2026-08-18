import crypto from 'crypto';

// ECPay 設定一律由環境變數提供（不可寫死在程式碼）。
// 測試環境預設值為綠界官方公開測試碼，正式上線請在環境變數覆寫。
export const ECPAY_CONFIG = {
    MERCHANT_ID: process.env.ECPAY_MERCHANT_ID || '2000132',
    HASH_KEY: process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9',
    HASH_IV: process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS',
    CHECKOUT_URL:
        process.env.ECPAY_CHECKOUT_URL ||
        'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

export type ECPayParams = Record<string, string | number | undefined>;

/**
 * 依綠界規格產生 CheckMacValue (SHA256)。
 * 同時用於「送出付款請求簽章」與「驗證回調簽章」。
 */
export function generateCheckMacValue(params: ECPayParams): string {
    const keys = Object.keys(params)
        .filter((k) => k !== 'CheckMacValue' && params[k] !== undefined)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    let raw = keys.map((k) => `${k}=${params[k]}`).join('&');
    raw = `HashKey=${ECPAY_CONFIG.HASH_KEY}&${raw}&HashIV=${ECPAY_CONFIG.HASH_IV}`;

    let encoded = encodeURIComponent(raw).toLowerCase();
    encoded = encoded
        .replace(/%2d/g, '-')
        .replace(/%5f/g, '_')
        .replace(/%2e/g, '.')
        .replace(/%21/g, '!')
        .replace(/%2a/g, '*')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%20/g, '+');

    return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

/**
 * 驗證綠界回調的 CheckMacValue 是否正確（防止偽造付款通知）。
 */
export function verifyCheckMacValue(params: ECPayParams): boolean {
    const received = String(params.CheckMacValue || '');
    if (!received) return false;
    const expected = generateCheckMacValue(params);
    // 長度一致才做 timingSafeEqual，避免拋例外
    if (received.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
