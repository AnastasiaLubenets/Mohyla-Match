import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = localFont({
  src: [
    { path: "./fonts/geist-100.ttf", weight: "100" },
    { path: "./fonts/geist-200.ttf", weight: "200" },
    { path: "./fonts/geist-300.ttf", weight: "300" },
    { path: "./fonts/geist-400.ttf", weight: "400" },
    { path: "./fonts/geist-500.ttf", weight: "500" },
    { path: "./fonts/geist-600.ttf", weight: "600" },
    { path: "./fonts/geist-700.ttf", weight: "700" },
    { path: "./fonts/geist-800.ttf", weight: "800" },
    { path: "./fonts/geist-900.ttf", weight: "900" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "./fonts/geist-mono-100.ttf", weight: "100" },
    { path: "./fonts/geist-mono-200.ttf", weight: "200" },
    { path: "./fonts/geist-mono-300.ttf", weight: "300" },
    { path: "./fonts/geist-mono-400.ttf", weight: "400" },
    { path: "./fonts/geist-mono-500.ttf", weight: "500" },
    { path: "./fonts/geist-mono-600.ttf", weight: "600" },
    { path: "./fonts/geist-mono-700.ttf", weight: "700" },
    { path: "./fonts/geist-mono-800.ttf", weight: "800" },
    { path: "./fonts/geist-mono-900.ttf", weight: "900" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-500.ttf", weight: "500" },
    { path: "./fonts/cormorant-garamond-600.ttf", weight: "600" },
    { path: "./fonts/cormorant-garamond-700.ttf", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mohyla Match",
    template: "%s | Mohyla Match",
  },
  description:
    "Discover students across Mohyla based on skills, interests and what you want to build.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
