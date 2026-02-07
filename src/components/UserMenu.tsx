"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, LogOut, LayoutDashboard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/AuthStore";

export default function UserMenu() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    // Removed local isAuthModalOpen
    const { openAuthModal } = useAuthStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("UserMenu: Initial session check", session?.user?.email);
            setUser(session?.user ?? null);
            if (session?.user) checkAdmin(session.user.id);
        });

        // 2. Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("UserMenu: Auth state change", _event, session?.user?.email);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdmin(session.user.id);
            } else {
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('admins') // Assuming you have an 'admins' table
                .select('user_id')
                .eq('user_id', userId)
                .single();
            setIsAdmin(!!data);
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
        setUser(null);
        setIsAdmin(false);
        window.location.href = "/";
    };

    return (
        <>
            {/* AuthModal is now in RootLayout */}

            <div className="relative">
                {user ? (
                    // Logged In State (remains same)
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-200 group"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </span>
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-sm z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                        <p className="text-xs text-gray-400">登入帳號</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                                    </div>

                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <LayoutDashboard className="w-5 h-5" />
                                            管理員後台
                                        </Link>
                                    )}

                                    <Link
                                        href="/account/orders"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        歷史訂單
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left mt-1"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        登出
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // Guest State
                    <button
                        onClick={() => openAuthModal()}
                        className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest font-medium text-gray-900 border border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300"
                    >
                        <User className="w-5 h-5" />
                        <span>登入 / 註冊</span>
                    </button>
                )}
            </div>
        </>
    );
}
