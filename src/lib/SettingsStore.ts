import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface AnnouncementSetting {
    enabled: boolean;
    text: string;
}
export interface AboutSetting {
    body: string; // 段落以空行分隔
}

interface SettingsState {
    announcement: AnnouncementSetting | null;
    about: AboutSetting | null;
    loaded: boolean;
    load: () => Promise<void>;
}

// 全站可自訂內容（公告、關於我們…）一次載入，供 Navbar / 跑馬燈 / About 共用。
export const useSettingsStore = create<SettingsState>((set, get) => ({
    announcement: null,
    about: null,
    loaded: false,
    load: async () => {
        if (get().loaded) return;
        const { data } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['announcement', 'about']);
        const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
        set({
            announcement: map.announcement ?? null,
            about: map.about ?? null,
            loaded: true,
        });
    },
}));
