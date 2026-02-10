import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "GeoPlay - Competitive Geography Game",
  description:
    "Race, block, and outsmart friends by navigating the world map under pressure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a]">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
