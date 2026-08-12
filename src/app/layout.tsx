import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NM-EX · Nigerian Metals Exchange",
  description:
    "Live spot reference for Nigeria's principal mineral exports — Tin, Lead, Zinc, Gold, and Columbite–Tantalite — in USD and NGN.",
  metadataBase: new URL("https://nm-ex.com"),
  openGraph: {
    title: "NM-EX · Nigerian Metals Exchange",
    description:
      "Official spot reference for Nigeria's solid mineral exports, converted to naira.",
    url: "https://nm-ex.com",
    siteName: "NM-EX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
