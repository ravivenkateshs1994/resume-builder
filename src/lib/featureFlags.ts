function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isPremiumTemplatesEnabled(): boolean {
  return parseBooleanFlag(process.env.FEATURE_PREMIUM_TEMPLATES);
}

export function isPremiumTemplatesEnabledClient(): boolean {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_PREMIUM_TEMPLATES);
}
