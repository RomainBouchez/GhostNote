"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import type { StepCopy } from "./i18n";
import { ScrambleText } from "./scramble-text";

interface StepPanelProps {
    step: StepCopy;
    align: "left" | "right";
    vAlign?: "top" | "bottom";
    accent?: boolean;
}

export function StepPanel({ step, align, vAlign = "top", accent = false }: StepPanelProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // Fade in as the panel enters, then hold opaque — never fade back out on exit.
    const opacity = useTransform(scrollYProgress, [0.1, 0.32], [0, 1]);
    const y = useTransform(scrollYProgress, [0.1, 0.4, 0.6, 0.9], [40, 0, 0, -40]);

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        const inView = v > 0.3 && v < 0.7;
        if (inView !== active) setActive(inView);
    });

    return (
        <section
            ref={ref}
            className="relative flex min-h-screen flex-col px-6 sm:px-10"
        >
            {/* Each card lives in one half of the section so it can never cross
                the vertical centre where the globe's focus point sits. Top cards
                bottom-align in the upper half; bottom cards top-align in the lower. */}
            <div
                className={`mx-auto flex h-[50vh] w-full max-w-7xl ${
                    vAlign === "top" ? "items-end pb-4" : "mt-auto items-center"
                }`}
            >
            <motion.div
                style={{ opacity, y }}
                className={`w-full max-w-md ${
                    align === "right" ? "ml-auto text-right" : "mr-auto text-left"
                }`}
            >
                <div
                    className={`inline-block rounded-2xl border border-black/10 bg-white/45 p-6 shadow-[0_1px_40px_rgba(0,0,0,0.04)] backdrop-blur-md sm:p-8 ${
                        align === "right" ? "text-right" : "text-left"
                    }`}
                >
                    <div
                        className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] ${
                            align === "right" ? "justify-end" : "justify-start"
                        } ${accent ? "text-red-500" : "text-gray-400"}`}
                    >
                        {accent && (
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                            </span>
                        )}
                        <span>{step.index}</span>
                        <span className="text-gray-300">·</span>
                        <span>{step.label}</span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-black sm:text-3xl">
                        <ScrambleText text={step.title} active={active} />
                    </h2>

                    <p className="mt-3 text-base leading-relaxed text-gray-500">
                        {step.body}
                    </p>
                </div>
            </motion.div>
            </div>
        </section>
    );
}
