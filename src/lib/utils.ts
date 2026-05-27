import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Produces a stable SHA-256 hex digest of any JSON-serialisable value.
 * Object keys are sorted so {a:1,b:2} === {b:2,a:1}.
 */
export function stableHash(value: unknown): string {
  const json = JSON.stringify(value, (_key, val) =>
    val !== null && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort())
      : val
  );
  return createHash("sha256").update(json).digest("hex");
}
