import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, requireSupabaseUser } from "@/lib/supabase/server";
import { stableHash } from "@/lib/utils";
import { getColorName } from "@/lib/colorNames";
import type { ResumeData } from "@/types/resume";

interface SaveResumeBody {
  title?: string;
  resumeData: ResumeData;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const supabase = getSupabaseServerClient();

    // Optional template filter via query string: ?templateId=modern
    const templateFilter = request.nextUrl.searchParams.get("templateId");

    let builder: any = supabase
      .from("user_resumes")
      .select(
        "id, created_at, updated_at, title, resume_data, template_id, template_name, template_accent_color, template_color_name"
      )
      .eq("user_id", user.id);

    if (templateFilter) {
      builder = builder.eq("template_id", templateFilter);
    }

    const { data, error } = await builder.order("updated_at", { ascending: false }).limit(50);

    if (error) throw error;
    return NextResponse.json({
      resumes: (data ?? []).map((r: any) => {
        const resumeData = r.resume_data ?? {};
        if (!resumeData.template && r.template_id) {
          resumeData.template = {
            id: r.template_id,
            name: r.template_name ?? r.template_id,
            accentColor: r.template_accent_color,
            colorName: r.template_color_name ?? null,
          };
        }
        return { id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at, resumeData };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list resumes.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSupabaseUser(request);
    const body = (await request.json()) as SaveResumeBody;
    if (!body?.resumeData) {
      return NextResponse.json({ error: "resumeData is required." }, { status: 400 });
    }

    const title = body.title?.trim() || body.resumeData.personalInfo.fullName?.trim() || body.resumeData.targetRole?.trim() || "Resume Draft";

    // Compute content hash ignoring transient template metadata so users don't get duplicate entries
    // when only the selected template/colour changes.
    const forHash: any = JSON.parse(JSON.stringify(body.resumeData));
    if (forHash?.template) delete forHash.template;
    const contentHash = stableHash(forHash);

    // Extract template metadata (may be present in resumeData.template)
    const tmpl: any = (body.resumeData as any)?.template ?? {};
    const templateId = tmpl?.id ?? null;
    const templateName = tmpl?.name ?? null;
    const templateAccentColor = tmpl?.accentColor ?? null;
    const templateColorName = getColorName(templateAccentColor);

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_resumes")
      .upsert(
        {
          user_id: user.id,
          title,
          resume_data: body.resumeData,
          content_hash: contentHash,
          template_id: templateId,
          template_name: templateName,
          template_accent_color: templateAccentColor,
          template_color_name: templateColorName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_hash", ignoreDuplicates: false }
      )
      .select("id, created_at, updated_at, title, resume_data, template_id, template_name, template_accent_color, template_color_name")
      .single();

    if (error) throw error;
    return NextResponse.json({ resume: { id: data.id, title: data.title, createdAt: data.created_at, updatedAt: data.updated_at, resumeData: data.resume_data } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save resume.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

