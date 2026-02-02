"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminMemberTable from "@/components/AdminMemberTable";
import AdminOrderTable from "@/components/AdminOrderTable";
import AdminProductTable from "@/components/AdminProductTable";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, ShoppingBag, Package } from "lucide-react";

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'orders' | 'products'>('orders');
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push("/");
            return;
        }

        const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (data?.role === "admin") {
            setIsAdmin(true);
        } else {
            router.push("/");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
                <p className="text-gray-400 tracking-widest text-sm">驗證權限中...</p>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-6 py-10 pt-32 max-w-7xl">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-light tracking-[0.2em] text-[#333333] mb-2">後台管理系統</h1>
                            <Link href="/admin/diagnose" className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 transition-colors">
                                系統診斷
                            </Link>
                        </div>
                        <p className="text-xs text-gray-400 tracking-wider">Admin Dashboard</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-white rounded-sm shadow-sm p-1 border border-gray-100">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex items-center gap-2 px-6 py-2 text-sm tracking-wider rounded-sm transition-all duration-300 ${activeTab === 'orders'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            訂單管理
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex items-center gap-2 px-6 py-2 text-sm tracking-wider rounded-sm transition-all duration-300 ${activeTab === 'products'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            商品管理
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex items-center gap-2 px-6 py-2 text-sm tracking-wider rounded-sm transition-all duration-300 ${activeTab === 'members'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            會員列表
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 min-h-[500px]">
                    {activeTab === 'orders' && <AdminOrderTable />}
                    {activeTab === 'products' && <AdminProductTable />}
                    {activeTab === 'members' && <AdminMemberTable />}
                </div>
            </main>
            <Footer />
        </div>
    );
}
