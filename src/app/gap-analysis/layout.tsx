"use client";

// FloatingResumeBanner removed
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function GapAnalysisLayout({ children }: { children: React.ReactNode }) {
  

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>{children}</main>

      <SiteFooter />
    </div>
  );
}
