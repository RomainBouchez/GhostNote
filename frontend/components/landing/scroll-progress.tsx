"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin top progress bar tracking the whole-page scroll. */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <motion.div
            aria-hidden="true"
            style={{ scaleX }}
            className="fixed top-0 left-0 right-0 z-[60] h-0.5 origin-left bg-black"
        />
    );
}
