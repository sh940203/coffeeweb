"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils"; // Assuming you might have a generic utility, if not I'll just use template literals

interface WishlistButtonProps {
    productId: string;
    className?: string;
}

export default function WishlistButton({ productId, className = "" }: WishlistButtonProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check initial status
    useEffect(() => {
        const checkStatus = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) return;

            const { data } = await supabase
                .from("wishlists")
                .select("id")
                .eq("user_id", sessionData.session.user.id)
                .eq("product_id", productId)
                .single();

            if (data) setIsLiked(true);
        };
        checkStatus();
    }, [productId]);

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        if (loading) return;
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
            alert("請先登入會員");
            setLoading(false);
            return;
        }

        const userId = sessionData.session.user.id;

        if (isLiked) {
            // Remove
            const { error } = await supabase
                .from("wishlists")
                .delete()
                .eq("user_id", userId)
                .eq("product_id", productId);

            if (!error) setIsLiked(false);
        } else {
            // Add
            const { error } = await supabase
                .from("wishlists")
                .insert({ user_id: userId, product_id: productId });

            if (!error) setIsLiked(true);
        }
        setLoading(false);
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={loading}
            className={`p-2 rounded-full transition-all duration-300 ${isLiked ? "text-red-500 bg-red-50" : "text-gray-300 hover:text-red-400 hover:bg-gray-50"} ${className}`}
        >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
        </button>
    );
}
