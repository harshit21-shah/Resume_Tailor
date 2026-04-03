interface Props {
  value: string;
  onChange: (v: string) => void;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagePaste?: (file: File) => void;
  isOcrLoading?: boolean;
}

export default function JDPanel({ value, onChange, onImageUpload, onImagePaste, isOcrLoading }: Props) {
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!onImagePaste) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          onImagePaste(file);
          e.preventDefault();
        }
      }
    }
  };

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Job Description</span>
        {onImageUpload && (
          <div>
            <input 
              type="file" 
              id="jd-image-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={onImageUpload} 
              disabled={isOcrLoading}
            />
            <label 
              htmlFor="jd-image-upload" 
              className={`text-xs font-medium px-3 py-1 rounded-md border border-gray-300 bg-white cursor-pointer transition-colors ${isOcrLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              {isOcrLoading ? 'Extracting text...' : 'OCR from Image'}
            </label>
          </div>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste the full job description here (text or screenshot)..."
        className="flex-1 p-4 text-sm text-gray-800 resize-none outline-none bg-white leading-relaxed"
        style={{ minHeight: '360px' }}
      />
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">{value.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
