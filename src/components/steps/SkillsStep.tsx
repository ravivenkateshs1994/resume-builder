"use client";

import { useResumeStore } from "@/store/resumeStore";
import { useState } from "react";

export default function SkillsStep() {
  const { resumeData, setSkills, setSummary, nextStep, prevStep, setIsGenerating } =
    useResumeStore();

  const [input, setInput] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);

  function addSkill(skill?: string) {
    const trimmed = (skill ?? input).trim();
    if (trimmed && !resumeData.skills.includes(trimmed)) {
      setSkills([...resumeData.skills, trimmed]);
    }
    if (!skill) setInput("");
  }

  function removeSkill(skill: string) {
    setSkills(resumeData.skills.filter((s) => s !== skill));
  }

  function suggestSkills() {
    const role = (resumeData.targetRole || resumeData.personalInfo.jobTitle || "").toLowerCase();
    const skillMap: Record<string, string[]> = {
      software: ["JavaScript", "TypeScript", "Python", "React", "Node.js", "REST APIs", "Git", "SQL", "Docker", "CI/CD", "Agile", "Unit Testing", "Linux", "AWS", "System Design"],
      frontend: ["React", "Vue.js", "TypeScript", "CSS/SASS", "Tailwind CSS", "Webpack", "Vite", "Accessibility (WCAG)", "Responsive Design", "GraphQL", "Jest", "Storybook", "Figma", "Web Performance", "Next.js"],
      backend: ["Node.js", "Python", "Java", "Go", "PostgreSQL", "Redis", "Docker", "Kubernetes", "REST APIs", "GraphQL", "Microservices", "Message Queues", "AWS", "CI/CD", "System Design"],
      devops: ["Kubernetes", "Docker", "Terraform", "AWS", "GCP", "Azure", "CI/CD", "Helm", "Ansible", "Prometheus", "Grafana", "Linux", "Bash", "GitHub Actions", "Infrastructure as Code"],
      data: ["Python", "SQL", "Pandas", "NumPy", "Spark", "Tableau", "Power BI", "ETL", "Data Modeling", "Machine Learning", "Airflow", "BigQuery", "dbt", "Statistics", "Data Visualization"],
      machine: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision", "MLOps", "Feature Engineering", "Model Deployment", "Hugging Face", "Statistics", "SQL", "Docker", "A/B Testing", "LLMs"],
      product: ["Product Roadmapping", "User Research", "A/B Testing", "OKRs", "Agile / Scrum", "Stakeholder Management", "Wireframing", "Data Analysis", "SQL", "Figma", "Competitive Analysis", "Go-to-Market", "JIRA", "Prioritization Frameworks", "Customer Discovery"],
      design: ["Figma", "Adobe XD", "User Research", "Prototyping", "Wireframing", "Usability Testing", "Design Systems", "Typography", "Accessibility", "Interaction Design", "Information Architecture", "Sketch", "Motion Design", "Brand Identity", "Responsive Design"],
      marketing: ["SEO / SEM", "Google Analytics", "Content Strategy", "Email Marketing", "Social Media Management", "CRM", "HubSpot", "Copywriting", "A/B Testing", "Paid Advertising", "Brand Management", "Market Research", "Campaign Management", "Lead Generation", "Conversion Optimization"],
      sales: ["CRM (Salesforce)", "Lead Qualification", "Pipeline Management", "Cold Outreach", "Negotiation", "Account Management", "B2B Sales", "Solution Selling", "Sales Forecasting", "HubSpot", "Objection Handling", "Customer Success", "Revenue Growth", "Prospecting", "Contract Negotiation"],
      finance: ["Financial Modeling", "Excel / VBA", "GAAP", "Budgeting & Forecasting", "Variance Analysis", "ERP Systems", "SQL", "Power BI", "Audit & Compliance", "Cash Flow Management", "Tableau", "Bloomberg", "Risk Assessment", "M&A Analysis", "QuickBooks"],
      hr: ["Talent Acquisition", "HRIS", "Performance Management", "Onboarding", "Employee Relations", "Compensation & Benefits", "Labor Law", "Workday", "Diversity & Inclusion", "Succession Planning", "Training & Development", "Payroll", "Conflict Resolution", "Employer Branding", "Organizational Design"],
      project: ["Project Planning", "Risk Management", "Agile / Scrum", "Stakeholder Communication", "JIRA", "MS Project", "Budget Management", "Cross-functional Collaboration", "Gantt Charts", "PMP", "Change Management", "Resource Allocation", "KPI Tracking", "Process Improvement", "Confluence"],
      manager: ["Team Leadership", "Strategic Planning", "Performance Reviews", "Budget Management", "Cross-functional Collaboration", "OKRs", "Stakeholder Management", "Change Management", "Hiring & Onboarding", "Conflict Resolution", "Process Improvement", "Executive Communication", "P&L Responsibility", "Agile", "Coaching & Mentoring"],
    };
    const keyMap: [string, string[]][] = [
      ["frontend", skillMap.frontend], ["back end", skillMap.backend], ["backend", skillMap.backend],
      ["full stack", [...skillMap.frontend.slice(0, 7), ...skillMap.backend.slice(0, 8)]],
      ["devops", skillMap.devops], ["cloud", skillMap.devops], ["infrastructure", skillMap.devops],
      ["data engineer", skillMap.data], ["data analyst", skillMap.data], ["data scientist", skillMap.machine],
      ["machine learning", skillMap.machine], ["ai ", skillMap.machine], ["ml ", skillMap.machine],
      ["product manager", skillMap.product], ["product owner", skillMap.product],
      ["ux", skillMap.design], ["ui ", skillMap.design], ["designer", skillMap.design],
      ["marketing", skillMap.marketing], ["sales", skillMap.sales],
      ["finance", skillMap.finance], ["accounting", skillMap.finance], ["analyst", skillMap.finance],
      ["hr ", skillMap.hr], ["human resource", skillMap.hr], ["recruiter", skillMap.hr],
      ["project manager", skillMap.project], ["program manager", skillMap.project],
      ["manager", skillMap.manager], ["director", skillMap.manager], ["lead", skillMap.manager],
      ["software", skillMap.software], ["engineer", skillMap.software], ["developer", skillMap.software],
    ];
    let matched: string[] = [];
    for (const [keyword, skills] of keyMap) {
      if (role.includes(keyword)) { matched = skills; break; }
    }
    if (!matched.length) matched = skillMap.software;
    setSkillSuggestions(matched.filter((s) => !resumeData.skills.includes(s)));
  }

  function addSuggestedSkill(skill: string) {
    addSkill(skill);
    setSkillSuggestions((prev) => prev.filter((s) => s !== skill));
  }

  async function generateSummary() {
    setGeneratingSummary(true);
    setIsGenerating(true);
    setSummaryError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "summary", resumeData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || `Request failed (${res.status})`);
        return;
      }
      if (data.result) {
        setSummary(data.result);
      } else {
        setSummaryError("AI returned an empty response. Please try again.");
      }
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setGeneratingSummary(false);
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-[22px] font-bold text-slate-800 md:text-[30px]">Skills & Summary</h2>
      <p className="mb-6 break-words text-sm text-slate-500 md:text-base">
        Add your skills and let AI write your professional summary.
      </p>

      {/* Skills */}
      <div className="mb-6">
        <div className="mb-2 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <label htmlFor="skill-input" className="block text-sm font-medium text-slate-700">Skills</label>
          <button
            type="button"
            onClick={suggestSkills}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 md:w-auto"
          >
            Suggest skills for role
          </button>
        </div>
        <div className="mb-3 flex flex-col gap-2 md:flex-row">
          <input
            id="skill-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="Type a skill and press Enter"
            className="w-full flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => addSkill()}
            className="min-h-[44px] w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700 md:w-auto"
          >
            Add
          </button>
        </div>

        {skillSuggestions.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">
              Suggested - click to add
            </p>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSuggestedSkill(s)}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 md:min-h-0"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {resumeData.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center leading-none text-blue-400 hover:text-blue-600 md:min-h-0 md:min-w-0"
              >
                x
              </button>
            </span>
          ))}
        </div>
        {resumeData.skills.length === 0 && !skillSuggestions.length && (
          <p className="text-slate-400 text-sm mt-2">No skills added yet.</p>
        )}
      </div>

      {/* Professional Summary */}
        <div>
        <div className="mb-2 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <label htmlFor="professional-summary" className="block text-sm font-medium text-slate-700">Professional Summary</label>
          <button
            type="button"
            onClick={generateSummary}
            disabled={generatingSummary}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 md:w-auto"
          >
            {generatingSummary ? (
              <><span className="animate-spin">...</span> Generating...</>
            ) : (
              <>Generate with AI</>
            )}
          </button>
        </div>
        <textarea
          id="professional-summary"
          value={resumeData.summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          placeholder="Write your professional summary or click 'Generate with AI'..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {summaryError && (
          <p role="alert" aria-live="assertive" className="text-red-500 text-xs mt-1.5">{summaryError}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{resumeData.summary.length} characters</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="min-h-[44px] w-full rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 md:w-auto"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="min-h-[44px] w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700 md:w-auto"
        >
          Next: Preview & Export
        </button>
      </div>
    </div>
  );
}

