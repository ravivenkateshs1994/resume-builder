import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

interface AuthGateCardProps {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}

export function AuthGateCard({
  title,
  description,
  primaryHref = "/login",
  primaryLabel = "Sign in",
  secondaryHref = "/",
  secondaryLabel = "Back to home",
  className = "",
}: AuthGateCardProps) {
  return (
    <div className={`w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/80 p-8 text-center text-slate-100 shadow-lg backdrop-blur ${className}`.trim()}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10">
        <Lock className="h-7 w-7 text-cyan-200" />
      </div>
      <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link href={primaryHref} className="crp-btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm">
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={secondaryHref} className="crp-btn-secondary inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm">
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}