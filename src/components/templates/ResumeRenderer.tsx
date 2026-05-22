"use client";

import type { ResumeData, TemplateId } from "@/types/resume";
import ModernTemplate from "./ModernTemplate";
import ClassicTemplate from "./ClassicTemplate";
import CreativeTemplate from "./CreativeTemplate";
import MinimalTemplate from "./MinimalTemplate";
import ExecutiveTemplate from "./ExecutiveTemplate";
import SlateTemplate from "./SlateTemplate";
import ChronosTemplate from "./ChronosTemplate";
import TerraTemplate from "./TerraTemplate";
import TechTemplate from "./TechTemplate";
import NovaTemplate from "./NovaTemplate";
import PrismTemplate from "./PrismTemplate";
import ApexTemplate from "./ApexTemplate";

interface Props {
  data: ResumeData;
  templateId: TemplateId;
  accentColor?: string;
}

export default function ResumeRenderer({ data, templateId, accentColor }: Props) {
  switch (templateId) {
    case "modern":
      return <ModernTemplate data={data} accentColor={accentColor} />;
    case "classic":
      return <ClassicTemplate data={data} accentColor={accentColor} />;
    case "creative":
      return <CreativeTemplate data={data} accentColor={accentColor} />;
    case "minimal":
      return <MinimalTemplate data={data} accentColor={accentColor} />;
    case "executive":
      return <ExecutiveTemplate data={data} accentColor={accentColor} />;
    case "slate":
      return <SlateTemplate data={data} accentColor={accentColor} />;
    case "chronos":
      return <ChronosTemplate data={data} accentColor={accentColor} />;
    case "terra":
      return <TerraTemplate data={data} accentColor={accentColor} />;
    case "tech":
      return <TechTemplate data={data} accentColor={accentColor} />;
    case "nova":
      return <NovaTemplate data={data} accentColor={accentColor} />;
    case "prism":
      return <PrismTemplate data={data} accentColor={accentColor} />;
    case "apex":
      return <ApexTemplate data={data} accentColor={accentColor} />;
    default:
      return <ModernTemplate data={data} accentColor={accentColor} />;
  }
}

