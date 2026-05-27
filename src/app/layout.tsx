import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import ChunkErrorHandler from "@/components/ChunkErrorHandler";
import PwaRegister from "@/components/PwaRegister";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Career Readiness Platform",
  description: "Become interview-ready with AI-powered resume tailoring, JD match analysis, skill-gap insights, and personalized learning roadmaps.",
  applicationName: "AI Resume Builder",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AI Resume Builder",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${playfair.variable} bg-gray-50 text-gray-900 antialiased`}>
        <ChunkErrorHandler />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
