import { useRef } from 'react'

function IconImageUpload({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      <path d="M19 16v6" />
      <path d="m16 19 3-3 3 3" />
    </svg>
  )
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="h-screen bg-[#111112] text-zinc-200 flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-6 shrink-0">
        <span className="text-sm font-semibold tracking-tight text-white/90">ImageFlow</span>
      </header>

      <div className="flex items-center px-6 py-3 border-b border-white/[0.06] shrink-0">
        <button 
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3.5 h-9 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-medium hover:bg-emerald-500/15 transition-colors"
        >
          <IconImageUpload />
          Upload images
        </button>
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" />
      </div>

      <main className="flex-1 p-6" />
    </div>
  )
}