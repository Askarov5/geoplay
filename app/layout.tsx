import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "GeoPlay - Competitive Geography Game",
  description:
    "Race, block, and outsmart friends by navigating the world map under pressure.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#0a0e1a]">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
