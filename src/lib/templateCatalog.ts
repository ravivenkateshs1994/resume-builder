import type { TemplateId } from "@/types/resume";

export type TemplateCategory = "simple" | "modern" | "professional" | "ats";
export type TemplatePriceModel = "free" | "premium" | "credit";
export type RoleCategory = "all" | "software" | "design" | "product" | "operations" | "leadership";
export type CareerLevel = "all" | "entry" | "mid" | "senior";

export interface TemplateCatalogItem {
  id: TemplateId;
  name: string;
  thumbnailUrl: string;
  description: string;
  style: string;
  previewColor: string;
  category: TemplateCategory;
  tags: string[];
  atsScore: number | null;
  recommendedRoles: string[];
  recommendedFor: string[];
  recommendedIndustries: string[];
  isPremium: boolean;
  premiumBadgeType: string | null;
  priceModel: TemplatePriceModel;
  roleCategory: RoleCategory;
  levelCategory: CareerLevel;
}

const BASE_THUMBNAIL = "/images/template-thumbnails";

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  {
    id: "modern",
    name: "Modern",
    thumbnailUrl: `${BASE_THUMBNAIL}/modern.jpg`,
    description: "Balanced two-column with clean hierarchy.",
    style: "Balanced two-column with clean hierarchy.",
    previewColor: "bg-blue-600",
    category: "modern",
    tags: ["ATS Optimized", "Popular"],
    atsScore: 91,
    recommendedRoles: ["Frontend Developer", "Product Designer", "Business Analyst"],
    recommendedFor: ["Frontend Engineer", "Product Designer"],
    recommendedIndustries: ["SaaS", "FinTech", "HealthTech"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "software",
    levelCategory: "mid",
  },
  {
    id: "classic",
    name: "Classic",
    thumbnailUrl: `${BASE_THUMBNAIL}/classic.jpg`,
    description: "Traditional format with conservative styling.",
    style: "Traditional format with conservative styling.",
    previewColor: "bg-slate-700",
    category: "professional",
    tags: ["ATS Optimized", "Formal"],
    atsScore: 94,
    recommendedRoles: ["Operations Manager", "Project Manager", "Account Executive"],
    recommendedFor: ["Operations Manager", "Program Manager"],
    recommendedIndustries: ["Consulting", "Manufacturing", "Public Sector"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "operations",
    levelCategory: "mid",
  },
  {
    id: "creative",
    name: "Creative",
    thumbnailUrl: `${BASE_THUMBNAIL}/creative.jpg`,
    description: "Bold sidebar layout for standout portfolios.",
    style: "Bold sidebar layout for standout portfolios.",
    previewColor: "bg-indigo-700",
    category: "modern",
    tags: ["Design", "Portfolio"],
    atsScore: 86,
    recommendedRoles: ["Brand Designer", "UI Designer", "Creative Director"],
    recommendedFor: ["Brand Designer", "UI Designer"],
    recommendedIndustries: ["Agencies", "Ecommerce", "Media"],
    isPremium: true,
    premiumBadgeType: "Premium",
    priceModel: "premium",
    roleCategory: "design",
    levelCategory: "mid",
  },
  {
    id: "minimal",
    name: "Minimal",
    thumbnailUrl: `${BASE_THUMBNAIL}/minimal.jpg`,
    description: "Minimal whitespace-focused, elegant look.",
    style: "Minimal whitespace-focused, elegant look.",
    previewColor: "bg-gray-400",
    category: "simple",
    tags: ["Simple", "ATS Optimized"],
    atsScore: 92,
    recommendedRoles: ["Data Analyst", "QA Engineer", "Associate Consultant"],
    recommendedFor: ["Data Analyst", "QA Engineer"],
    recommendedIndustries: ["Tech", "Healthcare", "Education"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "software",
    levelCategory: "entry",
  },
  {
    id: "executive",
    name: "Executive",
    thumbnailUrl: `${BASE_THUMBNAIL}/executive.jpg`,
    description: "Premium corporate style for leadership roles.",
    style: "Premium corporate style for leadership roles.",
    previewColor: "bg-gray-900",
    category: "professional",
    tags: ["Popular", "Leadership"],
    atsScore: 93,
    recommendedRoles: ["Director", "VP Operations", "Strategy Lead"],
    recommendedFor: ["Director", "Head of Product"],
    recommendedIndustries: ["Enterprise", "Consulting", "Banking"],
    isPremium: true,
    premiumBadgeType: "Popular",
    priceModel: "premium",
    roleCategory: "leadership",
    levelCategory: "senior",
  },
  {
    id: "slate",
    name: "Slate",
    thumbnailUrl: `${BASE_THUMBNAIL}/slate.jpg`,
    description: "Dark-accent professional two-pane composition.",
    style: "Dark-accent professional two-pane composition.",
    previewColor: "bg-slate-800",
    category: "modern",
    tags: ["Structured", "Modern"],
    atsScore: 89,
    recommendedRoles: ["Staff Engineer", "Solutions Architect", "Tech Lead"],
    recommendedFor: ["Staff Engineer", "Tech Lead"],
    recommendedIndustries: ["Cloud", "SaaS", "Cybersecurity"],
    isPremium: true,
    premiumBadgeType: "Premium",
    priceModel: "credit",
    roleCategory: "software",
    levelCategory: "senior",
  },
  {
    id: "chronos",
    name: "Chronos",
    thumbnailUrl: `${BASE_THUMBNAIL}/chronos.jpg`,
    description: "Timeline-centric storytelling layout.",
    style: "Timeline-centric storytelling layout.",
    previewColor: "bg-teal-600",
    category: "modern",
    tags: ["Timeline", "ATS Optimized"],
    atsScore: 90,
    recommendedRoles: ["Program Manager", "Delivery Manager", "Scrum Master"],
    recommendedFor: ["Program Manager", "Delivery Manager"],
    recommendedIndustries: ["SaaS", "Logistics", "Healthcare"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "operations",
    levelCategory: "mid",
  },
  {
    id: "terra",
    name: "Terra",
    thumbnailUrl: `${BASE_THUMBNAIL}/terra.jpg`,
    description: "Warm editorial tone with refined typography.",
    style: "Warm editorial tone with refined typography.",
    previewColor: "bg-amber-700",
    category: "professional",
    tags: ["Editorial", "Popular"],
    atsScore: 88,
    recommendedRoles: ["Content Strategist", "Marketing Lead", "Brand Manager"],
    recommendedFor: ["Content Strategist", "Marketing Manager"],
    recommendedIndustries: ["Media", "Ecommerce", "Consumer"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "product",
    levelCategory: "mid",
  },
  {
    id: "tech",
    name: "Tech",
    thumbnailUrl: `${BASE_THUMBNAIL}/tech.jpg`,
    description: "Sharp high-contrast style for tech profiles.",
    style: "Sharp high-contrast style for tech profiles.",
    previewColor: "bg-cyan-600",
    category: "ats",
    tags: ["ATS Optimized", "Technical"],
    atsScore: 95,
    recommendedRoles: ["Backend Engineer", "DevOps Engineer", "SRE"],
    recommendedFor: ["Backend Engineer", "DevOps Engineer"],
    recommendedIndustries: ["Cloud", "FinTech", "Developer Tools"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "software",
    levelCategory: "mid",
  },
  {
    id: "nova",
    name: "Nova",
    thumbnailUrl: `${BASE_THUMBNAIL}/nova.jpg`,
    description: "Avatar header with vibrant full-width accent banner.",
    style: "Avatar header with vibrant full-width accent banner.",
    previewColor: "bg-blue-500",
    category: "modern",
    tags: ["Photo", "Modern"],
    atsScore: 84,
    recommendedRoles: ["Creative Technologist", "Community Manager", "CX Specialist"],
    recommendedFor: ["Community Manager", "CX Specialist"],
    recommendedIndustries: ["Consumer Apps", "Social", "Gaming"],
    isPremium: true,
    premiumBadgeType: "Premium",
    priceModel: "premium",
    roleCategory: "design",
    levelCategory: "entry",
  },
  {
    id: "prism",
    name: "Prism",
    thumbnailUrl: `${BASE_THUMBNAIL}/prism.jpg`,
    description: "Light sidebar with accent-tinted left panel.",
    style: "Light sidebar with accent-tinted left panel.",
    previewColor: "bg-teal-500",
    category: "modern",
    tags: ["Two-Column", "Elegant"],
    atsScore: 87,
    recommendedRoles: ["Customer Success", "Account Manager", "Operations Analyst"],
    recommendedFor: ["Customer Success", "Account Executive"],
    recommendedIndustries: ["SaaS", "Hospitality", "EdTech"],
    isPremium: true,
    premiumBadgeType: "Popular",
    priceModel: "credit",
    roleCategory: "operations",
    levelCategory: "mid",
  },
  {
    id: "apex",
    name: "Apex",
    thumbnailUrl: `${BASE_THUMBNAIL}/apex.jpg`,
    description: "Bold headers, grid skills and ATS-safe readability.",
    style: "Bold headers, grid skills and ATS-safe readability.",
    previewColor: "bg-slate-600",
    category: "ats",
    tags: ["ATS Optimized", "Popular"],
    atsScore: 96,
    recommendedRoles: ["Software Engineer", "Data Engineer", "Platform Engineer"],
    recommendedFor: ["Software Engineer", "Data Engineer"],
    recommendedIndustries: ["Cloud", "AI", "Developer Tools"],
    isPremium: false,
    premiumBadgeType: null,
    priceModel: "free",
    roleCategory: "software",
    levelCategory: "mid",
  },
];

export type TemplateTierFilter = "all" | "recommended" | "free" | "premium";

export function getTemplateById(id: string): TemplateCatalogItem | undefined {
  return TEMPLATE_CATALOG.find((template) => template.id === id);
}

export function getRecommendedTemplateIds(seed: string): TemplateId[] {
  const key = seed.trim().toLowerCase();
  if (!key) {
    return ["apex", "classic", "modern"];
  }

  const scoring = TEMPLATE_CATALOG.map((template) => {
    const haystack = [
      template.name,
      template.description,
      ...template.tags,
      ...template.recommendedRoles,
      ...template.recommendedFor,
      ...template.recommendedIndustries,
      template.roleCategory,
      template.levelCategory,
    ]
      .join(" ")
      .toLowerCase();

    const words = key.split(/[^a-z0-9]+/).filter(Boolean);
    const wordHits = words.reduce((count, word) => (haystack.includes(word) ? count + 1 : count), 0);
    const atsBoost = template.atsScore ? template.atsScore / 100 : 0;
    return { id: template.id, score: wordHits + atsBoost };
  });

  return scoring
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.id);
}
