import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriScan AI - FSSAI Front-of-Pack Nutrition Grade & Nutri-Score Calculator",
  description: "Intelligent food wrapper label scanner and Nutri-Score calculator tailored for Indian packaged foods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#080c14] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
