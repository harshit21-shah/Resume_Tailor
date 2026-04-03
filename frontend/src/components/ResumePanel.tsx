interface Props {
  value: string;
  onChange: (v: string) => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export default function ResumePanel({ value, onChange, onFileUpload, isUploading }: Props) {
  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your Resume</span>
        {onFileUpload && (
          <div>
            <input 
              type="file" 
              id="resume-upload" 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={onFileUpload} 
              disabled={isUploading}
            />
            <label 
              htmlFor="resume-upload" 
              className={`text-xs font-medium px-3 py-1 rounded-md border border-gray-300 bg-white cursor-pointer transition-colors ${isUploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              {isUploading ? 'Parsing text...' : 'Upload PDF / DOCX'}
            </label>
          </div>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste your resume text here, or upload a PDF / DOCX above..."
        className="flex-1 p-4 text-sm font-mono text-gray-800 resize-none outline-none bg-white leading-relaxed"
        style={{ minHeight: '360px' }}
      />
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">{value.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
