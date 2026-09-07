import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Kept for the NM-EX wordmark only — see `.font-brand`. */
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "NM-EX · Nigerian Metals Exchange",
  description:
    "Nigeria's benchmark for transparent mineral prices.",
  metadataBase: new URL("https://nm-ex.com"),
  openGraph: {
    title: "NM-EX · Nigerian Metals Exchange",
    description: "Nigeria's benchmark for transparent mineral prices.",
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
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${syne.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
