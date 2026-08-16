import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// § 5 — Display font: Fraunces (variable font with axes)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

// § 5 — UI font: Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Twilight Chronicles",
    template: "%s — Twilight Chronicles",
  },
  description:
    "A two-player conversation game for people who aren't in the same room — you choose the mood, Twilight Chronicles chooses the question.",
  keywords: [
    "conversation game",
    "two player",
    "long distance",
    "couples game",
    "friends game",
    "questions game",
  ],
  authors: [{ name: "Twilight Chronicles" }],
  openGraph: {
    title: "Twilight Chronicles",
    description: "The conversations that come out at dusk.",
    type: "website",
    siteName: "Twilight Chronicles",
  },
  twitter: {
    card: "summary_large_image",
    title: "Twilight Chronicles",
    description: "The conversations that come out at dusk.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7F1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body>{children}</body>
    </html>
  );
}
