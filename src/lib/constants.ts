export const SITE_CONFIG = {
    name: "家庭烘焙咖啡",
    description: "用心烘焙每一顆咖啡豆，帶給您最純粹的風味。",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export const CHECKOUT_CONFIG = {
    FREE_SHIPPING_THRESHOLD: 3000,
    SHIPPING_FEE: 60,
};

export const PAYMENT_METHODS = {
    ATM: "ATM / 匯款",
    ECPAY: "綠界支付",
};

export const SHIPPING_METHODS = {
    HOME: "宅配到府",
    SEVEN_ELEVEN: "7-ELEVEN 超商取貨",
    FAMILY_MART: "全家 Family 超商取貨",
};

// 訂單狀態 — 對應實際手烘流程：
// 訂購 → 確認數量 → 統一烘焙 → 挑豆封裝 → 開賣貨便寄出 → 完成
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: "待確認", color: "bg-yellow-100 text-yellow-800" },
    confirmed: { label: "已確認", color: "bg-sky-100 text-sky-800" },
    roasting: { label: "烘焙中", color: "bg-orange-100 text-orange-800" },
    packing: { label: "挑豆封裝", color: "bg-amber-100 text-amber-800" },
    shipped: { label: "已寄出", color: "bg-purple-100 text-purple-800" },
    completed: { label: "完成", color: "bg-green-100 text-green-800" },
    cancelled: { label: "已取消", color: "bg-red-100 text-red-800" },
    paid: { label: "已付款", color: "bg-blue-100 text-blue-800" },
};

// 流程推進順序（後台「下一步」按鈕用）
export const ORDER_FLOW = ["pending", "confirmed", "roasting", "packing", "shipped", "completed"] as const;

export const getOrderStatus = (status: string) =>
    ORDER_STATUS[status] || { label: status, color: "bg-gray-100 text-gray-800" };
