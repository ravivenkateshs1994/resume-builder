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
              size: { width: 11906, height: 16838 },
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

    const { personalInfo, summary, workExperience, education, skills, certifications } =
      resumeData;

    const accent = headingColorForTemplate(selectedTemplate, templateAccentColor);

    const doc = new Document({
      sections: [
        {
          children: [
            // Header
            new Paragraph({
              text: personalInfo.fullName,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: [
                    personalInfo.jobTitle,
                    personalInfo.email,
                    personalInfo.phone,
                    personalInfo.location,
                    personalInfo.linkedin,
                    personalInfo.website,
                  ]
                    .filter(Boolean)
                    .join("  |  "),
                  size: 20,
                }),
              ],
              spacing: { after: 220 },
            }),

            // Summary
            ...(summary
              ? [
                  new Paragraph({
                    text: "PROFESSIONAL SUMMARY",
                    heading: HeadingLevel.HEADING_2,
                    thematicBreak: false,
                    spacing: { before: 80, after: 140 },
                    children: [
                      new TextRun({ text: "PROFESSIONAL SUMMARY", color: accent, bold: true }),
                    ],
                    border: {
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
                    },
                  }),
                  new Paragraph({ text: summary, spacing: { after: 220 } }),
                ]
              : []),

            // Work Experience
            ...(workExperience.length > 0
              ? [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 80, after: 140 },
                    children: [new TextRun({ text: "WORK EXPERIENCE", color: accent, bold: true })],
                    border: {
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
                    },
                  }),
                  ...workExperience.flatMap((w) => {
                    return [
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          new TextRun({ text: w.title, bold: true }),
                          new TextRun({ text: `  —  ${w.company}`, italics: true }),
                          new TextRun({
                            text: `  |  ${w.startDate} – ${w.endDate}`,
                            color: "666666",
                          }),
                        ],
                      }),
                      ...(w.location
                        ? [new Paragraph({ text: w.location, spacing: { after: 80 } })]
                        : []),
                      ...paragraphsFromRichHtml(w.description),
                      new Paragraph({ text: "", spacing: { after: 120 } }),
                    ];
                  }),
                ]
              : []),

            // Education
            ...(education.length > 0
              ? [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 80, after: 140 },
                    children: [new TextRun({ text: "EDUCATION", color: accent, bold: true })],
                    border: {
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
                    },
                  }),
                  ...education.flatMap((e) => [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [
                        new TextRun({ text: `${e.degree}${e.field ? ` in ${e.field}` : ""}`, bold: true }),
                        new TextRun({ text: `  —  ${e.institution}`, italics: true }),
                        new TextRun({
                          text: `  |  ${e.startDate} – ${e.endDate}`,
                          color: "666666",
                        }),
                      ],
                    }),
                    ...(e.gpa
                      ? [new Paragraph({ children: [new TextRun({ text: `GPA: ${e.gpa}`, color: "666666" })] })]
                      : []),
                    ...(e.honors ? [new Paragraph({ text: e.honors })] : []),
                    new Paragraph({ text: "", spacing: { after: 120 } }),
                  ]),
                ]
              : []),

            // Skills
            ...(skills.length > 0
              ? [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 80, after: 140 },
                    children: [new TextRun({ text: "SKILLS", color: accent, bold: true })],
                    border: {
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
                    },
                  }),
                  ...skills.map(
                    (skill) =>
                      new Paragraph({
                        text: skill,
                        bullet: { level: 0 },
                        spacing: { after: 40 },
                      })
                  ),
                  new Paragraph({ text: "", spacing: { after: 120 } }),
                ]
              : []),

            // Certifications
            ...(certifications.length > 0
              ? [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 80, after: 140 },
                    children: [new TextRun({ text: "CERTIFICATIONS", color: accent, bold: true })],
                    border: {
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
                    },
                  }),
                  ...certifications.map(
                    (c) =>
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          new TextRun({ text: c.name, bold: true }),
                          new TextRun({ text: `  —  ${c.issuer}  |  ${c.date}` }),
                        ],
                      })
                  ),
                ]
              : []),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx"`,
      },
    });
  } catch (err) {
    console.error("[/api/export/docx]", err);
    return NextResponse.json({ error: "DOCX export failed" }, { status: 500 });
  }
}
