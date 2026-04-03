# Resume Tailor

AI-powered resume tailoring tool that surgically rewrites your resume to match a job description — improving ATS score and keyword alignment without fabricating experience.

Built with FastAPI + Groq (Llama 3.3 70B) on the backend and React + TypeScript + Tailwind on the frontend.

## Features

- Paste or upload your resume (PDF / DOCX)
- Paste or OCR a job description (text or screenshot)
- AI rewrites summary, skills, and bullet phrasing to match the JD
- Shows ATS match score, matched keywords, and what changed
- Download the tailored resume as a formatted DOCX or PDF

## Stack

- **Backend**: FastAPI, Groq API, python-docx, pdfplumber, pdf2docx, docx2pdf
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Infra**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker & Docker Compose
- A [Groq API key](https://console.groq.com)

### Setup

1. Clone the repo and copy the env file:
   ```bash
   cp .env.example .env
   ```

2. Add your Groq API key to `.env`:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. Start with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Local Dev (without Docker)

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Upload your resume PDF/DOCX or paste the text
2. Paste the job description — or use "OCR from Image" to extract text from a screenshot
3. Click **Tailor Resume**
4. Review the changes and ATS score in the output panel
5. Download as DOCX or PDF

> Note: PDF download requires LibreOffice or Microsoft Word installed on the server for conversion via `docx2pdf`.

## Project Structure

```
├── backend/
│   ├── main.py          # FastAPI app — upload, tailor, generate endpoints
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/  # ResumePanel, JDPanel, OutputPanel, ChangesList, Navbar
│       ├── hooks/       # useTailor — API calls and state
│       └── types/       # Shared TypeScript interfaces
├── docker-compose.yml
└── .env.example
```
