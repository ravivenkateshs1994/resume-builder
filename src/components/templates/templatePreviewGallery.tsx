"use client";

import type { ReactNode } from "react";
import { useResumeStore } from "@/store/resumeStore";
import AccentColorPicker from "@/components/AccentColorPicker";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import { getDefaultTemplateAccent } from "@/lib/templateTheme";
import type { ResumeData, TemplateId } from "@/types/resume";

export type TemplateCategory = "simple" | "modern" | "professional" | "ats";

export interface TemplateCatalogItem {
  id: TemplateId;
  name: string;
  description: string;
  style: string;
  previewColor: string;
  category: TemplateCategory;
  tags: string[];
}

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  { id: "modern", name: "Modern", description: "Balanced two-column with clean hierarchy.", style: "Balanced two-column with clean hierarchy.", previewColor: "bg-blue-600", category: "modern", tags: ["ATS", "Popular"] },
  { id: "classic", name: "Classic", description: "Traditional format with conservative styling.", style: "Traditional format with conservative styling.", previewColor: "bg-slate-700", category: "professional", tags: ["Formal", "ATS"] },
  { id: "creative", name: "Creative", description: "Bold sidebar layout for standout portfolios.", style: "Bold sidebar layout for standout portfolios.", previewColor: "bg-violet-700", category: "modern", tags: ["Design", "Modern"] },
  { id: "minimal", name: "Minimal", description: "Minimal whitespace-focused, elegant look.", style: "Minimal whitespace-focused, elegant look.", previewColor: "bg-gray-400", category: "simple", tags: ["Simple", "Clean"] },
  { id: "executive", name: "Executive", description: "Premium corporate style for leadership roles.", style: "Premium corporate style for leadership roles.", previewColor: "bg-gray-900", category: "professional", tags: ["Senior", "Corporate"] },
  { id: "slate", name: "Slate", description: "Dark-accent professional two-pane composition.", style: "Dark-accent professional two-pane composition.", previewColor: "bg-slate-800", category: "modern", tags: ["Structured", "Modern"] },
  { id: "chronos", name: "Chronos", description: "Timeline-centric storytelling layout.", style: "Timeline-centric storytelling layout.", previewColor: "bg-teal-600", category: "modern", tags: ["Timeline", "Elegant"] },
  { id: "terra", name: "Terra", description: "Warm editorial tone with refined typography.", style: "Warm editorial tone with refined typography.", previewColor: "bg-amber-700", category: "professional", tags: ["Creative", "Warm"] },
  { id: "tech", name: "Tech", description: "Sharp high-contrast style for tech profiles.", style: "Sharp high-contrast style for tech profiles.", previewColor: "bg-cyan-600", category: "ats", tags: ["Tech", "Bold"] },
  { id: "nova", name: "Nova", description: "Avatar header with vibrant full-width accent banner.", style: "Avatar header with vibrant full-width accent banner.", previewColor: "bg-blue-500", category: "modern", tags: ["Photo", "Modern"] },
  { id: "prism", name: "Prism", description: "Light sidebar with accent-tinted left panel.", style: "Light sidebar with accent-tinted left panel.", previewColor: "bg-teal-500", category: "modern", tags: ["Two-Column", "Elegant"] },
  { id: "apex", name: "Apex", description: "Bold headers, grid skills — maximally ATS-safe.", style: "Bold headers, grid skills — maximally ATS-safe.", previewColor: "bg-slate-600", category: "ats", tags: ["ATS", "Clean"] },
];

type ResumeSeed = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  workExperience: ResumeData["workExperience"];
  education: ResumeData["education"];
  skills: string[];
  certifications: ResumeData["certifications"];
};

function htmlDescription(summary: string, bullets: string[]) {
  const previewFillBullet = getPreviewFillBullet(summary);
  return `<p>${summary}</p><ul>${[...bullets, previewFillBullet].map((bullet) => `<li><p>${bullet}</p></li>`).join("")}</ul>`;
}

