import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://ghostnote.io";
const TITLE = "Ghost Note — Zero-knowledge notes that vanish";
const DESCRIPTION =
  "Share secrets that self-destruct. Notes and files are encrypted in your browser with AES-256, read once, then permanently deleted. Zero-knowledge by design.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Ghost Note",
  },
  description: DESCRIPTION,
  applicationName: "Ghost Note",
  keywords: [
    "zero-knowledge",
    "encrypted notes",
    "self-destructing messages",
    "one-time secret",
    "AES-256",
    "read once",
    "private sharing",
  ],
  authors: [{ name: "Ghost Note" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Ghost Note",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
