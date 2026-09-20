import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "SpendGate — Liability + multi-principal policy for agentic commerce",
    template: "%s · SpendGate",
  },
  description:
    "EU-native liability and multi-principal policy layer over any commerce agent. Mandates, per-intent spend contracts, approval hierarchy, and an append-only evidence pack.",
  openGraph: {
    title: "SpendGate",
    description:
      "The liability layer agents don’t have. Multi-principal mandates over any commerce agent.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[15px] leading-6">{children}</body>
    </html>
  );
}
