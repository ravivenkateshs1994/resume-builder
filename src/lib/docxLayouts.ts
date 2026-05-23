import {
  AlignmentType,
  BorderStyle,
  ImageRun,
  Paragraph,
  ShadingType,
  Table,
  TableBorders,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlignTable,
  WidthType,
} from "docx";
import type { ResumeData, TemplateId } from "@/types/resume";
import { createTemplateTheme, getDefaultTemplateAccent, normalizeHexColor } from "@/lib/templateTheme";

type DocxBlock = Paragraph | Table;
type Theme = ReturnType<typeof createTemplateTheme>;
const STANDARD_FONT = "Aptos";
const SERIF_FONT = "Times New Roman";
const MONO_FONT = "Consolas";

function docxColor(color: string): string {
  return normalizeHexColor(color).replace(/^#/, "");
}

function rt(text: string, options: any = {}): TextRun {
  return new TextRun({
    text,
    font: options.font ?? STANDARD_FONT,
    size: options.size,
    color: options.color ? docxColor(options.color) : undefined,
    bold: options.bold,
    italics: options.italics,
    underline: options.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function p(children: TextRun[] = [], options: any = {}): Paragraph {
  return new Paragraph({ children, ...options });
}

function blank(after = 80): Paragraph {
  return p([rt(" ")], { spacing: { after } });
}

function rule(color: string, size = 6, after = 120): Paragraph {
  return p([rt(" ")], {
    border: {
      bottom: { style: BorderStyle.SINGLE, size, color: docxColor(color) },
    },
    spacing: { after },
  });
}

function sectionHeading(title: string, theme: Theme, options: any = {}): Paragraph {
  const text = options.uppercase === false ? title : title.toUpperCase();
  const withRule = options.withRule !== false;
  return p([rt(text, {
    font: options.font ?? STANDARD_FONT,
    size: options.size ?? 18,
    color: options.color ?? theme.accent,
    bold: true,
  })], {
    alignment: options.align ?? AlignmentType.LEFT,
    spacing: {
      before: options.before ?? 80,
      after: options.after ?? (withRule ? 40 : 80),
    },
    border: withRule
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: options.borderSize ?? 4,
            color: docxColor(options.borderColor ?? options.color ?? theme.accent),
          },
        }
      : undefined,
  });
}

function lineParagraph(text: string, options: any = {}): Paragraph {
  return p([rt(text, {
    font: options.font ?? STANDARD_FONT,
    size: options.size ?? 18,
    color: options.color,
    bold: options.bold,
    italics: options.italics,
  })], {
    alignment: options.align ?? AlignmentType.LEFT,
    spacing: options.spacing ?? { after: 40 },
  });
}

function joinParts(parts: Array<string | undefined | null>, separator = "  |  "): string {
  return parts.filter(Boolean).join(separator);
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

function inlineRunsFromHtml(html: string, options: any = {}): TextRun[] {
  const tokens = html
    .replace(/<br\s*\/?>\s*/gi, "\n")
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

    runs.push(rt(text, {
      font: options.font ?? STANDARD_FONT,
      size: options.size ?? 18,
      color: options.color,
      bold: state.bold,
      italics: state.italics,
      underline: state.underline,
    }));
  }

  return runs.length ? runs : [rt("")];
}

function paragraphsFromRichHtml(description: string, options: any = {}): Paragraph[] {
  const html = description || "";
  const listItems = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m) => m[1] ?? "");
  if (listItems.length) {
    return listItems
      .map((item) => stripHtml(item))
      .filter(Boolean)
      .map(
        (text) =>
          p([rt(text, {
            font: options.font ?? STANDARD_FONT,
            size: options.size ?? 18,
            color: options.color,
          })], {
            bullet: { level: 0 },
            spacing: { after: options.after ?? 60 },
          })
      );
  }

  const blocks = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) => m[1] ?? "");
  if (blocks.length) {
    return blocks
      .map((block) => inlineRunsFromHtml(block, options))
      .map(
        (children) =>
          p(children, {
            spacing: { after: options.after ?? 90 },
          })
      );
  }

  const plain = stripHtml(html);
  return plain
    ? [
        p([rt(plain, {
          font: options.font ?? STANDARD_FONT,
          size: options.size ?? 18,
          color: options.color,
        })], { spacing: { after: options.after ?? 90 } }),
      ]
    : [];
}

function makeContactLine(info: ResumeData["personalInfo"], options: any = {}): Paragraph | null {
  const text = joinParts(
    [info.jobTitle, info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean) as string[],
    "  |  "
  );
  if (!text) return null;

  return lineParagraph(text, {
    font: options.font ?? STANDARD_FONT,
    size: options.size ?? 18,
    color: options.color,
    align: options.align,
    spacing: options.spacing,
  });
}

function makeContactStack(info: ResumeData["personalInfo"], options: any = {}): Paragraph[] {
  const lines = [
    info.email,
    info.phone,
    info.location,
    info.linkedin,
    info.website,
  ].filter(Boolean) as string[];

  return lines.map((text) =>
    lineParagraph(text, {
      font: options.font ?? STANDARD_FONT,
      size: options.size ?? 18,
      color: options.color,
      align: options.align ?? AlignmentType.LEFT,
      spacing: options.spacing ?? { after: 20 },
    })
  );
}

