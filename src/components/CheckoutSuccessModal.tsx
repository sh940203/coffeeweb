"use client";

import { CheckCircle, ExternalLink, X, ShoppingBag } from "lucide-react";
import { Coffee } from "@/types/coffee";

export interface OrderItem {
    id: string;
    name: string;
    price: string;
    quantity: number;
}

interface CheckoutSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: OrderItem[];
    total: number;
}

export default function CheckoutSuccessModal({ isOpen, onClose, items, total }: CheckoutSuccessModalProps) {
    if (!isOpen) return null;

    // 假設的賣貨便連結，實際專案中應該從資料庫或環境變數獲取
    // 這裡使用一個通用的連結或首頁作為示範
    const MYSHIP_URL = "https://myship.7-11.com.tw/";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-green-50 p-6 text-center border-b border-green-100">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 tracking-wide">訂單已成立</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        感謝您的訂購！庫存已為您保留。
                        <br />
                        請前往 7-11 賣貨便完成付款與運送資訊填寫。
                    </p>
                </div>

                <div className="p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                        訂單明細
                    </h4>

                    <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    {item.name} <span className="text-xs text-gray-400">x{item.quantity}</span>
                                </span>
                                <span className="font-medium text-gray-900">{item.price}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                            <span className="font-medium text-gray-900">總計</span>
                            <span className="text-lg font-bold text-gray-900">NT$ {total}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <a
                            href={MYSHIP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E60012] text-white rounded-sm hover:bg-[#c4000f] transition-colors shadow-md"
                            onClick={onClose}
                        >
                            <span>前往 7-11 賣貨便結帳</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
                        >
                            稍後再說
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
