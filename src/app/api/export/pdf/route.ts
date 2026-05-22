import { NextRequest, NextResponse } from "next/server";
import type { ResumeData, TemplateId } from "@/types/resume";
import { createExportSession, deleteExportSession } from "@/lib/exportSessions";
import { launchPdfBrowser } from "@/lib/puppeteer";

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;
  let sessionId = "";
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
    sessionId = createExportSession({
      resumeData,
      selectedTemplate,
      templateAccentColor: body.templateAccentColor,
    });

    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });

    const origin = req.nextUrl.origin;
    await page.goto(`${origin}/print/resume/${sessionId}`, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    await page.evaluate(() => document.fonts.ready.then(() => true));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const pdfBody = Buffer.from(pdf);

    const fileName = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_") || "Resume"}_Resume.pdf`;

    return new NextResponse(pdfBody as unknown as BodyInit, {
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
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
    if (sessionId) deleteExportSession(sessionId);
  }
}