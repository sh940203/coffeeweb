import { CheckCircle, ExternalLink, X, ShoppingBag, Truck, CreditCard, User, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export interface OrderDetail {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    user_id?: string;
    items?: any[];
    order_number?: string;
}

interface CheckoutSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderDetail | null;
}

export default function CheckoutSuccessModal({ isOpen, onClose, order }: CheckoutSuccessModalProps) {
    if (!isOpen || !order) return null;

    // Helper to parse address for store info
    const getShippingInfo = (address: string) => {
        let method = "宅配到府";
        let storeName = "";
        let storeId = "";
        let addr = address;

        if (address.includes("[7-11]")) {
            method = "7-11 超商取貨";
            const match = address.match(/\[7-11\]\s*(.+?)門市\s*\((\d+)\)/);
            if (match) {
                storeName = match[1] + "門市";
                storeId = match[2];
                // Remove the prefix part from display address if needed, or keep full
            }
        } else if (address.includes("[全家]")) {
            method = "全家 超商取貨";
            // Simple parsing for manual entry if user followed format, else just show address
        }

        return { method, storeName, storeId, addr };
    };

    const { method, storeName, storeId, addr } = getShippingInfo(order.recipient_address);
    const orderDate = format(new Date(order.created_at), "yyyy-MM-dd hh:mm a");

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white md:rounded-lg shadow-2xl w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 flex flex-col">

                {/* Header / Steps (Mock Visual) */}
                <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">1 購物車</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-400">2 填寫資料</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-bold text-gray-900">3 訂單確認</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8 pb-12">
                    {/* Success Message */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-2">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">謝謝您！您的訂單已經成立！</h2>
                        <div className="text-gray-500 font-mono">
                            訂單號碼 <span className="text-gray-900 font-medium">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        {/* Mock Email Message */}
                        <p className="text-sm text-gray-500">
                            訂單確認電郵已經發送到您的電子郵箱
                        </p>
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Column 1 */}
                        <div className="space-y-6">

                            {/* Order Info */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> 訂單資訊
                                </h3>
                                <dl className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">訂單日期:</dt>
                                        <dd className="text-gray-900">{orderDate}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">訂單狀態:</dt>
                                        <dd className="text-amber-600 font-medium">訂單處理中</dd>
                                    </div>
                                </dl>
                            </section>

                            {/* Customer Info */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> 顧客資訊
                                </h3>
                                <dl className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">名稱:</dt>
                                        <dd className="text-gray-900">{order.recipient_name}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">電話號碼:</dt>
                                        <dd className="text-gray-900">{order.recipient_phone}</dd>
                                    </div>
                                    {/* Email logic would go here if we collected it */}
                                </dl>
                            </section>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">

                            {/* Shipping Info */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> 送貨資訊
                                </h3>
                                <dl className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">送貨方式:</dt>
                                        <dd className="text-gray-900 font-medium">{method}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">送貨狀態:</dt>
                                        <dd className="text-gray-900">備貨中</dd>
                                    </div>
                                    {storeId && (
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500">超商店號:</dt>
                                            <dd className="text-gray-900 font-mono">{storeId}</dd>
                                        </div>
                                    )}
                                    {storeName && (
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500">門市名稱:</dt>
                                            <dd className="text-gray-900">{storeName}</dd>
                                        </div>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-gray-50">
                                        <dt className="text-gray-500 text-xs mb-1">地址/門市資訊:</dt>
                                        <dd className="text-gray-900">{order.recipient_address}</dd>
                                    </div>
                                </dl>
                            </section>

                            {/* Payment Info */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> 付款資訊
                                </h3>
                                <dl className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">付款方式:</dt>
                                        <dd className="text-gray-900">ATM 轉帳 / 匯款</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">付款狀態:</dt>
                                        <dd className="text-red-500 font-medium">未付款</dd>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mt-2">
                                        <span className="block font-medium mb-1">匯款帳號 (822 中國信託)</span>
                                        <span className="font-mono text-base text-gray-900">9015-4033-2201</span>
                                    </div>
                                </dl>
                            </section>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 space-y-3">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition-colors font-medium tracking-wide"
                        >
                            回到首頁 / 繼續購物
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
