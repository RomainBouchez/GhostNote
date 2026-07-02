"use client";

import { useEffect, useRef, useState } from "react";

const CRYPT_CHARS = "!<>-_\\/[]{}—=+*^?#________ABCDEF0123456789";

interface ScrambleTextProps {
    text: string;
    /** When true, the text "decrypts" from noise into the real string. */
    active: boolean;
    className?: string;
    /** Frames of scramble before fully resolving. */
    frames?: number;
}

/**
 * Reveals a string with a "decrypting" scramble effect. Re-runs whenever the
 * text changes (e.g. language switch) while active. Respects reduced-motion.
 */
export function ScrambleText({ text, active, className = "", frames = 26 }: ScrambleTextProps) {
    const [display, setDisplay] = useState(text);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        if (!active || prefersReduced) {
            setDisplay(text);
            return;
        }

        let frame = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            frame++;
            const progress = frame / frames;
            const revealed = Math.floor(progress * text.length);
            let out = "";
            for (let i = 0; i < text.length; i++) {
                if (text[i] === " ") {
                    out += " ";
                } else if (i < revealed) {
                    out += text[i];
                } else {
                    out += CRYPT_CHARS[Math.floor(Math.random() * CRYPT_CHARS.length)];
                }
            }
            setDisplay(out);
            if (frame >= frames) {
                setDisplay(text);
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, 40);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, active, frames]);

    return (
        <span className={className} aria-label={text}>
            <span aria-hidden="true">{display}</span>
        </span>
    );
}
