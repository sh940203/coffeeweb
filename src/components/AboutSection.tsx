"use client";

import Image from "next/image";
import { Coffee, Award, Heart } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ── 交錯進場動畫設定 ── */
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.15 },
    },
};

const slideFromLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const slideFromRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function AboutSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
        <section id="about" className="py-24 bg-[#F5EDE4]" ref={sectionRef}>
            <div className="container mx-auto px-6 max-w-7xl">
                <motion.div
                    className="flex flex-col md:flex-row items-center gap-16 md:gap-24"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >

                    {/* Left: Image / Visual — 從左滑入 */}
                    <motion.div className="w-full md:w-1/2 relative group" variants={slideFromLeft}>
                        <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300">
                                <span className="tracking-widest">ABOUT IMAGE</span>
                            </div>
                            <Image
                                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop"
                                alt="Hand dripping coffee"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>

                        {/* Decorative Element — 延遲淡入 */}
                        <motion.div
                            className="absolute -bottom-6 -right-6 w-full h-full border border-gray-100 -z-10 rounded-sm"
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        />
                    </motion.div>

                    {/* Right: Content — 從右滑入 */}
                    <motion.div className="w-full md:w-1/2 space-y-8 text-center md:text-left" variants={slideFromRight}>
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-light text-[#3B2F2F] tracking-[0.1em]">
                                關於我們
                            </h2>
                            <p className="text-xs text-[#8B7355] tracking-[0.3em] uppercase font-light">
                                Our Story
                            </p>
                        </div>

                        <div className="space-y-6 text-[#3B2F2F] leading-relaxed tracking-wide text-lg md:text-xl">
                            <p>
                                「家庭烘焙」的故事，始於<span className="font-bold">爸爸對咖啡最純粹的興趣</span>。從最早的探索嘗試，到經歷數次烘焙設備的升級，爸爸在無數次的風味實踐中，逐漸熟成出屬於自己的烘焙哲學。起初只是單純地想與好友分享，沒想到這份真摯的風味在朋友圈中口耳相傳，<span className="font-bold text-black">「以咖啡豆交朋友」</span>便成了我們最溫暖的起點。
                            </p>
                            <p>
                                而在這迷人的香氣背後，還有<span className="font-bold">媽媽溫柔而堅定的身影</span>。作為最重要的靈魂助手，從生豆進貨時的<span className="font-bold">嚴格把關</span>、繁瑣的<span className="font-bold">雙重手挑瑕疵</span>，到最後的分類包裝與運送，每一個細節都蘊含著媽媽的細心與堅持。
                            </p>
                            <p>
                                我們是一個由<span className="font-bold text-black">爸爸掌爐、媽媽守護</span>的家庭式烘焙室。這裡沒有商業量產的冰冷，只有我們對每一顆豆子的珍視。我們堅持<span className="font-bold">小批次新鮮烘焙</span>，將這份來自「家」的溫度與專業，傳遞到您手中的每一杯咖啡裡。
                            </p>
                        </div>

                        {/* Features / Icons — 依序交錯進場 */}
                        <motion.div
                            className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#D8CCBE]"
                            variants={containerVariants}
                        >
                            <motion.div className="flex flex-col items-center md:items-start space-y-3" variants={fadeUp}>
                                <div className="p-3 bg-gray-50 rounded-full text-gray-800">
                                    <Coffee className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <h3 className="text-base font-bold tracking-wider text-gray-900">新鮮烘焙</h3>
                                <p className="text-sm text-gray-700 leading-6">接單後烘焙，保留最佳風味期</p>
                            </motion.div>
                            <motion.div className="flex flex-col items-center md:items-start space-y-3" variants={fadeUp}>
                                <div className="p-3 bg-gray-50 rounded-full text-gray-800">
                                    <Award className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <h3 className="text-base font-bold tracking-wider text-gray-900">嚴選生豆</h3>
                                <p className="text-sm text-gray-700 leading-6">100% 阿拉比卡精品等級莊園豆</p>
                            </motion.div>
                            <motion.div className="flex flex-col items-center md:items-start space-y-3" variants={fadeUp}>
                                <div className="p-3 bg-gray-50 rounded-full text-gray-800">
                                    <Heart className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <h3 className="text-base font-bold tracking-wider text-gray-900">職人手挑</h3>
                                <p className="text-sm text-gray-700 leading-6">烘焙前後兩次手挑瑕疵豆</p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
