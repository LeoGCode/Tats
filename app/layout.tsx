import type { Metadata, Viewport } from "next";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/400-italic.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "@fontsource/atkinson-hyperlegible-next/800.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midterm Test — Ventures 1",
  description: "Ventures Level 1 midterm (Units 1–5) with feedback in Spanish.",
  // An English test must never be auto-translated into Spanish by the browser.
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9ebee" },
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no">
      <body>{children}</body>
    </html>
  );
}
