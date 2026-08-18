
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Truck, ChevronDown, ChevronUp, MapPin, Copy, Plus, QrCode, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Order } from "@/types/index";
import { toast } from "sonner";
import QRCode from "qrcode";
import { getOrderStatus, ORDER_STATUS, ORDER_FLOW } from "@/lib/constants";
import AdminOrderForm from "./AdminOrderForm";

export default function AdminOrderTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    // 為已有寄件代碼的訂單預先產生 QR
    useEffect(() => {
        orders.forEach((o) => {
            if (o.tracking_number && !qrMap[o.id]) genQr(o.id, o.tracking_number);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // 1. Fetch Orders (No complex joins first to avoid 400)
            const { data: ordersData, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // 2. Fetch details (Items & Profiles) for each order
            const ordersWithDetails = await Promise.all(ordersData.map(async (order: any) => {
                // Fetch Items
                const { data: itemsData } = await supabase
                    .from("order_items")
                    .select("*, coffee:coffees(name, image_url)")
                    .eq("order_id", order.id);

                // Fetch User Email (Manually to avoid join syntax issues)
                let userEmail = 'Guest';
                if (order.user_id) {
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("email")
                        .eq("id", order.user_id)
                        .single();
                    if (profileData?.email) userEmail = profileData.email;
                }

                return {
                    ...order,
                    items: itemsData || [],
                    user_email: userEmail
                };
            }));

            setOrders(ordersWithDetails);
        } catch (e: any) {
            console.error("Error fetching orders:", e);
            alert("讀取訂單失敗: " + (e.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});
    const [showForm, setShowForm] = useState(false);
    const [qrMap, setQrMap] = useState<Record<string, string>>({});

    // 由賣貨便寄件代碼/連結產生 QR（賣家到 7-11 掃描寄件用）
    const genQr = async (orderId: string, value: string) => {
        if (!value) return;
        try {
            const url = await QRCode.toDataURL(value, { width: 220, margin: 1 });
            setQrMap((m) => ({ ...m, [orderId]: url }));
        } catch {
            toast.error("QR 產生失敗");
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId);

        if (error) {
            alert("更新失敗: " + error.message);
        } else {
            // Optimistic update
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        }
    };

    const saveTracking = async (orderId: string) => {
        const tracking = (trackingDraft[orderId] ?? "").trim();
        // 填了出貨單號通常代表已出貨，順手把狀態推進到 shipped
        const { error } = await supabase
            .from("orders")
            .update({ tracking_number: tracking, status: 'shipped' })
            .eq("id", orderId);

        if (error) {
            alert("儲存出貨單號失敗: " + error.message);
        } else {
            setOrders(orders.map(o => o.id === orderId ? { ...o, tracking_number: tracking, status: 'shipped' } : o));
            genQr(orderId, tracking);
        }
    };

    const copyShippingInfo = async (order: Order) => {
        const items = (order.items || [])
            .map((i) => `・${i.coffee?.name || '商品'} ×${i.quantity}`)
            .join('\n');
        const text =
            `【出貨資訊】訂單 #${order.order_number || order.id.slice(0, 8)}\n` +
            `收件人：${order.recipient_name}\n` +
            `電話：${order.recipient_phone}\n` +
            `取貨/地址：${order.recipient_address}\n` +
            `金額：NT$ ${order.total_amount}\n` +
            `商品：\n${items}`;
        try {
            await navigator.clipboard.writeText(text);
            toast.success("出貨資訊已複製，可貼到賣貨便建單");
        } catch {
            toast.error("複製失敗，請手動選取");
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);

    const getPaymentMethodName = (method?: string) => {
        switch (method) {
            case 'ECPAY': return '綠界支付 (信用卡/ATM)';
            case 'ATM': return '匯款轉帳';
            case 'cod': return '匯款或是信用卡付款'; // Legacy or specific requirement
            default: return method || '未知';
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-400">載入訂單中...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap bg-gray-100 p-1 rounded-sm">
                    {['all', 'pending', 'confirmed', 'roasting', 'packing', 'shipped', 'completed', 'cancelled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {s === 'all' ? '全部' : getOrderStatus(s).label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">共 {filteredOrders.length} 筆</span>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-sm hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        代客建單
                    </button>
                </div>
            </div>

            <AdminOrderForm isOpen={showForm} onClose={() => setShowForm(false)} onCreated={fetchOrders} />

            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">訂單編號</div>
                <div className="col-span-2">顧客</div>
                <div className="col-span-1">金額</div>
                <div className="col-span-2">付款方式</div>
                <div className="col-span-1">狀態</div>
                <div className="col-span-2">收件人</div>
                <div className="col-span-2 text-right">操作</div>
            </div>

            {/* Orders List */}
            <div className="space-y-4 md:space-y-0">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border md:border-t-0 md:border-b border-gray-100 md:hover:bg-gray-50 transition-colors">
                        {/* Mobile View / Condensed */}
                        <div className="p-4 md:p-0 md:grid md:grid-cols-12 md:gap-4 md:items-center md:px-6 md:py-4">
                            <div className="col-span-2 flex items-center gap-2 mb-2 md:mb-0">
                                <button
                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                    className="p-1 hover:bg-gray-200 rounded-full md:hidden"
                                >
                                    {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <span className="font-mono text-sm text-gray-900">
                                    #{order.order_number || order.id.slice(0, 8)}
                                </span>
                            </div>

                            <div className="col-span-2 mb-1 md:mb-0 text-sm text-gray-600 truncate">
                                {order.user_email}
                            </div>

                            <div className="col-span-1 mb-1 md:mb-0 text-sm font-medium text-gray-900">
                                NT$ {order.total_amount}
                            </div>

                            <div className="col-span-2 mb-1 md:mb-0 text-xs text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded-sm border border-gray-200">
                                    {getPaymentMethodName(order.payment_method)}
                                </span>
                            </div>

                            <div className="col-span-1 mb-2 md:mb-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium md:mt-0 ${getOrderStatus(order.status).color}`}>
                                    {getOrderStatus(order.status).label}
                                </span>
                            </div>

                            <div className="col-span-2 mb-2 md:mb-0 text-xs text-gray-500 truncate">
                                {order.recipient_name}
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex justify-end gap-2">
                                <button
                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                    className="hidden md:flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded-sm hover:border-gray-300 transition-colors"
                                >
                                    {expandedOrder === order.id ? '收合' : '詳情'}
                                </button>

                                {/* 下一步：依流程推進到下一階段 */}
                                {(() => {
                                    const idx = ORDER_FLOW.indexOf(order.status as typeof ORDER_FLOW[number]);
                                    const next = idx >= 0 && idx < ORDER_FLOW.length - 1 ? ORDER_FLOW[idx + 1] : null;
                                    if (!next) return null;
                                    return (
                                        <button
                                            onClick={() => updateStatus(order.id, next)}
                                            className="flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1 rounded-sm hover:bg-gray-800 transition-colors whitespace-nowrap"
                                        >
                                            <ArrowRight className="w-3 h-3" />
                                            {getOrderStatus(next).label}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedOrder === order.id && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2">
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Left: Shipping Info */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            收件與聯絡資訊
                                        </h4>
                                        <div className="bg-white p-4 rounded-sm border border-gray-200 text-sm space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">姓名</span>
                                                <span className="text-gray-900 font-medium">{order.recipient_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">電話</span>
                                                <span className="text-gray-900 font-medium">{order.recipient_phone}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">地址</span>
                                                <span className="text-gray-900 font-medium text-right max-w-[200px]">{order.recipient_address}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                                <span className="text-gray-500">下單時間</span>
                                                <span className="text-gray-900">{new Date(order.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* 賣貨便寄件代碼 + QR（賣家到 7-11 掃描寄件）*/}
                                        <div className="bg-white p-4 rounded-sm border border-gray-200">
                                            <h4 className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                                <QrCode className="w-3.5 h-3.5" />
                                                賣貨便寄件代碼 / 連結
                                            </h4>
                                            <p className="text-[11px] text-gray-400 mb-2">
                                                開設單次獨立賣貨便後，把寄件代碼或連結貼上 → 產生 QR，到 7-11 ibon 掃描列印寄出。
                                            </p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={trackingDraft[order.id] ?? order.tracking_number ?? ""}
                                                    onChange={(e) => setTrackingDraft({ ...trackingDraft, [order.id]: e.target.value })}
                                                    placeholder="貼上賣貨便寄件代碼或連結"
                                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                                />
                                                <button
                                                    onClick={() => saveTracking(order.id)}
                                                    className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition-colors whitespace-nowrap"
                                                >
                                                    儲存並出貨
                                                </button>
                                            </div>

                                            {/* QR 顯示 */}
                                            {qrMap[order.id] && (
                                                <div className="mt-3 flex flex-col items-center bg-gray-50 rounded-md p-3">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={qrMap[order.id]} alt="賣貨便寄件 QR" className="w-40 h-40" />
                                                    <p className="text-[11px] text-gray-500 mt-1 font-mono break-all text-center">{order.tracking_number}</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">到 7-11 ibon 掃描此 QR 列印寄件單</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => copyShippingInfo(order)}
                                                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                複製出貨資訊（貼到賣貨便建單）
                                            </button>
                                        </div>

                                        {/* Status Control Panel */}
                                        <div className="bg-white p-4 rounded-sm border border-gray-200">
                                            <h4 className="text-xs text-gray-500 mb-3">更改訂單狀態</h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {Object.keys(ORDER_STATUS).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => updateStatus(order.id, s)}
                                                        disabled={order.status === s}
                                                        className={`px-3 py-1 text-xs border rounded-sm transition-colors ${order.status === s
                                                            ? getOrderStatus(s).color + ' border-transparent cursor-default'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                                                            }`}
                                                    >
                                                        {getOrderStatus(s).label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Items */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            商品明細
                                        </h4>
                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-sm border border-gray-200">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 relative">
                                                        {item.coffee?.image_url ? (
                                                            <Image
                                                                src={item.coffee.image_url}
                                                                alt={item.coffee.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="48px"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{item.coffee?.name || '未知商品'}</p>
                                                        <p className="text-xs text-gray-500">數量: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                                        NT$ {item.price_at_time}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
