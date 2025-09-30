import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerpDEX Arbitrage Visualizer",
  description: "Track price differences between Hyperliquid and Lighter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