function getPreviewFillBullet(seed: string) {
  const bullets = [
    "Kept stakeholders aligned and next steps clear from start to finish.",
    "Documented decisions so the handoff stayed easy to follow.",
    "Added enough detail for the work to read as complete and polished.",
  ];
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return bullets[hash % bullets.length];
}

function experienceEntry(
  title: string,
  company: string,
  location: string,
  startDate: string,
  endDate: string,
  summary: string,
  bullets: string[]
): ResumeData["workExperience"][number] {
  return {
    id: `${company}-${title}-${startDate}`,
    company,
    title,
    location,
    startDate,
    endDate,
    description: htmlDescription(summary, bullets),
  };
}

function educationEntry(
  institution: string,
  degree: string,
  field: string,
  startDate: string,
  endDate: string,
  gpa?: string,
  honors?: string
): ResumeData["education"][number] {
  return {
    id: `${institution}-${degree}-${startDate}`,
    institution,
    degree,
    field,
    startDate,
    endDate,
    gpa,
    honors,
  };
}

function certificationEntry(name: string, issuer: string, date: string): ResumeData["certifications"][number] {
  return {
    id: `${issuer}-${name}-${date}`,
    name,
    issuer,
    date,
  };
}

function buildResumeData(seed: ResumeSeed): ResumeData {
  return {
    personalInfo: {
      fullName: seed.fullName,
      email: seed.email,
      phone: seed.phone,
      location: seed.location,
      linkedin: seed.linkedin,
      website: seed.website,
      jobTitle: seed.jobTitle,
    },
    targetRole: seed.jobTitle,
    summary: seed.summary,
    workExperience: seed.workExperience,
    education: seed.education,
    skills: seed.skills,
    certifications: seed.certifications,
  };
}

