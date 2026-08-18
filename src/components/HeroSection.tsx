"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ── HeroSection 動畫設定 ── */
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.18, delayChildren: 0.3 },
    },
};

const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* ── 背景循環影片（最底層）── */}
            <video
                className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
                src="/hero.mp4"
                poster="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
            />
            {/* reduced-motion 使用者：以靜態底圖取代影片 */}
            <div
                className="absolute inset-0 hidden motion-reduce:block bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop')" }}
            />

            {/* ── 暗色遮罩層（讓前層文字更顯眼）── */}
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50" />

            {/* ── 前層文字內容 ── */}
            <motion.div
                className="relative z-10 container mx-auto px-6 max-w-4xl text-center text-white"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.p
                    className="tracking-[0.4em] text-xs md:text-sm uppercase font-light text-[#E8D9C5] drop-shadow"
                    variants={fadeUpVariant}
                >
                    Handmade Coffee Roastery
                </motion.p>

                <motion.h1
                    className="mt-6 text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide leading-tight drop-shadow-2xl"
                    variants={fadeUpVariant}
                >
                    品味每一杯
                    <span className="block mt-3">手烘咖啡的純粹藝術</span>
                </motion.h1>

                <motion.p
                    className="mt-8 text-base md:text-xl font-light leading-relaxed max-w-2xl mx-auto text-gray-100/95 drop-shadow-lg"
                    variants={fadeUpVariant}
                >
                    嚴選莊園級精品生豆，接單新鮮烘焙，<br className="hidden md:block" />
                    將最純粹的風味傳遞到您手中的每一杯。
                </motion.p>

                <motion.div
                    className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
                    variants={fadeUpVariant}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        <Link
                            href="#shop"
                            className="inline-flex items-center gap-3 px-10 py-4 bg-[#C4A882] text-white text-sm tracking-[0.15em] hover:bg-[#B49972] transition-colors duration-300 rounded-full shadow-xl cursor-pointer"
                        >
                            立即選購
                        </Link>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        <Link
                            href="#about"
                            className="inline-flex items-center gap-3 px-10 py-4 border border-white/70 text-white text-sm tracking-[0.15em] hover:bg-white hover:text-[#3B2F2F] transition-colors duration-300 rounded-full cursor-pointer backdrop-blur-sm"
                        >
                            關於我們
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/80 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{
                    opacity: { delay: 1.4, duration: 0.8 },
                    y: { delay: 1.6, duration: 2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] as const },
                }}
            >
                <ArrowDown className="w-6 h-6 stroke-1" />
            </motion.div>
        </section>
    );
}
