"use client";

import Link from "next/link";
import Image from "next/image";
// ...
import { Coffee } from "@/types/index";
import { Coffee as CoffeeIcon, ShoppingCart, Check, AlertCircle, MessageSquareText } from "lucide-react";
import { useCartStore } from "@/lib/CartStore";
import { useState } from "react";
import FlavorRadar from "./FlavorRadar";
import ReviewSection from "./ReviewSection";
import { motion, AnimatePresence } from "framer-motion";
import WishlistButton from "./WishlistButton";
import { toast } from "sonner";

interface CoffeeCardProps {
    coffee: Coffee;
}

export default function CoffeeCard({ coffee }: CoffeeCardProps) {
    const { addItem } = useCartStore();
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [showReviews, setShowReviews] = useState(false);

    // Stock Logic
    const stock = coffee.stock ?? 10;
    const isOutOfStock = stock <= 0 || !coffee.is_available;
    const isLowStock = stock < 10 && stock > 0;

    const handleIncrement = () => {
        if (stock > quantity) setQuantity(q => q + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) setQuantity(q => q - 1);
    };

    const handleAddToCart = () => {
        addItem(coffee, quantity);
        toast.success(`${coffee.name} (x${quantity}) 已加入購物車`);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        setQuantity(1); // Reset after adding
    };

    // ... (Stock Logic remains same) ...

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="group flex flex-col h-full bg-[#FAF7F4] rounded-sm overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-500"
        >
            {/* Image Container 4:5 Aspect Ratio */}
            <Link href={`/products/${coffee.id}`} className="block relative w-full aspect-[4/5] bg-gray-100 overflow-hidden cursor-pointer">
                {coffee.image_url ? (
                    <Image
                        src={coffee.image_url}
                        alt={coffee.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-300">
                        <CoffeeIcon className="w-12 h-12 stroke-1" />
                    </div>
                )}

                {/* 底部漸層：增加景深，讓圖片與下方內容銜接更柔順 */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-10" />

                {/* 烘焙度標籤 */}
                {coffee.roast_level && (
                    <span className="absolute top-3 left-3 z-20 bg-white/85 backdrop-blur-sm text-[#3B2F2F] text-[11px] tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        {coffee.roast_level}
                    </span>
                )}

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <span className="bg-[#3B2F2F] text-white px-4 py-2 text-sm tracking-widest uppercase">已售罄</span>
                    </div>
                )}

                <div className="absolute top-2 right-2 z-20">
                    <WishlistButton productId={coffee.id} className="bg-white/80 backdrop-blur-sm shadow-sm" />
                </div>
            </Link>

            {/* Content */}
            <div className="flex flex-col flex-grow p-6 text-center">
                <Link href={`/products/${coffee.id}`}>
                    <h3 className="text-lg font-medium tracking-wide text-[#3B2F2F] mb-2 hover:text-[#6B5B4E] transition-colors cursor-pointer">{coffee.name}</h3>
                </Link>

                <div className="text-xs text-gray-500 tracking-wider uppercase mb-4 space-x-2">
                    {coffee.origin && <span>{coffee.origin}</span>}
                    {coffee.process && <span className="text-gray-300">|</span>}
                    {coffee.process && <span>{coffee.process}</span>}
                </div>

                {/* Feature & Flavor */}
                <div className="space-y-4 mb-6 flex-grow">
                    {coffee.flavor && (
                        <p className="text-sm text-gray-600 leading-relaxed min-h-[3em]">{coffee.flavor}</p>
                    )}

                    {/* Radar Chart */}
                    <div className="w-full h-[180px] flex justify-center -ml-2">
                        <FlavorRadar coffee={coffee} />
                    </div>

                    {coffee.features && (
                        <p className="text-xs text-gray-400">{coffee.features}</p>
                    )}
                </div>

                {/* Price & Action */}
                <div className="pt-4 border-t border-gray-100 w-full mb-4">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="text-gray-900 font-medium tracking-wide">
                            {coffee.price_display} <span className="text-xs text-gray-400 font-normal">/ 半磅</span>
                        </div>
                        {/* Stock Indicator */}
                        {isLowStock && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3" />
                                僅剩 {stock} 組
                            </div>
                        )}
                    </div>

                    {isOutOfStock ? (
                        <button disabled className="w-full py-3 bg-gray-100 text-gray-400 text-sm tracking-widest cursor-not-allowed">
                            暫不販售
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-gray-200 rounded-sm">
                                <button
                                    onClick={handleDecrement}
                                    disabled={quantity <= 1}
                                    className="px-3 py-3 hover:bg-gray-50 text-gray-500 disabled:text-gray-300 transition-colors"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center text-sm font-medium text-gray-900">{quantity}</span>
                                <button
                                    onClick={handleIncrement}
                                    disabled={quantity >= stock}
                                    className="px-3 py-3 hover:bg-gray-50 text-gray-500 disabled:text-gray-300 transition-colors"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add Button — 點擊回饋動畫 */}
                            <motion.button
                                onClick={handleAddToCart}
                                disabled={added}
                                whileTap={{ scale: 0.95 }}
                                className={`flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm tracking-widest transition-colors duration-300 ${added
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-[#3B2F2F] text-white hover:bg-[#5A4A3E]'
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {added ? (
                                        <motion.span
                                            key="added"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="inline-flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>已加入</span>
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            key="add"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="inline-flex items-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span>加入</span>
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* Reviews Toggle */}
                <div className="w-full border-t border-gray-100 pt-2">
                    <button
                        onClick={() => setShowReviews(!showReviews)}
                        className="flex items-center justify-center gap-2 w-full py-2 text-xs tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <MessageSquareText className="w-4 h-4" />
                        <span>{showReviews ? '隱藏評論' : '查看評論'}</span>
                    </button>
                    {showReviews && (
                        <div className="mt-4">
                            <ReviewSection coffeeId={coffee.id} />
                        </div>
                    )}
                </div>
            </div >
        </motion.div >
    );
}
