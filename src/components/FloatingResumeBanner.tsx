"use client";

import { useResumeStore } from "@/store/resumeStore";
import { FileText, Sparkles, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingResumeBanner() {
  const { resumeData, uploadedResume } = useResumeStore();
  const pathname = usePathname();
  
  const hasBuilderResume = !!(
    resumeData.personalInfo?.fullName || 
    (resumeData.skills && resumeData.skills.length > 0) || 
    (resumeData.workExperience && resumeData.workExperience.length > 0)
  );
  
  const hasUploadedResume = !!uploadedResume;
  const hasAnything = hasBuilderResume || hasUploadedResume;

  if (!hasAnything) return null;

  const displayName = hasUploadedResume 
    ? uploadedResume.label 
    : (resumeData.personalInfo?.fullName || "Untitled Draft");
  
  const showBadge = hasUploadedResume && hasBuilderResume;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/10 ring-1 ring-black/20">
        <div className="flex items-center gap-2.5 border-r border-white/20 pr-4">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm">
             <FileText className="h-4 w-4" />
           </div>
           <div className="flex flex-col min-w-0">
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                 {hasUploadedResume ? "Uploaded Resume" : "App Draft"}
               </span>
               {showBadge && (
                 <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/30 font-bold uppercase">
                   + Draft Available
                 </span>
               )}
             </div>
             <span className="text-xs sm:text-sm font-semibold truncate max-w-[150px] mt-0.5">
               {displayName}
             </span>
           </div>
        </div>

        <div className="flex items-center gap-4">
          {!pathname.includes("/create") && (
            <Link href="/create" className="text-xs sm:text-sm font-medium hover:text-indigo-400 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Resume</span>
            </Link>
          )}
          
          {pathname.includes("/create") ? (
            <Link href="/create?step=personal" className="text-xs sm:text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Continue</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            !pathname.includes("/gap-analysis/analysis") && (
              <Link href="/gap-analysis/analysis" className="text-xs sm:text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">Analyze</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
