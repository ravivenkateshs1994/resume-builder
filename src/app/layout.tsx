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

const SITE_TITLE = "Career Readiness";
const SITE_DESCRIPTION =
  "Become interview-ready with AI-powered resume tailoring, JD match analysis, skill-gap insights, and personalized learning roadmaps.";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUPPETEER_BASE_URL || "https://example.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/#app`,
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "AI resume tailoring",
        "Job description match analysis",
        "Skill gap insights",
        "Learning roadmaps",
        "PDF and DOCX export",
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      en: "/",
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: BASE_URL,
    siteName: SITE_TITLE,
    // opengraph-image.tsx auto-generates the og:image at 1200x630
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_TITLE,
    statusBarStyle: "default",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  other: {
    "geo.region": "US",
    "geo.placename": "United States",
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
        <a href="#content" className="skip-link">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ChunkErrorHandler />
        <PwaRegister />
        <main id="content" role="main">{children}</main>
      </body>
    </html>
  );
}
