"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import RotatingEarth from "@/components/ui/wireframe-dotted-globe";
import { LanguageProvider, useLang } from "@/components/landing/i18n";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { StepPanel } from "@/components/landing/step-panel";

// The journey the encrypted note takes across the globe.
const SENDER: [number, number] = [2.3522, 48.8566]; // Paris
const RECIPIENT: [number, number] = [-74.006, 40.7128]; // New York

function Experience() {
    const { t } = useLang();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ["start start", "end end"],
    });

    // Hero fades and lifts away as the camera locks onto the first node.
    const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.94]);
    const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -40]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

    return (
        <>
            <ScrollProgress />
            <Header />

            <main>
                <section ref={scrollRef} className="relative bg-white">
                    {/* Sticky globe layer — the scroll-driven camera */}
                    <div className="sticky top-0 h-screen w-full overflow-hidden">
                        {/* Subtle radial vignette to seat the globe on white */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    "radial-gradient(60% 60% at 50% 45%, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 70%)",
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <RotatingEarth
                                className="h-full w-auto"
                                progress={scrollYProgress}
                                focusMode
                                sender={SENDER}
                                recipient={RECIPIENT}
                            />
                        </div>
                    </div>

                    {/* Foreground content, pulled up to overlay the sticky globe */}
                    <div className="relative -mt-[100vh]">
                        {/* Hero */}
                        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
                            <motion.div
                                style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                                className="flex flex-col items-center"
                            >
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="text-5xl font-bold tracking-tighter text-black drop-shadow-sm sm:text-7xl md:text-8xl"
                                >
                                    {t.hero.title}
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                    className="mt-6 max-w-md text-base text-gray-400 sm:text-lg md:text-xl"
                                >
                                    {t.hero.taglineTop}
                                    <br />
                                    {t.hero.taglineBottom}
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="mt-10"
                                >
                                    <Link
                                        href="/create"
                                        className="inline-block rounded-full bg-black px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2"
                                    >
                                        {t.hero.cta}
                                    </Link>
                                </motion.div>
                            </motion.div>

                            <motion.div
                                style={{ opacity: hintOpacity }}
                                className="absolute bottom-10 flex flex-col items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400"
                            >
                                <span>{t.hero.scroll}</span>
                                <motion.span
                                    aria-hidden="true"
                                    animate={{ y: [0, 6, 0] }}
                                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    ↓
                                </motion.span>
                            </motion.div>
                        </div>

                        {/* Technical narrative — revealed while the note travels */}
                        <div id="how-it-works">
                            {t.steps.map((step, i) => (
                                <StepPanel
                                    key={step.index}
                                    step={step}
                                    align={i % 2 === 0 ? "left" : "right"}
                                    accent={i === t.steps.length - 1}
                                />
                            ))}
                        </div>

                        {/* Outro CTA */}
                        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.6 }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col items-center"
                            >
                                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">
                                    {t.outro.eyebrow}
                                </span>
                                <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tighter text-black sm:text-5xl">
                                    {t.outro.title}
                                </h2>
                                <Link
                                    href="/create"
                                    className="mt-10 inline-block rounded-full bg-black px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2"
                                >
                                    {t.outro.cta}
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}

export default function LandingPage() {
    return (
        <LanguageProvider>
            <Experience />
        </LanguageProvider>
    );
}
