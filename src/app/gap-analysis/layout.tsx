"use client";

import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { FloatingResumeBanner } from "@/components/FloatingResumeBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function GapAnalysisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>{children}</main>
      <FloatingResumeBanner />

      <SiteFooter />
    </div>
  );
}
