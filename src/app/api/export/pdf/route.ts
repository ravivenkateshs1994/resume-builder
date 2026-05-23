import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ResumeData, TemplateId } from "@/types/resume";
import { ResumePdfDocument } from "@/lib/resume-pdf-document";

export const runtime = "nodejs";

function buildPdfFileName(fullName: string): string {
  const baseName = fullName
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return `${baseName || "Resume"}_Resume.pdf`;
}

export async function POST(req: NextRequest) {
  let resumeData: ResumeData | null = null;

  try {
    const body = (await req.json()) as {
      resumeData?: ResumeData;
      selectedTemplate?: TemplateId;
      templateAccentColor?: string;
    };

    resumeData = body.resumeData ?? null;

    if (!resumeData?.personalInfo?.fullName) {
      return NextResponse.json({ error: "Missing resume data." }, { status: 400 });
    }

    const selectedTemplate = body.selectedTemplate ?? "modern";
    const pdfBuffer = await renderToBuffer(
      createElement(ResumePdfDocument, {
        resumeData,
        selectedTemplate,
        accentColor: body.templateAccentColor,
      }) as Parameters<typeof renderToBuffer>[0]
    );

    const fileName = buildPdfFileName(resumeData.personalInfo.fullName);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[/api/export/pdf]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF export failed" },
      { status: 500 }
    );
  }
}