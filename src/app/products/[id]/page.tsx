"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Coffee } from "@/types/index";
import { useCartStore } from "@/lib/CartStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FlavorRadar from "@/components/FlavorRadar";
import FadeIn from "@/components/animations/FadeIn";
import WishlistButton from "@/components/WishlistButton";
import { ChevronLeft, ShoppingCart, Check, Bean, Thermometer, Droplets, MapPin, Award } from "lucide-react";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const [coffee, setCoffee] = useState<Coffee | null>(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const { addItem } = useCartStore();

    useEffect(() => {
        const fetchCoffee = async () => {
            const { data, error } = await supabase
                .from("coffees")
                .select("*")
                .eq("id", id)
                .single();

            if (data) {
                // Map DB fields to frontend type
                const mapped: Coffee = {
                    ...data,
                    process: data.processing_method,
                    flavor: data.flavor_notes,
                    price_display: data.price_half_lb ? `NT$${data.price_half_lb}` : '未定價',
                    // Default values for radar chart if missing
                    acid: data.acid ?? 3,
                    aroma: data.aroma ?? 3,
                    bitter: data.bitter ?? 3,
                    body: data.body ?? 3,
                };
                setCoffee(mapped);
            }
            setLoading(false);
        };

        if (id) fetchCoffee();
    }, [id]);

    const handleAddToCart = () => {
        if (coffee) {
            addItem(coffee);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    if (!coffee) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    const stock = coffee.stock ?? 10;
    const isOutOfStock = stock <= 0 || !coffee.is_available;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <FadeIn>
                <main className="container mx-auto px-6 py-12 md:py-24 max-w-7xl flex-grow">
                    {/* Breadcrumb */}
                    <Link href="/" className="inline-flex items-center text-xs text-gray-400 hover:text-gray-900 mb-8 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        BACK TO SHOP
                    </Link>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {/* Left: Image */}
                        <div className="relative aspect-[3/4] md:aspect-[4/5] bg-gray-50 rounded-lg overflow-hidden">
                            {coffee.image_url ? (
                                <Image
                                    src={coffee.image_url}
                                    alt={coffee.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-200">
                                    <Bean className="w-24 h-24" />
                                </div>
                            )}
                        </div>

                        {/* Right: Info */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-wide">
                                    {coffee.name}
                                </h1>
                                <WishlistButton productId={coffee.id} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50" />
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 tracking-widest uppercase">
                                {coffee.origin && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {coffee.origin}</span>}
                                {coffee.roast_level && <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> {coffee.roast_level}</span>}
                            </div>

                            {/* Price */}
                            <div className="text-2xl font-medium text-gray-900 mb-8">
                                {coffee.price_display} <span className="text-sm font-normal text-gray-400">/ 半磅</span>
                            </div>

                            {/* Description/Flavor */}
                            {coffee.flavor && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Award className="w-4 h-4" /> 風味筆記
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed font-light">{coffee.flavor}</p>
                                </div>
                            )}

                            {/* Radar Chart Section */}
                            <div className="mb-10 p-6 bg-gray-50 rounded-sm">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 text-center">風味分析</h3>
                                <div className="w-full h-[200px]">
                                    <FlavorRadar coffee={coffee} />
                                </div>
                            </div>

                            {/* Features/Processing */}
                            {coffee.features && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Droplets className="w-4 h-4" /> 處理法與特色
                                    </h3>
                                    <div className="text-sm text-gray-600 bg-white border border-gray-100 p-4 rounded-sm">
                                        {coffee.process && <div className="mb-2"><span className="text-gray-400">處理法：</span> {coffee.process}</div>}
                                        <div>{coffee.features}</div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-8 border-t border-gray-100">
                                {isOutOfStock ? (
                                    <button disabled className="w-full py-4 bg-gray-100 text-gray-400 tracking-widest cursor-not-allowed uppercase font-medium">
                                        Sold Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={added}
                                        className={`w-full py-4 flex items-center justify-center gap-2 tracking-widest uppercase font-medium transition-all ${added ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
                                            }`}
                                    >
                                        {added ? (
                                            <>
                                                <Check className="w-5 h-5" /> Added to Cart
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5" /> Add to Cart
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </FadeIn>

            <Footer />
        </div>
    );
}
