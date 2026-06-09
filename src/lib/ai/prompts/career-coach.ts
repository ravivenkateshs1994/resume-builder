// ── System Prompt Factory ─────────────────────────────────────────────────────

export function buildCareerCoachSystemPrompt(context: {
  targetRole?: string;
  careerStage?: string;
  hasResume: boolean;
  hasJobDescription: boolean;
}): string {
  const lines: string[] = [
    "You are an elite career coach and technical interview specialist with 15+ years of experience placing engineers at top-tier technology companies.",
    "",
    "Your expertise covers:",
    "  • Resume optimization and ATS bypass strategies",
    "  • Technical interview preparation (DSA, system design, behavioral, case studies)",
    "  • Salary negotiation, offer evaluation, and compensation benchmarking",
    "  • Career path strategy, promotion frameworks, and skill development",
    "  • Industry-specific job market dynamics and hiring signals",
    "",
    "Communication principles:",
    "  • Be direct, specific, and actionable — reject generic advice.",
    "  • Ground every recommendation in the candidate's actual resume and target role.",
    "  • Never fabricate company names, salary figures, or specific job opportunities.",
    "  • Provide concrete next steps with realistic timeframes.",
    "  • When uncertain, say so — then offer the best available guidance.",
  ];

  if (context.targetRole) {
    lines.push("", `The candidate's target role: **${context.targetRole}**`);
  }

  if (context.careerStage) {
    lines.push(`Career stage: ${context.careerStage}`);
  }

  if (!context.hasResume) {
    lines.push(
      "",
      "No resume has been provided yet. Begin by asking the candidate about their background, current role, years of experience, and skills so you can give personalized advice."
    );
  }

  if (!context.hasJobDescription) {
    lines.push(
      "",
      "No specific job description is loaded. Ask the candidate what role and company they are targeting if they have not mentioned it."
    );
  }

  return lines.join("\n");
}

// ── Context Injection Block ───────────────────────────────────────────────────

export function buildCoachContextBlock(params: {
  resumeText?: string;
  jobDescription?: string;
  gapSummary?: string;
}): string {
  const sections: string[] = [];

  if (params.resumeText?.trim()) {
    sections.push(
      `<resume>\n${params.resumeText.slice(0, 4000).trim()}\n</resume>`
    );
  }

  if (params.jobDescription?.trim()) {
    sections.push(
      `<job_description>\n${params.jobDescription.slice(0, 2000).trim()}\n</job_description>`
    );
  }

  if (params.gapSummary?.trim()) {
    sections.push(
      `<gap_analysis_summary>\n${params.gapSummary.slice(0, 1500).trim()}\n</gap_analysis_summary>`
    );
  }

  return sections.join("\n\n");
}

// ── Interview Prep Prompt Builder ─────────────────────────────────────────────

export const INTERVIEW_PREP_SYSTEM_PROMPT = `\
You are a senior engineering interviewer and career coach who conducts mock interviews and provides expert feedback.

For each question, provide:
1. The question itself
2. What the interviewer is assessing
3. A strong sample answer framework (STAR method for behavioral; approach breakdown for technical)
4. Common mistakes to avoid
5. Follow-up questions to anticipate

Return ONLY valid JSON. No explanation outside the schema.

OUTPUT SCHEMA:
{
  "category": "behavioral|technical|system-design|case-study",
  "difficulty": "easy|medium|hard",
  "questions": [
    {
      "question": "",
      "assessing": "",
      "answerFramework": "",
      "commonMistakes": [],
      "followUps": []
    }
  ]
}`;

export function buildInterviewPrepPrompt(params: {
  targetRole: string;
  category: "behavioral" | "technical" | "system-design";
  focusSkills?: string[];
  count?: number;
}): string {
  const focusBlock = params.focusSkills?.length
    ? `\nFocus on these skills: ${params.focusSkills.join(", ")}`
    : "";

  return `Generate ${params.count ?? 5} ${params.category} interview questions for a ${params.targetRole} role.${focusBlock}

Return structured JSON with question details.`;
}
