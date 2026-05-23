import { NextRequest, NextResponse } from "next/server";
import { createExportSession } from "@/lib/exportSessions";

export async function POST(req: NextRequest) {
  const { resumeData, selectedTemplate, templateAccentColor } = await req.json();
  const sessionId = createExportSession({ resumeData, selectedTemplate, templateAccentColor });
  return NextResponse.json({ sessionId });
}
