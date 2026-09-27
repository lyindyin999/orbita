import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBITA — Explore the Solar System",
  description:
    "A cinematic 3D journey through the Solar System with real planetary data from NASA/JPL.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
