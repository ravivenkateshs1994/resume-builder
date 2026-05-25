/**
 * Central template registry.
 * Combines the static catalog metadata from templateCatalog with a component
 * reference for each template. Use this as the single source of truth for
 * template discovery, gallery rendering, and thumbnail generation.
 */
import { type ComponentType, lazy } from "react";
import { TEMPLATE_CATALOG, type TemplateCatalogItem } from "@/lib/templateCatalog";
import type { TemplateId } from "@/types/resume";

export type { TemplateCatalogItem };

/** Lazy-loaded component map — keeps the main bundle small. */
export const TEMPLATE_COMPONENTS: Record<TemplateId, ComponentType<{ data: import("@/types/resume").ResumeData; accentColor?: string }>> = {
  modern:    lazy(() => import("@/components/templates/ModernTemplate").then((m) => ({ default: m.default }))),
  classic:   lazy(() => import("@/components/templates/ClassicTemplate").then((m) => ({ default: m.default }))),
  creative:  lazy(() => import("@/components/templates/CreativeTemplate").then((m) => ({ default: m.default }))),
  minimal:   lazy(() => import("@/components/templates/MinimalTemplate").then((m) => ({ default: m.default }))),
  executive: lazy(() => import("@/components/templates/ExecutiveTemplate").then((m) => ({ default: m.default }))),
  slate:     lazy(() => import("@/components/templates/SlateTemplate").then((m) => ({ default: m.default }))),
  chronos:   lazy(() => import("@/components/templates/ChronosTemplate").then((m) => ({ default: m.default }))),
  terra:     lazy(() => import("@/components/templates/TerraTemplate").then((m) => ({ default: m.default }))),
  tech:      lazy(() => import("@/components/templates/TechTemplate").then((m) => ({ default: m.default }))),
  nova:      lazy(() => import("@/components/templates/NovaTemplate").then((m) => ({ default: m.default }))),
  prism:     lazy(() => import("@/components/templates/PrismTemplate").then((m) => ({ default: m.default }))),
  apex:      lazy(() => import("@/components/templates/ApexTemplate").then((m) => ({ default: m.default }))),
};

export interface TemplateRegistryEntry extends TemplateCatalogItem {
  /** Lazy React component for rendering the template. */
  component: ComponentType<{ data: import("@/types/resume").ResumeData; accentColor?: string }>;
}

/** Enriched catalog — catalog metadata + lazy component reference. */
export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = TEMPLATE_CATALOG.map((item) => ({
  ...item,
  component: TEMPLATE_COMPONENTS[item.id],
}));

/** Fast ID → entry lookup. */
export const TEMPLATE_REGISTRY_MAP: Record<TemplateId, TemplateRegistryEntry> = Object.fromEntries(
  TEMPLATE_REGISTRY.map((entry) => [entry.id, entry])
) as Record<TemplateId, TemplateRegistryEntry>;

// Re-export for convenience
export { TEMPLATE_CATALOG } from "@/lib/templateCatalog";
