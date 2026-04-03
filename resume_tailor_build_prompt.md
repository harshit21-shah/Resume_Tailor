# Resume Tailor Agent — Complete Build Prompt for Trae AI

## What You Are Building

A full-stack web application called **Resume Tailor Agent**. The user pastes their resume and a job description. The app uses Claude AI to surgically tailor the resume for that specific role — modifying only the Profile Summary, Skills section, and bullet phrasing to match JD keywords. It never changes dates, company names, titles, or fabricates experience.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI + Python 3.11
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Containerization**: Docker + Docker Compose

---

## Project Structure

```
resume-tailor/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResumePanel.tsx
│   │   │   ├── JDPanel.tsx
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── ChangesList.tsx
│   │   │   └── Navbar.tsx
│   │   ├── hooks/
│   │   │   └── useTailor.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Backend — FastAPI

### `backend/requirements.txt`
```
fastapi==0.111.0
uvicorn==0.30.0
anthropic==0.28.0
python-dotenv==1.0.1
pydantic==2.7.0
```

### `backend/main.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

app = FastAPI(title="Resume Tailor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class TailorRequest(BaseModel):
    resume: str
    job_description: str


class Change(BaseModel):
    section: str
    description: str


class TailorResponse(BaseModel):
    tailored_resume: str
    changes: list[Change]
    match_score: int
    matched_keywords: list[str]
    missing_keywords: list[str]


SYSTEM_PROMPT = """You are an expert ATS resume optimizer and career coach with deep knowledge of how applicant tracking systems parse resumes.

Your job is to surgically tailor a candidate's resume to match a specific job description — improving ATS score and keyword alignment without fabricating any experience.

STRICT RULES:
1. NEVER change: candidate name, contact info, dates, company names, job titles, university name, degree name, publication text, achievement names
2. DO modify:
   - Profile Summary: Completely rewrite to mirror the JD's language, tone, and key requirements. Lead with the most relevant skills the candidate has that match the JD.
   - Skills section: Reorder skills to surface the most JD-relevant ones first. Add skills from the JD that the candidate genuinely demonstrates in their experience bullets (even if not explicitly listed). Never add skills with no evidence.
   - Experience bullets: Swap synonyms to match JD keywords (e.g. "built" → "developed", "designed" → "architected"). Reorder bullet emphasis to highlight JD-relevant aspects first. Do not change core technical facts or metrics.
   - Project bullets: Same rules as experience bullets.
3. Keep identical document structure and formatting
4. Be subtle — changes should feel natural, not keyword-stuffed
5. The tailored resume must be honest and 100% defensible in an interview"""

USER_PROMPT_TEMPLATE = """RESUME:
{resume}

JOB DESCRIPTION:
{job_description}

Analyze the JD carefully. Identify the top keywords, required skills, and tone. Then tailor the resume.

Respond with ONLY a valid JSON object in this exact structure (no markdown fences, no explanation before or after):
{{
  "tailored_resume": "the complete tailored resume as a string with \\n for newlines",
  "changes": [
    {{"section": "Profile Summary", "description": "Specific description of what changed and why it matches the JD"}},
    {{"section": "Skills", "description": "Specific description of what was reordered or added"}},
    {{"section": "Actorius bullet 2", "description": "Specific description of phrasing change"}}
  ],
  "match_score": 78,
  "matched_keywords": ["keyword1", "keyword2", "keyword3"],
  "missing_keywords": ["keyword4", "keyword5"]
}}

match_score should be an integer 0-100 representing ATS alignment after tailoring.
matched_keywords: top 8 JD keywords present in the tailored resume.
missing_keywords: up to 5 important JD keywords the candidate genuinely cannot claim."""


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/tailor", response_model=TailorResponse)
def tailor_resume(req: TailorRequest):
    if not req.resume.strip():
        raise HTTPException(status_code=400, detail="Resume cannot be empty")
    if not req.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")
    if len(req.resume) > 8000:
        raise HTTPException(status_code=400, detail="Resume too long (max 8000 chars)")
    if len(req.job_description) > 5000:
        raise HTTPException(status_code=400, detail="Job description too long (max 5000 chars)")

    prompt = USER_PROMPT_TEMPLATE.format(
        resume=req.resume,
        job_description=req.job_description
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Try extracting JSON object
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            parsed = json.loads(match.group(0))
        else:
            raise HTTPException(status_code=500, detail="Failed to parse AI response")

    return TailorResponse(
        tailored_resume=parsed.get("tailored_resume", ""),
        changes=[Change(**c) for c in parsed.get("changes", [])],
        match_score=parsed.get("match_score", 0),
        matched_keywords=parsed.get("matched_keywords", []),
        missing_keywords=parsed.get("missing_keywords", [])
    )
```

### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

## Frontend — React + TypeScript + Tailwind

### `frontend/src/types/index.ts`
```typescript
export interface Change {
  section: string;
  description: string;
}

export interface TailorResponse {
  tailored_resume: string;
  changes: Change[];
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
}

export interface TailorRequest {
  resume: string;
  job_description: string;
}
```

### `frontend/src/hooks/useTailor.ts`
```typescript
import { useState } from 'react';
import { TailorRequest, TailorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useTailor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResponse | null>(null);

  const tailor = async (req: TailorRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `Request failed: ${res.status}`);
      }

      const data: TailorResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return { tailor, loading, error, result };
}
```

### `frontend/src/components/Navbar.tsx`
```typescript
export default function Navbar() {
  return (
    <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">RT</span>
        </div>
        <span className="font-medium text-gray-900 text-sm">Resume Tailor</span>
      </div>
      <span className="text-xs text-gray-400">Powered by Groq AI</span>
    </nav>
  );
}
```

### `frontend/src/components/ResumePanel.tsx`
```typescript
interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ResumePanel({ value, onChange }: Props) {
  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your Resume</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste your resume text here..."
        className="flex-1 p-4 text-sm font-mono text-gray-800 resize-none outline-none bg-white leading-relaxed"
        style={{ minHeight: '360px' }}
      />
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">{value.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
```

### `frontend/src/components/JDPanel.tsx`
```typescript
interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function JDPanel({ value, onChange }: Props) {
  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Job Description</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste the full job description here..."
        className="flex-1 p-4 text-sm text-gray-800 resize-none outline-none bg-white leading-relaxed"
        style={{ minHeight: '360px' }}
      />
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">{value.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
```

### `frontend/src/components/ChangesList.tsx`
```typescript
import { Change } from '../types';

interface Props {
  changes: Change[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function ChangesList({ changes, matchedKeywords, missingKeywords }: Props) {
  return (
    <div className="space-y-4">
      {/* Keywords */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-green-100 bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-2">Matched Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map((kw, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">{kw}</span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Cannot Claim</p>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.length === 0
              ? <span className="text-xs text-amber-600">None — great alignment!</span>
              : missingKeywords.map((kw, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{kw}</span>
                ))
            }
          </div>
        </div>
      </div>

      {/* Changes */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">What Changed</p>
        <div className="space-y-2">
          {changes.map((c, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">{c.section}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">modified</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### `frontend/src/components/OutputPanel.tsx`
```typescript
import { useState } from 'react';
import { TailorResponse } from '../types';
import ChangesList from './ChangesList';

interface Props {
  result: TailorResponse;
}

export default function OutputPanel({ result }: Props) {
  const [tab, setTab] = useState<'resume' | 'changes'>('resume');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result.tailored_resume).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const scoreColor =
    result.match_score >= 80 ? 'text-green-700 bg-green-50 border-green-200' :
    result.match_score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-red-700 bg-red-50 border-red-200';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-1">
          {(['resume', 'changes'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                tab === t ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t === 'resume' ? 'Tailored Resume' : `What Changed (${result.changes.length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${scoreColor}`}>
            ATS Score: {result.match_score}%
          </span>
          {tab === 'resume' && (
            <button
              onClick={copy}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === 'resume' ? (
          <pre className="text-sm text-gray-800 font-mono leading-relaxed whitespace-pre-wrap">
            {result.tailored_resume}
          </pre>
        ) : (
          <ChangesList
            changes={result.changes}
            matchedKeywords={result.matched_keywords}
            missingKeywords={result.missing_keywords}
          />
        )}
      </div>
    </div>
  );
}
```

### `frontend/src/App.tsx`
```typescript
import { useState } from 'react';
import Navbar from './components/Navbar';
import ResumePanel from './components/ResumePanel';
import JDPanel from './components/JDPanel';
import OutputPanel from './components/OutputPanel';
import { useTailor } from './hooks/useTailor';

const DEFAULT_RESUME = `Harshit Shah
Pune, India • shahharshit777@gmail.com • +91-8275566293 • LinkedIn • GitHub

PROFILE SUMMARY
AI Engineer with experience of building and shipping production-grade AI systems spanning LLM applications, RAG pipelines and NL2SQL interfaces. Experienced in fine-tuning, prompt engineering, and deploying end-to-end ML solutions that solve real-world problems. Published researcher with a track record of measurable impact across multiple products.

EDUCATION
MIT ADT University, Pune, India | Aug 2021 - Jul 2025
B.Tech in Biomedical Engineering

SKILLS
Technical : Machine Learning, LLM Fine-tuning, RAG, NL2SQL, Prompt Engineering, MLOps, Agentic AI
AI / ML : PyTorch, TensorFlow, Keras, Scikit-learn, Hugging Face, LangChain, LangGraph, OpenCV, FastAPI
Languages / Tools : Python, SQL, Java, TypeScript, React, Pinecone, Vector Databases, Docker, AWS, Git/GitHub, CrewAI

PROFESSIONAL EXPERIENCE
Actorius Innovations and Research – Pune | Oct 2025 – Mar 2026
AI Engineer
• Engineered a production-deployed WhatsApp AI assistant using LLM + RAG, supporting multi-turn FAQ resolution, automated test booking, and intelligent live-agent escalation for real users at production scale.
• Built a desktop CTC analysis application that processes .czi (Carl Zeiss) microscopy files through a marker-first pipeline, automating fluorescence channel parsing, cell segmentation, and multi-class classification.
• Designed an NL2SQL system using a fine-tuned transformer with schema-aware prompting, enabling the clinical team to query structured patient datasets in plain English without any SQL knowledge.

1Cell.Ai - Pune | Jul 2025 - Oct 2025
Machine Learning Engineer
• Built a document intelligence pipeline processing 500+ oncology PDFs/month using PyPDF2 and pdfplumber with 12+ regex patterns for genomic entity extraction (SNVs, CNVs, fusions, VAF, MSI, TMB, HRD), achieving 95% accuracy and 3x throughput via parallel processing.

1Cell.Ai - Pune | Jan 2025 - Jun 2025
Project Intern
• Automated CTC image analysis using ImageJ macros, Java plugins, and Bio-Formats integration, achieving a 140x performance improvement from 7 minutes to 3 seconds per sample; published findings in ESMO Open (2025).

Bioinformatics Centre, SPPU - Pune | Jul 2024 - Sep 2024
Research Intern
• Performed DESeq2 differential expression analysis on 522 TCGA RNA-seq samples, identified 117 DEGs, and surfaced 10 hub gene biomarker candidates via Cytoscape PPI network analysis, validated across 9,736 samples on GEPIA.

PROJECTS
TrendSense — Multi-Agent Market Intelligence Platform
• Architected a multi-agent market intelligence platform using LangGraph StateGraph, orchestrating a parallelized Fetcher → Sentiment → Synthesis → RAG-Validation pipeline that concurrently ingests 10,000+ signals from Reddit, HackerNews, and NewsAPI via Python asyncio.
• Built a self-correcting RAG agent backed by ChromaDB that fact-checks LLM-generated trend summaries against historical vector embeddings, preventing hallucinations and filtering already-mainstream signals — powered by Groq (Llama 3.3) for low-latency inference.
• Developed a custom S-TVS (Sentiment-Adjusted Trend Velocity Score) algorithm using a dual-model sentiment engine (VADER + TextBlob); served results via FastAPI SSE-streaming backend with a React 18 + TypeScript + Tailwind dashboard featuring real-time Recharts sparklines.

PUBLICATIONS
Bhosale, B., Shah, H., et al. (2025). Profiling of PD-L1 and HER2 overexpression on cancer cells using AI-based macro-driven automation. ESMO Open, 10(3), 105588.

ACHIEVEMENTS
• Finalist, NABARD Rural Innovation Hackathon (2024).`;

export default function App() {
  const [resume, setResume] = useState(DEFAULT_RESUME);
  const [jd, setJd] = useState('');
  const { tailor, loading, error, result } = useTailor();

  const handleSubmit = () => {
    if (resume.trim() && jd.trim()) {
      tailor({ resume, job_description: jd });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Tailor your resume</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paste a job description — Groq AI surgically modifies summary, skills, and phrasing to match the role
          </p>
        </div>

        {/* Input grid */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <ResumePanel value={resume} onChange={setResume} />
          <JDPanel value={jd} onChange={setJd} />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleSubmit}
            disabled={loading || !resume.trim() || !jd.trim()}
            className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analysing and tailoring...
              </span>
            ) : 'Tailor Resume'}
          </button>

          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}

          {result && !loading && (
            <span className="text-sm text-gray-500">
              {result.changes.length} change{result.changes.length !== 1 ? 's' : ''} made · ATS score: <strong className="text-gray-900">{result.match_score}%</strong>
            </span>
          )}
        </div>

        {/* Output */}
        {result && <OutputPanel result={result} />}
      </main>
    </div>
  );
}
```

### `frontend/src/main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `frontend/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

textarea {
  font-family: inherit;
}
```

### `frontend/package.json`
```json
{
  "name": "resume-tailor",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1"
  }
}
```

### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

### `frontend/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

### `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

### `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
```

---

## Docker Compose

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./backend:/app
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped
```

### `.env.example`
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

---

## Setup & Run

```bash
# 1. Clone / create project directory
mkdir resume-tailor && cd resume-tailor

# 2. Create .env
cp .env.example .env
# Add your Anthropic API key to .env

# 3. Run with Docker
docker-compose up --build

# OR run locally without Docker:

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Frontend:** http://localhost:3000
**Backend API docs:** http://localhost:8000/docs

---

## Features Summary

| Feature | Details |
|---|---|
| Resume pre-loaded | Harshit's resume is default in the textarea |
| JD input | Free text paste |
| Tailoring engine | Claude Sonnet — rewrites summary, reorders skills, rephrases bullets |
| ATS Score | 0–100 score shown after tailoring |
| Matched keywords | Green badges showing JD keywords present in resume |
| Missing keywords | Amber badges showing JD keywords candidate cannot claim |
| What changed tab | Every modification explained with section + reason |
| Copy button | One-click copy of full tailored resume |
| Character counters | Live count in both input panels |

---

## What Claude Changes vs What It Never Touches

**CHANGES:**
- Profile Summary — full rewrite mirroring JD language
- Skills order — most JD-relevant skills surfaced first
- Bullet phrasing — synonym swaps to match JD keywords
- Bullet emphasis — most relevant aspects moved to front

**NEVER TOUCHES:**
- Name, email, phone, LinkedIn, GitHub
- All dates (employment, education)
- Company names and job titles
- University, degree name
- Publication text and DOI
- Metrics and numbers in bullets
- Achievement names
