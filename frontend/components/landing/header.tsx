"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { useLang } from "./i18n";
import { LanguageToggle } from "./language-toggle";

const GITHUB_URL = "https://github.com/romainbouchez/ghostnote";

export function Header() {
    const { t } = useLang();
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (v) => {
        setScrolled(v > 24);
    });

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
                scrolled
                    ? "bg-white/70 backdrop-blur-md border-b border-black/5"
                    : "bg-transparent border-b border-transparent"
            }`}
        >
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-black rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60"
                >
                    <span>Ghost Note</span>
                </Link>

                <nav className="flex items-center gap-3 sm:gap-5">
                    <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden font-mono text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-black sm:inline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60"
                    >
                        {t.header.source}
                    </a>
                    <LanguageToggle />
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Link
                            href="/create"
                            className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2"
                        >
                            {t.header.cta}
                        </Link>
                    </motion.div>
                </nav>
            </div>
        </header>
    );
}
