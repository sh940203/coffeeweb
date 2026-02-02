"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Package, CheckCircle, Clock, Truck, ChevronDown, ChevronUp, Search, XCircle } from "lucide-react";
import Link from "next/link";

interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total_amount: number;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    items?: OrderItem[];
}

interface OrderItem {
    id: string;
    coffee_id: string;
    quantity: number;
    price_at_time: number;
    coffee?: {
        name: string;
    };
}

const DebugUserCheck = () => {
    const [info, setInfo] = useState<any>(null);
    useEffect(() => {
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setInfo({ error: "No Session" }); return; }
            const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            setInfo({
                user_id: session.user.id,
                email: session.user.email,
                profile_role: profile?.role,
                profile_error: error?.message
            });
        };
        check();
    }, []);
    return <pre>{JSON.stringify(info, null, 2)}</pre>;
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            console.log("Fetching orders (simple)...");
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersError) {
                console.error("Orders Error:", ordersError);
                throw new Error("Orders Table Error: " + (ordersError.message || JSON.stringify(ordersError)));
            }

            const ordersList = ordersData || [];
            if (ordersList.length === 0) {
                setOrders([]);
                return;
            }

            console.log("Fetching order items...");
            const orderIds = ordersList.map(o => o.id);
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*, coffee:coffees(name)')
                .in('order_id', orderIds);

            if (itemsError) {
                console.error("Items Error:", itemsError);
                throw new Error("Order Items Error: " + (itemsError.message || JSON.stringify(itemsError)));
            }

            // Merge
            const fullOrders = ordersList.map(o => ({
                ...o,
                items: itemsData?.filter(i => i.order_id === o.id) || []
            }));

            setOrders(fullOrders);
        } catch (error: any) {
            console.error('Final Fetch Error:', error);
            alert('讀取失敗: ' + (error.message || JSON.stringify(error)));
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Optimistic update
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('更新狀態失敗');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> 待付款</span>;
            case 'paid':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3" /> 已付款/待出貨</span>;
            case 'shipped':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Truck className="w-3 h-3" /> 已出貨</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">已完成</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> 已取消</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Package className="w-8 h-8" />
                        訂單管理
                    </h1>
                    <p className="text-gray-500 mt-2">管理所有客戶訂單與出貨狀態</p>
                </div>

                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">全部訂單</option>
                        <option value="pending">待付款</option>
                        <option value="paid">待出貨</option>
                        <option value="shipped">已出貨</option>
                    </select>
                    <button
                        onClick={fetchOrders}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                    >
                        重新整理
                    </button>
                    <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">
                        返回後台
                    </Link>
                </div>
            </div>

            {/* Debug Info Section */}
            {(orders.length === 0 || filterStatus === 'debug') && (
                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700">
                    <h3 className="font-bold border-b border-gray-200 pb-2 mb-2">Debug Info (開發者診斷)</h3>
                    <p>Current Page: Admin Orders</p>
                    <DebugUserCheck />
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">目前沒有訂單</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">訂單編號 / 時間</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">收件人</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">總金額</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">目前狀態</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => (
                                    <>
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-medium text-gray-900">{order.id.slice(0, 8)}...</span>
                                                    <span className="text-xs text-gray-500 mt-1">
                                                        {new Date(order.created_at).toLocaleString('zh-TW')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{order.recipient_name}</span>
                                                    <span className="text-xs text-gray-500">{order.recipient_phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900">NT$ {order.total_amount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 hover:underline"
                                                >
                                                    {expandedOrderId === order.id ? '收起詳情' : '查看詳情'}
                                                    {expandedOrderId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedOrderId === order.id && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={5} className="px-6 py-6">
                                                    <div className="grid md:grid-cols-2 gap-8">
                                                        {/* Details */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-2">收件資訊</h4>
                                                            <div className="text-sm text-gray-600 space-y-1">
                                                                <p>地址/門市：{order.recipient_address}</p>
                                                                <p>電話：{order.recipient_phone}</p>
                                                            </div>

                                                            <h4 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-2 pt-2">狀態管理</h4>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {order.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => updateStatus(order.id, 'paid')}
                                                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                                    >
                                                                        標記為「已付款」
                                                                    </button>
                                                                )}
                                                                {order.status === 'paid' && (
                                                                    <button
                                                                        onClick={() => updateStatus(order.id, 'shipped')}
                                                                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                                    >
                                                                        標記為「已出貨」
                                                                    </button>
                                                                )}
                                                                {(order.status === 'pending' || order.status === 'paid') && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('確定要取消此訂單嗎？')) updateStatus(order.id, 'cancelled');
                                                                        }}
                                                                        className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 transition-colors"
                                                                    >
                                                                        取消訂單
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Items */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-2">購買項目</h4>
                                                            <ul className="mt-2 space-y-2">
                                                                {order.items?.map((item) => (
                                                                    <li key={item.id} className="flex justify-between text-sm text-gray-600">
                                                                        <span>{item.coffee?.name || '未知商品'} x {item.quantity}</span>
                                                                        <span>NT$ {item.price_at_time * item.quantity}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <div className="border-t border-gray-200 mt-3 pt-2 flex justify-between font-medium text-gray-900 text-sm">
                                                                <span>總計</span>
                                                                <span>NT$ {order.total_amount}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
