import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ubbbcvhadpmmhkbylobn.supabase.co',
      },
    ],
  },
  output: 'standalone',
  async headers() {
    // Content-Security-Policy — 依本站實際載入的來源設定白名單：
    //   img:   Unsplash 商品圖、Supabase Storage、QR 的 data: URL、placehold.co
    //   media: 本站 /hero.mp4
    //   connect: Supabase REST/Auth/Realtime(wss)
    //   form-action: 結帳時表單 POST 到 ECPay / ezship 取貨地圖
    // 註：Next.js 與 framer-motion 需 'unsafe-inline'（樣式/啟動腳本），
    //     超商選店 callback 也回傳內嵌 <script>，故 script-src 保留 'unsafe-inline'。
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://placehold.co",
      "media-src 'self'",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'self'",
      "form-action 'self' https://payment-stage.ecpay.com.tw https://payment.ecpay.com.tw https://map.ezship.com.tw",
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
