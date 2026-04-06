import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investment Idea Radar",
  description: "Quantitative stock screening and research workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
