"use client";

import { useResumeStore } from "@/store/resumeStore";
import { TEMPLATE_CATALOG as TEMPLATES, TemplateGalleryCard } from "@/components/templates/templateGallery";
import { isPremiumTemplatesEnabledClient } from "@/lib/featureFlags";

export default function TemplatePicker({ variant = "grid" }: { variant?: "grid" | "sidebar" }) {
  const { selectedTemplate, setSelectedTemplate } = useResumeStore();
  const premiumEnabled = isPremiumTemplatesEnabledClient();

  const freeTemplates = TEMPLATES.filter((template) => !template.isPremium);
  const premiumTemplates = TEMPLATES.filter((template) => template.isPremium);

  if (variant === "sidebar") {
    return (
      <div className="flex max-w-full flex-col gap-1.5 overflow-x-hidden">
        {freeTemplates.map((template) => (
          <TemplateGalleryCard
            key={template.id}
            template={template}
            variant="sidebar"
            selected={selectedTemplate === template.id}
            isSelected={selectedTemplate === template.id}
            onSelect={() => setSelectedTemplate(template.id)}
            isPremium={false}
          />
        ))}
        {premiumEnabled && premiumTemplates.length > 0 && (
          <>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Premium Templates</p>
            {premiumTemplates.map((template) => (
              <TemplateGalleryCard
                key={template.id}
                template={template}
                variant="sidebar"
                selected={selectedTemplate === template.id}
                isSelected={selectedTemplate === template.id}
                onSelect={() => setSelectedTemplate(template.id)}
                isPremium
                badgeType={template.premiumBadgeType ?? "Premium"}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Choose a Template</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {freeTemplates.map((template) => (
          <TemplateGalleryCard
            key={template.id}
            template={template}
            selected={selectedTemplate === template.id}
            isSelected={selectedTemplate === template.id}
            onSelect={() => setSelectedTemplate(template.id)}
          />
        ))}
        {premiumEnabled && premiumTemplates.map((template) => (
          <TemplateGalleryCard
            key={template.id}
            template={template}
            selected={selectedTemplate === template.id}
            isSelected={selectedTemplate === template.id}
            onSelect={() => setSelectedTemplate(template.id)}
            isPremium
            badgeType={template.premiumBadgeType ?? "Premium"}
          />
        ))}
      </div>
    </div>
  );
}
