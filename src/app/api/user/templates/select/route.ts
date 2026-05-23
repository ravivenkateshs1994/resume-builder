import { NextResponse } from "next/server";
import { persistTemplateSelection } from "@/lib/templateSelections";
import { getTemplateById } from "@/lib/templateCatalog";
import type { TemplateId } from "@/types/resume";

export const dynamic = "force-dynamic";

function inferUserKey(request: Request): string {
  const fromHeader = request.headers.get("x-user-id");
  if (fromHeader) return fromHeader;
  return "anonymous";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { templateId?: string } | null;
  const templateId = body?.templateId;

  if (!templateId || !getTemplateById(templateId)) {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }

  const userKey = inferUserKey(request);
  persistTemplateSelection(userKey, templateId as TemplateId);

  return NextResponse.json({ ok: true, templateId, userKey });
}
