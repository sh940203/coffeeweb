"use client";

import { useState } from "react";
import { X, Truck, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/CartStore";
import { supabase } from "@/lib/supabase";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (orderId: string) => void;
}

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'confirm'>('form');

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "", // Can be full address or 7-11 Store Name
        note: ""
    });

    if (!isOpen) return null;

    const total = getTotalPrice();
    const shipping = total >= 2000 ? 0 : 60; // Hardcoded rule for now, sync with store later
    const grandTotal = total + shipping;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Get current user (if logged in)
            const { data: { user } } = await supabase.auth.getUser();

            // 2. Prepare items for RPC
            const orderItems = items.map(item => ({
                coffee_id: item.id,
                quantity: item.quantity,
                price: parseInt(item.price_display?.replace(/\D/g, '') || "0", 10)
            }));

            // 3. Call RPC
            const { data, error } = await supabase.rpc('handle_checkout', {
                p_user_id: user?.id || null, // Allow guest checkout (will be null)
                p_total_amount: grandTotal,
                p_recipient_name: formData.name,
                p_recipient_phone: formData.phone,
                p_recipient_address: formData.address + (formData.note ? ` (備註: ${formData.note})` : ""),
                p_items: orderItems
            });

            if (error) throw error;

            console.log("Order created:", data);

            // 4. Success
            clearCart();
            onSuccess(data.order_id);
            onClose();

        } catch (error) {
            console.error("Checkout failed:", error);
            alert("結帳發生錯誤，請稍後再試。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        結帳資訊
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">

                        {/* Order Summary */}
                        <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>商品小計 (Total)</span>
                                <span>NT$ {total}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>運費 (Shipping)</span>
                                <span>{shipping > 0 ? `NT$ ${shipping}` : '免運'}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-lg">
                                <span>應付金額</span>
                                <span>NT$ {grandTotal}</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex gap-3">
                            <div className="mt-1">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm">付款方式：ATM 轉帳 / 銀行匯款</h3>
                                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                    下單完成後系統會提供匯款帳號。
                                    <br />
                                    請於 3 日內完成匯款，並回傳帳號後五碼。
                                </p>
                            </div>
                        </div>

                        {/* Shipping Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    收件人姓名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                                    placeholder="請輸入真實姓名"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    手機號碼 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                                    placeholder="09xx-xxx-xxx"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    收件地址 / 7-11 店名 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="宅配請填寫完整地址 (含縣市)&#10;超商取貨請填寫：7-11 xx門市"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    備註留言 (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                                    placeholder="例如：需研磨、禮盒包裝..."
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gray-900 text-white px-6 py-2 rounded-sm text-sm tracking-widest font-medium hover:bg-gray-800 transition-all flex items-center gap-2 disabled:bg-gray-400"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    處理中...
                                </>
                            ) : (
                                <>
                                    確認下單
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
