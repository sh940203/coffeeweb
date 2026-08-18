"use client";

import { useCartStore } from "@/lib/CartStore";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function CartTrigger({ scrolled = true }: { scrolled?: boolean }) {
    const { toggleCart, items } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const count = mounted ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

    return (
        <button
            onClick={toggleCart}
            className={cn(
                "relative p-2 transition-colors",
                scrolled ? "text-[#6B5B4E] hover:text-[#3B2F2F]" : "text-white hover:text-white/80 drop-shadow-md"
            )}
        >
            <ShoppingCart className="w-7 h-7 stroke-1" />
            {count > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B2F2F] text-[10px] text-white">
                    {count}
                </span>
            )}
        </button>
    );
}
