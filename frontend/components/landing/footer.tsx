"use client";

import Link from "next/link";
import { useLang } from "./i18n";

const GITHUB_URL = "https://github.com/romainbouchez/ghostnote";

export function Footer() {
    const { t } = useLang();

    return (
        <footer className="relative z-10 border-t border-black/5 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-sm space-y-3">
                        <div className="flex items-center gap-2 font-mono text-sm font-semibold text-black">
                            <span aria-hidden="true">👻</span>
                            <span>Ghost Note</span>
                        </div>
                        <p className="text-sm text-gray-500">{t.footer.tagline}</p>
                    </div>

                    <nav className="flex flex-col gap-3 font-mono text-xs uppercase tracking-widest text-gray-500">
                        <a
                            href="#how-it-works"
                            className="transition-colors hover:text-black rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60"
                        >
                            {t.footer.howItWorks}
                        </a>
                        <Link
                            href="/create"
                            className="transition-colors hover:text-black rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60"
                        >
                            {t.footer.create}
                        </Link>
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors hover:text-black rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-black/60"
                        >
                            {t.footer.source}
                        </a>
                    </nav>
                </div>

                <div className="mt-10 flex items-center gap-2 border-t border-black/5 pt-6">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-black" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400">
                        {t.footer.rights}
                    </span>
                </div>
            </div>
        </footer>
    );
}
