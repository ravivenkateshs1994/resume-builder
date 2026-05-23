import { describe, expect, it } from "vitest";
import type { ResumeData } from "@/types/resume";
import { buildResumeIntelligenceReport, extractResumeSignals } from "./resume-intelligence";
import { normalizeSkillNames } from "./skill-taxonomy";

describe("resume intelligence engine", () => {
  it("normalizes skill aliases into canonical taxonomy values", () => {
    const normalized = normalizeSkillNames(["ReactJS", "JS", "RESTful API", "AEM", "ReactJS"]);

    expect(normalized).toEqual(["React", "JavaScript", "REST API", "Adobe Experience Manager"]);
  });

  it("builds a deterministic intelligence report without AI", async () => {
    const resumeData: Partial<ResumeData> = {
      personalInfo: {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        phone: "555-555-5555",
        location: "Austin, TX",
        linkedin: "https://linkedin.com/in/alexmorgan",
        jobTitle: "Frontend Engineer",
      },
      targetRole: "Frontend Engineer",
      summary: "Frontend engineer building React and TypeScript applications.",
      workExperience: [
        {
          id: "exp-1",
          company: "Acme Labs",
          title: "Frontend Engineer",
          location: "Remote",
          startDate: "Jan 2020",
          endDate: "Present",
          description:
            "<ul><li><p>Built React and TypeScript dashboards for internal operations.</p></li><li><p>Improved conversion by 18% with UX refinements.</p></li></ul>",
        },
      ],
      education: [],
      skills: ["React", "TypeScript", "SQL"],
      certifications: [],
    };

    const report = await buildResumeIntelligenceReport({
      resumeData,
      jobDescription:
        "We need a Frontend Engineer with React, TypeScript, GraphQL, and 4+ years of experience. Responsibilities include building UI and collaborating with design.",
      useAi: false,
    });

    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.jobMatchScore).toBeGreaterThan(0);
    expect(report.atsCompatibilityScore).toBeGreaterThan(0);
    expect(report.recruiterAppealScore).toBeGreaterThan(0);
    expect(report.matchedSkills).toContain("React");
    expect(report.matchedSkills).toContain("TypeScript");
    expect(report.missingSkills).toContain("GraphQL");
    expect(report.scoreBreakdown.overall.score).toBe(report.overallScore);
    expect(report.scoreBreakdown.jobMatch.evidence.length).toBeGreaterThan(0);
    expect(report.deterministicAnalysis.atsScore).toBeGreaterThan(0);
  });

  it("extracts resume signals deterministically when AI is disabled", async () => {
    const signals = await extractResumeSignals({
      resumeText:
        "Alex Morgan\nFrontend Engineer\nalex@example.com\nReact, TypeScript, AWS\nExperience\nBuilt dashboards with React and AWS.",
      useAi: false,
    });

    expect(signals.skills).toContain("React");
    expect(signals.skills).toContain("TypeScript");
    expect(signals.skills).toContain("AWS");
    expect(signals.jobTitles.length).toBeGreaterThan(0);
  });
});
