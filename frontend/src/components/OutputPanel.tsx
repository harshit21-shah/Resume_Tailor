import { useState } from 'react';
import { TailorResponse, Replacement } from '../types';
import ChangesList from './ChangesList';

interface Props {
  result: TailorResponse;
  downloadFile: (type: 'pdf' | 'docx', replacements: Replacement[]) => Promise<void>;
}

export default function OutputPanel({ result, downloadFile }: Props) {
  const [tab, setTab] = useState<'resume' | 'changes'>('resume');
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result.tailored_resume).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    await downloadFile('pdf', result.replacements);
    setIsDownloadingPdf(false);
  };
  
  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    await downloadFile('docx', result.replacements);
    setIsDownloadingDocx(false);
  };

  const scoreColor =
    result.match_score >= 80 ? 'text-green-700 bg-green-50 border-green-200' :
    result.match_score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-red-700 bg-red-50 border-red-200';

  const renderHighlightedResume = (text: string, replacements: Replacement[]) => {
    let elements: (string | JSX.Element)[] = [text];

    replacements.forEach((rep, i) => {
      if (!rep.new || rep.new.trim() === '') return;
      const newElements: (string | JSX.Element)[] = [];
      elements.forEach(el => {
        if (typeof el === 'string') {
          const parts = el.split(rep.new);
          parts.forEach((part, index) => {
            newElements.push(part);
            if (index < parts.length - 1) {
              newElements.push(<mark key={`${i}-${index}`} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">{rep.new}</mark>);
            }
          });
        } else {
          newElements.push(el);
        }
      });
      elements = newElements;
    });

    return elements;
  };

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
          <button
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="text-xs px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors font-medium ml-2"
            >
              {isDownloadingDocx ? 'Generating DOCX...' : 'Download Formatted DOCX'}
          </button>
          <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="text-xs px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 rounded-md hover:bg-rose-100 transition-colors font-medium"
            >
              {isDownloadingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}
          </button>
          {tab === 'resume' && (
            <button
              onClick={copy}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors font-medium ml-2"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === 'resume' ? (
          <div className="text-sm text-gray-800 font-mono leading-relaxed whitespace-pre-wrap">
            {renderHighlightedResume(result.tailored_resume, result.replacements)}
          </div>
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
