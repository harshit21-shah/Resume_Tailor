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
