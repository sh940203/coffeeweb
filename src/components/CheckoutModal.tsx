"use client";

import { useState, useEffect } from "react";
import { X, Truck, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/CartStore";
import { supabase } from "@/lib/supabase";

import { OrderDetail } from "./CheckoutSuccessModal";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (order: OrderDetail) => void;
}

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'ATM' | 'ECPAY'>('ATM');

    // Touch gestures state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Min swipe distance (in px) 
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchEnd - touchStart;
        const isDownSwipe = distance > minSwipeDistance;
        if (isDownSwipe) {
            onClose();
        }
    };

    // Form Data
    const [shippingMethod, setShippingMethod] = useState<'HOME' | '711' | 'FAMILY'>('HOME');
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "", // Can be full address or 7-11 Store Name
        note: ""
    });

    const handleSelectStore = (storeType: '711' | 'FAMILY') => {
        // Construct the Callback URL
        const callbackUrl = `${window.location.origin}/api/ezship/callback`;

        // Create a hidden form to POST to Ezship
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://map.ezship.com.tw/ezship_map_web.jsp';
        form.target = 'SelectStoreWindow';

        // Ezship Parameters
        const params = {
            suID: 'test@test.com', // Required but not validated for map search
            processID: '123',      // Arbitrary ID
            stCate: '',            // Leave empty to let user choose, or 'TFM'/'TLW'
            rtURL: callbackUrl,    // The critical callback URL
            webPara: storeType     // Pass our internal type to identify roughly
        };

        for (const [key, value] of Object.entries(params)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value as string; // Cast value to string
            form.appendChild(input);
        }

        document.body.appendChild(form);

        // Open window
        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open('', 'SelectStoreWindow', `width=${width},height=${height},top=${top},left=${left}`);

        form.submit();
        document.body.removeChild(form);
    };

    // Listen for Ezship Callback
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            const { storeId, storeName, storeAddress, source } = event.data;
            if (source === 'ezship' && storeId) {
                // Determine type based on store name or context if possible, 
                // but usually we just fill the address.
                // We can use the current shippingMethod state to prefix.

                let prefix = "";
                if (shippingMethod === '711') prefix = "[7-11]";
                else if (shippingMethod === 'FAMILY') prefix = "[全家]";

                // If the map returns info that contradicts the selected method (e.g. user picked FamilyMart in 7-11 mode),
                // we might want to warn or just auto-switch. For now, trust the user or just prefix.
                // Better: Check storeName or storeAddress content? 
                // Ezship returns stCate usually properly.

                const storeInfo = `${prefix} ${storeName}門市 (${storeId})\n${storeAddress}`;
                setFormData(prev => ({ ...prev, address: storeInfo }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [shippingMethod]);

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

            // Build final address string with method prefix if needed
            let finalAddress = formData.address;
            if (shippingMethod === '711' && !finalAddress.includes('[7-11]')) {
                finalAddress = `[7-11] ${finalAddress}`;
            } else if (shippingMethod === 'FAMILY' && !finalAddress.includes('[全家]')) {
                finalAddress = `[全家] ${finalAddress}`;
            }

            // 3. Call RPC
            const { data, error } = await supabase.rpc('handle_checkout', {
                p_user_id: user?.id || null, // Allow guest checkout (will be null)
                p_total_amount: grandTotal,
                p_recipient_name: formData.name,
                p_recipient_phone: formData.phone,
                p_recipient_address: finalAddress + (formData.note ? ` (備註: ${formData.note})` : ""),
                p_items: orderItems,
                p_payment_method: paymentMethod
            });

            if (error) throw error;
            console.log("Order created:", data);

            // Handle ECPay Logic
            if (paymentMethod === 'ECPAY') {
                const orderId = data?.order_id || data?.id;

                // Call internal API to sign data
                const res = await fetch('/api/ecpay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        amount: grandTotal,
                        itemName: "Coffee Order",
                        recipientEmail: user?.email // Optional
                    })
                });

                if (!res.ok) throw new Error("Failed to prepare ECPay payment");

                const ecpayData = await res.json();

                // Create form and submit
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = ecpayData.action; // https://payment-stage.ecpay.com.tw/...

                for (const [key, value] of Object.entries(ecpayData.params)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value as string;
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
                // Don't close modal or clear cart immediately, user is redirecting.
                // Or maybe clear cart? Ideally clear cart AFTER successful payment callback.
                // optimizing: clear cart now to prevent double order if they go back?
                clearCart();
                return;
            }

            // 4. Success (ATM / Manual)
            const successOrder: OrderDetail = {
                id: data?.order_id || data?.id || "ORDER_ID",
                created_at: new Date().toISOString(),
                total_amount: grandTotal,
                status: 'PENDING',
                recipient_name: formData.name,
                recipient_phone: formData.phone,
                recipient_address: finalAddress + (formData.note ? ` (備註: ${formData.note})` : ""),
                items: items,
            };

            clearCart();
            onSuccess(successOrder);
            onClose();

        } catch (error) {
            console.error("Checkout failed:", error);
            alert("結帳發生錯誤，請稍後再試。");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 pb-0 md:pb-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-t-xl md:rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] md:max-h-[90vh] animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Mobile Handle */}
                <div className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl md:rounded-t-lg">
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

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
                        {/* Payment Info */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">付款方式</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('ATM')}
                                    className={`py-3 px-4 border rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentMethod === 'ATM'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    ATM / 匯款
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('ECPAY')}
                                    className={`py-3 px-4 border rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentMethod === 'ECPAY'
                                        ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                >
                                    <div className="w-4 h-4 bg-green-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">E</div>
                                    綠界支付
                                </button>
                            </div>

                            {paymentMethod === 'ATM' && (
                                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex gap-3 text-sm">
                                    <div className="text-blue-800">
                                        <p className="font-bold mb-1">匯款資訊：</p>
                                        <p>銀行：000 測試銀行</p>
                                        <p>帳號：1234-5678-9012-3456</p>
                                        <p className="text-xs mt-2 text-blue-600">請於 3 日內完成匯款。</p>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'ECPAY' && (
                                <div className="bg-green-50 p-4 rounded-md border border-green-100 flex gap-3 text-sm">
                                    <div className="text-green-800">
                                        <p className="font-bold mb-1">綠界科技 ECPay (測試環境)</p>
                                        <p className="text-xs">支援信用卡、網路 ATM、超商代碼繳費。</p>
                                        <p className="text-xs mt-2 text-green-600">
                                            點擊「確認下單」後將跳轉至綠界支付頁面。
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Shipping Form */}
                        <div className="space-y-4">
                            {/* Shipping Method Tabs */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    運送方式
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShippingMethod('HOME')}
                                        className={`py-2 px-1 text-sm rounded border text-center transition-colors ${shippingMethod === 'HOME' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Truck className="w-4 h-4 mx-auto mb-1" />
                                        宅配到府
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShippingMethod('711')}
                                        className={`py-2 px-1 text-sm rounded border text-center transition-colors ${shippingMethod === '711' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <span className="block font-bold text-xs mb-1">7-ELEVEN</span>
                                        超商取貨
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShippingMethod('FAMILY')}
                                        className={`py-2 px-1 text-sm rounded border text-center transition-colors ${shippingMethod === 'FAMILY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <span className="block font-bold text-xs mb-1">全家 Family</span>
                                        超商取貨
                                    </button>
                                </div>
                            </div>

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
                                {shippingMethod !== 'HOME' && <p className="text-xs text-amber-600 mt-1">請填寫與證件相符之姓名，以免店員拒絕取貨。</p>}
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
                                    {shippingMethod === 'HOME' ? '收件地址' : '取貨門市'} <span className="text-red-500">*</span>
                                </label>

                                {shippingMethod === '711' && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectStore('711')}
                                        className="w-full mb-2 bg-green-50 text-green-700 border border-green-200 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        選擇 7-11 門市 (自動帶入)
                                    </button>
                                )}

                                {shippingMethod === 'FAMILY' && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectStore('FAMILY')}
                                        className="w-full mb-2 bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        選擇全家門市 (自動帶入)
                                    </button>
                                )}

                                <textarea
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-none bg-gray-50"
                                    rows={3}
                                    placeholder={shippingMethod === 'HOME' ? "請填寫完整地址 (含縣市)" : "請輸入門市名稱與店號，或是使用上方按鈕選擇"}
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
                    <div className="flex-none px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 rounded-b-xl md:rounded-b-lg pb-8 md:pb-4">
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
