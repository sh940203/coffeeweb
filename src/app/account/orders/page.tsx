"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { ShoppingBag, Calendar, MapPin, Truck, ChevronDown, ChevronUp } from "lucide-react";

interface OrderItem {
    id: string;
    coffee: {
        name: string;
        image_url: string;
    };
    quantity: number;
    price_at_time: number;
}

interface Order {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    items: OrderItem[]; // We will fetch this separately or via join
}

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/");
                return;
            }

            // Fetch orders
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false });

            if (ordersError) {
                console.error("Error fetching orders:", ordersError);
                setLoading(false);
                return;
            }

            // Fetch items for each order (In a real app, maybe do this on expand or via robust query)
            // ideally: .select('*, order_items(*, public.coffees(name, image_url))') if relationships are set
            // Let's try deep select if foreign keys are correct.
            // But we didn't set explicit FK name for 'coffee_id' to 'coffees' in setup_orders logic maybe?
            // Let's try manual fetch loop for simplicity or a join if possible.

            // Attempting deep join:
            const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
                const { data: itemsData } = await supabase
                    .from("order_items")
                    .select("*, coffee:coffees(name, image_url)")
                    .eq("order_id", order.id);

                return { ...order, items: itemsData || [] };
            }));

            setOrders(ordersWithItems);
            setLoading(false);
        };

        fetchOrders();
    }, [router]);

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

    const toggleExpand = (orderId: string) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
            <Navbar />
            <div className="flex-grow pt-32 pb-20 container mx-auto px-6 md:px-12 max-w-4xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-light tracking-[0.2em] text-[#333333] mb-2">
                        歷史訂單
                    </h1>
                    <p className="text-xs text-gray-400 tracking-[0.3em] uppercase">
                        My Order History
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400 tracking-wider">載入中...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-sm shadow-sm border border-gray-100">
                        <ShoppingBag className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 tracking-widest">目前沒有訂單紀錄</p>
                        <button
                            onClick={() => router.push('/#shop')}
                            className="mt-6 text-sm border-b border-gray-900 pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors"
                        >
                            前往選購
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                                {/* Order Header */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-gray-900 tracking-wider">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                                    {order.status === 'pending' && '處理中'}
                                                    {order.status === 'paid' && '已付款'}
                                                    {order.status === 'shipped' && '已出貨'}
                                                    {order.status === 'completed' && '已完成'}
                                                    {order.status === 'cancelled' && '已取消'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    {order.items.length} 件商品
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">訂單金額</p>
                                                <p className="text-lg font-medium text-gray-900">NT$ {order.total_amount}</p>
                                            </div>
                                            <div className="text-gray-400">
                                                {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Details (Collapsible) */}
                                {expandedOrder === order.id && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid md:grid-cols-2 gap-8 mb-6">
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Truck className="w-4 h-4" />
                                                    收件資訊
                                                </h4>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p>{order.recipient_name}</p>
                                                    <p>{order.recipient_phone}</p>
                                                    <p className="flex items-start gap-1">
                                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                                        {order.recipient_address}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                {/* Future: Payment info or Tracking number */}
                                            </div>
                                        </div>

                                        <h4 className="text-xs font-medium text-gray-900 uppercase tracking-widest mb-3">商品明細</h4>
                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-sm border border-gray-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                                                            {item.coffee?.image_url && (
                                                                <img src={item.coffee.image_url} alt={item.coffee.name} className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{item.coffee?.name || '未知商品'}</p>
                                                            <p className="text-xs text-gray-500">數量: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">NT$ {item.price_at_time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
