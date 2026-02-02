import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import { supabase } from "@/lib/supabase";
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
    process: c.processing_method,
    flavor: c.flavor_notes,
    price_display: c.price_half_lb ? `NT$${c.price_half_lb}` : '未定價',
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <HeroSection />

      <main id="shop" className="flex-grow container mx-auto px-6 md:px-12 py-24 w-full max-w-7xl scroll-mt-20">
        <div className="mb-16 text-center space-y-4">
          <h1 className="text-3xl md:text-3xl font-light tracking-[0.2em] text-[#333333]">
            當季豆單
          </h1>
          <p className="text-xs text-gray-400 tracking-[0.3em] font-light uppercase">
            Seasonal Selection
          </p>
        </div>

        <ProductGrid coffees={productList} />
      </main>

      <AboutSection />

      <Footer />
    </div>
  );
}
