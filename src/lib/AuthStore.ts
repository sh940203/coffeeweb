import { create } from 'zustand';

interface AuthState {
    isAuthModalOpen: boolean;
    authView: 'login' | 'register';
    openAuthModal: (view?: 'login' | 'register') => void;
    closeAuthModal: () => void;
    setAuthView: (view: 'login' | 'register') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthModalOpen: false,
    authView: 'login',
    openAuthModal: (view = 'login') => set({ isAuthModalOpen: true, authView: view }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),
    setAuthView: (view) => set({ authView: view }),
}));
