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
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [fileId, setFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const { uploadResumeFile, ocrJD, tailor, downloadFile, loading, error, setError, result } = useTailor();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const data = await uploadResumeFile(file);
      setFileId(data.file_id);
      setResume(data.text);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const processJDImage = async (file: File) => {
    try {
      setOcrLoading(true);
      setError(null);
      const data = await ocrJD(file);
      setJd(data.text);
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from image');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleJDImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processJDImage(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = () => {
    if (resume.trim() && jd.trim()) {
      tailor({ resume, job_description: jd });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Tailor your resume</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paste a job description — Groq AI surgically modifies summary, skills, and phrasing to match the role
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <ResumePanel value={resume} onChange={setResume} onFileUpload={handleFileUpload} isUploading={uploading} />
          <JDPanel 
            value={jd} 
            onChange={setJd} 
            onImageUpload={handleJDImageUpload} 
            onImagePaste={processJDImage}
            isOcrLoading={ocrLoading} 
          />
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleSubmit}
            disabled={loading || !resume.trim() || !jd.trim()}
            className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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

        {result && <OutputPanel result={result} downloadFile={async (type, reps) => {
          if (fileId) {
            await downloadFile(type, fileId, reps);
          } else {
            alert("No valid uploaded template found. File downloads require uploading a PDF/DOCX file first.");
          }
        }} />}
      </main>
    </div>
  );
}
