import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  UnderlineType,
  ImageRun,
} from "docx";
import type { ResumeData, TemplateId } from "@/types/resume";
import { getDefaultTemplateAccent, normalizeHexColor } from "@/lib/templateTheme";
import { buildDocxChildren } from "@/lib/docxLayouts";

const A4_PAGE_WIDTH_TWIPS = 11906;
const A4_PAGE_HEIGHT_TWIPS = 16838;
const WORD_DEFAULT_MARGIN_TWIPS = 1440;

function dataUrlToBuffer(dataUrl: string): Buffer {
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!m) throw new Error("Invalid image data URL for DOCX export.");
  return Buffer.from(m[2], "base64");
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function inlineRunsFromHtml(html: string): TextRun[] {
  const tokens = html
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .split(/(<[^>]+>)/g)
    .filter(Boolean);

  const runs: TextRun[] = [];
  const state = { bold: false, italics: false, underline: false };

  for (const token of tokens) {
    if (token.startsWith("<")) {
      const tag = token.toLowerCase().replace(/[<>/]/g, "").trim().split(" ")[0];
      const isClosing = token.startsWith("</");
      if (tag === "strong" || tag === "b") state.bold = !isClosing;
      if (tag === "em" || tag === "i") state.italics = !isClosing;
      if (tag === "u") state.underline = !isClosing;
      continue;
    }

    const text = decodeEntities(token);
    if (!text) continue;

    runs.push(
      new TextRun({
        text,
        bold: state.bold,
        italics: state.italics,
        underline: state.underline ? { type: UnderlineType.SINGLE } : undefined,
      })
    );
  }

  return runs.length ? runs : [new TextRun("")];
}

function paragraphsFromRichHtml(description: string): Paragraph[] {
  const html = description || "";
  const listItems = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m) => m[1] ?? "");
  if (listItems.length) {
    return listItems
      .map((item) => stripHtml(item))
      .filter(Boolean)
      .map(
        (text) =>
          new Paragraph({
            children: [new TextRun(text)],
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
      );
  }

  const blocks = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) => m[1] ?? "");
  if (blocks.length) {
    return blocks
      .map((block) => inlineRunsFromHtml(block))
      .map(
        (children) =>
          new Paragraph({
            children,
            spacing: { after: 120 },
          })
      );
  }

  const plain = stripHtml(html);
  return plain
    ? [
        new Paragraph({
          children: [new TextRun(plain)],
          spacing: { after: 120 },
        }),
      ]
    : [];
}

function headingColorForTemplate(templateId?: TemplateId, accentColor?: string): string {
  const resolved = normalizeHexColor(
    accentColor ?? (templateId ? getDefaultTemplateAccent(templateId) : getDefaultTemplateAccent("modern"))
  );
  return resolved.replace(/^#/, "");
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
