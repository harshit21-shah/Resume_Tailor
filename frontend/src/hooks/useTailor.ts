import { useState } from 'react';
import { TailorRequest, TailorResponse, Replacement } from '../types';

const API_URL = '/api';

export function useTailor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResponse | null>(null);

  const uploadResumeFile = async (file: File): Promise<{ file_id: string, text: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return await res.json();
  };

  const ocrJD = async (file: File): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/ocr-jd`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'OCR failed');
    }
    return await res.json();
  };

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

  const downloadFile = async (type: 'pdf' | 'docx', file_id: string, replacements: Replacement[]) => {
    try {
      const res = await fetch(`${API_URL}/generate-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id, replacements }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      if (!data.url) throw new Error('No download URL returned');
      
      const link = document.createElement('a');
      link.href = `${API_URL}${data.url}`;
      // Explicitly label the download with the extension to force browser compliance
      link.setAttribute('download', `Tailored_Resume.${type}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (e: any) {
      alert(e.message || 'Download failed');
    }
  };

  return { uploadResumeFile, ocrJD, tailor, downloadFile, loading, error, setError, result };
}
