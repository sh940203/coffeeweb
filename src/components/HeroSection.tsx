"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative h-screen flex flex-col items-center justify-center bg-[#F9F9F9] overflow-hidden">
            {/* Background Image/Texture Layer */}
            <div className="absolute inset-0 z-0">
                {/* Optional: Add a subtle background image here if desired */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F9F9F9]/80" />
            </div>

            <div className="relative z-10 text-center space-y-8 px-6">
                {/* 1. Subtitle */}
                <p
                    className={cn(
                        "text-gray-500 tracking-[0.3em] text-xs md:text-sm uppercase font-light transition-all duration-1000 transform",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}
                >
                    Handmade Coffee Roastery
                </p>

                {/* 2. Heading */}
                <h1
                    className={cn(
                        "text-4xl md:text-6xl font-light text-gray-900 tracking-[0.1em] leading-tight transition-all duration-1000 delay-300 transform",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}
                >
                    家庭手作
                    <span
                        className={cn(
                            "block mt-4 text-2xl md:text-3xl text-gray-500 font-extralight tracking-[0.15em] transition-all duration-1000 delay-500",
                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                        )}
                    >
                        用心烘焙，純粹風味
                    </span>
                </h1>

                {/* 3. Button */}
                <div
                    className={cn(
                        "relative z-20 pt-12 transition-all duration-1000 delay-700 transform",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}
                >
                    <Link
                        href="#shop"
                        className="relative z-30 inline-flex items-center gap-3 px-10 py-4 bg-gray-900 text-white text-sm tracking-[0.2em] hover:bg-gray-800 transition-all duration-300 rounded-sm group shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        立即開始選購
                        <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                    </Link>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div
                className={cn(
                    "absolute bottom-12 animate-bounce text-gray-300 transition-opacity duration-1000 delay-500",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
            >
                <ArrowDown className="w-6 h-6 stroke-1" />
            </div>
        </section>
    );
}
