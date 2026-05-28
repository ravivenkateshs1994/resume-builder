import { notFound } from "next/navigation";
import type { TemplateId } from "@/types/resume";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { TEMPLATE_MOCK_DATA } from "@/data/templatePreviewMockData";
import { ReadySignal } from "../ReadySignal";

const VALID_IDS = new Set<string>([
  "modern", "classic", "creative", "minimal", "executive",
  "slate", "chronos", "terra", "tech", "nova", "prism", "apex",
  "pinnacle", "vector",
]);

/** A4 at 96 dpi */
const A4_W = 794;
const A4_H = 1123;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ color?: string }>;
}

export default async function ThumbnailCapturePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { color } = await searchParams;

  if (!VALID_IDS.has(id)) notFound();

  const templateId = id as TemplateId;
  const data = TEMPLATE_MOCK_DATA[templateId];
  const accentColor = color ? `#${color}` : undefined;

  return (
    <>
      <ReadySignal />
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
        <ResumeRenderer data={data} templateId={templateId} accentColor={accentColor} />
      </div>
    </>
  );
}

/** Pre-render every template at build time */
export function generateStaticParams() {
  return [...VALID_IDS].map((id) => ({ id }));
}
