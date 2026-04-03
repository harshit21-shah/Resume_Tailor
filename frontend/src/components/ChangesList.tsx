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
