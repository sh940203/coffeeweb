"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

/* ── HeroSection 動畫設定 ── */
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
};

const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center bg-[#EDE5DB] overflow-hidden pt-24">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

                    {/* Left: Text Content */}
                    <motion.div
                        className="w-full md:w-1/2 space-y-8 text-center md:text-left z-10 py-12 md:py-0"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.p
                            className="text-[#8B7355] tracking-[0.3em] text-xs md:text-sm uppercase font-light"
                            variants={fadeUpVariant}
                        >
                            Handmade Coffee Roastery
                        </motion.p>

                        <motion.h1
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#3B2F2F] tracking-wide leading-tight"
                            variants={fadeUpVariant}
                        >
                            品味每一杯
                            <span className="block mt-2">手烘咖啡的</span>
                            <span className="block mt-2">純粹藝術</span>
                        </motion.h1>

                        <motion.p
                            className="text-[#6B5B4E] text-base md:text-lg font-light leading-relaxed max-w-md mx-auto md:mx-0"
                            variants={fadeUpVariant}
                        >
                            嚴選莊園級精品生豆，接單新鮮烘焙，<br className="hidden md:block" />
                            將最純粹的風味傳遞到您手中的每一杯。
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4"
                            variants={fadeUpVariant}
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <Link
                                    href="#shop"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#C4A882] text-white text-sm tracking-[0.15em] hover:bg-[#B49972] transition-colors duration-300 rounded-full shadow-md cursor-pointer"
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
                                    className="inline-flex items-center gap-3 px-8 py-4 border border-[#3B2F2F] text-[#3B2F2F] text-sm tracking-[0.15em] hover:bg-[#3B2F2F] hover:text-white transition-colors duration-300 rounded-full cursor-pointer"
                                >
                                    關於我們
                                </Link>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Right: Hero Image */}
                    <motion.div
                        className="w-full md:w-1/2 relative"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.3 }}
                    >
                        <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop"
                                alt="精品手沖咖啡"
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[#8B7355]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{
                    opacity: { delay: 1.2, duration: 0.8 },
                    y: { delay: 1.5, duration: 2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] as const },
                }}
            >
                <ArrowDown className="w-6 h-6 stroke-1" />
            </motion.div>
        </section>
    );
}