const TEMPLATE_RESUMES: Record<TemplateId, ResumeData> = {
  modern: buildResumeData({
    fullName: "Ava Morgan",
    jobTitle: "Product Designer",
    email: "ava.morgan@example.com",
    phone: "(555) 014-2298",
    location: "Brooklyn, NY",
    linkedin: "linkedin.com/in/avamorgan",
    website: "avamorgan.design",
    summary: "Product designer focused on onboarding clarity, design systems, and quick iteration.",
    workExperience: [
      experienceEntry(
        "Senior Product Designer",
        "Northstar Labs",
        "New York, NY",
        "2022",
        "Present",
        "Owned onboarding redesign across web and mobile.",
        ["Partnered with PMs and engineers to ship every sprint.", "Created reusable components for the design system."]
      ),
      experienceEntry(
        "Product Designer",
        "Orbit Studio",
        "Boston, MA",
        "2018",
        "2022",
        "Built clearer product flows for a growing SaaS app.",
        ["Standardized accessibility patterns for product teams.", "Improved handoff quality through tighter documentation."]
      ),
    ],
    education: [educationEntry("Parsons School of Design", "BFA", "Communication Design", "2014", "2018")],
    skills: ["Research", "UI", "Accessibility", "Prototyping", "Design Systems", "Figma"],
    certifications: [certificationEntry("Google UX Design Certificate", "Coursera", "2023")],
  }),
  classic: buildResumeData({
    fullName: "Eleanor Grant",
    jobTitle: "Operations Manager",
    email: "eleanor.grant@example.com",
    phone: "(555) 016-1191",
    location: "Boston, MA",
    linkedin: "linkedin.com/in/eleanorgrant",
    website: "eleanorgrant.com",
    summary: "Traditional resume with a centered name block and disciplined, formal spacing.",
    workExperience: [
      experienceEntry(
        "Operations Manager",
        "Harbor Systems",
        "Boston, MA",
        "2020",
        "Present",
        "Reduced report turnaround time for leadership.",
        ["Aligned finance, support, and field teams around one process.", "Improved weekly reporting cadence across departments."]
      ),
      experienceEntry(
        "Operations Analyst",
        "Luma Retail",
        "Cambridge, MA",
        "2016",
        "2020",
        "Supported the operations team with reporting and process documentation.",
        ["Managed weekly KPI reporting.", "Documented operating procedures across locations."]
      ),
    ],
    education: [educationEntry("Boston University", "MBA", "Operations", "2014", "2016")],
    skills: ["Operations", "Reporting", "Process", "Planning", "Leadership", "Excel"],
    certifications: [certificationEntry("Lean Six Sigma Green Belt", "ASQ", "2019")],
  }),
  creative: buildResumeData({
    fullName: "Maya Patel",
    jobTitle: "Brand Designer",
    email: "maya.patel@studio.com",
    phone: "(555) 019-4420",
    location: "Remote",
    linkedin: "linkedin.com/in/mayapatel",
    website: "behance.net/mayapatel",
    summary: "Portfolio-friendly brand profile with a bold left rail and bright creative work area.",
    workExperience: [
      experienceEntry(
        "Brand Designer",
        "Studio North",
        "Remote",
        "2021",
        "Present",
        "Built campaign systems for product launches.",
        ["Directed visual identity across social, web, and print.", "Developed motion assets for launch marketing."]
      ),
      experienceEntry(
        "Visual Designer",
        "Field Creative",
        "Chicago, IL",
        "2017",
        "2021",
        "Produced brand assets and pitch materials for emerging products.",
        ["Created pitch decks and brand kits.", "Kept visual language consistent across channels."]
      ),
    ],
    education: [educationEntry("School of the Art Institute of Chicago", "BFA", "Graphic Design", "2013", "2017")],
    skills: ["Brand", "Color", "Layout", "Typography", "Motion", "Illustration"],
    certifications: [certificationEntry("Adobe Certified Professional", "Adobe", "2022")],
  }),
  minimal: buildResumeData({
    fullName: "Sam Chen",
    jobTitle: "Data Analyst",
    email: "sam.chen@example.com",
    phone: "(555) 018-2044",
    location: "Chicago, IL",
    linkedin: "linkedin.com/in/samchen",
    website: "samchen.dev",
    summary: "Whitespace-first resume with compact copy and a calm reading rhythm.",
    workExperience: [
      experienceEntry(
        "Data Analyst",
        "Northwind Analytics",
        "Chicago, IL",
        "2021",
        "Present",
        "Built concise dashboards for leadership.",
        ["Turned raw data into weekly decision briefs.", "Kept reports readable and lightweight."]
      ),
      experienceEntry(
        "Reporting Specialist",
        "Metro Insights",
        "Chicago, IL",
        "2018",
        "2021",
        "Created repeatable reporting for operations teams.",
        ["Built ad hoc reports for operations teams.", "Maintained a clean reporting cadence."]
      ),
    ],
    education: [educationEntry("University of Illinois", "BS", "Statistics", "2014", "2018")],
    skills: ["Analysis", "Reporting", "SQL", "Looker", "Storytelling", "BI"],
    certifications: [certificationEntry("Google Data Analytics Certificate", "Coursera", "2022")],
  }),
  executive: buildResumeData({
    fullName: "Taylor Brooks",
    jobTitle: "Strategy Director",
    email: "taylor.brooks@leadership.com",
    phone: "(555) 017-3882",
    location: "New York, NY",
    linkedin: "linkedin.com/in/taylorbrooks",
    website: "taylorbrooks.com",
    summary: "Executive profile with a strong header and disciplined board-level presentation.",
    workExperience: [
      experienceEntry(
        "Strategy Director",
        "Summit Group",
        "New York, NY",
        "2020",
        "Present",
        "Owned quarterly operating plans for multiple business lines.",
        ["Presented progress to executive leadership and investors.", "Aligned cross-functional teams around a shared roadmap."]
      ),
      experienceEntry(
        "Senior Strategy Manager",
        "Crest Partners",
        "New York, NY",
        "2016",
        "2020",
        "Translated strategy into measurable execution goals.",
        ["Ran market and competitive analysis.", "Built operating reviews for senior stakeholders."]
      ),
    ],
    education: [educationEntry("Wharton School", "MBA", "Strategy", "2014", "2016")],
    skills: ["Strategy", "Leadership", "Operating Plans", "Executive Reporting", "Change Management", "Finance"],
    certifications: [certificationEntry("PMP", "PMI", "2018")],
  }),
  slate: buildResumeData({
    fullName: "Casey Rivera",
    jobTitle: "Staff Engineer",
    email: "casey@platform.io",
    phone: "(555) 015-7741",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/caseyrivera",
    website: "github.com/caseyrivera",
    summary: "Dark sidebar plus bright content column for strong contrast and technical focus.",
    workExperience: [
      experienceEntry(
        "Staff Engineer",
        "Platform.io",
        "Seattle, WA",
        "2022",
        "Present",
        "Owned service reliability for internal platforms.",
        ["Shipped tooling that reduced developer friction.", "Improved deployment safety and observability."]
      ),
      experienceEntry(
        "Senior Software Engineer",
        "North Coast Systems",
        "Seattle, WA",
        "2017",
        "2022",
        "Built backend systems and mentored engineers.",
        ["Improved observability and incident response.", "Mentored backend and infra teams."]
      ),
    ],
    education: [educationEntry("University of Washington", "BS", "Computer Science", "2012", "2016")],
    skills: ["Systems", "Reliability", "TypeScript", "Observability", "Leadership", "CI/CD"],
    certifications: [certificationEntry("AWS Solutions Architect", "Amazon", "2021")],
  }),
  chronos: buildResumeData({
    fullName: "Jordan Kim",
    jobTitle: "Program Manager",
    email: "jordan.kim@ops.com",
    phone: "(555) 013-6682",
    location: "Austin, TX",
    linkedin: "linkedin.com/in/jordankim",
    website: "jordankim.dev",
    summary: "Timeline-driven resume that foregrounds dates, milestones, and delivery rhythm.",
    workExperience: [
      experienceEntry(
        "Program Manager",
        "Orbit Health",
        "Austin, TX",
        "2021",
        "Present",
        "Led launch planning across product and operations.",
        ["Kept delivery on track with weekly milestone reviews.", "Coordinated stakeholders around release timing."]
      ),
      experienceEntry(
        "Project Coordinator",
        "Lattice Labs",
        "Austin, TX",
        "2017",
        "2021",
        "Tracked dependencies and release calendars.",
        ["Supported stakeholder updates and status reports.", "Maintained consistent delivery documentation."]
      ),
    ],
    education: [educationEntry("University of Texas", "BA", "Business Administration", "2013", "2017")],
    skills: ["Delivery", "Timeline", "Planning", "Stakeholder Mgmt", "Execution", "Roadmapping"],
    certifications: [certificationEntry("Scrum Master", "Scrum Alliance", "2020")],
  }),
  terra: buildResumeData({
    fullName: "Avery Hill",
    jobTitle: "Content Strategist",
    email: "avery@editorial.com",
    phone: "(555) 012-4881",
    location: "Portland, OR",
    linkedin: "linkedin.com/in/averyhill",
    website: "averyhill.co",
    summary: "Warm editorial profile with thoughtful typography and a grounded reading feel.",
    workExperience: [
      experienceEntry(
        "Content Strategist",
        "Moss Editorial",
        "Portland, OR",
        "2020",
        "Present",
        "Defined voice guidelines for product and lifecycle content.",
        ["Collaborated with design to align content and layout.", "Improved launch messaging across channels."]
      ),
      experienceEntry(
        "Senior Copywriter",
        "Field Notes",
        "Portland, OR",
        "2016",
        "2020",
        "Wrote launch campaigns and editorial landing pages.",
        ["Refined tone across web, email, and docs.", "Shaped editorial systems for product launches."]
      ),
    ],
    education: [educationEntry("Portland State University", "BA", "English", "2012", "2016")],
    skills: ["Writing", "Voice", "Brand", "Editing", "Messaging", "Information Design"],
    certifications: [certificationEntry("Content Strategy for Professionals", "Nielsen Norman Group", "2021")],
  }),
  tech: buildResumeData({
    fullName: "Riley Chen",
    jobTitle: "Full-Stack Engineer",
    email: "riley@stack.dev",
    phone: "(555) 019-2299",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/rileychen",
    website: "rileychen.dev",
    summary: "Technical profile with code-like rhythm, compact labels, and dark contrast.",
    workExperience: [
      experienceEntry(
        "Full-Stack Engineer",
        "Stack.dev",
        "San Francisco, CA",
        "2021",
        "Present",
        "Built internal APIs and tooling for product teams.",
        ["Reduced manual work through automation and scripts.", "Improved developer velocity with shared utilities."]
      ),
      experienceEntry(
        "Software Engineer",
        "North Bridge",
        "San Francisco, CA",
        "2017",
        "2021",
        "Shipped front-end features in TypeScript.",
        ["Improved test coverage and deployment confidence.", "Contributed to UI and backend services."]
      ),
    ],
    education: [educationEntry("UC Berkeley", "BS", "Computer Science", "2012", "2016")],
    skills: ["TypeScript", "APIs", "CI/CD", "Testing", "Automation", "Node.js"],
    certifications: [certificationEntry("AWS Developer Associate", "Amazon", "2022")],
  }),
  nova: buildResumeData({
    fullName: "Morgan Diaz",
    jobTitle: "Product Lead",
    email: "morgan@product.com",
    phone: "(555) 011-9402",
    location: "Remote",
    linkedin: "linkedin.com/in/morgandiaz",
    website: "morgandiaz.dev",
    summary: "Avatar-led profile with a bright banner and a friendly leadership feel.",
    workExperience: [
      experienceEntry(
        "Product Lead",
        "Nova Apps",
        "Remote",
        "2022",
        "Present",
        "Guided roadmap and launch sequencing across teams.",
        ["Worked closely with design and engineering to keep momentum.", "Kept product direction simple and visible."]
      ),
      experienceEntry(
        "Senior Product Manager",
        "Brightside Labs",
        "Remote",
        "2018",
        "2022",
        "Launched customer-facing features in a fast cadence.",
        ["Improved product discovery and stakeholder communication.", "Balanced launch scope with delivery quality."]
      ),
    ],
    education: [educationEntry("University of Washington", "BS", "Human-Computer Interaction", "2013", "2017")],
    skills: ["Product", "Launches", "Roadmaps", "Teams", "User Research", "Strategy"],
    certifications: [certificationEntry("Pragmatic Product Management", "Pragmatic Institute", "2020")],
  }),
  prism: buildResumeData({
    fullName: "Ari Patel",
    jobTitle: "Data Scientist",
    email: "ari@insight.ai",
    phone: "(555) 010-7718",
    location: "New York, NY",
    linkedin: "linkedin.com/in/aripatel",
    website: "ari-patel.com",
    summary: "Light sidebar with a tinted rail and an analysis-heavy content column.",
    workExperience: [
      experienceEntry(
        "Data Scientist",
        "Insight AI",
        "New York, NY",
        "2021",
        "Present",
        "Built models that surfaced product trends.",
        ["Explained results to non-technical teams and leadership.", "Turned analyses into actionable decisions."]
      ),
      experienceEntry(
        "Analytics Engineer",
        "SignalWorks",
        "New York, NY",
        "2017",
        "2021",
        "Created reliable reporting pipelines.",
        ["Improved data quality across dashboards.", "Shipped clean analytics infrastructure."]
      ),
    ],
    education: [educationEntry("Columbia University", "MS", "Data Science", "2015", "2017")],
    skills: ["Python", "Modeling", "Insights", "Dashboards", "Communication", "Statistics"],
    certifications: [certificationEntry("TensorFlow Developer", "Google", "2022")],
  }),
  apex: buildResumeData({
    fullName: "Noah Scott",
    jobTitle: "Engineering Lead",
    email: "noah@apexlead.com",
    phone: "(555) 014-6601",
    location: "Denver, CO",
    linkedin: "linkedin.com/in/noahscott",
    website: "apexlead.com",
    summary: "ATS-safe single column with bold rules and compact, keyword-rich sections.",
    workExperience: [
      experienceEntry(
        "Engineering Lead",
        "Apex Systems",
        "Denver, CO",
        "2020",
        "Present",
        "Led delivery across platform and product engineering.",
        ["Managed planning, reviews, and technical direction.", "Kept delivery and architecture aligned."]
      ),
      experienceEntry(
        "Senior Software Engineer",
        "Coreworks",
        "Denver, CO",
        "2016",
        "2020",
        "Built APIs and backend services.",
        ["Improved release stability and incident response.", "Contributed to core platform decisions."]
      ),
    ],
    education: [educationEntry("Colorado State University", "BS", "Software Engineering", "2012", "2016")],
    skills: ["ATS", "Leadership", "Execution", "Architecture", "Delivery", "APIs"],
    certifications: [certificationEntry("AWS Solutions Architect", "Amazon", "2021")],
  }),
};

