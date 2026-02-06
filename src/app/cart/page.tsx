"use client";

import { useCartStore } from "@/lib/CartStore";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import CheckoutSuccessModal, { OrderDetail } from "@/components/CheckoutSuccessModal";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
    const { items, removeItem, updateQuantity, getTotalPrice, getFreeShippingProgress } = useCartStore();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [successOrder, setSuccessOrder] = useState<OrderDetail | null>(null);

    const totalPrice = getTotalPrice();
    const { progress, remaining: freeShippingDiff } = getFreeShippingProgress();

    const handleOrderSuccess = async (orderId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (data) {
            setSuccessOrder(data);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-gray-50">
                <div className="bg-white p-12 rounded-lg shadow-sm text-center max-w-md w-full mx-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        <ArrowLeft className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-medium text-gray-900 mb-2">購物車是空的</h1>
                    <p className="text-gray-500 mb-8">看起來您還沒有加入任何咖啡豆。</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white text-sm tracking-widest hover:bg-gray-800 transition-colors rounded-sm"
                    >
                        前往選購
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-[#F9F9F9]">
            <div className="container mx-auto px-6 max-w-5xl">
                <h1 className="text-3xl font-medium text-gray-900 mb-8 tracking-wide">您的購物車</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-sm shadow-sm flex gap-6 items-center">
                                {/* Image */}
                                <div className="w-24 h-24 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 relative">
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                                        <p className="text-lg font-medium text-gray-900">
                                            NT$ {parseInt(item.price_display?.replace(/\D/g, '') || "0") * item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{item.price_display} / 半磅</p>

                                    <div className="flex justify-between items-center">
                                        {/* Quantity Control */}
                                        <div className="flex items-center border border-gray-200 rounded-sm">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-2 hover:bg-gray-50 text-gray-500 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-12 text-center text-sm text-gray-900 font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-2 hover:bg-gray-50 text-gray-500 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="hidden sm:inline">移除</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-sm shadow-sm sticky top-28">
                            <h2 className="text-xl font-medium text-gray-900 mb-6 pb-4 border-b border-gray-100">訂單摘要</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>小計</span>
                                    <span>NT$ {totalPrice}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>運費</span>
                                    {freeShippingDiff > 0 ? (
                                        <span>NT$ 100</span> // Assuming standard shipping is 100 if not stated otherwise, actually logic might be in checkout modal
                                    ) : (
                                        <span className="text-green-600">免運費</span>
                                    )}
                                </div>
                                {freeShippingDiff > 0 && (
                                    <div className="text-xs text-gray-500 text-right">
                                        再消費 NT$ {freeShippingDiff} 享免運
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-100 flex justify-between text-lg font-medium text-gray-900">
                                    <span>總計</span>
                                    <span>NT$ {totalPrice + (freeShippingDiff > 0 ? 100 : 0)} </span> {/* Approximate logic, real logic in checkout */}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCheckoutOpen(true)}
                                className="w-full py-4 bg-gray-900 text-white text-base tracking-widest hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2 rounded-sm"
                            >
                                前往結帳
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-900 mt-4 underline underline-offset-4">
                                繼續購物
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reuse Modals */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleOrderSuccess}
            />

            <CheckoutSuccessModal
                isOpen={!!successOrder}
                onClose={() => {
                    setSuccessOrder(null);
                    window.location.href = "/";
                }}
                order={successOrder}
            />
        </div>
    );
}
