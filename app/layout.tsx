import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lyindyin999.github.io/orbita/"),
  title: "ORBITA — Explore the Solar System",
  description:
    "A cinematic 3D journey through the Solar System with real planetary data from NASA/JPL.",
  applicationName: "ORBITA",
  openGraph: {
    title: "ORBITA — Explore the Solar System",
    description:
      "Fly through a cinematic 3D Solar System and explore real planetary data.",
    url: "https://lyindyin999.github.io/orbita/",
    siteName: "ORBITA",
    type: "website",
  },
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
