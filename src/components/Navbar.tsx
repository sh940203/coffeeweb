"use client";

import Link from "next/link";
import { Coffee, Menu, X } from "lucide-react";
import CartTrigger from "./CartTrigger";
import UserMenu from "./UserMenu";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ── 導覽列連結元件（含底線動畫）── */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="relative py-1 hover:text-[#3B2F2F] transition-colors group">
            {children}
            {/* 底線：hover 時從左滑入 */}
            <span className="absolute left-0 -bottom-1 h-[1.5px] w-0 bg-[#3B2F2F] transition-all duration-300 ease-out group-hover:w-full" />
        </Link>
    );
}

/* ── 手機選單動畫設定 ── */
const mobileMenuVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const } },
};

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
        <motion.nav
            className={cn(
                "fixed top-0 left-0 right-0 z-40 border-b border-transparent transition-colors duration-300",
                scrolled
                    ? "bg-[#EDE5DB]/80 backdrop-blur-xl backdrop-saturate-150 border-[#D8CCBE] shadow-sm"
                    : "bg-transparent"
            )}
            /* Framer Motion 平滑驅動高度（padding）過渡 */
            animate={{ paddingTop: scrolled ? 16 : 32, paddingBottom: scrolled ? 16 : 32 }}
            transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
        >
            <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
                {/* Left: Brand */}
                <Link href="/" className="text-xl md:text-2xl font-medium tracking-[0.2em] text-[#3B2F2F] hover:text-[#6B5B4E] transition-colors flex items-center gap-2">
                    <Coffee className="w-7 h-7 stroke-[1.5]" />
                    <span>家庭烘焙</span>
                </Link>

                {/* Center: Navigation Links (Desktop) — 底線動畫 */}
                <div className="hidden md:flex items-center gap-8 text-sm tracking-[0.15em] font-medium text-[#6B5B4E] absolute left-1/2 transform -translate-x-1/2">
                    <NavLink href="/">首頁</NavLink>
                    <NavLink href="/#shop">挑選咖啡</NavLink>
                    <NavLink href="/#about">關於我們</NavLink>
                    <NavLink href="/account/orders">歷史訂單</NavLink>
                </div>

                {/* Right: Cart & User & Mobile Menu Toggle */}
                <div className="flex justify-end items-center gap-4">
                    <UserMenu />
                    <CartTrigger />

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-[#6B5B4E] hover:text-[#3B2F2F] transition-colors"
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

            {/* Mobile Menu Overlay — AnimatePresence 平滑進出 */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-menu"
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 w-full bg-[#EDE5DB]/95 backdrop-blur-xl border-t border-[#D8CCBE] shadow-xl md:hidden"
                    >
                        <div className="flex flex-col py-4 px-6 space-y-4">
                            <Link
                                href="/"
                                className="text-[#6B5B4E] hover:text-[#3B2F2F] py-2 border-b border-[#D8CCBE]/50 text-sm tracking-widest"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                首頁
                            </Link>
                            <Link
                                href="/#shop"
                                className="text-[#6B5B4E] hover:text-[#3B2F2F] py-2 border-b border-[#D8CCBE]/50 text-sm tracking-widest"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                挑選咖啡
                            </Link>
                            <Link
                                href="/#about"
                                className="text-[#6B5B4E] hover:text-[#3B2F2F] py-2 border-b border-[#D8CCBE]/50 text-sm tracking-widest"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                關於我們
                            </Link>
                            <Link
                                href="/account/orders"
                                className="text-[#6B5B4E] hover:text-[#3B2F2F] py-2 text-sm tracking-widest"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                歷史訂單
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