function makeSingleCellBand(children: DocxBlock[], fill: string, options: any = {}): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: children.length ? children : [blank(0)],
            shading: { type: ShadingType.SOLID, color: "auto", fill: docxColor(fill) },
            verticalAlign: VerticalAlignTable.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    columnWidths: [10000],
  });
}

function makeTwoCellBand(left: DocxBlock[], right: DocxBlock[], leftFill: string, rightFill: string, options: any = {}): Table {
  const leftWidth = options.leftWidth ?? 1800;
  const rightWidth = options.rightWidth ?? 8200;
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: left.length ? left : [blank(0)],
            shading: { type: ShadingType.SOLID, color: "auto", fill: docxColor(leftFill) },
            margins: options.leftMargins ?? { top: 200, bottom: 200, left: 180, right: 180 },
            verticalAlign: VerticalAlignTable.CENTER,
            width: { size: leftWidth, type: WidthType.DXA },
          }),
          new TableCell({
            children: right.length ? right : [blank(0)],
            shading: { type: ShadingType.SOLID, color: "auto", fill: docxColor(rightFill) },
            margins: options.rightMargins ?? { top: 200, bottom: 200, left: 260, right: 260 },
            verticalAlign: VerticalAlignTable.CENTER,
            width: { size: rightWidth, type: WidthType.DXA },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    columnWidths: [leftWidth, rightWidth],
  });
}

function makeTwoColumnLayout(left: DocxBlock[], right: DocxBlock[], options: any = {}): Table {
  const leftWidth = options.leftWidth ?? 6500;
  const rightWidth = options.rightWidth ?? 3500;
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: left.length ? left : [blank(0)],
            width: { size: leftWidth, type: WidthType.DXA },
            margins: options.leftMargins ?? { top: 120, bottom: 120, left: 0, right: 180 },
            shading: options.leftFill ? { type: ShadingType.SOLID, color: "auto", fill: docxColor(options.leftFill) } : undefined,
            verticalAlign: VerticalAlignTable.TOP,
          }),
          new TableCell({
            children: right.length ? right : [blank(0)],
            width: { size: rightWidth, type: WidthType.DXA },
            margins: options.rightMargins ?? { top: 120, bottom: 120, left: 180, right: 0 },
            shading: options.rightFill ? { type: ShadingType.SOLID, color: "auto", fill: docxColor(options.rightFill) } : undefined,
            verticalAlign: VerticalAlignTable.TOP,
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    columnWidths: [leftWidth, rightWidth],
  });
}

function makeSidebarAvatar(initials: string, fill: string, textColor: string, options: any = {}): Paragraph {
  const headshotUrl = typeof options.headshotUrl === "string" ? options.headshotUrl : "";
  if (headshotUrl) {
    const match = headshotUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      const size = options.headshotSize ?? 96;
      const imageType = match[1].split("/")[1]?.toLowerCase();
      const image = new ImageRun({
        type: imageType === "jpeg" ? "jpg" : imageType === "jpg" ? "jpg" : "png",
        data: Buffer.from(match[2], "base64"),
        transformation: { width: size, height: size },
      });
      return p([image], {
        alignment: AlignmentType.CENTER,
        spacing: options.spacing ?? { before: 60, after: 120 },
      });
    }
  }

  return p([rt(initials || "?", {
    font: options.font ?? STANDARD_FONT,
    size: options.size ?? 28,
    color: textColor,
    bold: true,
  })], {
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: "auto", fill: docxColor(fill) },
    spacing: options.spacing ?? { before: 60, after: 120 },
  });
}

function makeSkillStack(skills: string[], theme: Theme, options: any = {}): Paragraph[] {
  if (!skills.length) return [];
  return skills.map((skill) =>
    p([rt(skill, {
      font: options.font ?? STANDARD_FONT,
      size: options.size ?? 17,
      color: options.color ?? theme.contrast,
      bold: true,
    })], {
      shading: { type: ShadingType.SOLID, color: "auto", fill: docxColor(options.fill ?? theme.accent) },
      border: options.borderColor
        ? {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: docxColor(options.borderColor) },
          }
        : undefined,
      spacing: { after: options.after ?? 50 },
      alignment: options.align ?? AlignmentType.LEFT,
    })
  );
}

function makeInlineSkills(skills: string[], theme: Theme, options: any = {}): Paragraph[] {
  if (!skills.length) return [];
  return [
    p([rt(skills.join("  |  "), {
      font: options.font ?? STANDARD_FONT,
      size: options.size ?? 18,
      color: options.color ?? theme.accentDeep,
    })], {
      spacing: { after: options.after ?? 90 },
    }),
  ];
}

