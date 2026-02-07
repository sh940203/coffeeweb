export const SITE_CONFIG = {
    name: "家庭手作烘焙咖啡",
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
