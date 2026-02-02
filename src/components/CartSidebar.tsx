"use client";

import { useCartStore } from "@/lib/CartStore";
import { X, Minus, Plus, ShoppingCart, Truck, ArrowLeft, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import CheckoutModal from "./CheckoutModal";
import CheckoutSuccessModal, { OrderDetail } from "./CheckoutSuccessModal";

export default function CartSidebar() {
    const { isCartOpen, toggleCart, items, removeItem, updateQuantity, getTotalPrice, getFreeShippingProgress, clearCart } = useCartStore();
    const [userId, setUserId] = useState<string | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [successOrder, setSuccessOrder] = useState<OrderDetail | null>(null);

    // Touch gestures state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        // Cart is on the right, so swipe right (positive translateX) closes it
        if (isRightSwipe) {
            toggleCart();
        }
    };

    // Hydration fix & Auth Check
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!isMounted) return null;

    const totalPrice = getTotalPrice();
    const { progress, remaining: freeShippingDiff } = getFreeShippingProgress();

    const handleOrderSuccess = async (orderId: string) => {
        // Fetch full order details to display in success modal
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (data) {
            setSuccessOrder(data);
        } else {
            console.error("Failed to fetch order details", error);
        }
    };

    return (
        <>
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isCartOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={toggleCart}
                />

                {/* Sidebar Panel */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col h-full transform transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                        <h2 className="text-xl font-medium tracking-widest text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6" />
                            購物車
                        </h2>
                        <button
                            onClick={toggleCart}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Free Shipping Bar */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100">
                        {freeShippingDiff > 0 ? (
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                還差 <span className="font-medium text-gray-900">NT$ {freeShippingDiff}</span> 即可享免運
                            </p>
                        ) : (
                            <p className="text-sm text-green-600 mb-2 flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                已享免運優惠！
                            </p>
                        )}
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gray-900 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <ShoppingCart className="w-12 h-12 opacity-20" />
                                <p className="tracking-widest">購物車是空的</p>
                                <button
                                    onClick={toggleCart}
                                    className="text-sm border-b border-gray-300 pb-0.5 hover:text-gray-900 hover:border-gray-900 transition-colors"
                                >
                                    繼續購物
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        {/* Image Placeholder */}
                                        <div className="w-24 h-24 bg-gray-100 rounded-sm flex-shrink-0 overflow-hidden relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingCart className="w-8 h-8 opacity-20" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <h3 className="font-medium text-gray-900 tracking-wide text-lg">{item.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{item.price_display} <span className="text-[10px]">/ 半磅</span></p>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-gray-200 rounded-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 px-2 hover:bg-gray-50 text-gray-500 transition-colors"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm text-gray-700 font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 px-2 hover:bg-gray-50 text-gray-500 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors tracking-wider"
                                                >
                                                    移除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t border-gray-100 p-6 space-y-4 bg-gray-50 safe-area-bottom">
                            <div className="flex justify-between text-base font-medium text-gray-900">
                                <p>總金額</p>
                                <p>NT$ {totalPrice}</p>
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                                {freeShippingDiff > 0 ? (
                                    <span>再消費 NT$ {freeShippingDiff} 享免運</span>
                                ) : (
                                    <span className="text-green-600 font-medium">已達免運門檻</span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsCheckoutOpen(true)}
                                className="w-full flex items-center justify-center gap-2 rounded-sm border border-transparent bg-gray-900 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
                            >
                                前往結帳
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    className="text-sm font-medium text-gray-500 hover:text-gray-800 underline decoration-gray-300 underline-offset-4 transition-colors"
                                    onClick={toggleCart}
                                >
                                    繼續購物
                                </button>
                            </div>
                        </div>
                    )}
                </div> {/* End Sidebar Panel */}
            </div> {/* End Main Container */}

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleOrderSuccess}
            />

            {/* Success Modal */}
            <CheckoutSuccessModal
                isOpen={!!successOrder}
                onClose={() => {
                    setSuccessOrder(null);
                    toggleCart();
                }}
                order={successOrder}
            />
        </>
    );
}