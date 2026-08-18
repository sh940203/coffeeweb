"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Plus, Minus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Coffee } from "@/types/index";

interface AdminOrderFormProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

interface Line {
    coffee_id: string;
    quantity: number;
}

export default function AdminOrderForm({ isOpen, onClose, onCreated }: AdminOrderFormProps) {
    const [coffees, setCoffees] = useState<Coffee[]>([]);
    const [lines, setLines] = useState<Line[]>([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

    useEffect(() => {
        if (!isOpen) return;
        setForm({ name: "", phone: "", address: "", note: "" });
        setLines([]);
        supabase
            .from("coffees")
            .select("*")
            .eq("is_available", true)
            .order("sort_order")
            .then(({ data }) => setCoffees(data || []));
    }, [isOpen]);

    if (!isOpen) return null;

    const addLine = (coffeeId: string) => {
        if (!coffeeId) return;
        setLines((prev) =>
            prev.find((l) => l.coffee_id === coffeeId)
                ? prev
                : [...prev, { coffee_id: coffeeId, quantity: 1 }]
        );
    };

    const setQty = (id: string, q: number) =>
        setLines((prev) => prev.map((l) => (l.coffee_id === id ? { ...l, quantity: Math.max(1, q) } : l)));

    const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.coffee_id !== id));

    const nameOf = (id: string) => coffees.find((c) => c.id === id)?.name || id;
    const priceOf = (id: string) => Number((coffees.find((c) => c.id === id)?.price_display || "").replace(/\D/g, "") || 0);
    const subtotal = lines.reduce((s, l) => s + priceOf(l.coffee_id) * l.quantity, 0);

    const handleSubmit = async () => {
        if (!form.name || !form.phone) return toast.error("請填寫收件人姓名與電話");
        if (lines.length === 0) return toast.error("請至少加入一項商品");

        setSaving(true);
        try {
            const { data, error } = await supabase.rpc("handle_checkout", {
                p_user_id: null,
                p_recipient_name: form.name,
                p_recipient_phone: form.phone,
                p_recipient_address: (form.address || "（賴群組訂單）") + (form.note ? ` (備註: ${form.note})` : ""),
                p_items: lines.map((l) => ({ coffee_id: l.coffee_id, quantity: l.quantity })),
                p_payment_method: "賣貨便",
                p_shipping_method: "711",
                p_recipient_email: null,
                p_client_total: subtotal,
            });
            if (error) throw error;
            toast.success(`訂單已建立 #${data?.order_number || ""}`);
            onCreated();
            onClose();
        } catch (e: any) {
            toast.error("建立失敗：" + (e.message || "未知錯誤"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-gray-900">代客建立訂單（賴群組）</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-5 space-y-5">
                    {/* 收件資料 */}
                    <div className="grid grid-cols-2 gap-3">
                        <input className="px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="收件人姓名 *"
                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <input className="px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="手機 *"
                            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="取貨門市 / 地址（可留空，之後開賣貨便再填）"
                        value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="備註（選填）"
                        value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

                    {/* 加入商品 */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">加入商品</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                            value=""
                            onChange={(e) => addLine(e.target.value)}
                        >
                            <option value="">＋ 選擇商品加入...</option>
                            {coffees.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}（{c.price_display}）</option>
                            ))}
                        </select>
                    </div>

                    {/* 已選清單 */}
                    <div className="space-y-2">
                        {lines.length === 0 && <p className="text-xs text-gray-400 text-center py-3">尚未加入商品</p>}
                        {lines.map((l) => (
                            <div key={l.coffee_id} className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                                <span className="flex-1 text-sm text-gray-800 truncate">{nameOf(l.coffee_id)}</span>
                                <div className="flex items-center border border-gray-200 rounded bg-white">
                                    <button onClick={() => setQty(l.coffee_id, l.quantity - 1)} className="px-2 py-1 text-gray-500"><Minus className="w-3 h-3" /></button>
                                    <span className="w-7 text-center text-sm">{l.quantity}</span>
                                    <button onClick={() => setQty(l.coffee_id, l.quantity + 1)} className="px-2 py-1 text-gray-500"><Plus className="w-3 h-3" /></button>
                                </div>
                                <span className="w-20 text-right text-sm text-gray-700">NT$ {priceOf(l.coffee_id) * l.quantity}</span>
                                <button onClick={() => removeLine(l.coffee_id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-500">商品小計（不含運費）</span>
                        <span className="text-lg font-bold text-gray-900">NT$ {subtotal}</span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        建立訂單
                    </button>
                </div>
            </div>
        </div>
    );
}
