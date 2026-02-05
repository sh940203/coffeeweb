import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import { supabase } from "@/lib/supabase";
import FadeIn from "@/components/animations/FadeIn";
import { Coffee } from "@/types/coffee";

// This is a Server Component by default
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  // Fetch data
  const { data: coffees, error } = await supabase
    .from("coffees")
    .select("*")
    .eq("is_available", true) // Filter only available items
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching coffees:", error);
  } else {
    console.log("Fetched coffees:", coffees);
  }

  // Handle null data and map DB fields to Frontend Type
  const productList: Coffee[] = (coffees || []).map((c: any) => ({
    ...c,
    // Using DB columns directly: process, flavor, price_display are already correct
    price_display: c.price_display || (c.price_half_lb ? `NT$${c.price_half_lb}` : '未定價'),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <FadeIn className="w-full">
        <HeroSection />
      </FadeIn>

      <main id="shop" className="flex-grow container mx-auto px-6 md:px-12 py-24 w-full max-w-7xl scroll-mt-20">
        <FadeIn delay={0.2} className="mb-16 text-center space-y-4">
          <h1 className="text-3xl md:text-3xl font-light tracking-[0.2em] text-[#333333]">
            當季豆單
          </h1>
          <p className="text-xs text-gray-400 tracking-[0.3em] font-light uppercase">
            Seasonal Selection
          </p>
        </FadeIn>

        <ProductGrid coffees={productList} />
      </main>

      <FadeIn delay={0.2} direction="up">
        <AboutSection />
      </FadeIn>

      <Footer />
    </div>
  );
}
