"use client";

import { useLang, type Lang } from "./i18n";

const OPTIONS: Lang[] = ["en", "fr"];

export function LanguageToggle({ className = "" }: { className?: string }) {
    const { lang, setLang } = useLang();

    return (
        <div
            className={`flex items-center gap-1 font-mono text-xs ${className}`}
            role="group"
            aria-label="Language"
        >
            {OPTIONS.map((option, i) => (
                <span key={option} className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setLang(option)}
                        aria-pressed={lang === option}
                        className={`uppercase tracking-widest transition-colors rounded-sm px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-black/60 ${
                            lang === option
                                ? "text-black"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        {option}
                    </button>
                    {i < OPTIONS.length - 1 && <span className="text-gray-300">/</span>}
                </span>
            ))}
        </div>
    );
}
