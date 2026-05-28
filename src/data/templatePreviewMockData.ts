/**
 * Canonical mock resume data used exclusively for template thumbnail previews.
 * Do not use this data for user-facing resume generation or editing.
 */
import type { ResumeData, TemplateId } from "@/types/resume";

function html(summary: string, bullets: string[]) {
  return `<p>${summary}</p><ul>${bullets.map((b) => `<li><p>${b}</p></li>`).join("")}</ul>`;
}

function exp(
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
    description: html(summary, bullets),
  };
}

function edu(
  institution: string,
  degree: string,
  field: string,
  startDate: string,
  endDate: string,
  gpa?: string,
  honors?: string
): ResumeData["education"][number] {
  return { id: `${institution}-${degree}`, institution, degree, field, startDate, endDate, gpa, honors };
}

function cert(name: string, issuer: string, date: string): ResumeData["certifications"][number] {
  return { id: `${issuer}-${name}`, name, issuer, date };
}

interface Seed {
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
}

function build(seed: Seed): ResumeData {
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

export const TEMPLATE_MOCK_DATA: Record<TemplateId, ResumeData> = {
  modern: build({
    fullName: "Ava Morgan",
    jobTitle: "Senior Product Designer",
    email: "ava.morgan@example.com",
    phone: "(555) 014-2298",
    location: "Brooklyn, NY",
    linkedin: "linkedin.com/in/avamorgan",
    website: "avamorgan.design",
    summary: "Senior product designer with 10 years of experience leading design for onboarding, growth, and platform products at B2B and consumer SaaS companies. Expert at building design systems from scratch, running mixed-method user research, and keeping cross-functional teams aligned from discovery through launch. Known for translating ambiguous problem spaces into clear, polished interfaces that ship on time and move metrics. Passionate mentor who has grown four junior designers into mid-level roles.",
    workExperience: [
      exp("Senior Product Designer", "Northstar Labs", "New York, NY", "2021", "Present",
        "Design lead for the onboarding, activation, and core product experience across web and iOS.",
        ["Redesigned first-run experience end-to-end, reducing 30-day drop-off by 34% and increasing paid conversion by 18%.", "Built and maintained a component library of 120+ tokens and patterns adopted by six product squads.", "Ran bi-weekly design critiques and established a design review process that cut revision rounds from four to one.", "Partnered with the data team to instrument every key interaction and establish a measurement framework for design quality."]),
      exp("Product Designer", "Orbit Studio", "Boston, MA", "2017", "2021",
        "Led design for a growing B2B SaaS platform used by 200+ enterprise clients and 40,000 daily active users.",
        ["Drove a full navigation redesign that reduced average task completion time from 4.2 to 1.8 clicks.", "Standardized accessibility patterns across the product, achieving WCAG 2.1 AA compliance on all flows.", "Collaborated with engineering to introduce design tokens, cutting theming work from two weeks to two days."]),
    ],
    education: [
      edu("Parsons School of Design", "BFA", "Communication Design", "2008", "2012", "3.8", "Dean's List — 4 semesters"),
      edu("Rhode Island School of Design", "Certificate", "UX Research Methods", "2015", "2016"),
    ],
    skills: ["User Research", "UI Design", "Prototyping", "Design Systems", "Figma", "Usability Testing"],
    certifications: [
      cert("Google UX Design Professional Certificate", "Coursera / Google", "2023"),
      cert("Nielsen Norman UX Certification — Interaction Design", "Nielsen Norman Group", "2021"),
      cert("WCAG 2.1 Accessibility Fundamentals", "W3C / WebAIM", "2020"),
      cert("Certified Design Sprint Facilitator", "Google Ventures", "2022"),
    ],
  }),

  classic: build({
    fullName: "Eleanor Grant",
    jobTitle: "Director of Operations",
    email: "eleanor.grant@example.com",
    phone: "(555) 016-1191",
    location: "Boston, MA",
    linkedin: "linkedin.com/in/eleanorgrant",
    website: "eleanorgrant.com",
    summary: "Operations executive with 14 years of experience building the reporting infrastructure, process frameworks, and cross-departmental alignment systems that allow fast-growing companies to scale without chaos. Proven track record managing budgets over $20M, leading teams of 25+, and delivering measurable efficiency gains in services, retail, and logistics environments. Highly skilled at translating complex operations data into clear executive narratives and actionable quarterly plans.",
    workExperience: [
      exp("Director of Operations", "Harbor Systems", "Boston, MA", "2019", "Present",
        "Led all operational functions for a 300-person professional services firm across six practice areas.",
        ["Reduced weekly executive report turnaround from five days to same-day by building an automated data pipeline.", "Designed and rolled out a unified process framework across six practice areas, reducing delivery inconsistency by 45%.", "Managed a direct team of eight and coordinated with 14 department leads through weekly operating rhythms.", "Renegotiated vendor contracts and consolidated tooling, saving $1.1M annually without reducing service quality."]),
      exp("Senior Operations Manager", "Luma Retail", "Cambridge, MA", "2015", "2019",
        "Owned operations strategy, reporting, and process improvement for a 14-location retail business.",
        ["Introduced a standardized KPI framework that unified reporting across all locations for the first time in company history.", "Documented 40+ standard operating procedures, cutting manager onboarding time from eight weeks to three.", "Partnered with IT to automate inventory reconciliation, saving six labor-hours per store per week."]),
    ],
    education: [
      edu("Boston University Questrom School of Business", "MBA", "Operations & Supply Chain Management", "2008", "2010", "3.9", "Beta Gamma Sigma Honor Society"),
      edu("University of Massachusetts Amherst", "BS", "Business Administration", "2004", "2008", "3.7", "Magna Cum Laude"),
    ],
    skills: ["Operations Strategy", "Process Improvement", "KPI Frameworks", "Vendor Management", "Budget Management", "Executive Reporting"],
    certifications: [
      cert("Lean Six Sigma Green Belt", "ASQ", "2018"),
      cert("Project Management Professional (PMP)", "PMI", "2020"),
    ],
  }),

  creative: build({
    fullName: "Maya Patel",
    jobTitle: "Creative Director",
    email: "maya.patel@studio.com",
    phone: "(555) 019-4420",
    location: "Remote",
    linkedin: "linkedin.com/in/mayapatel",
    website: "behance.net/mayapatel",
    summary: "Creative director and brand designer with 11 years of experience building visual identities, campaign systems, and design languages for consumer, tech, and lifestyle brands. Equally comfortable directing a multi-agency rebrand and executing a tight product launch campaign. Work spans print, digital, motion, packaging, and environmental design. Passionate about building scalable creative systems that give teams autonomy without sacrificing brand coherence.",
    workExperience: [
      exp("Creative Director", "Studio North", "Remote", "2020", "Present",
        "Creative lead for a 12-person independent studio serving technology, wellness, and consumer brands.",
        ["Directed full rebrands for eight clients, three of which won international design awards post-launch.", "Built a motion and animation capability from scratch, growing studio revenue from that practice by $800K in two years.", "Developed scalable design systems that enabled two-person marketing teams to self-serve campaign assets.", "Managed relationships with four agency-of-record clients, consistently renewing annual contracts."]),
      exp("Senior Brand Designer", "Field Creative", "Chicago, IL", "2016", "2020",
        "Led brand identity and campaign design for a creative agency serving CPG, fintech, and retail clients.",
        ["Created brand identities for 15 clients across food, wellness, and technology verticals.", "Designed pitch materials that supported three clients in raising a combined $65M in Series A and B funding.", "Managed external print production vendors and maintained color accuracy across all physical deliverables."]),
      exp("Brand Designer", "Hatch Studio", "Chicago, IL", "2012", "2016",
        "Mid-level designer at a boutique branding agency specializing in food, hospitality, and lifestyle brands.",
        ["Executed full brand rollouts across packaging, signage, and digital for six clients.", "Led typography and color system development that became the agency's internal standard for client onboarding."]),
    ],
    education: [
      edu("School of the Art Institute of Chicago", "BFA", "Graphic Design", "2008", "2012", "3.9", "Graduated with Distinction"),
      edu("Instituto Europeo di Design, Milan", "Summer Intensive", "Brand Strategy & Identity", "2011", "2011"),
    ],
    skills: ["Brand Identity", "Visual Direction", "Campaign Design", "Typography", "Motion Design", "Adobe Creative Suite"],
    certifications: [
      cert("Adobe Certified Professional — Illustrator & InDesign", "Adobe", "2022"),
      cert("Motion Design Certificate", "School of Motion", "2020"),
      cert("Brand Strategy Certification", "Marty Neumeier / AiGA", "2021"),
    ],
  }),

  minimal: build({
    fullName: "Sam Chen",
    jobTitle: "Senior Data Analyst",
    email: "sam.chen@example.com",
    phone: "(555) 018-2044",
    location: "Chicago, IL",
    linkedin: "linkedin.com/in/samchen",
    website: "samchen.dev",
    summary: "Senior data analyst with 9 years of experience transforming complex, messy datasets into the concise dashboards and decision briefs that executive teams rely on daily. Deep expertise in SQL, Python, and BI tooling across product, finance, and operations analytics domains. Known for building lightweight, maintainable reporting systems and for communicating quantitative findings to non-technical stakeholders with unusual clarity. Committed to mentoring junior analysts and raising data literacy across the organizations I join.",
    workExperience: [
      exp("Senior Data Analyst", "Northwind Analytics", "Chicago, IL", "2020", "Present",
        "Lead analyst for a 200-person SaaS company, owning executive dashboards, product analytics, and ad hoc modeling.",
        ["Reduced executive dashboard load time by 65% through query restructuring, indexing, and layer caching in Looker.", "Designed the product analytics instrumentation plan for a major platform relaunch, defining 40+ key events.", "Automated eight previously manual reports, saving the analytics team 15 hours of work per week collectively."]),
      exp("Data Analyst", "Metro Insights", "Chicago, IL", "2016", "2020",
        "Analytics owner for the operations function of a 500-person regional services company.",
        ["Designed and launched a KPI scorecard system used consistently across all 18 regional offices.", "Built ETL pipelines in Python that replaced four manual data exports, reducing errors and saving 10 hours weekly."]),
    ],
    education: [
      edu("Northwestern University Kellogg", "Masters", "Data Visualization & Storytelling", "2017", "2017"),
    ],
    skills: ["SQL (PostgreSQL, BigQuery)", "Python (pandas, NumPy)", "Looker", "Tableau", "dbt", "Data Storytelling"],
    certifications: [
      cert("dbt Certified Analytics Engineer", "dbt Labs", "2023"),
    ],
  }),

  executive: build({
    fullName: "Taylor Brooks",
    jobTitle: "Chief Strategy Officer",
    email: "taylor.brooks@leadership.com",
    phone: "(555) 017-3882",
    location: "New York, NY",
    linkedin: "linkedin.com/in/taylorbrooks",
    website: "taylorbrooks.com",
    summary: "Chief Strategy Officer with 16 years of experience translating long-range organizational vision into operating plans, capital allocation frameworks, and cross-functional execution systems at $100M–$1B revenue companies. Proven record advising boards and investors, leading transformational change programs, and building the management cadences that allow fast-growing companies to scale with discipline. Trusted thought partner to founders and CEOs navigating market entry, M&A, and organizational redesign.",
    workExperience: [
      exp("Chief Strategy Officer", "Summit Group", "New York, NY", "2019", "Present",
        "CSO for a $450M professional services firm, owning strategy, planning, corporate development, and executive communications.",
        ["Designed the company's three-year growth strategy adopted by the board, resulting in 22% revenue growth in year one.", "Led two strategic acquisitions totaling $120M, including 90-day post-merger integration for a 200-person acquired company.", "Built and ran the annual strategy planning cycle across eight business lines, producing all board-level materials.", "Established a portfolio governance model that improved capital allocation decisions and eliminated three underperforming initiatives."]),
      exp("Vice President, Strategy", "Crest Partners", "New York, NY", "2014", "2019",
        "Led strategy and operating plan development for a PE-backed portfolio across six companies.",
        ["Authored market entry analysis for five new verticals; three were approved and successfully launched.", "Designed operating review frameworks adopted across all portfolio companies, improving board confidence in management teams.", "Managed a 90-day post-acquisition integration for a 300-person target company, achieving full operational merger ahead of schedule."]),
    ],
    education: [
      edu("The Wharton School, University of Pennsylvania", "MBA", "Strategy & Finance", "2006", "2008", "3.9", "Dean's Scholar — Top 5% of Class"),
      edu("Georgetown University", "BS", "Economics — International Trade", "2002", "2006", "3.85", "Summa Cum Laude, Phi Beta Kappa"),
    ],
    skills: ["Corporate Strategy", "M&A and Integration", "Executive Communication", "Board Advisory", "Financial Modeling", "Organizational Design"],
    certifications: [
      cert("Project Management Professional (PMP)", "PMI", "2016"),
      cert("Balanced Scorecard Master Professional (BSMP)", "Palladium", "2019"),
    ],
  }),

  slate: build({
    fullName: "Casey Rivera",
    jobTitle: "Staff Engineer",
    email: "casey@platform.io",
    phone: "(555) 015-7741",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/caseyrivera",
    website: "github.com/caseyrivera",
    summary: "Staff engineer with 12 years of experience owning platform reliability, distributed systems architecture, and developer experience at high-scale companies. Track record of reducing incident rates, cutting deployment risk, and building the tooling that empowers hundreds of engineers to move faster with confidence. Strong technical leader who can define multi-year platform roadmaps, partner with engineering directors, and mentor senior engineers toward staff-level impact.",
    workExperience: [
      exp("Staff Engineer", "Platform.io", "Seattle, WA", "2021", "Present",
        "Technical lead and architecture owner for the internal developer platform serving 400+ engineers.",
        ["Reduced MTTR by 52% by redesigning the observability stack and standardizing runbooks across all services.", "Shipped a self-service infrastructure provisioning tool that eliminated 90% of manual DevOps tickets.", "Designed the company's multi-region failover architecture, achieving 99.99% uptime SLA for the first time.", "Defined a platform engineering roadmap adopted by the VP of Engineering as the three-year technical strategy."]),
      exp("Senior Software Engineer", "North Coast Systems", "Seattle, WA", "2016", "2021",
        "Backend technical lead for a distributed SaaS platform processing 500M events per day.",
        ["Re-architected the event processing pipeline to handle 5x peak load with no latency degradation.", "Introduced distributed tracing and structured logging, cutting average incident investigation time by 65%.", "Drove unit test coverage from 38% to 89% by championing a shift-left testing culture across three teams."]),
      exp("Software Engineer", "Meridian Cloud", "Seattle, WA", "2013", "2016",
        "Backend engineer on a fintech API platform serving 200+ enterprise integrations.",
        ["Built rate-limiting and authentication middleware reducing API abuse incidents by 80%.", "Migrated legacy monolith modules to REST microservices, improving deploy cadence from monthly to weekly."]),
    ],
    education: [
      edu("University of Washington", "BS", "Computer Science", "2008", "2012", "3.85", "Dean's List"),
      edu("Stanford University Center for Professional Development", "Certificate", "Distributed Systems Design", "2018", "2018"),
    ],
    skills: ["Distributed Systems", "Platform Engineering", "Site Reliability", "Kubernetes & Helm", "Observability (OTel, Datadog)", "System Design"],
    certifications: [
      cert("AWS Solutions Architect - Professional", "Amazon Web Services", "2021"),
      cert("Certified Kubernetes Administrator (CKA)", "CNCF", "2022")
    ],
  }),

  chronos: build({
    fullName: "Jordan Kim",
    jobTitle: "Senior Program Manager",
    email: "jordan.kim@ops.com",
    phone: "(555) 013-6682",
    location: "Austin, TX",
    linkedin: "linkedin.com/in/jordankim",
    website: "jordankim.dev",
    summary: "Senior program manager with 11 years of experience delivering high-complexity, multi-team initiatives on time by building the dependency maps, milestone cadences, and stakeholder communication rhythms that keep large programs healthy. Experienced leading programs that span product, engineering, operations, legal, and external partner organizations simultaneously. Trusted by executives to own the most critical delivery programs in the portfolio and surface risks before they become crises.",
    workExperience: [
      exp("Senior Program Manager", "Orbit Health", "Austin, TX", "2020", "Present",
        "Owned the delivery of 10+ concurrent product and operational programs for a health tech company serving 4M patients.",
        ["Delivered a core platform migration three weeks ahead of a non-negotiable regulatory deadline by restructuring dependencies.", "Built a standardized program operating model adopted across all 22 product squads within one quarter.", "Reduced unplanned executive escalations by 60% through proactive risk identification and weekly stakeholder briefings.", "Managed a $14M multi-vendor program spanning three external development partners and two internal engineering teams."]),
      exp("Program Manager", "Lattice Labs", "Austin, TX", "2016", "2020",
        "Led program delivery across product, engineering, QA, and go-to-market for a B2B SaaS company.",
        ["Coordinated 14 product releases per year with zero missed go-to-market dates over four years.", "Introduced a dependency registry that eliminated three recurring launch delays in the first quarter of adoption.", "Rebuilt the program status reporting process, cutting preparation time from six hours to 45 minutes per cycle."]),
    ],
    education: [
      edu("University of Texas at Austin McCombs School of Business", "BA", "Business Administration — Operations", "2007", "2011", "3.75")
    ],
    skills: ["Program Delivery", "Milestone Tracking", "Risk & Issue Management", "Stakeholder Communication", "Roadmap Planning", "Agile & Waterfall"],
    certifications: [
      cert("Project Management Professional (PMP)", "PMI", "2018"),
      cert("Certified Scrum Master (CSM)", "Scrum Alliance", "2016")
    ],
  }),

  terra: build({
    fullName: "Avery Hill",
    jobTitle: "Head of Content Strategy",
    email: "avery@editorial.com",
    phone: "(555) 012-4881",
    location: "Portland, OR",
    linkedin: "linkedin.com/in/averyhill",
    website: "averyhill.co",
    summary: "Head of Content Strategy with 12 years of experience building the voice frameworks, editorial systems, and content operations that allow product and marketing teams to communicate with clarity at scale. Expert at content audits, information architecture, UX writing, and lifecycle messaging across B2B SaaS, consumer wellness, and publishing. Track record of building and managing high-performing content teams and delivering measurable improvements in activation, engagement, and brand perception.",
    workExperience: [
      exp("Head of Content Strategy", "Moss Editorial", "Portland, OR", "2019", "Present",
        "Led content strategy, UX writing, and editorial operations for a 14-person agency serving 12 active clients.",
        ["Developed comprehensive brand voice and tone guides for eight clients, each adopted org-wide by marketing, product, and support.", "Partnered with UX design teams to rewrite onboarding and activation copy, driving a 31% improvement in 7-day activation.", "Built a content audit and governance framework that resolved 400+ inconsistent product messages across three client platforms.", "Grew the content team from two to seven writers and strategists, establishing career ladders and content quality rubrics."]),
      exp("Senior Content Strategist", "Field Notes Brand", "Portland, OR", "2014", "2019",
        "Owned content strategy, copywriting, and editorial standards for a direct-to-consumer brand with 600K subscribers.",
        ["Built and stewarded the brand's editorial voice guide, a document still in active use five years after my departure.", "Wrote acquisition email campaigns that added 45K new subscribers in a single quarter at a 28% open rate.", "Produced 400+ product descriptions, UX strings, and help articles shipped with zero QA escalations."]),
    ],
    education: [
      edu("Portland State University", "BA", "English — Writing & Rhetoric", "2005", "2009", "3.9", "Summa Cum Laude"),
      edu("Nielsen Norman Group", "UX Certificate", "Content Strategy for UX Practitioners", "2017", "2017"),
    ],
    skills: ["Content Strategy", "Brand Voice & Tone", "UX Writing", "Editorial Planning", "SEO Writing", "Content Audits"],
    certifications: [
      cert("Content Strategy for Professionals", "Northwestern University / Coursera", "2021"),
      cert("UX Writing Fundamentals Certificate", "Nielsen Norman Group", "2019"),
      cert("Certified Content Marketer", "Copyblogger", "2020"),
    ],
  }),

  tech: build({
    fullName: "Riley Chen",
    jobTitle: "Senior Full-Stack Engineer",
    email: "riley@stack.dev",
    phone: "(555) 019-2299",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/rileychen",
    website: "rileychen.dev",
    summary: "Senior full-stack engineer with 10 years of experience building high-reliability APIs, developer tooling, and customer-facing product features for B2B SaaS companies at growth and scale stages. Known for owning complex features end-to-end — from RFC through deployment and monitoring — and for leaving codebases meaningfully cleaner than I found them. Equally comfortable in the front-end, backend, and infrastructure layers. Strong mentor and technical interviewer who has hired and onboarded 12 engineers.",
    workExperience: [
      exp("Senior Full-Stack Engineer", "Stack.dev", "San Francisco, CA", "2020", "Present",
        "Technical lead for the developer tools product area at a 90-person B2B developer productivity company.",
        ["Designed and shipped a webhook delivery system processing 4M events/day at 99.99% delivery success rate.", "Built a local development environment CLI that reduced average engineer onboarding time from two weeks to three days.", "Improved end-to-end test coverage from 28% to 82% by introducing Playwright, vitest, and a mandatory E2E policy.", "Led the technical design review process for the team, reviewing 30+ RFCs per quarter and authoring 12 of them."]),
      exp("Software Engineer", "North Bridge Software", "San Francisco, CA", "2016", "2020",
        "Shipped product features and platform improvements for a B2B SaaS platform with 8,000 business accounts.",
        ["Rebuilt the billing and subscription system on Stripe, reducing failed payment events by 68% and churn by 4 points.", "Led migration of three core features from a monolith to microservices with zero downtime using strangler fig pattern.", "Eliminated all planned maintenance windows by introducing feature flags, dark launches, and gradual rollouts."]),
      exp("Junior Software Engineer", "Inkwell Labs", "San Francisco, CA", "2014", "2016",
        "Full-stack engineer on a content collaboration platform used by 500+ creative agencies.",
        ["Built a real-time commenting and annotation feature used daily by 80% of active users.", "Reduced page load time by 40% through lazy-loading, bundle splitting, and CDN configuration."])
    ],
    education: [
      edu("University of California, Berkeley", "BS", "Electrical Engineering & Computer Science", "2009", "2013", "3.75"),
      edu("Hack Reactor San Francisco", "Immersive", "Advanced Software Engineering", "2013", "2014"),
    ],
    skills: ["TypeScript & JavaScript", "React & Next.js", "Node.js", "PostgreSQL", "Docker & Kubernetes", "System Design"],
    certifications: [
      cert("AWS Developer - Associate", "Amazon Web Services", "2022"),
      cert("GitHub Actions Certification", "GitHub", "2023"),
      cert("MongoDB Certified Developer", "MongoDB", "2021"),
    ],
  }),

  nova: build({
    fullName: "Morgan Diaz",
    jobTitle: "Director of Product",
    email: "morgan@product.com",
    phone: "(555) 011-9402",
    location: "Remote",
    linkedin: "linkedin.com/in/morgandiaz",
    website: "morgandiaz.dev",
    summary: "Director of Product with 11 years of experience building and shipping complex consumer and B2B products from zero to scale. Expert at roadmap sequencing, cross-functional alignment, and go-to-market execution in fast-moving, fully distributed organizations. Track record of shipping ambitious features on time, building durable discovery and delivery practices, and growing product teams that consistently outperform expectations. Trusted by founders and CEOs to own the most strategically important product areas.",
    workExperience: [
      exp("Director of Product", "Nova Apps", "Remote", "2021", "Present",
        "Product leader for three core product areas at a 150-person B2B SaaS company growing 80% year-over-year.",
        ["Shipped eight major features in 14 months, each with on-time delivery and under 2% rollback rate.", "Defined and implemented a company-wide product discovery process that reduced feature rework by 42%.", "Built and grew the product team from four PMs to nine, including two leads and a dedicated research function.", "Led quarterly planning for all product areas, producing the OKR framework now used across the entire company."]),
      exp("Senior Product Manager", "Brightside Labs", "Remote", "2017", "2021",
        "PM for the activation and monetization product area at a fully distributed SaaS company.",
        ["Managed a backlog of 250+ items across three squads, maintaining clear priority rationale at every review.", "Defined success metrics for every feature before engineering kickoff, reducing post-launch uncertainty significantly.", "Ran weekly async product reviews that kept three time-zone-distributed squads aligned without synchronous overhead."]),
    ],
    education: [
      edu("University of Washington", "BS", "Human-Computer Interaction", "2009", "2013", "3.8", "Dean's List")
    ],
    skills: ["Product Strategy", "Roadmap Planning", "OKRs & Goal Setting", "Discovery & User Research", "Go-to-market Execution", "Feature Prioritization"],
    certifications: [
      cert("Pragmatic Product Management Certified", "Pragmatic Institute", "2020"),
      cert("Certified Scrum Product Owner (CSPO)", "Scrum Alliance", "2018")
    ],
  }),

  prism: build({
    fullName: "Ari Patel",
    jobTitle: "Senior Data Scientist",
    email: "ari@insight.ai",
    phone: "(555) 010-7718",
    location: "New York, NY",
    linkedin: "linkedin.com/in/aripatel",
    website: "ari-patel.com",
    summary: "Senior data scientist with 10 years of experience building production ML models, experimentation platforms, and analytical systems that directly shape product strategy and revenue decisions at high-scale technology companies. Equally fluent prototyping in a Jupyter notebook and deploying a model to a production microservice. Recognized for translating quantitative findings into language non-technical executives can act on immediately, and for building analytics cultures that outlast my tenure.",
    workExperience: [
      exp("Senior Data Scientist", "Insight AI", "New York, NY", "2020", "Present",
        "Lead data scientist for a 6M-user enterprise SaaS platform, owning the ML roadmap, experimentation platform, and executive analytics.",
        ["Trained a churn prediction model with 89% recall that enabled proactive outreach retaining 1,800 at-risk accounts annually.", "Built and launched an in-house A/B testing platform that replaced a $180K/year vendor tool and improved test velocity by 3x.", "Reduced feature engineering pipeline runtime by 75% through vectorized transforms, Spark optimization, and layer caching.", "Mentored four analysts and two junior data scientists through weekly 1:1s, code reviews, and structured learning plans."]),
      exp("Data Scientist", "SignalWorks", "New York, NY", "2016", "2020",
        "Built ML models, analytics infrastructure, and business intelligence systems for a high-growth B2B platform.",
        ["Trained a lead scoring model that improved sales-qualified lead conversion rate by 28% in the first quarter post-launch.", "Built and maintained dbt models serving 55+ dashboards relied on for daily business decisions across six departments.", "Reduced data freshness latency from 14 hours to 40 minutes by redesigning the ingestion and transformation pipeline."]),
      exp("Junior Data Analyst", "Clearview Analytics", "New York, NY", "2013", "2016",
        "Analyst on the customer insights team at a 200-person e-commerce analytics company.",
        ["Built SQL-based reporting pipelines delivering weekly KPI summaries to C-suite stakeholders.", "Automated monthly cohort analysis that previously took two days of manual spreadsheet work."])
    ],
    education: [
      edu("Columbia University", "MS", "Data Science", "2011", "2013", "4.0", "Graduate Research Fellow — NLP Lab"),
      edu("University of Michigan", "BS", "Statistics & Applied Mathematics", "2007", "2011", "3.9", "Summa Cum Laude"),
    ],
    skills: ["Python (scikit-learn, PyTorch, XGBoost)", "SQL & dbt", "Spark & BigQuery", "Machine Learning & MLOps", "A/B Testing", "Statistical Modeling"],
    certifications: [
      cert("TensorFlow Developer Certificate", "Google", "2022"),
      cert("AWS Machine Learning - Specialty", "Amazon Web Services", "2021")
    ],
  }),

  apex: build({
    fullName: "Noah Scott",
    jobTitle: "VP of Engineering",
    email: "noah@apexlead.com",
    phone: "(555) 014-6601",
    location: "Denver, CO",
    linkedin: "linkedin.com/in/noahscott",
    website: "apexlead.com",
    summary: "VP of Engineering with 14 years of progressive technical leadership experience, from staff engineer through executive, at Series B through post-IPO technology companies. Expert at building high-performing engineering organizations, defining multi-year technical strategies, and aligning platform architecture to business objectives. Track record of improving engineering velocity, reducing incident rates, and growing senior engineers into leaders. Trusted partner to CTOs, CPOs, and boards on technical direction and engineering culture.",
    workExperience: [
      exp("Senior Software Engineer", "Ridgeline Technologies", "Denver, CO", "2011", "2015",
        "Backend lead for a real estate data and analytics platform processing 5M property records daily.",
        ["Designed a property data enrichment pipeline that increased data completeness from 62% to 94%.", "Improved system test coverage from near-zero to 75% through TDD advocacy and pair programming.", "Led incident response for three major outages, each with full root-cause analysis and systemic fixes that prevented recurrence."]),
      exp("Software Engineer", "Clearpath Software", "Boulder, CO", "2009", "2011",
        "Developed backend services and data pipelines for an early-stage SaaS startup.",
        ["Built core billing, user management, and reporting modules used by the product from launch through Series A.", "Shipped features across a full Django stack, including REST APIs, Celery background jobs, and PostgreSQL schemas."]),
    ],
    education: [
      edu("Colorado State University", "BS", "Computer Science", "2005", "2009", "3.85", "Dean's List — 6 semesters"),
    ],
    skills: ["Engineering Leadership", "Organizational Scaling", "Technical Strategy", "Platform Architecture", "Hiring & Team Building", "System Design"],
    certifications: [
      cert("AWS Solutions Architect - Professional", "Amazon Web Services", "2020"),
      cert("Certified Engineering Manager", "Plato", "2021"),
      cert("NACD Board Director Certification", "National Association of Corporate Directors", "2023"),
    ],
  }),

  pinnacle: build({
    fullName: "Catherine Wren",
    jobTitle: "Associate Partner, Strategy & Operations",
    email: "c.wren@example.com",
    phone: "(212) 555-0174",
    location: "New York, NY",
    linkedin: "linkedin.com/in/catherinewren",
    website: "catherinewren.com",
    summary: "Strategy and operations leader with 12 years of management consulting and corporate strategy experience across financial services, private equity, and healthcare. Track record of driving enterprise transformations, leading M&A integrations, and building the operating frameworks that enable organisations to execute at scale. Trusted adviser to C-suite and board stakeholders on cost restructuring, go-to-market strategy, and post-merger value capture.",
    workExperience: [
      exp("Associate Partner", "Meridian Group Consulting", "New York, NY", "2019", "Present",
        "Led end-to-end strategy engagements for Fortune 100 clients across financial services and healthcare.",
        ["Directed a $340M operating cost reduction programme for a Tier 1 bank, delivering 23% overhead reduction within 18 months.", "Led post-merger integration for a $2.1B healthcare services acquisition, achieving synergy targets six months ahead of schedule.", "Managed a team of 12 consultants across three simultaneous engagements with zero client escalations over four years.", "Presented quarterly progress and roadmap updates directly to C-suite and board audiences at four clients."]),
      exp("Senior Consultant", "Meridian Group Consulting", "New York, NY", "2015", "2019",
        "Delivered operational transformation and corporate strategy workstreams for mid-market and enterprise clients.",
        ["Built an enterprise-wide KPI framework for a global logistics company, adopted across 14 regional business units.", "Designed a pricing restructure that increased gross margin by 8 points for a $600M consumer products division.", "Mentored six analysts and junior consultants through structured feedback programmes and internal case coaching."]),
      exp("Analyst", "Landmark Advisory Partners", "Boston, MA", "2012", "2015",
        "Financial modelling and due diligence analysis for private equity deal teams.",
        ["Built full LBO and DCF models for eight portfolio company acquisitions totalling $3.4B in enterprise value.", "Produced industry analysis and management presentation materials for three successful IPO processes."]),
    ],
    education: [
      edu("Harvard Business School", "MBA", "Business Administration", "2010", "2012", "", "Baker Scholar (top 5%)"),
      edu("Princeton University", "BA", "Economics — Concentration in Finance", "2006", "2010", "3.92", "Phi Beta Kappa"),
    ],
    skills: ["Corporate Strategy", "M&A Integration", "Operating Model Design", "Financial Modelling", "Stakeholder Management", "Team Leadership"],
    certifications: [
      cert("Chartered Financial Analyst (CFA)", "CFA Institute", "2014"),
      cert("Project Management Professional (PMP)", "PMI", "2017"),
    ],
  }),

  vector: build({
    fullName: "Aiden Park",
    jobTitle: "Principal Software Engineer",
    email: "aiden.park@example.com",
    phone: "(415) 555-0288",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/aidenpark",
    website: "aidenpark.dev",
    summary: "Principal software engineer with 13 years of experience designing and shipping large-scale distributed systems at Google, Amazon, and high-growth startups. Deep expertise in systems architecture, platform reliability, and developer experience. Known for owning complex technical problems end-to-end — from design doc through production rollout — and for raising the engineering bar on every team I've joined. Frequent tech-talk speaker and open-source contributor with 3.4K GitHub stars.",
    workExperience: [
      exp("Principal Software Engineer", "Amplitude Inc.", "Seattle, WA", "2020", "Present",
        "Technical lead for the data ingestion and query execution platform, handling 800B events per month.",
        ["Redesigned the query execution engine with a vectorised evaluation model, reducing p99 query latency by 61%.", "Architected a multi-region active-active ingestion pipeline processing 9M events/second at 99.995% availability.", "Defined the technical roadmap for the platform team and drove alignment across seven engineering squads.", "Reduced oncall incident load by 74% through proactive failure-mode analysis and automated remediation playbooks."]),
      exp("Senior Software Engineer", "Amazon Web Services", "Seattle, WA", "2015", "2020",
        "Senior engineer on the AWS DynamoDB storage engine team.",
        ["Designed and shipped auto-scaling storage partitioning, adopted by 200K+ customers within six months of launch.", "Led root-cause investigation for a region-wide availability event and implemented three systemic architectural fixes.", "Grew two L4 engineers to L5 through structured mentoring, code reviews, and design doc collaboration."]),
      exp("Software Engineer", "Google", "Mountain View, CA", "2011", "2015",
        "Engineer on the Google Search indexing infrastructure team.",
        ["Contributed to a distributed index compaction system processing 25PB of crawl data per day.", "Implemented a segment-aware cache eviction policy that improved cache hit rate by 18% across 40K servers."]),
    ],
    education: [
      edu("Stanford University", "MS", "Computer Science — Systems", "2009", "2011", "4.0", "Graduate Excellence Award"),
      edu("UC San Diego", "BS", "Computer Science & Mathematics", "2005", "2009", "3.96", "Summa Cum Laude"),
    ],
    skills: ["Distributed Systems", "Go & Rust", "C++ & Java", "Database Internals", "System Design", "Site Reliability Engineering"],
    certifications: [
      cert("Google Cloud Professional Data Engineer", "Google Cloud", "2023"),
      cert("AWS Solutions Architect — Professional", "Amazon Web Services", "2022"),
      cert("CKA: Certified Kubernetes Administrator", "CNCF", "2021"),
    ],
  }),
};
