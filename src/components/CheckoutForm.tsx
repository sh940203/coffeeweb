import { useState } from "react";

interface CheckoutFormProps {
    total: number;
    onSubmit: (details: { name: string; phone: string; address: string }) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

export default function CheckoutForm({ total, onSubmit, onCancel, isSubmitting }: CheckoutFormProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, phone, address });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 h-full flex flex-col justify-between bg-white relative z-20">
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-medium tracking-widest text-gray-900 mb-6">填寫收件資訊</h2>
                    <p className="text-sm text-gray-500 mb-6">訂單總金額: <span className="font-medium text-gray-900">NT$ {total}</span></p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">收件人姓名</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-gray-900"
                            placeholder="例如：王小明"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">聯絡電話</label>
                        <input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-gray-900"
                            placeholder="例如：0912345678"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">收件地址</label>
                        <textarea
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-gray-900 h-24 resize-none"
                            placeholder="請填寫完整收件地址"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3 mt-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gray-900 text-white text-sm tracking-[0.2em] hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-lg shadow-gray-200"
                >
                    {isSubmitting ? "處理中..." : "確認結帳"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full py-3 text-sm text-gray-500 tracking-widest hover:text-gray-900 transition-colors"
                >
                    返回購物車
                </button>
            </div>
        </form>
    );
}
