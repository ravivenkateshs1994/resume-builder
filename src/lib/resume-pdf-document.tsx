import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Certification, Education, ResumeData, TemplateId, WorkExperience } from "../types/resume";

interface ResumePdfDocumentProps {
  resumeData: ResumeData;
  selectedTemplate: TemplateId;
  accentColor?: string;
  visualPages?: Array<{ dataUrl: string; width: number; height: number }>;
}

const DEFAULT_ACCENT = "#2563eb";

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  modern: "Modern",
  classic: "Classic",
  creative: "Creative",
  minimal: "Minimal",
  executive: "Executive",
  slate: "Slate",
  chronos: "Chronos",
  terra: "Terra",
  tech: "Tech",
  nova: "Nova",
  prism: "Prism",
  apex: "Apex",
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeAccentColor(value?: string): string {
  return typeof value === "string" && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value) ? value : DEFAULT_ACCENT;
}

function toDisplayPeriod(startDate?: string, endDate?: string): string {
  const start = normalizeText(startDate);
  const end = normalizeText(endDate);

  if (!start && !end) {
    return "";
  }

  if (!start) {
    return end;
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

function htmlToText(value: string): string {
  return value
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function toBulletLines(value: string): string[] {
  const normalized = htmlToText(value);
  const lineCandidates = normalized
    .split(/\r?\n/)
    .map((line) => normalizeText(line.replace(/^[\s*-•·\d.)]+/, "")))
    .filter(Boolean);

  if (lineCandidates.length > 1) {
    return dedupePreserveOrder(lineCandidates);
  }

  const sentenceCandidates = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence.replace(/^[\s*-•·\d.)]+/, "")))
    .filter(Boolean);

  if (sentenceCandidates.length > 1) {
    return dedupePreserveOrder(sentenceCandidates);
  }

  return dedupePreserveOrder(lineCandidates.length > 0 ? lineCandidates : [normalizeText(normalized)]);
}

function safeImageSource(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.startsWith("data:image/") ? value : undefined;
}

function contactLine(parts: Array<string | undefined | null>): string {
  return dedupePreserveOrder(parts.filter((part): part is string => typeof part === "string" && part.length > 0)).join(" • ");
}

type NormalizedExperience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};

type NormalizedEducation = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
};

type NormalizedCertification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
};

interface SlatePdfDocumentProps {
  resumeData: ResumeData;
  templateLabel: string;
  themeColor: string;
  displayName: string;
  headline: string;
  headshotUrl?: string;
  summary: string;
  skills: string[];
  experiences: NormalizedExperience[];
  education: NormalizedEducation[];
  certifications: NormalizedCertification[];
}

interface VisualPdfDocumentProps {
  displayName: string;
  headline: string;
  templateLabel: string;
  visualPages: Array<{ dataUrl: string; width: number; height: number }>;
}

