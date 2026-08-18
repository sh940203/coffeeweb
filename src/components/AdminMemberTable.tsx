"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Search, ShieldCheck, Phone, Mail } from "lucide-react";

interface Profile {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: string;
    created_at: string;
}

export default function AdminMemberTable() {
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) =>
            [m.email, m.full_name, m.phone].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
        );
    }, [members, query]);

    const adminCount = members.filter((m) => m.role === "admin").length;

    const initial = (m: Profile) =>
        (m.full_name?.trim()?.[0] || m.email?.[0] || "?").toUpperCase();

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-medium text-[#3B2F2F] flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        會員列表
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        共 {members.length} 位會員 · 其中 {adminCount} 位管理員
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜尋 Email / 姓名 / 電話..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-[#C4A882] focus:border-[#C4A882] outline-none w-full md:w-72"
                    />
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-md">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-[#FAF7F4] text-xs uppercase tracking-wider text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">會員</th>
                            <th className="px-6 py-4">聯絡電話</th>
                            <th className="px-6 py-4">身份</th>
                            <th className="px-6 py-4">註冊時間</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">載入中...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">{query ? "找不到符合的會員" : "目前尚無會員資料"}</td></tr>
                        ) : (
                            filtered.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#3B2F2F] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                                                {initial(member)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{member.full_name || "（未填姓名）"}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {member.phone ? (
                                            <span className="flex items-center gap-1 text-gray-700">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                {member.phone}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"}`}>
                                            {member.role === "admin" && <ShieldCheck className="w-3 h-3" />}
                                            {member.role === "admin" ? "管理員" : "一般會員"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(member.created_at).toLocaleDateString()}
                                        <span className="text-gray-300 ml-1">
                                            {new Date(member.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
