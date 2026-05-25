import { notFound } from "next/navigation";
import type { TemplateId } from "@/types/resume";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { TEMPLATE_MOCK_DATA } from "@/data/templatePreviewMockData";
import { ReadySignal } from "../ReadySignal";

const VALID_IDS = new Set<string>([
  "modern", "classic", "creative", "minimal", "executive",
  "slate", "chronos", "terra", "tech", "nova", "prism", "apex",
]);

/** A4 at 96 dpi */
const A4_W = 794;
const A4_H = 1123;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ThumbnailCapturePage({ params }: Props) {
  const { id } = await params;

  if (!VALID_IDS.has(id)) notFound();

  const templateId = id as TemplateId;
  const data = TEMPLATE_MOCK_DATA[templateId];

  return (
    <>
      <ReadySignal />
      {/*
        Render the template at exactly A4 pixel dimensions.
        overflow:hidden prevents any stray content from expanding the page.
      */}
      <div
        data-template-root
        style={{
          width: A4_W,
          height: A4_H,
          overflow: "hidden",
          background: "#ffffff",
          position: "relative",
        }}
      >
        <ResumeRenderer data={data} templateId={templateId} />
      </div>
    </>
  );
}

/** Pre-render every template at build time */
export function generateStaticParams() {
  return [...VALID_IDS].map((id) => ({ id }));
}
