"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Search } from "lucide-react";

interface Profile {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

export default function AdminMemberTable() {
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    會員列表 ({members.length})
                </h2>

                {/* Simple Search Placeholder */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜尋會員..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-sm text-sm focus:border-gray-900 outline-none w-64"
                        disabled
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Email / 帳號</th>
                            <th className="px-6 py-4">身份</th>
                            <th className="px-6 py-4">註冊時間</th>
                            <th className="px-6 py-4">狀態</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">載入中...</td>
                            </tr>
                        ) : members.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">目前尚無會員資料</td>
                            </tr>
                        ) : (
                            members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {member.role === 'admin' ? '管理員' : '一般會員'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(member.created_at).toLocaleDateString()} {new Date(member.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-600 flex items-center gap-1 text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            正常
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
