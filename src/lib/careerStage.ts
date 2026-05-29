import type { CareerStage } from "@/types/careerStage";

export const DEFAULT_CAREER_STAGE: CareerStage = "FRESHER";

export async function getCareerStage(supabase: any): Promise<CareerStage | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return null;

    const { data: profile, error } = await supabase.from("profiles").select("career_stage").eq("id", userId).single();
    if (error) return null;
    return (profile?.career_stage as CareerStage) ?? null;
  } catch {
    return null;
  }
}

export async function setCareerStage(supabase: any, stage: CareerStage): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return false;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, career_stage: stage, updated_at: new Date().toISOString() }, { returning: "minimal" });

    return !error;
  } catch {
    return false;
  }
}

export function isFresher(stage?: CareerStage | null): boolean {
  return stage === "FRESHER";
}

export function isExperienced(stage?: CareerStage | null): boolean {
  return stage === "EXPERIENCED";
}
