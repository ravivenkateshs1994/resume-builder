"use client";

// FloatingResumeBanner removed
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function GapAnalysisLayout({ children }: { children: React.ReactNode }) {
  

  return (
    <div className="min-h-screen bg-[#06141d] text-slate-100">
      <SiteHeader />

      <main>{children}</main>

      <SiteFooter />
    </div>
  );
}
