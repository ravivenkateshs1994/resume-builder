import { NextRequest, NextResponse } from "next/server";
import { createExportSession, deleteExportSession } from "@/lib/exportSessions";
import type { ResumeData, TemplateId } from "@/types/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPdfFileName(fullName: string): string {
  const baseName = fullName
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return `${baseName || "Resume"}_Resume.pdf`;
}

export async function POST(req: NextRequest) {
  let resumeData: ResumeData | null = null;
  let sessionId: string | null = null;

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
    const templateAccentColor = body.templateAccentColor;

    // Store resume data in server-side session so the print page can access it
    sessionId = createExportSession({ resumeData, selectedTemplate, templateAccentColor });

    // Determine the base URL — loopback is fastest on Render (same machine)
    const port = process.env.PORT ?? "3000";
    const baseUrl = process.env.PUPPETEER_BASE_URL ?? `http://localhost:${port}`;

    const { launchPdfBrowser } = await import("@/lib/puppeteer");
    const browser = await launchPdfBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 794, height: 1123 });
      await page.goto(`${baseUrl}/print/resume/${sessionId}`, {
        waitUntil: "networkidle0",
        timeout: 30_000,
      });

      // Allow React hydration and fonts to settle
      await new Promise((r) => setTimeout(r, 800));

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      const fileName = buildPdfFileName(resumeData.personalInfo.fullName);

      return new NextResponse(pdf as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
      if (sessionId) deleteExportSession(sessionId);
    }
  } catch (error) {
    console.error("[/api/export/pdf]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF export failed" },
      { status: 500 }
    );
  }
}