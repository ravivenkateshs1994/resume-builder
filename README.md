# Career Readiness - AI-Powered Resume Builder

A full-stack resume builder that uses OpenRouter free models to generate professional content, tailor resumes to job descriptions, analyze skill gaps, and recommend role-specific jobs.

---

## Features

- AI content generation with OpenRouter using task-specific free models
- Resume upload and parsing for PDF and DOCX files
- ATS tailoring with keyword optimization and match scoring
- Gap analysis with prioritized recommendations and learning paths
- Role-based job feed for fresher and experienced users
- Live location-aware job listings via Adzuna, with Supabase and bundled fallback data
- 12 professional templates
- PDF and DOCX export
- Persistent local state

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| AI | OpenRouter free models (`deepseek/deepseek-chat:free`, `qwen/qwen3-32b:free`, `meta-llama/llama-4-maverick:free`) |
| Rich Text | Tiptap |
| PDF Export | Puppeteer / jsPDF / html2canvas |
| DOCX Export | docx.js |
| Resume Parsing | pdf-parse + mammoth |
| Backend | Supabase |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenRouter API key](https://openrouter.ai/settings/keys)

### Installation

```bash
git clone https://github.com/ravivenkateshs1994/resume-builder.git
cd resume-builder
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=qwen/qwen3-32b:free
FEATURE_PREMIUM_TEMPLATES=off
NEXT_PUBLIC_FEATURE_PREMIUM_TEMPLATES=off
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_ATS_MODEL=deepseek/deepseek-chat:free
OPENROUTER_GAP_ANALYSIS_MODEL=deepseek/deepseek-chat:free
OPENROUTER_RESUME_INTELLIGENCE_MODEL=deepseek/deepseek-chat:free
OPENROUTER_CAREER_COPILOT_MODEL=qwen/qwen3-32b:free
OPENROUTER_ROADMAP_MODEL=qwen/qwen3-32b:free
OPENROUTER_INTERVIEW_MODEL=qwen/qwen3-32b:free
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-4-maverick:free
```

The app now routes ATS analysis, gap analysis, and resume intelligence through DeepSeek V3, general career copilot content through Qwen 3 32B, and falls back to Llama 4 Maverick if the primary request fails. You can still override each role-specific model in `.env.local` if you want to test a different free variant later.

To enable live job listings, add:

```env
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
ADZUNA_DEFAULT_COUNTRY=us
```

When configured, the job feed searches Adzuna by keyword and location, then merges those live listings with your database and bundled fallback jobs. Adzuna listings should be acknowledged in the UI where they are displayed.

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
│   ├── page.tsx
│   ├── create/page.tsx
│   ├── jobs/page.tsx
│   ├── gap-analysis/page.tsx
│   └── api/
│       ├── generate/route.ts
│       ├── tailor/route.ts
│       ├── parse/route.ts
│       ├── gap-analysis/route.ts
│       └── jobs/
│           ├── recommendations/route.ts
│           ├── saved/route.ts
│           └── track/route.ts
├── components/
│   ├── steps/
│   ├── templates/
│   └── jobs/
├── data/
├── lib/
│   ├── openai.ts
│   ├── candidate-profile.ts
│   ├── job-feed.ts
│   └── job-matching.ts
├── store/
└── types/
```

---

## Database

The Supabase schema includes:

- `profiles` for user metadata and career stage
- `user_resumes` for saved resume snapshots
- `user_analysis` for saved job analysis results
- `job_listings` for job feed records
- `saved_jobs` for saved job cards
- `job_interactions` for job clicks and tailoring events

Run the migrations in `supabase/migrations/` to keep your database aligned.

---

## Notes

- Freshers see internships, apprenticeships, and entry-level roles first.
- Experienced users see full-time roles ranked by skill, experience, title, and location fit.
- The job feed can use Adzuna live listings first, then database-backed listings, and finally the bundled seed listings as a fallback.
- Job location auto-fill tries browser geolocation first, reverse-geocodes the coordinates, and falls back to an approximate IP-based lookup if needed.
