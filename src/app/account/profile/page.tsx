"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Loader2, Save } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used for toasts, if not I'll use simple alert or verify package.json

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const [profile, setProfile] = useState({
        id: "",
        email: "",
        full_name: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/");
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();

                if (error) {
                    console.error("Error fetching profile:", error);
                }

                if (data) {
                    setProfile({
                        id: session.user.id,
                        email: session.user.email || "",
                        full_name: data.full_name || "",
                        phone: data.phone || "",
                        address: data.address || ""
                    });
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    phone: profile.phone,
                    address: profile.address,
                    updated_at: new Date().toISOString()
                })
                .eq("id", profile.id);

            if (error) throw error;

            toast.success("個人資料已儲存");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("儲存失敗，請稍後再試。");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
            <Navbar />
            <div className="flex-grow pt-32 pb-20 container mx-auto px-6 md:px-12 max-w-2xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-light tracking-[0.2em] text-[#3B2F2F] mb-2">
                        個人資料
                    </h1>
                    <p className="text-xs text-gray-400 tracking-[0.3em] uppercase">
                        My Profile
                    </p>
                </div>

                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email (Read only) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                電子郵件 (Email)
                            </label>
                            <input
                                type="email"
                                disabled
                                value={profile.email}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-sm cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1 pl-1">帳號信箱無法修改</p>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-medium text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                姓名 (Full Name)
                            </label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                placeholder="請輸入您的姓名"
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:ring-1 focus:ring-[#C4A882] focus:border-[#C4A882] outline-none transition-all"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-medium text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                手機號碼 (Phone)
                            </label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="09xx-xxx-xxx"
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:ring-1 focus:ring-[#C4A882] focus:border-[#C4A882] outline-none transition-all"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-xs font-medium text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                預設地址 (Address)
                            </label>
                            <textarea
                                value={profile.address}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                placeholder="請輸入您的收件地址"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:ring-1 focus:ring-[#C4A882] focus:border-[#C4A882] outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-[#3B2F2F] text-white py-3 rounded-sm text-sm tracking-widest font-medium hover:bg-[#5A4A3E] transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        儲存中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        儲存變更
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
