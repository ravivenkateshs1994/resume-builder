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
      <h2 className="text-xl font-bold text-slate-800 mb-1">Skills & Summary</h2>
      <p className="text-sm text-slate-500 mb-6">
        Add your skills and let AI write your professional summary.
      </p>

      {/* Skills */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">Skills</label>
          <button
            onClick={suggestSkills}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            âœ¨ Suggest skills for role
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="Type a skill and press Enter"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => addSkill()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>

        {skillSuggestions.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">
              Suggested â€” click to add
            </p>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => addSuggestedSkill(s)}
                  className="inline-flex items-center gap-1 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-full px-3 py-1 text-xs font-medium transition-colors"
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
                onClick={() => removeSkill(skill)}
                className="text-blue-400 hover:text-blue-600 leading-none"
              >
                âœ•
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">Professional Summary</label>
          <button
            onClick={generateSummary}
            disabled={generatingSummary}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            {generatingSummary ? (
              <><span className="animate-spin">âŸ³</span> Generating...</>
            ) : (
              <>âœ¨ Generate with AI</>
            )}
          </button>
        </div>
        <textarea
          value={resumeData.summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          placeholder="Write your professional summary or click 'Generate with AI'..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {summaryError && (
          <p className="text-red-500 text-xs mt-1.5">{summaryError}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{resumeData.summary.length} characters</p>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          â† Back
        </button>
        <button
          onClick={nextStep}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Next: Preview & Export â†’
        </button>
      </div>
    </div>
  );
}

