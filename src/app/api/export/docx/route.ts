import { NextRequest, NextResponse } from "next/server";
import { Document, Packer } from "docx";
import type { ResumeData, TemplateId } from "@/types/resume";
import { buildDocxChildren } from "@/lib/docxLayouts";

const A4_PAGE_WIDTH_TWIPS = 11906;
const A4_PAGE_HEIGHT_TWIPS = 16838;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/export/docx
export async function POST(req: NextRequest) {
  try {
    const { resumeData, selectedTemplate, templateAccentColor } = (await req.json()) as {
      resumeData: ResumeData;
      selectedTemplate?: TemplateId;
      templateAccentColor?: string;
    };

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: A4_PAGE_WIDTH_TWIPS, height: A4_PAGE_HEIGHT_TWIPS },
              margin: { top: 720, right: 900, bottom: 720, left: 900 },
            },
          },
          children: [
            ...buildDocxChildren(resumeData, selectedTemplate, templateAccentColor),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_") || "Resume"}_Resume.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("[/api/export/docx]", err);
    return NextResponse.json({ error: "DOCX export failed" }, { status: 500 });
  }
}
