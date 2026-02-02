"use client";

import Link from "next/link";
import { Coffee, Menu, X } from "lucide-react";
import CartTrigger from "./CartTrigger";
import UserMenu from "./UserMenu";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b border-transparent",
                scrolled ? "bg-white/80 backdrop-blur-md border-gray-100 py-4 shadow-sm" : "bg-transparent py-8"
            )}
        >
            <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
                {/* Left: Brand */}
                <Link href="/" className="text-xl md:text-2xl font-medium tracking-[0.2em] text-gray-800 hover:text-gray-600 transition-colors flex items-center gap-2">
                    <Coffee className="w-7 h-7 stroke-[1.5]" />
                    <span>家庭手作</span>
                </Link>

                {/* Center: Navigation Links (Desktop) */}
                <div className="hidden md:flex items-center gap-8 text-sm tracking-[0.15em] font-medium text-gray-500 absolute left-1/2 transform -translate-x-1/2">
                    <Link href="/" className="hover:text-gray-900 transition-colors">首頁</Link>
                    <Link href="#shop" className="hover:text-gray-900 transition-colors">挑選咖啡</Link>
                    <Link href="#about" className="hover:text-gray-900 transition-colors">關於我們</Link>
                    <Link href="/account/orders" className="hover:text-gray-900 transition-colors">歷史訂單</Link>
                </div>

                {/* Right: Cart & User & Mobile Menu Toggle */}
                <div className="flex justify-end items-center gap-4">
                    <UserMenu />
                    <CartTrigger />

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl md:hidden animate-in slide-in-from-top-5 duration-200">
                    <div className="flex flex-col py-4 px-6 space-y-4">
                        <Link
                            href="/"
                            className="text-gray-700 hover:text-gray-900 py-2 border-b border-gray-50 text-sm tracking-widest"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            首頁
                        </Link>
                        <Link
                            href="#shop"
                            className="text-gray-700 hover:text-gray-900 py-2 border-b border-gray-50 text-sm tracking-widest"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            挑選咖啡
                        </Link>
                        <Link
                            href="#about"
                            className="text-gray-700 hover:text-gray-900 py-2 border-b border-gray-50 text-sm tracking-widest"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            關於我們
                        </Link>
                        <Link
                            href="/account/orders"
                            className="text-gray-700 hover:text-gray-900 py-2 text-sm tracking-widest"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            歷史訂單
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