function makeSummarySection(summary: string, theme: Theme, options: any = {}): DocxBlock[] {
  if (!summary) return [];
  const title = options.title === undefined ? "Professional Summary" : options.title;
  return [
    ...(title === "" ? [] : [sectionHeading(title, theme, options.heading ?? {})]),
    p([rt(summary, {
      font: options.font ?? STANDARD_FONT,
      size: options.bodySize ?? 18,
      color: options.bodyColor ?? "333333",
    })], {
      spacing: { after: options.after ?? 110 },
    }),
  ];
}

function makeExperienceSection(workExperience: ResumeData["workExperience"], theme: Theme, options: any = {}): DocxBlock[] {
  if (!workExperience.length) return [];
  const title = options.title === undefined ? "Work Experience" : options.title;
  const blocks: DocxBlock[] = [...(title === "" ? [] : [sectionHeading(title, theme, options.heading ?? {})])];

  for (const w of workExperience) {
    if (options.timeline) {
      blocks.push(makeTimelineExperienceItem(w, theme, options));
      continue;
    }

    blocks.push(
      p([
        rt(w.title, {
          font: options.font ?? STANDARD_FONT,
          size: options.titleSize ?? 18,
          color: options.titleColor ?? "111827",
          bold: true,
        }),
        ...(w.company
          ? [rt(`  |  ${w.company}`, {
              font: options.font ?? STANDARD_FONT,
              size: options.bodySize ?? 18,
              color: options.accentColor ?? theme.accent,
              italics: true,
            })]
          : []),
        rt(`  |  ${w.startDate} - ${w.endDate}`, {
          font: options.font ?? STANDARD_FONT,
          size: options.bodySize ?? 18,
          color: options.dateColor ?? "666666",
        }),
      ], {
        border: options.borderColor
          ? {
              left: { style: BorderStyle.SINGLE, size: options.borderSize ?? 6, color: docxColor(options.borderColor) },
            }
          : undefined,
        spacing: { after: 30 },
      })
    );

    if (w.location) {
      blocks.push(lineParagraph(w.location, {
        font: options.font ?? STANDARD_FONT,
        size: options.bodySize ?? 17,
        color: options.mutedColor ?? "6b7280",
        spacing: { after: 30 },
      }));
    }

    blocks.push(...paragraphsFromRichHtml(w.description, {
      font: options.font ?? STANDARD_FONT,
      size: options.bodySize ?? 18,
      color: options.bodyColor ?? "374151",
      after: options.descriptionSpacing ?? 60,
    }));

    blocks.push(blank(options.after ?? 90));
  }

  return blocks;
}

function makeTimelineExperienceItem(w: ResumeData["workExperience"][number], theme: Theme, options: any = {}): Table {
  const dateWidth = options.dateWidth ?? 1350;
  const contentWidth = options.contentWidth ?? 7150;

  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: dateWidth, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.TOP,
            shading: { type: ShadingType.SOLID, color: "auto", fill: docxColor(options.dateFill ?? theme.accentSoft) },
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [
              lineParagraph(w.startDate, {
                font: options.font ?? STANDARD_FONT,
                size: options.dateSize ?? 17,
                color: options.dateColor ?? theme.accent,
                align: AlignmentType.CENTER,
                spacing: { after: 20 },
              }),
              lineParagraph(w.endDate, {
                font: options.font ?? STANDARD_FONT,
                size: options.dateSize ?? 17,
                color: options.dateColor ?? theme.accent,
                align: AlignmentType.CENTER,
                spacing: { after: 0 },
              }),
            ],
          }),
          new TableCell({
            width: { size: contentWidth, type: WidthType.DXA },
            verticalAlign: VerticalAlignTable.TOP,
            borders: {
              left: { style: BorderStyle.SINGLE, size: options.borderSize ?? 6, color: docxColor(options.borderColor ?? theme.accent) },
            },
            margins: { top: 120, bottom: 120, left: 180, right: 0 },
            children: [
              lineParagraph(w.title, {
                font: options.font ?? STANDARD_FONT,
                size: options.titleSize ?? 18,
                color: options.titleColor ?? "111827",
                bold: true,
                spacing: { after: 10 },
              }),
              ...(w.company
                ? [lineParagraph([w.company, w.location].filter(Boolean).join(" | "), {
                    font: options.font ?? STANDARD_FONT,
                    size: options.bodySize ?? 17,
                    color: options.accentColor ?? theme.accent,
                    bold: true,
                    spacing: { after: 20 },
                  })]
                : []),
              ...paragraphsFromRichHtml(w.description, {
                font: options.font ?? STANDARD_FONT,
                size: options.bodySize ?? 18,
                color: options.bodyColor ?? "374151",
                after: options.descriptionSpacing ?? 50,
              }),
            ],
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    columnWidths: [dateWidth, contentWidth],
  });
}

