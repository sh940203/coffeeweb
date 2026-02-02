"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, LogOut, Settings, LayoutDashboard, ShoppingBag } from "lucide-react";
import AuthModal from "./AuthModal";
import Link from "next/link";

export default function UserMenu() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) checkAdmin(session.user.id);
        });

        // 2. Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
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
            const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();

            if (data && data.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (e) {
            console.error("Check Admin Exception:", e);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
        window.location.href = "/";
    };

    return (
        <>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            <div className="relative">
                {user ? (
                    // Logged In State
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
                        >
                            <User className="w-7 h-7" />
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
                        onClick={() => setIsAuthModalOpen(true)}
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
