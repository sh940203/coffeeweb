import type { Metadata } from "next";
import { Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import CartSidebar from "@/components/CartSidebar";
import { Toaster } from "sonner";

const notoSerifTC = Noto_Serif_TC({
    variable: "--font-noto-serif",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "家庭手作烘焙咖啡",
    description: "用心烘焙每一顆咖啡豆，帶給您最純粹的風味。",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-TW">
            <body
                className={`${notoSerifTC.variable} antialiased bg-[#F9F9F9] text-[#333333]`}
            >
                {children}
                <CartSidebar />
                <Toaster position="top-center" richColors />
            </body>
        </html>
    );
}
