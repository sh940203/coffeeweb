"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Coffee } from "@/types/index";
import ProductGrid from "@/components/ProductGrid";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/animations/FadeIn";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPage() {
    const [coffees, setCoffees] = useState<Coffee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                setLoading(false);
                return;
            }

            // Fetch wishlist items with product details
            // Note: This assumes foreign key relation is set up or we fetch manually.
            // Since we might not have complex joins setup in type gen, let's do it simply:
            // Fetch wishlist -> IDs -> fetch coffees

            const { data: wishlistItems } = await supabase
                .from("wishlists")
                .select("product_id")
                .eq("user_id", sessionData.session.user.id);

            if (wishlistItems && wishlistItems.length > 0) {
                const ids = wishlistItems.map(item => item.product_id);
                const { data: products } = await supabase
                    .from("coffees")
                    .select("*")
                    .in("id", ids);

                if (products) {
                    // Map processing_method -> process, flavor_notes -> flavor
                    const mapped = products.map((c: any) => ({
                        ...c,
                        process: c.processing_method,
                        flavor: c.flavor_notes,
                        price_display: c.price_half_lb ? `NT$${c.price_half_lb}` : '未定價'
                    }));
                    setCoffees(mapped);
                }
            } else {
                setCoffees([]);
            }
            setLoading(false);
        };

        fetchWishlist();
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-6 py-12">
                <FadeIn className="mb-8">
                    <h1 className="text-2xl font-light tracking-widest flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-current" />
                        MY WISHLIST
                    </h1>
                </FadeIn>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Loading...</div>
                ) : coffees.length > 0 ? (
                    <ProductGrid coffees={coffees} />
                ) : (
                    <FadeIn delay={0.2} className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-sm text-center">
                        <p className="text-gray-500 mb-4 tracking-widest">您的收藏清單是空的</p>
                        <Link href="/" className="px-6 py-2 bg-gray-900 text-white text-sm tracking-widest hover:bg-gray-700 transition-colors">
                            去逛逛
                        </Link>
                    </FadeIn>
                )}
            </main>

            <Footer />
        </div>
    );
}
