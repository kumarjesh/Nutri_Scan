import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="posthog-init" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}var m=e;for(void 0!==a?m=e[a]=[]:a="posthog",m.people=m.people||[],m.toString=function(t){var e="posthog";return"default"!==a&&(e+="."+a),t||(e+=" (stub)"),e},m.people.toString=function(){return m.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify_group setGroupProperties resetGroupProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags".split(" "),n=0;n<o.length;n++)g(m,o[n]);e._i.push([i,s,a])},e.__SV=1.0,o=t.createElement("script"),o.type="text/javascript",o.async=!0,o.src=s.api_host+"/static/array.js",(n=t.getElementsByTagName("script")[0]).parentNode.insertBefore(o,n))}(document,window.posthog||[]);
            posthog.init('phc_ki5c86tGZJHwfHnEJdztikc3tpQ3gSuRoN7GB5gbFMsZ', {api_host: 'https://us.i.posthog.com', person_profiles: 'always'});
          `}
        </Script>
      </head>
      <body className="antialiased bg-[#080c14] text-slate-100 min-h-screen">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
