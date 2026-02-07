import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Coffee } from '@/types/coffee';

export interface CartItem extends Coffee {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;

    // Actions
    addItem: (product: Coffee, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;

    // Getters (computed properties pattern in Zustand)
    getTotalPrice: () => number;
    getFreeShippingProgress: () => { current: number; threshold: number; remaining: number; progress: number };
}

const FREE_SHIPPING_THRESHOLD = 3000;

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isCartOpen: false,

            addItem: (product: Coffee, quantity: number = 1) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.id === product.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.id === product.id
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }
                    return { items: [...state.items, { ...product, quantity: quantity }] };
                });
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                }));
            },

            updateQuantity: (productId, quantity) => {
                if (quantity < 1) {
                    get().removeItem(productId);
                    return;
                }
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

            getTotalPrice: () => {
                const { items } = get();
                return items.reduce((sum, item) => {
                    // Extract price number from string "NT$ 400"
                    const price = parseInt(item.price_display?.replace(/\D/g, '') || "0", 10);
                    return sum + price * item.quantity;
                }, 0);
            },

            getFreeShippingProgress: () => {
                const total = get().getTotalPrice();
                return {
                    current: total,
                    threshold: FREE_SHIPPING_THRESHOLD,
                    remaining: Math.max(0, FREE_SHIPPING_THRESHOLD - total),
                    progress: Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)
                };
            }
        }),
        {
            name: 'coffee-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
