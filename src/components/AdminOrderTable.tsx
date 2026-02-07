
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Truck, CheckCircle, Clock, XCircle, Search, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import Image from "next/image";
import { Order } from "@/types/index";

export default function AdminOrderTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

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

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-400">載入訂單中...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex bg-gray-100 p-1 rounded-sm w-full md:w-auto">
                    {['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all capitalize ${filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {s === 'all' ? '全部' : s}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-gray-400">
                    共 {filteredOrders.length} 筆訂單
                </div>
            </div>

            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">訂單編號</div>
                <div className="col-span-2">顧客</div>
                <div className="col-span-2">金額</div>
                <div className="col-span-2">狀態</div>
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
                                <span className="font-mono text-sm text-gray-900">#{order.id.slice(0, 8)}</span>
                            </div>

                            <div className="col-span-2 mb-1 md:mb-0 text-sm text-gray-600 truncate">
                                {order.user_email}
                            </div>

                            <div className="col-span-2 mb-1 md:mb-0 text-sm font-medium text-gray-900">
                                NT$ {order.total_amount}
                            </div>

                            <div className="col-span-2 mb-2 md:mb-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium md:mt-0 ${getStatusColor(order.status)}`}>
                                    {order.status}
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

                                {order.status === 'pending' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'shipped')}
                                        className="flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1 rounded-sm hover:bg-gray-800 transition-colors"
                                    >
                                        <Truck className="w-3 h-3" />
                                        出貨
                                    </button>
                                )}
                                {order.status === 'shipped' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'completed')}
                                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1 rounded-sm hover:bg-green-700 transition-colors"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        完成
                                    </button>
                                )}
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

                                        {/* Status Control Panel */}
                                        <div className="bg-white p-4 rounded-sm border border-gray-200">
                                            <h4 className="text-xs text-gray-500 mb-3">更改訂單狀態</h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {['pending', 'paid', 'shipped', 'completed', 'cancelled'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => updateStatus(order.id, s)}
                                                        disabled={order.status === s}
                                                        className={`px-3 py-1 text-xs border rounded-sm transition-colors capitalize ${order.status === s
                                                            ? getStatusColor(s) + ' border-transparent cursor-default'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                                                            }`}
                                                    >
                                                        {s}
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
