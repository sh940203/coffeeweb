"use client";

import { useEffect } from "react";
import { Megaphone } from "lucide-react";
import { useSettingsStore } from "@/lib/SettingsStore";

// 公告跑馬燈：固定於頁面最上方，由後台 app_settings.announcement 控制。
export default function AnnouncementBar() {
    const { announcement, load } = useSettingsStore();

    useEffect(() => {
        load();
    }, [load]);

    if (!announcement?.enabled || !announcement.text?.trim()) return null;

    // 重複文字確保長度足夠、跑馬燈無縫
    const text = announcement.text.trim();

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-9 bg-[#3B2F2F] text-[#EDE5DB] flex items-center overflow-hidden">
            <div className="flex-shrink-0 px-3 h-full flex items-center bg-[#2A2020] z-10">
                <Megaphone className="w-4 h-4" />
            </div>
            <div className="relative flex-1 overflow-hidden">
                <div className="marquee-track whitespace-nowrap text-xs tracking-wider py-2">
                    {[0, 1].map((i) => (
                        <span key={i} className="mx-8" aria-hidden={i === 1}>
                            {text}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