function PreviewViewport({ compact, children }: { compact: boolean; children: ReactNode }) {
  const scale = compact ? 0.28 : 0.66;
  const height = compact ? 260 : 620;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-white" style={{ height }}>
      <div
        className="absolute inset-0"
        style={{ width: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}

export function TemplatePreviewCard({ template, compact = false }: { template: TemplateCatalogItem; compact?: boolean }) {
  const { selectedTemplate, templateAccentColor } = useResumeStore();
  const accentColor = selectedTemplate === template.id ? templateAccentColor : getDefaultTemplateAccent(template.id);
  const resumeData = TEMPLATE_RESUMES[template.id];

  return (
    <div className={compact ? "rounded-lg border border-slate-200 bg-white p-2 shadow-sm" : "rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"}>
      <PreviewViewport compact={compact}>
        <ResumeRenderer data={resumeData} templateId={template.id} accentColor={accentColor} />
      </PreviewViewport>
    </div>
  );
}

export function TemplateGalleryCard({
  template,
  selected = false,
  onSelect,
  variant = "grid",
}: {
  template: TemplateCatalogItem;
  selected?: boolean;
  onSelect: () => void;
  variant?: "grid" | "sidebar";
}) {
  if (variant === "sidebar") {
    return (
      <div
        onClick={onSelect}
        className={`border-2 rounded-xl p-2.5 cursor-pointer transition-all flex h-full flex-col ${
          selected ? "border-blue-600 shadow-md shadow-blue-100" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <TemplatePreviewCard template={template} compact />
        <p className="mt-2 text-xs font-semibold text-gray-800">{template.name}</p>
        <p className="mt-0.5 text-[10px] leading-tight text-gray-500">{template.style}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
              {tag}
            </span>
          ))}
        </div>
        {selected && <div className="mt-1.5 text-[10px] font-semibold text-blue-600">✓ Selected</div>}
        <div className="mt-2" onClick={(event) => event.stopPropagation()}>
          <AccentColorPicker templateId={template.id} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`flex h-full cursor-pointer flex-col rounded-xl border-2 p-3 text-left transition-all ${
        selected ? "border-blue-600 shadow-md shadow-blue-100" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <TemplatePreviewCard template={template} />
      <p className="mt-3 text-xs font-semibold text-gray-800">{template.name}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-gray-500">{template.description}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {template.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
            {tag}
          </span>
        ))}
      </div>
      {selected && <div className="mt-1.5 text-[10px] font-semibold text-blue-600">✓ Selected</div>}
      <div className="mt-2" onClick={(event) => event.stopPropagation()}>
        <AccentColorPicker templateId={template.id} />
      </div>
    </div>
  );
}
