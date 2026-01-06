"use client";

import RotatingEarth from "@/components/ui/wireframe-dotted-globe";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Globe Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-1000 py-15">
        <RotatingEarth className="w-full max-w-4xl" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full min-h-[80vh] md:min-h-0 md:h-auto justify-between md:justify-end p-6 md:p-4 md:space-y-4">
        <div className="space-y-4 pt-50 md:pt-0">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-black drop-shadow-sm">
            Ghost Note
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-md mx-auto">
            Zero-Knowledge. Read-Once. <br />
            Share secrets that vanish forever.
          </p>
        </div>

        <Link
          href="/create"
          className="mb-10 md:mb-0 px-8 py-4 bg-black text-white text-lg font-bold rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl"
        >
          Send a Note
        </Link>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-600">
        End-to-End Encrypted • No Logs • Auto-Destruction
      </div>
    </div>
  );
}
