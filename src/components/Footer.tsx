"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Footer() {
    const footerRef = useRef<HTMLElement>(null);
    const isInView = useInView(footerRef, { once: true, margin: "-50px" });

    return (
        <motion.footer
            ref={footerRef}
            className="w-full py-12 mt-16 text-center text-sm text-[#8B7355] border-t border-[#D8CCBE]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
            <p className="tracking-widest">Copyright © {new Date().getFullYear()} 家庭烘焙咖啡</p>
            <p className="mt-3 text-xs tracking-[0.15em] opacity-80">用心烘焙每一顆咖啡豆</p>
            <p className="mt-5 text-xs tracking-[0.15em]">
                Produced by{" "}
                <a
                    href="https://sh-studio.huhu940203.workers.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B5B4E] underline underline-offset-4 decoration-[#D8CCBE] hover:text-[#3B2F2F] transition-colors"
                >
                    @SH Studio
                </a>
            </p>
        </motion.footer>
    );
}
