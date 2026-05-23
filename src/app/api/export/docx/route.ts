import { NextRequest, NextResponse } from "next/server";
import { Document, ImageRun, Packer, Paragraph } from "docx";
import type { ResumeData, TemplateId } from "@/types/resume";
import { buildDocxChildren } from "@/lib/docxLayouts";

const A4_PAGE_WIDTH_TWIPS = 11906;
const A4_PAGE_HEIGHT_TWIPS = 16838;

function dataUrlToBuffer(dataUrl: string): Buffer {
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!m) throw new Error("Invalid image data URL for DOCX export.");
  return Buffer.from(m[2], "base64");
}

// POST /api/export/docx
export async function POST(req: NextRequest) {
  try {
    const { mode, resumeData, selectedTemplate, templateAccentColor, pages } = (await req.json()) as {
      mode?: "visual" | "structured";
      resumeData: ResumeData;
      selectedTemplate?: TemplateId;
      templateAccentColor?: string;
      pages?: unknown[];
    };

    if (mode === "visual") {
      const visualPages = Array.isArray(pages)
        ? pages
            .filter(
              (page): page is { dataUrl: string; width: number; height: number } =>
                Boolean(page && typeof page === "object" && typeof (page as { dataUrl?: unknown }).dataUrl === "string") &&
                typeof (page as { width?: unknown }).width === "number" &&
                typeof (page as { height?: unknown }).height === "number"
            )
        : [];
      if (!visualPages.length) {
        return NextResponse.json({ error: "No visual pages provided." }, { status: 400 });
      }

      const doc = new Document({
        sections: visualPages.map((page) => ({
          properties: {
            page: {
              size: { width: A4_PAGE_WIDTH_TWIPS, height: A4_PAGE_HEIGHT_TWIPS },
              margin: { top: 0, right: 0, bottom: 0, left: 0 },
            },
          },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new ImageRun({
                  type: "jpg",
                  data: dataUrlToBuffer(page.dataUrl),
                  transformation: {
                    width: 794,
                    height: Math.max(1, Math.round((page.height / page.width) * 794)),
                  },
                }),
              ],
            }),
          ],
        })),
      });

      const buffer = await Packer.toBuffer(doc);
      const fileName = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_") || "Resume"}_Resume.docx`;

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

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
