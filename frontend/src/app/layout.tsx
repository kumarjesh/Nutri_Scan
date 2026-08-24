import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";

export const metadata: Metadata = {
  title: "NutriScan AI — Smart Front-of-Pack Nutrition Grade & FSSAI Scanner",
  description: "Unmask hidden sugar levels, palm oil, and INS 476 additives in Indian packaged foods before taking a bite. Powered by OpenCV & 2023 Nutri-Score.",
  keywords: ["NutriScan AI", "Nutri-Score India", "FSSAI Label Scanner", "Food Nutrition Grade", "Sugar Meter", "Cadbury Sugar Level", "Amul Dark Chocolate"],
  openGraph: {
    title: "NutriScan AI — Smart FSSAI Label Scanner & Nutri-Score Calculator",
    description: "Scan packaging back labels with your phone camera to instantly reveal official Nutri-Score grades (A to E) and pre-eating verdicts.",
    type: "website",
    locale: "en_US",
    siteName: "NutriScan AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriScan AI — Unmask Hidden Packaging Labels",
    description: "Camera OCR scanner for Indian food packaging labels & Nutri-Score (A-E) ratings.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#080c14] text-slate-100 min-h-screen">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