function getInitials(fullName: string): string {
  return normalizeText(fullName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function SlatePdfDocument({
  resumeData,
  templateLabel,
  themeColor,
  displayName,
  headline,
  headshotUrl,
  summary,
  skills,
  experiences,
  education,
  certifications,
}: SlatePdfDocumentProps) {
  const initials = getInitials(displayName);

  return (
    <Document
      title={`${displayName} Resume`}
      author={displayName}
      subject={headline || `${templateLabel} resume`}
      creator="AI Resume Builder"
      producer="AI Resume Builder"
      keywords={[displayName, headline, templateLabel].filter(Boolean).join(", ")}
    >
      <Page size="A4" style={slateStyles.page} wrap>
        <View fixed style={slateStyles.sidebar}>
          <View style={slateStyles.headshotFrame}>
            {headshotUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt text
              <Image src={headshotUrl} style={slateStyles.headshotImage} />
            ) : (
              <View style={slateStyles.headshotFallback}>
                <Text style={slateStyles.headshotInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={slateStyles.sidebarName}>{displayName}</Text>
          {headline ? <Text style={slateStyles.sidebarTitle}>{headline}</Text> : null}

          <View style={slateStyles.sidebarSection}>
            <Text style={slateStyles.sidebarHeading}>Contact</Text>
            <View>
              {resumeData.personalInfo.email ? <ContactRow icon="✉" text={resumeData.personalInfo.email} /> : null}
              {resumeData.personalInfo.phone ? <ContactRow icon="✆" text={resumeData.personalInfo.phone} /> : null}
              {resumeData.personalInfo.location ? <ContactRow icon="⊙" text={resumeData.personalInfo.location} /> : null}
              {resumeData.personalInfo.linkedin ? <ContactRow icon="in" text={resumeData.personalInfo.linkedin} /> : null}
              {resumeData.personalInfo.website ? <ContactRow icon="🌐" text={resumeData.personalInfo.website} /> : null}
            </View>
          </View>

          {skills.length > 0 ? (
            <View style={slateStyles.sidebarSection}>
              <Text style={slateStyles.sidebarHeading}>Skills</Text>
              <View style={slateStyles.skillWrap}>
                {skills.map((skill) => (
                  <View key={skill} style={slateStyles.skillChip}>
                    <Text style={slateStyles.skillChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {education.length > 0 ? (
            <View style={slateStyles.sidebarSection}>
              <Text style={slateStyles.sidebarHeading}>Education</Text>
              {education.map((entry) => (
                <View key={entry.id} style={slateStyles.sidebarEntry}>
                  <Text style={slateStyles.sidebarEntryTitle}>
                    {entry.degree}
                    {entry.field ? ` in ${entry.field}` : ""}
                  </Text>
                  <Text style={slateStyles.sidebarEntryMeta}>{entry.institution}</Text>
                  <Text style={slateStyles.sidebarEntryPeriod}>
                    {entry.startDate} – {entry.endDate}
                    {entry.gpa ? ` · GPA ${entry.gpa}` : ""}
                  </Text>
                  {entry.honors ? <Text style={slateStyles.sidebarEntryHonors}>{entry.honors}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          {certifications.length > 0 ? (
            <View style={slateStyles.sidebarSection}>
              <Text style={slateStyles.sidebarHeading}>Certifications</Text>
              {certifications.map((certification) => (
                <View key={certification.id} style={slateStyles.sidebarEntry}>
                  <Text style={slateStyles.sidebarEntryTitle}>{certification.name}</Text>
                  <Text style={slateStyles.sidebarEntryMeta}>{certification.issuer}</Text>
                  {certification.date ? <Text style={slateStyles.sidebarEntryPeriod}>{certification.date}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={slateStyles.main}>
          <View style={[slateStyles.topStripe, { backgroundColor: themeColor }]} />

          {summary ? (
            <View style={slateStyles.mainSection}>
              <Text style={[slateStyles.mainHeading, { color: themeColor }]}>Profile</Text>
              <Text style={slateStyles.mainSummary}>{summary}</Text>
            </View>
          ) : null}

          {experiences.length > 0 ? (
            <View style={slateStyles.mainSection}>
              <Text style={[slateStyles.mainHeading, { color: themeColor }]}>Work Experience</Text>
              {experiences.map((experience) => (
                <View key={experience.id} style={slateStyles.experienceEntry}>
                  <View style={slateStyles.experienceHeader}>
                    <View style={slateStyles.experienceHeaderCopy}>
                      <Text style={slateStyles.experienceTitle}>{experience.title}</Text>
                      <Text style={[slateStyles.experienceMeta, { color: themeColor }]}>
                        {[experience.company, experience.location].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <Text style={slateStyles.experiencePeriod}>
                      {experience.startDate} – {experience.endDate}
                    </Text>
                  </View>

                  {experience.bullets.length > 0 ? (
                    <View style={slateStyles.bulletList}>
                      {experience.bullets.map((bullet, index) => (
                        <View key={`${experience.id}-${index}`} style={slateStyles.bulletRow}>
                          <Text style={[slateStyles.bulletMark, { color: themeColor }]}>•</Text>
                          <Text style={slateStyles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

function VisualPdfDocument({ displayName, headline, templateLabel, visualPages }: VisualPdfDocumentProps) {
  return (
    <Document
      title={`${displayName} Resume`}
      author={displayName}
      subject={headline || `${templateLabel} resume`}
      creator="AI Resume Builder"
      producer="AI Resume Builder"
      keywords={[displayName, headline, templateLabel].filter(Boolean).join(", ")}
    >
      {visualPages.map((page, index) => (
        <Page key={`${templateLabel}-${index}`} size="A4" style={visualPdfStyles.page}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt text */}
          <Image src={page.dataUrl} style={visualPdfStyles.image} />
        </Page>
      ))}
    </Document>
  );
}

function ContactRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={slateStyles.contactRow}>
      <Text style={slateStyles.contactIcon}>{icon}</Text>
      <Text style={slateStyles.contactText}>{text}</Text>
    </View>
  );
}

export function ResumePdfDocument({ resumeData, selectedTemplate, accentColor, visualPages }: ResumePdfDocumentProps) {
  const themeColor = normalizeAccentColor(accentColor);
  const templateLabel = TEMPLATE_LABELS[selectedTemplate];
  const headshotUrl = safeImageSource(resumeData.personalInfo.headshotUrl);
  const displayName = normalizeText(resumeData.personalInfo.fullName) || "Resume";
  const headline = normalizeText(resumeData.personalInfo.jobTitle || resumeData.targetRole);
  const summary = normalizeText(resumeData.summary);
  const contact = contactLine([
    resumeData.personalInfo.email,
    resumeData.personalInfo.phone,
    resumeData.personalInfo.location,
    resumeData.personalInfo.linkedin,
    resumeData.personalInfo.website,
  ]);
  const skills = dedupePreserveOrder(resumeData.skills);

  const experiences = resumeData.workExperience
    .map((experience: WorkExperience) => ({
      ...experience,
      title: normalizeText(experience.title),
      company: normalizeText(experience.company),
      location: normalizeText(experience.location),
      startDate: normalizeText(experience.startDate),
      endDate: normalizeText(experience.endDate),
      bullets: toBulletLines(experience.description),
    }))
    .filter((experience) => experience.title || experience.company || experience.bullets.length > 0);

  const education = resumeData.education
    .map((entry: Education) => ({
      ...entry,
      institution: normalizeText(entry.institution),
      degree: normalizeText(entry.degree),
      field: normalizeText(entry.field),
      startDate: normalizeText(entry.startDate),
      endDate: normalizeText(entry.endDate),
      gpa: normalizeText(entry.gpa),
      honors: normalizeText(entry.honors),
    }))
    .filter((entry) => entry.institution || entry.degree || entry.field);

  const certifications = resumeData.certifications
    .map((entry: Certification) => ({
      ...entry,
      name: normalizeText(entry.name),
      issuer: normalizeText(entry.issuer),
      date: normalizeText(entry.date),
    }))
    .filter((entry) => entry.name || entry.issuer || entry.date);

  if (visualPages?.length) {
    return (
      <VisualPdfDocument
        displayName={displayName}
        headline={headline}
        templateLabel={templateLabel}
        visualPages={visualPages}
      />
    );
  }

  if (selectedTemplate === "slate") {
    return (
      <SlatePdfDocument
        resumeData={resumeData}
        templateLabel={templateLabel}
        themeColor={themeColor}
        displayName={displayName}
        headline={headline}
        headshotUrl={headshotUrl}
        summary={summary}
        skills={skills}
        experiences={experiences}
        education={education}
        certifications={certifications}
      />
    );
  }

  return (
    <Document
      title={`${displayName} Resume`}
      author={displayName}
      subject={headline || `${templateLabel} resume`}
      creator="AI Resume Builder"
      producer="AI Resume Builder"
      keywords={[displayName, headline, templateLabel].filter(Boolean).join(", ")}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.topStripe}>
          <View style={[styles.topStripeFill, { backgroundColor: themeColor }]} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.templateBadge, { color: themeColor, borderColor: themeColor }]}>
              {templateLabel}
            </Text>
            <Text style={styles.name}>{displayName}</Text>
            {headline ? <Text style={[styles.headline, { color: themeColor }]}>{headline}</Text> : null}
            {contact ? <Text style={styles.contact}>{contact}</Text> : null}
          </View>

          {headshotUrl ? (
            <View style={[styles.headshotFrame, { borderColor: themeColor }]}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt text */}
              <Image src={headshotUrl} style={styles.headshotImage} />
            </View>
          ) : null}
        </View>

        {summary ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>Professional Summary</Text>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryAccent, { backgroundColor: themeColor }]} />
              <Text style={styles.bodyText}>{summary}</Text>
            </View>
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>Skills</Text>
            <View style={styles.skillWrap}>
              {skills.map((skill) => (
                <View key={skill} style={[styles.skillChip, { borderColor: themeColor }]}>
                  <Text style={[styles.skillChipText, { color: themeColor }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {experiences.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>Experience</Text>
            {experiences.map((experience) => {
              const period = toDisplayPeriod(experience.startDate, experience.endDate);
              const location = experience.location ? experience.location : "";
              return (
                <View key={experience.id} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryHeaderCopy}>
                      <Text style={styles.entryTitle}>{experience.title || experience.company || "Experience"}</Text>
                      {experience.company || location ? (
                        <Text style={styles.entryMeta}>
                          {[experience.company, location].filter(Boolean).join(" • ")}
                        </Text>
                      ) : null}
                    </View>
                    {period ? <Text style={styles.entryPeriod}>{period}</Text> : null}
                  </View>

                  {experience.bullets.length > 0 ? (
                    <View style={styles.bulletList}>
                      {experience.bullets.map((bullet) => (
                        <View key={bullet} style={styles.bulletRow}>
                          <Text style={[styles.bulletMark, { color: themeColor }]}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>Education</Text>
            {education.map((entry) => {
              const period = toDisplayPeriod(entry.startDate, entry.endDate);
              const details = [entry.degree, entry.field].filter(Boolean).join(", ");
              const extra = [entry.gpa ? `GPA ${entry.gpa}` : "", entry.honors].filter(Boolean).join(" • ");

              return (
                <View key={entry.id} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryHeaderCopy}>
                      <Text style={styles.entryTitle}>{entry.institution || "Education"}</Text>
                      {details ? <Text style={styles.entryMeta}>{details}</Text> : null}
                    </View>
                    {period ? <Text style={styles.entryPeriod}>{period}</Text> : null}
                  </View>
                  {extra ? <Text style={styles.entrySupport}>{extra}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>Certifications</Text>
            {certifications.map((certification) => {
              const meta = [certification.issuer, certification.date].filter(Boolean).join(" • ");
              return (
                <View key={certification.id} style={styles.entry}>
                  <Text style={styles.entryTitle}>{certification.name}</Text>
                  {meta ? <Text style={styles.entryMeta}>{meta}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `${templateLabel} template • Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingRight: 30,
    paddingBottom: 40,
    paddingLeft: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    lineHeight: 1.45,
  },
  topStripe: {
    marginBottom: 14,
  },
  topStripeFill: {
    height: 4,
    borderRadius: 999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerCopy: {
    flexGrow: 1,
    flexShrink: 1,
  },
  templateBadge: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingTop: 3,
    paddingRight: 8,
    paddingBottom: 3,
    paddingLeft: 8,
    borderWidth: 1,
    borderRadius: 999,
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 23,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 4,
  },
  headline: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  contact: {
    fontSize: 9.2,
    color: "#475569",
    lineHeight: 1.5,
  },
  headshotFrame: {
    width: 84,
    height: 84,
    padding: 4,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    flexShrink: 0,
  },
  headshotImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.75,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 9,
    paddingLeft: 10,
    borderRadius: 6,
  },
  summaryAccent: {
    width: 3,
    borderRadius: 999,
    marginRight: 8,
  },
  bodyText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.55,
  },
  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  skillChipText: {
    fontSize: 9,
    fontWeight: 700,
  },
  entry: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  entryHeaderCopy: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 10,
  },
  entryTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#0f172a",
  },
  entryMeta: {
    fontSize: 9,
    color: "#475569",
    marginTop: 1,
  },
  entryPeriod: {
    fontSize: 8.8,
    fontWeight: 700,
    color: "#64748b",
    textAlign: "right",
    flexShrink: 0,
  },
  entrySupport: {
    fontSize: 9,
    color: "#475569",
    marginTop: 2,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  bulletMark: {
    width: 9,
    fontSize: 12,
    lineHeight: 1.2,
    marginRight: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.3,
    color: "#334155",
    lineHeight: 1.45,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const slateStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    lineHeight: 1.42,
  },
  sidebar: {
    position: "absolute",
    top: 24,
    left: 24,
    bottom: 24,
    width: 162,
    backgroundColor: "#1e293b",
    paddingTop: 16,
    paddingRight: 14,
    paddingBottom: 16,
    paddingLeft: 14,
  },
  headshotFrame: {
    width: 92,
    height: 92,
    padding: 4,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "#475569",
  },
  headshotImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  headshotFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#334155",
  },
  headshotInitials: {
    fontSize: 26,
    fontWeight: 700,
    color: "#ffffff",
  },
  sidebarName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.15,
    textTransform: "uppercase",
  },
  sidebarTitle: {
    marginTop: 2,
    fontSize: 8.8,
    fontWeight: 700,
    color: "#e2e8f0",
    lineHeight: 1.2,
  },
  sidebarSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  sidebarHeading: {
    marginBottom: 8,
    fontSize: 7.8,
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  contactIcon: {
    width: 12,
    marginTop: 1,
    marginRight: 5,
    fontSize: 8.5,
    color: "#cbd5e1",
  },
  contactText: {
    flex: 1,
    fontSize: 8.4,
    lineHeight: 1.3,
    color: "#f8fafc",
  },
  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillChip: {
    marginRight: 4,
    marginBottom: 4,
    paddingTop: 2.5,
    paddingRight: 5.5,
    paddingBottom: 2.5,
    paddingLeft: 5.5,
    borderRadius: 3,
    backgroundColor: "#0ea5e9",
  },
  skillChipText: {
    fontSize: 7.7,
    fontWeight: 700,
    lineHeight: 1.1,
    color: "#ffffff",
  },
  sidebarEntry: {
    marginBottom: 8,
  },
  sidebarEntryTitle: {
    fontSize: 8.4,
    fontWeight: 700,
    lineHeight: 1.15,
    color: "#ffffff",
  },
  sidebarEntryMeta: {
    marginTop: 1,
    fontSize: 7.8,
    lineHeight: 1.15,
    color: "#cbd5e1",
  },
  sidebarEntryPeriod: {
    marginTop: 1,
    fontSize: 7.4,
    lineHeight: 1.15,
    color: "#94a3b8",
  },
  sidebarEntryHonors: {
    marginTop: 1,
    fontSize: 7.4,
    lineHeight: 1.15,
    color: "#38bdf8",
  },
  main: {
    marginLeft: 180,
    paddingTop: 4,
  },
  topStripe: {
    width: 42,
    height: 4,
    marginTop: 2,
    marginBottom: 16,
    borderRadius: 999,
  },
  mainSection: {
    marginBottom: 12,
  },
  mainHeading: {
    marginBottom: 6,
    fontSize: 8.7,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mainSummary: {
    fontSize: 10.2,
    color: "#334155",
    lineHeight: 1.45,
  },
  experienceEntry: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  experienceHeaderCopy: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  experienceTitle: {
    fontSize: 10.3,
    fontWeight: 700,
    lineHeight: 1.15,
    color: "#0f172a",
  },
  experienceMeta: {
    marginTop: 1,
    fontSize: 8.4,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  experiencePeriod: {
    flexShrink: 0,
    paddingTop: 3,
    paddingRight: 8,
    paddingBottom: 3,
    paddingLeft: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    fontSize: 8.1,
    fontWeight: 700,
    color: "#94a3b8",
  },
  bulletList: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  bulletMark: {
    width: 8,
    marginTop: 0.5,
    marginRight: 4,
    fontSize: 11,
    lineHeight: 1.1,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.8,
    lineHeight: 1.35,
    color: "#334155",
  },
});

const visualPdfStyles = StyleSheet.create({
  page: {
    margin: 0,
    padding: 0,
    backgroundColor: "#ffffff",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
