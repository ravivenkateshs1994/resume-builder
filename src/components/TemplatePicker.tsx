"use client";

import { useResumeStore } from "@/store/resumeStore";
import { TEMPLATE_CATALOG as TEMPLATES, TemplateGalleryCard } from "@/components/templates/templateGallery";

export default function TemplatePicker({ variant = "grid" }: { variant?: "grid" | "sidebar" }) {
  const { selectedTemplate, setSelectedTemplate } = useResumeStore();

  if (variant === "sidebar") {
    return (
      <div className="flex flex-col gap-1.5">
        {TEMPLATES.map((template) => (
          <TemplateGalleryCard
            key={template.id}
            template={template}
            variant="sidebar"
            selected={selectedTemplate === template.id}
            onSelect={() => setSelectedTemplate(template.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Choose a Template</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TEMPLATES.map((template) => (
          <TemplateGalleryCard
            key={template.id}
            template={template}
            selected={selectedTemplate === template.id}
            onSelect={() => setSelectedTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
}