function makeEducationSection(education: ResumeData["education"], theme: Theme, options: any = {}): DocxBlock[] {
  if (!education.length) return [];
  const title = options.title === undefined ? "Education" : options.title;
  const blocks: DocxBlock[] = [...(title === "" ? [] : [sectionHeading(title, theme, options.heading ?? {})])];

  for (const e of education) {
    blocks.push(
      p([
        rt(`${e.degree}${e.field ? ` in ${e.field}` : ""}`, {
          font: options.font ?? STANDARD_FONT,
          size: options.titleSize ?? 18,
          color: options.titleColor ?? "111827",
          bold: true,
        }),
        ...(e.institution
          ? [rt(`  |  ${e.institution}`, {
              font: options.font ?? STANDARD_FONT,
              size: options.bodySize ?? 18,
              color: options.accentColor ?? theme.accent,
            })]
          : []),
        rt(`  |  ${e.startDate} - ${e.endDate}`, {
          font: options.font ?? STANDARD_FONT,
          size: options.bodySize ?? 18,
          color: options.dateColor ?? "666666",
        }),
      ], { spacing: { after: 20 } })
    );

    if (e.gpa || e.honors) {
      blocks.push(lineParagraph([e.honors, e.gpa ? `GPA: ${e.gpa}` : ""].filter(Boolean).join(" | "), {
        font: options.font ?? STANDARD_FONT,
        size: options.bodySize ?? 17,
        color: options.mutedColor ?? "6b7280",
        spacing: { after: 40 },
      }));
    }

    blocks.push(blank(options.after ?? 70));
  }

  return blocks;
}

function makeCertificationsSection(certifications: ResumeData["certifications"], theme: Theme, options: any = {}): DocxBlock[] {
  if (!certifications.length) return [];
  const title = options.title === undefined ? "Certifications" : options.title;
  const blocks: DocxBlock[] = [...(title === "" ? [] : [sectionHeading(title, theme, options.heading ?? {})])];

  for (const c of certifications) {
    blocks.push(
      lineParagraph(c.name, {
        font: options.font ?? STANDARD_FONT,
        size: options.titleSize ?? 17,
        color: options.titleColor ?? "111827",
        bold: true,
        spacing: { after: 10 },
      })
    );
    blocks.push(
      lineParagraph(c.issuer, {
        font: options.font ?? STANDARD_FONT,
        size: options.bodySize ?? 17,
        color: options.mutedColor ?? "6b7280",
        spacing: { after: 4 },
      })
    );
    if (!c.neverExpires && c.validTo) {
      blocks.push(
        lineParagraph(c.validTo, {
          font: options.font ?? STANDARD_FONT,
          size: options.bodySize ?? 17,
          color: options.mutedColor ?? "6b7280",
          spacing: { after: 4 },
        })
      );
    }
    blocks.push(blank(options.after ?? 35));
  }

  return blocks;
}

function buildModernLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const header = makeSingleCellBand(
    [
      lineParagraph(personalInfo.fullName || "Your Name", {
        font: STANDARD_FONT,
        size: 32,
        color: theme.contrast,
        bold: true,
      }),
      ...(personalInfo.jobTitle
        ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 20, color: theme.accentSofter })]
        : []),
      ...(makeContactLine(personalInfo, { font: STANDARD_FONT, size: 18, color: theme.accentSofter }) ? [makeContactLine(personalInfo, { font: STANDARD_FONT, size: 18, color: theme.accentSofter })!] : []),
    ],
    theme.accent,
    { margins: { top: 220, bottom: 220, left: 260, right: 260 } }
  );

  return [
    header,
    rule(theme.accent, 6, 120),
    ...makeSummarySection(summary, theme, {
      title: "Professional Summary",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accent },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Work Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeSummarySection(skills.length ? skills.join("  |  ") : "", theme, {
      title: "Skills",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accent },
      bodyColor: theme.accentDeep,
      bodySize: 18,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];
}

function buildClassicLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;

  return [
    p([rt(personalInfo.fullName || "Your Name", {
      font: SERIF_FONT,
      size: 32,
      color: "111827",
      bold: true,
    })], { alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    ...(personalInfo.jobTitle
      ? [p([rt(personalInfo.jobTitle, { font: SERIF_FONT, size: 20, color: "4b5563", italics: true })], {
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
        })]
      : []),
    ...(makeContactLine(personalInfo, { font: SERIF_FONT, size: 18, color: "4b5563", align: AlignmentType.CENTER })
      ? [makeContactLine(personalInfo, { font: SERIF_FONT, size: 18, color: "4b5563", align: AlignmentType.CENTER })!]
      : []),
    rule(theme.accent, 6, 140),
    ...makeSummarySection(summary, theme, {
      title: "Professional Summary",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Professional Experience",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeSummarySection(skills.length ? skills.join("  |  ") : "", theme, {
      title: "Skills",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      bodyColor: "374151",
      bodySize: 18,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];
}

function buildMinimalLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;

  return [
    p([rt(personalInfo.fullName || "Your Name", {
      font: STANDARD_FONT,
      size: 36,
      color: "111827",
    })], { spacing: { after: 30 } }),
    ...(personalInfo.jobTitle
      ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 18, color: "6b7280" })]
      : []),
    ...(makeContactLine(personalInfo, { font: STANDARD_FONT, size: 16, color: "9ca3af" })
      ? [makeContactLine(personalInfo, { font: STANDARD_FONT, size: 16, color: "9ca3af" })!]
      : []),
    ...makeSummarySection(summary, theme, {
      title: "Overview",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      bodyColor: "4b5563",
      after: 140,
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "4b5563",
      mutedColor: "9ca3af",
      after: 110,
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "4b5563",
      mutedColor: "9ca3af",
      after: 90,
    }),
    ...makeSummarySection(skills.length ? skills.join("  |  ") : "", theme, {
      title: "Skills",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      bodyColor: "4b5563",
      bodySize: 16,
      after: 120,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      titleColor: "111827",
      mutedColor: "9ca3af",
    }),
  ];
}

function buildApexLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;

  return [
    p([rt(personalInfo.fullName || "Your Name", {
      font: STANDARD_FONT,
      size: 34,
      color: "111827",
      bold: true,
    })], { spacing: { after: 20 } }),
    ...(personalInfo.jobTitle
      ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 18, color: theme.accent, bold: true })]
      : []),
    ...(makeContactLine(personalInfo, { font: STANDARD_FONT, size: 16, color: "6b7280" })
      ? [makeContactLine(personalInfo, { font: STANDARD_FONT, size: 16, color: "6b7280" })!]
      : []),
    rule(theme.accent, 6, 120),
    ...makeSummarySection(summary, theme, {
      title: "Professional Summary",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Work Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 80,
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeSummarySection(skills.length ? skills.join("  |  ") : "", theme, {
      title: "Skills",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      bodyColor: theme.accentDeep,
      bodySize: 18,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accent },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];
}

function buildExecutiveLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const header = makeSingleCellBand(
    [
      lineParagraph(personalInfo.fullName || "Your Name", { font: STANDARD_FONT, size: 30, color: theme.contrast, bold: true }),
      ...(personalInfo.jobTitle
        ? [lineParagraph(personalInfo.jobTitle.toUpperCase(), { font: STANDARD_FONT, size: 18, color: theme.accentSofter, bold: true })]
        : []),
      ...(makeContactLine(personalInfo, { font: STANDARD_FONT, size: 17, color: theme.accentSofter }) ? [makeContactLine(personalInfo, { font: STANDARD_FONT, size: 17, color: theme.accentSofter })!] : []),
    ],
    theme.accentDeep,
    { margins: { top: 220, bottom: 220, left: 260, right: 260 } }
  );

  const left = [
    ...makeSummarySection(summary, theme, {
      title: "Executive Summary",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accentDeep, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Professional Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accentDeep, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 85,
    }),
  ];

  const right = [
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accentDeep, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 60,
    }),
    ...(skills.length
      ? [sectionHeading("Core Competencies", theme, { font: STANDARD_FONT, size: 16, color: theme.accentDeep, borderColor: theme.accentBorder }), ...makeInlineSkills(skills, theme, { font: STANDARD_FONT, color: theme.accentDeep })]
      : []),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 16, color: theme.accentDeep, borderColor: theme.accentBorder },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];

  return [header, rule(theme.accent, 6, 120), makeTwoColumnLayout(left, right, { leftWidth: 5800, rightWidth: 4000 })];
}

function buildTerraLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const header = makeSingleCellBand(
    [
      lineParagraph(personalInfo.fullName || "Your Name", { font: SERIF_FONT, size: 30, color: theme.contrast, bold: true }),
      ...(personalInfo.jobTitle
        ? [lineParagraph(personalInfo.jobTitle.toUpperCase(), { font: SERIF_FONT, size: 18, color: theme.accentSofter, bold: true })]
        : []),
      ...(makeContactLine(personalInfo, { font: SERIF_FONT, size: 17, color: theme.accentSofter }) ? [makeContactLine(personalInfo, { font: SERIF_FONT, size: 17, color: theme.accentSofter })!] : []),
    ],
    theme.accentDeep,
    { margins: { top: 220, bottom: 220, left: 260, right: 260 } }
  );

  const left = [
    ...makeSummarySection(summary, theme, {
      title: "About Me",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 16, color: theme.accent, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Experience",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 16, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 80,
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 16, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 80,
    }),
  ];

  const right = [
    ...(skills.length
      ? [sectionHeading("Skills", theme, { font: SERIF_FONT, size: 16, color: theme.accent, borderColor: theme.accentBorder }), ...makeSkillStack(skills, theme, { font: SERIF_FONT, fill: theme.accentSoft, color: theme.accentDeep, borderColor: theme.accentBorder })]
      : []),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: SERIF_FONT,
      heading: { font: SERIF_FONT, size: 16, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];

  return [header, rule(theme.accent, 6, 120), makeTwoColumnLayout(left, right, { leftWidth: 6400, rightWidth: 3400 })];
}

function buildTechLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const header = makeSingleCellBand(
    [
      lineParagraph(personalInfo.fullName || "Your Name", { font: MONO_FONT, size: 28, color: theme.contrast, bold: true }),
      ...(personalInfo.jobTitle
        ? [lineParagraph(personalInfo.jobTitle, { font: MONO_FONT, size: 18, color: theme.accentSofter })]
        : []),
      ...(makeContactLine(personalInfo, { font: MONO_FONT, size: 16, color: theme.accentSofter }) ? [makeContactLine(personalInfo, { font: MONO_FONT, size: 16, color: theme.accentSofter })!] : []),
      ...(skills.length ? [lineParagraph(skills.join(" | "), { font: MONO_FONT, size: 16, color: theme.accentSofter })] : []),
    ],
    "0f172a",
    { margins: { top: 220, bottom: 220, left: 260, right: 260 } }
  );

  const left = [
    ...makeSummarySection(summary, theme, {
      title: "// about",
      font: MONO_FONT,
      heading: { font: MONO_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "// experience",
      font: MONO_FONT,
      heading: { font: MONO_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      borderColor: theme.accent,
      after: 80,
    }),
  ];

  const right = [
    ...makeEducationSection(education, theme, {
      title: "// education",
      font: MONO_FONT,
      heading: { font: MONO_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 50,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "// certifications",
      font: MONO_FONT,
      heading: { font: MONO_FONT, size: 16, color: theme.accent, withRule: false, uppercase: false },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];

  return [header, rule(theme.accent, 6, 120), makeTwoColumnLayout(left, right, { leftWidth: 6200, rightWidth: 3600 })];
}

function buildNovaLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const header = makeTwoCellBand(
    [makeSidebarAvatar(initials, theme.accentDeep, theme.contrastDeep, { font: STANDARD_FONT, size: 24, headshotUrl: personalInfo.headshotUrl, headshotSize: 96 })],
    [
      lineParagraph(personalInfo.fullName || "Your Name", { font: STANDARD_FONT, size: 30, color: theme.contrast, bold: true }),
      ...(personalInfo.jobTitle
        ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 18, color: theme.accentSofter, bold: true })]
        : []),
      ...(makeContactLine(personalInfo, { font: STANDARD_FONT, size: 16, color: theme.accentSofter }) ? [makeContactLine(personalInfo, { font: STANDARD_FONT, size: 16, color: theme.accentSofter })!] : []),
    ],
    theme.accentDeep,
    theme.accent,
    { leftWidth: 1700, rightWidth: 8300 }
  );

  return [
    header,
    ...makeSummarySection(summary, theme, {
      title: "Professional Summary",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Work Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
    ...makeSummarySection(skills.length ? skills.join("  |  ") : "", theme, {
      title: "Skills",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accentBorder },
      bodyColor: theme.accentDeep,
      bodySize: 18,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 18, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];
}

function buildCreativeLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const sidebar = [
    makeSidebarAvatar(initials, theme.accent, theme.contrast, { font: STANDARD_FONT, size: 24, headshotUrl: personalInfo.headshotUrl, headshotSize: 96 }),
    lineParagraph(personalInfo.fullName || "Your Name", { font: STANDARD_FONT, size: 24, color: theme.contrast, bold: true, align: AlignmentType.LEFT }),
    ...(personalInfo.jobTitle
      ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 16, color: theme.accentSofter })]
      : []),
    sectionHeading("Contact", theme, { font: STANDARD_FONT, size: 14, color: theme.accentSofter, withRule: false }),
    ...(personalInfo.email ? [lineParagraph(personalInfo.email, { font: STANDARD_FONT, size: 15, color: theme.accentSofter })] : []),
    ...(personalInfo.phone ? [lineParagraph(personalInfo.phone, { font: STANDARD_FONT, size: 15, color: theme.accentSofter })] : []),
    ...(personalInfo.location ? [lineParagraph(personalInfo.location, { font: STANDARD_FONT, size: 15, color: theme.accentSofter })] : []),
    ...(personalInfo.linkedin ? [lineParagraph(personalInfo.linkedin, { font: STANDARD_FONT, size: 14, color: theme.accentSofter })] : []),
    ...(personalInfo.website ? [lineParagraph(personalInfo.website, { font: STANDARD_FONT, size: 14, color: theme.accentSofter })] : []),
    sectionHeading("Skills", theme, { font: STANDARD_FONT, size: 14, color: theme.accentSofter, withRule: false }),
    ...makeSkillStack(skills, theme, { font: STANDARD_FONT, fill: theme.accent, color: theme.contrast, borderColor: theme.accentDeep }),
    sectionHeading("Education", theme, { font: STANDARD_FONT, size: 14, color: theme.accentSofter, withRule: false }),
    ...makeEducationSection(education, theme, {
      title: "",
      font: STANDARD_FONT,
      heading: { withRule: false, uppercase: false, color: theme.accentSofter },
      titleColor: theme.contrast,
      accentColor: theme.accentSofter,
      bodyColor: theme.accentSofter,
      mutedColor: theme.accentMuted,
      after: 60,
    }).filter((block) => !(block instanceof Paragraph && (block as any).options?.heading)),
    sectionHeading("Certifications", theme, { font: STANDARD_FONT, size: 14, color: theme.accentSofter, withRule: false }),
    ...makeCertificationsSection(certifications, theme, {
      title: "",
      font: STANDARD_FONT,
      heading: { withRule: false, uppercase: false, color: theme.accentSofter },
      titleColor: theme.contrast,
      mutedColor: theme.accentMuted,
    }).filter((block) => !(block instanceof Paragraph && (block as any).options?.heading)),
  ];

  const main = [
    ...makeSummarySection(summary, theme, {
      title: "About Me",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accentDeep, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accentDeep, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 85,
    }),
  ];

  return [makeTwoColumnLayout(sidebar, main, { leftWidth: 3000, rightWidth: 7000 })];
}

function buildSlateLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const darkSidebar = createTemplateTheme("0f172a");
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const sidebar = [
    makeSidebarAvatar(initials, theme.accent, theme.contrast, { font: STANDARD_FONT, size: 24, headshotUrl: personalInfo.headshotUrl, headshotSize: 96 }),
    lineParagraph(personalInfo.fullName || "Your Name", { font: STANDARD_FONT, size: 24, color: darkSidebar.contrast, bold: true }),
    ...(personalInfo.jobTitle ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 16, color: darkSidebar.accentSofter })] : []),
    sectionHeading("Contact", darkSidebar, { font: STANDARD_FONT, size: 14, color: darkSidebar.accentSofter, withRule: false }),
    ...(personalInfo.email ? [lineParagraph(personalInfo.email, { font: STANDARD_FONT, size: 15, color: darkSidebar.accentSofter })] : []),
    ...(personalInfo.phone ? [lineParagraph(personalInfo.phone, { font: STANDARD_FONT, size: 15, color: darkSidebar.accentSofter })] : []),
    ...(personalInfo.location ? [lineParagraph(personalInfo.location, { font: STANDARD_FONT, size: 15, color: darkSidebar.accentSofter })] : []),
    ...(personalInfo.linkedin ? [lineParagraph(personalInfo.linkedin, { font: STANDARD_FONT, size: 14, color: darkSidebar.accentSofter })] : []),
    ...(personalInfo.website ? [lineParagraph(personalInfo.website, { font: STANDARD_FONT, size: 14, color: darkSidebar.accentSofter })] : []),
    sectionHeading("Skills", darkSidebar, { font: STANDARD_FONT, size: 14, color: darkSidebar.accentSofter, withRule: false }),
    ...makeSkillStack(skills, theme, { font: STANDARD_FONT, fill: theme.accent, color: theme.contrast, borderColor: theme.accentDeep }),
    sectionHeading("Education", darkSidebar, { font: STANDARD_FONT, size: 14, color: darkSidebar.accentSofter, withRule: false }),
    ...makeEducationSection(education, theme, {
      title: "",
      font: STANDARD_FONT,
      heading: { withRule: false, uppercase: false, color: darkSidebar.accentSofter },
      titleColor: darkSidebar.contrast,
      accentColor: darkSidebar.accentSofter,
      bodyColor: darkSidebar.accentSofter,
      mutedColor: darkSidebar.accentMuted,
      after: 60,
    }).filter((block) => !(block instanceof Paragraph && (block as any).options?.heading)),
    sectionHeading("Certifications", darkSidebar, { font: STANDARD_FONT, size: 14, color: darkSidebar.accentSofter, withRule: false }),
    ...makeCertificationsSection(certifications, theme, {
      title: "",
      font: STANDARD_FONT,
      heading: { withRule: false, uppercase: false, color: darkSidebar.accentSofter },
      titleColor: darkSidebar.contrast,
      mutedColor: darkSidebar.accentMuted,
    }).filter((block) => !(block instanceof Paragraph && (block as any).options?.heading)),
  ];

  const main = [
    ...makeSummarySection(summary, theme, {
      title: "Profile",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Work Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 85,
    }),
  ];

  return [makeTwoColumnLayout(sidebar, main, { leftWidth: 3000, rightWidth: 7000, leftFill: darkSidebar.accent, rightFill: "ffffff" })];
}

function buildPrismLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const initials = personalInfo.fullName
    ? personalInfo.fullName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const sidebar = [
    makeSidebarAvatar(initials, theme.accent, theme.contrast, { font: STANDARD_FONT, size: 24, headshotUrl: personalInfo.headshotUrl, headshotSize: 96 }),
    lineParagraph(personalInfo.fullName || "Your Name", { font: STANDARD_FONT, size: 22, color: "111827", bold: true, align: AlignmentType.CENTER }),
    ...(personalInfo.jobTitle ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 15, color: theme.accentDeep, align: AlignmentType.CENTER })] : []),
    sectionHeading("Contact", theme, { font: STANDARD_FONT, size: 14, color: theme.accent, withRule: false }),
    ...(personalInfo.email ? [lineParagraph(personalInfo.email, { font: STANDARD_FONT, size: 14, color: "4b5563" })] : []),
    ...(personalInfo.phone ? [lineParagraph(personalInfo.phone, { font: STANDARD_FONT, size: 14, color: "4b5563" })] : []),
    ...(personalInfo.location ? [lineParagraph(personalInfo.location, { font: STANDARD_FONT, size: 14, color: "4b5563" })] : []),
    ...(personalInfo.linkedin ? [lineParagraph(personalInfo.linkedin, { font: STANDARD_FONT, size: 14, color: theme.accentDeep })] : []),
    ...(personalInfo.website ? [lineParagraph(personalInfo.website, { font: STANDARD_FONT, size: 14, color: theme.accentDeep })] : []),
    sectionHeading("Skills", theme, { font: STANDARD_FONT, size: 14, color: theme.accent, withRule: false }),
    ...makeSkillStack(skills, theme, { font: STANDARD_FONT, fill: theme.accentSoft, color: theme.accentDeep, borderColor: theme.accentBorder }),
    sectionHeading("Education", theme, { font: STANDARD_FONT, size: 14, color: theme.accent, withRule: false }),
    ...makeEducationSection(education, theme, {
      title: "",
      font: STANDARD_FONT,
      heading: { withRule: false, uppercase: false, color: theme.accent },
      titleColor: "111827",
      accentColor: theme.accentDeep,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 60,
    }).filter((block) => !(block instanceof Paragraph && (block as any).options?.heading)),
  ];

  const main = [
    ...makeSummarySection(summary, theme, {
      title: "Professional Summary",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accentDeep, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Work Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accentDeep, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accentDeep,
      bodyColor: "374151",
      mutedColor: "6b7280",
      after: 85,
    }),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accentDeep, borderColor: theme.accentBorder },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];

  return [makeTwoColumnLayout(sidebar, main, { leftWidth: 3000, rightWidth: 7000, leftFill: theme.accentSoft, rightFill: "ffffff" })];
}

function buildChronosLayout(data: ResumeData, theme: Theme): DocxBlock[] {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;

  const header = makeTwoCellBand(
    [
      lineParagraph(personalInfo.fullName || "Your Name", { font: STANDARD_FONT, size: 30, color: "111827", bold: true }),
      ...(personalInfo.jobTitle ? [lineParagraph(personalInfo.jobTitle, { font: STANDARD_FONT, size: 18, color: theme.accent, bold: true })] : []),
    ],
    [
      ...makeContactStack(personalInfo, { font: STANDARD_FONT, size: 16, color: "6b7280", align: AlignmentType.RIGHT, spacing: { after: 10 } }),
    ],
    "ffffff",
    "ffffff",
    { leftWidth: 6200, rightWidth: 3800, leftMargins: { top: 200, bottom: 160, left: 0, right: 180 }, rightMargins: { top: 200, bottom: 160, left: 180, right: 0 } }
  );

  const left = [
    ...makeSummarySection(summary, theme, {
      title: "Profile",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder },
      bodyColor: "374151",
    }),
    ...makeExperienceSection(workExperience, theme, {
      title: "Experience",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder },
      timeline: true,
      dateWidth: 1350,
      contentWidth: 7150,
      dateFill: theme.accentSoft,
      borderColor: theme.accent,
      dateColor: "6b7280",
      dateSize: 15,
      bodyColor: "374151",
      mutedColor: "6b7280",
      titleColor: "111827",
      accentColor: theme.accent,
    }),
    ...makeEducationSection(education, theme, {
      title: "Education",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      accentColor: theme.accent,
      bodyColor: "374151",
      mutedColor: "6b7280",
    }),
  ];

  const right = [
    ...(skills.length
      ? [sectionHeading("Skills", theme, { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder }), ...makeSkillStack(skills, theme, { font: STANDARD_FONT, fill: theme.accentSoft, color: theme.accentDeep, borderColor: theme.accentBorder })]
      : []),
    ...makeCertificationsSection(certifications, theme, {
      title: "Certifications",
      font: STANDARD_FONT,
      heading: { font: STANDARD_FONT, size: 17, color: theme.accent, borderColor: theme.accentBorder },
      titleColor: "111827",
      mutedColor: "6b7280",
    }),
  ];

  return [header, rule(theme.accent, 5, 120), makeTwoColumnLayout(left, right, { leftWidth: 6500, rightWidth: 3500 })];
}

export function buildDocxChildren(resumeData: ResumeData, templateId?: TemplateId, accentColor?: string): DocxBlock[] {
  const resolvedTemplate = templateId ?? "modern";
  const theme = createTemplateTheme(accentColor ?? (templateId ? getDefaultTemplateAccent(templateId) : getDefaultTemplateAccent("modern")));

  switch (resolvedTemplate) {
    case "modern":
      return buildModernLayout(resumeData, theme);
    case "classic":
      return buildClassicLayout(resumeData, theme);
    case "creative":
      return buildCreativeLayout(resumeData, theme);
    case "minimal":
      return buildMinimalLayout(resumeData, theme);
    case "executive":
      return buildExecutiveLayout(resumeData, theme);
    case "slate":
      return buildSlateLayout(resumeData, theme);
    case "chronos":
      return buildChronosLayout(resumeData, theme);
    case "terra":
      return buildTerraLayout(resumeData, theme);
    case "tech":
      return buildTechLayout(resumeData, theme);
    case "nova":
      return buildNovaLayout(resumeData, theme);
    case "prism":
      return buildPrismLayout(resumeData, theme);
    case "apex":
      return buildApexLayout(resumeData, theme);
    default:
      return buildModernLayout(resumeData, theme);
  }
}
