import { describe, expect, it } from "vitest";
import { defaultAtsScoringService } from "./ats-engine";
import type { ResumeData } from "@/types/resume";

function makeResumeData(): ResumeData {
  return {
    personalInfo: {
      fullName: "Jordan Rivera",
      email: "jordan.rivera@example.com",
      phone: "(555) 123-4567",
      location: "Austin, TX",
      linkedin: "https://www.linkedin.com/in/jordanrivera",
      website: "https://jordanrivera.dev",
      jobTitle: "Senior Frontend Engineer",
    },
    targetRole: "Senior Frontend Engineer",
    jobDescription: "",
    summary: "Senior frontend engineer focused on content platforms, performance, and cross-functional delivery.",
    workExperience: [
      {
        id: "exp-1",
        company: "Acme Digital",
        title: "Senior Frontend Engineer",
        location: "Austin, TX",
        startDate: "01/2020",
        endDate: "Present",
        description:
          "<ul><li>Built React and TypeScript interfaces for a content platform.</li><li>Integrated REST API services and AWS deployments for production releases.</li><li>Improved page load time by 35% through bundle optimization.</li></ul>",
      },
      {
        id: "exp-2",
        company: "Beta Studio",
        title: "Frontend Engineer",
        location: "Dallas, TX",
        startDate: "05/2017",
        endDate: "12/2019",
        description:
          "<ul><li>Maintained Adobe Experience Manager sites and reusable components.</li><li>Partnered with design and QA to deliver releases on schedule.</li></ul>",
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "State University",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "2013",
        endDate: "2017",
      },
    ],
    skills: ["React", "TypeScript", "AWS", "Adobe Experience Manager", "REST API"],
    certifications: [],
  };
}

describe("ATS engine", () => {
  it("scores a structured resume deterministically and matches configured synonyms", () => {
    const resumeData = makeResumeData();
    const jobDescription =
      "Senior Frontend Engineer needed with 5+ years of experience using React, TypeScript, AEM, REST API, AWS, and Kubernetes. Strong collaboration and communication skills required.";

    const analysis = defaultAtsScoringService.analyze({ resumeData, jobDescription });

    expect(analysis.keywordDetails.requiredKeywords).toContain("AEM");
    expect(analysis.matchedKeywords).toContain("AEM");
    expect(analysis.keywordScore).toBeGreaterThan(60);
    expect(analysis.sectionScore).toBe(80);
    expect(analysis.experienceDetails.requiredYears).toBe(5);
    expect(analysis.experienceDetails.requirementMet).toBe(true);
    expect(analysis.atsScore).toBeGreaterThanOrEqual(65);
    expect(analysis.contactDetails.email).toBe(true);
    expect(analysis.contactDetails.linkedin).toBe(true);
  });

  it("handles legacy partial resume data without throwing", () => {
    const legacyResume = {
      personalInfo: {
        fullName: "Jordan Rivera",
        email: "jordan.rivera@example.com",
        phone: "(555) 123-4567",
        location: "Austin, TX",
      },
      targetRole: "Frontend Engineer",
      summary: "Frontend engineer focused on content platforms and performance.",
    } as Partial<ResumeData>;

    const jobDescription = "Need a frontend engineer with React, TypeScript, and AWS experience.";
    const analysis = defaultAtsScoringService.analyze({ resumeData: legacyResume, jobDescription });

    expect(analysis.contactDetails.email).toBe(true);
    expect(analysis.sections.missingSections).toContain("skills");
    expect(analysis.atsScore).toBeGreaterThanOrEqual(0);
  });

  it("optimizes resume content without lowering the projected ATS score", () => {
    const resumeData = makeResumeData();
    const jobDescription =
      "Senior Frontend Engineer needed with 5+ years of experience using React, TypeScript, AEM, REST API, AWS, and Kubernetes. Strong collaboration and communication skills required.";

    const baseline = defaultAtsScoringService.analyze({ resumeData, jobDescription });
    const optimized = defaultAtsScoringService.optimize({ resumeData, jobDescription });

    expect(optimized.summary).toContain("Senior Frontend Engineer");
    expect(optimized.additionalSkills).toContain("Kubernetes");
    expect(optimized.workExperience[0].description).toContain("<ul>");
    expect(optimized.atsScore).toBeGreaterThanOrEqual(baseline.atsScore);
    expect(optimized.analysis.keywordScore).toBeGreaterThanOrEqual(baseline.keywordScore);
  });

  it("parses raw resume text and detects the declared sections and required years", () => {
    const resumeText = `
Jordan Rivera
Senior Frontend Engineer
jordan.rivera@example.com | (555) 123-4567 | linkedin.com/in/jordanrivera

Professional Summary
Senior frontend engineer focused on content platforms, performance, and delivery.

Skills
React, TypeScript, AWS, Adobe Experience Manager, REST API

Experience
Jan 2021 - Present
- Built React and TypeScript features for a content platform.
- Integrated AWS deployments and REST API services.

May 2018 - Dec 2020
- Maintained Adobe Experience Manager sites.
- Partnered with design and QA to deliver releases.

Education
State University - B.S. Computer Science
`.trim();

    const jobDescription = "Need a front-end engineer with 3+ years of experience using AWS, Kubernetes, and TypeScript.";
    const analysis = defaultAtsScoringService.analyze({ resumeText, jobDescription });

    expect(analysis.sections.detectedSections).toContain("Summary");
    expect(analysis.sections.detectedSections).toContain("Skills");
    expect(analysis.sections.detectedSections).toContain("Experience");
    expect(analysis.experienceDetails.requiredYears).toBe(3);
    expect(analysis.experienceDetails.requirementMet).toBe(true);
    expect(analysis.keywordDetails.missingKeywords).toContain("Kubernetes");
    expect(analysis.keywordScore).toBeGreaterThanOrEqual(50);
  });
});
