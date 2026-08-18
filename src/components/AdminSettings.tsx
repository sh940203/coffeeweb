"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Truck, Megaphone, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    // 運費
    const [fee, setFee] = useState(60);
    const [freeThreshold, setFreeThreshold] = useState(3000);
    // 公告
    const [annEnabled, setAnnEnabled] = useState(false);
    const [annText, setAnnText] = useState("");
    // 關於我們
    const [aboutBody, setAboutBody] = useState("");

    useEffect(() => {
        supabase
            .from("app_settings")
            .select("key, value")
            .in("key", ["shipping", "announcement", "about"])
            .then(({ data }) => {
                const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
                if (map.shipping) {
                    setFee(Number(map.shipping.fee ?? 60));
                    setFreeThreshold(Number(map.shipping.free_threshold ?? 3000));
                }
                if (map.announcement) {
                    setAnnEnabled(!!map.announcement.enabled);
                    setAnnText(map.announcement.text ?? "");
                }
                if (map.about) setAboutBody(map.about.body ?? "");
                setLoading(false);
            });
    }, []);

    const save = async (key: string, value: any) => {
        setSavingKey(key);
        const { error } = await supabase
            .from("app_settings")
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        setSavingKey(null);
        if (error) toast.error("儲存失敗：" + error.message);
        else toast.success("已更新");
    };

    if (loading) return <div className="flex justify-center p-10 text-gray-400"><Loader2 className="animate-spin w-6 h-6" /></div>;

    const card = "bg-white border border-gray-200 rounded-md p-6 space-y-4";
    const input = "w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#C4A882] outline-none";
    const saveBtn = (key: string) =>
        `flex items-center gap-2 px-6 py-2.5 bg-[#3B2F2F] text-white text-sm font-medium rounded-md hover:bg-[#5A4A3E] transition-colors disabled:opacity-50`;

    return (
        <div className="max-w-2xl space-y-8">
            {/* 運費 */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900 tracking-wider">運費設定</h3>
                </div>
                <div className={card}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">運費 (NT$)</label>
                            <input type="number" min={0} value={fee} onChange={(e) => setFee(Number(e.target.value))} className={input} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">免運門檻 (NT$)</label>
                            <input type="number" min={0} value={freeThreshold} onChange={(e) => setFreeThreshold(Number(e.target.value))} className={input} />
                        </div>
                    </div>
                    <button onClick={() => save("shipping", { fee, free_threshold: freeThreshold })} disabled={savingKey === "shipping"} className={saveBtn("shipping")}>
                        {savingKey === "shipping" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 儲存運費
                    </button>
                </div>
            </section>

            {/* 公告跑馬燈 */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900 tracking-wider">公告跑馬燈</h3>
                </div>
                <div className={card}>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={annEnabled} onChange={(e) => setAnnEnabled(e.target.checked)} className="w-4 h-4 accent-[#3B2F2F]" />
                        <span className="text-sm text-gray-700">在前台首頁最上方顯示公告跑馬燈</span>
                    </label>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">公告內容</label>
                        <textarea
                            value={annText}
                            onChange={(e) => setAnnText(e.target.value)}
                            rows={2}
                            placeholder="例如：本週六公休一天，訂單將於下週一統一出貨，感謝您的支持！"
                            className={input + " resize-none"}
                        />
                    </div>
                    <button onClick={() => save("announcement", { enabled: annEnabled, text: annText })} disabled={savingKey === "announcement"} className={saveBtn("announcement")}>
                        {savingKey === "announcement" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 儲存公告
                    </button>
                </div>
            </section>

            {/* 關於我們 */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900 tracking-wider">關於我們</h3>
                </div>
                <div className={card}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">內容（段落之間請空一行）</label>
                        <textarea
                            value={aboutBody}
                            onChange={(e) => setAboutBody(e.target.value)}
                            rows={10}
                            placeholder="留空則沿用預設的家庭烘焙故事。&#10;&#10;每段之間空一行即可自動分段。"
                            className={input + " resize-y leading-relaxed"}
                        />
                        <p className="text-xs text-gray-400 mt-1">留空白會顯示預設故事內容。</p>
                    </div>
                    <button onClick={() => save("about", { body: aboutBody })} disabled={savingKey === "about"} className={saveBtn("about")}>
                        {savingKey === "about" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 儲存關於我們
                    </button>
                </div>
            </section>
        </div>
    );
}
