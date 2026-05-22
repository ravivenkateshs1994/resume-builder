# ResumeAI — AI-Powered Resume Builder

A full-stack resume builder that uses Google Gemini AI to generate professional content, tailor resumes to job descriptions, and analyze skill gaps with personalized learning recommendations.

---

## Features

- **AI Content Generation** — Generates polished bullet points and professional summaries from your raw input
- **Resume Upload** — Upload a PDF or DOCX and AI extracts and pre-fills all your information
- **ATS Tailoring** — Paste a job description to get a keyword-optimized resume with an ATS match score
- **Gap Analyzer** — Compare your resume to any job description, see missing skills by priority, and get curated learning resources for each gap
- **12 Professional Templates** — Modern, Classic, Creative, Minimal, Executive, and more
- **PDF & DOCX Export** — Download your finished resume in any format
- **Persistent State** — Resume data is saved to localStorage so you never lose your work

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (with persistence) |
| AI | Google Gemini (`gemini-2.0-flash-lite`) |
| Rich Text | Tiptap |
| PDF Export | Puppeteer / jsPDF / html2canvas |
| DOCX Export | docx.js |
| Resume Parsing | pdf-parse + mammoth |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
git clone https://github.com/ravivenkateshs1994/resume-builder.git
cd resume-builder
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── create/page.tsx           # Resume builder (multi-step form)
│   ├── gap-analysis/page.tsx     # Gap analyzer page
│   └── api/
│       ├── generate/route.ts     # AI content generation
│       ├── tailor/route.ts       # ATS resume tailoring
│       ├── parse/route.ts        # Resume file parsing
│       ├── gap-analysis/route.ts # Gap analysis
│       └── export/
│           ├── pdf/route.ts      # PDF export
│           └── docx/route.ts     # DOCX export
├── components/
│   ├── steps/                    # Form steps (Personal, Experience, Education, Skills, Preview)
│   └── templates/                # Resume templates
├── store/resumeStore.ts          # Zustand store
├── lib/
│   ├── openai.ts                 # Gemini AI client
│   └── templateTheme.ts         # Template accent colors
└── types/resume.ts               # TypeScript types
```

---

## Gap Analyzer Flow

1. Paste a job description on the `/gap-analysis` page
2. AI compares it against your resume and returns an ATS match score + prioritized gaps
3. For each gap, choose:
   - **"Yes, I know this"** → Prompted to add it to your resume (links directly to Skills or Experience step)
   - **"Show me how to learn"** → AI-curated learning resources from Coursera, YouTube, Udemy, official docs, etc.

---

## License

MIT
