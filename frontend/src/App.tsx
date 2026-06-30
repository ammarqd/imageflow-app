import { useState, useCallback, useEffect, useRef } from 'react'
import { BalancedMasonryGrid, Frame } from '@masonry-grid/react'
import { api } from './services/api'
import type { Job } from './types'

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

function GalleryImageCard({ job, onRemove }: { job: Job; onRemove: (id: number) => void }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const imgUrl = api.getOutputUrl(job.output_filename!)

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-white/[0.04] shadow-md group h-full">
      <img
        src={imgUrl}
        alt={job.original_filename}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <button
        onClick={() => onRemove(job.id)}
        className="absolute top-2 right-2 bg-black/60 text-white/70 hover:text-emerald-400 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const jobsRef = useRef(jobs)

  const completedCount = jobs.filter(j => j.status === 'completed').length

  useEffect(() => { jobsRef.current = jobs }, [jobs])

  useEffect(() => {
    const interval = setInterval(async () => {
      const active = jobsRef.current.filter(j => j.status === 'pending' || j.status === 'processing')
      if (active.length === 0) return
      const updated = await api.getJobs(active.map(j => j.id))
      setJobs(prev => prev.map(j => updated.find(u => u.id === j.id) ?? j))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    const newJobs = await api.uploadImages(files)
    setJobs(prev => [...newJobs, ...prev])
  }, [])

  return (
    <div className="h-screen bg-[#111112] text-zinc-200 flex flex-col">
      <header className="h-12 border-b border-white/[0.06] flex items-center px-6 shrink-0">
        <span className="text-sm font-semibold tracking-tight text-white/90">ImageFlow</span>
      </header>

      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] shrink-0">
        <button 
          onClick={() => inputRef.current?.click()} 
          className="flex items-center gap-2 px-3.5 h-9 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-medium hover:bg-emerald-500/15 transition-colors"
        >
          <IconImageUpload /> Upload images
        </button>
        <input 
          ref={inputRef} 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => { 
            const f = Array.from(e.target.files ?? []); 
            if (f.length) handleFiles(f); 
            e.target.value = '' 
          }} 
        />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 tabular-nums">
          {completedCount} optimised / {jobs.length} total
        </span>
      </div>

      <main 
        className="flex-1 overflow-y-auto p-6" 
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }} 
        onDragLeave={() => setDragging(false)} 
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files)) }}
      >
        {jobs.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl ${dragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800'}`}>
            <p className="text-zinc-500 text-sm">Drag and drop images here</p>
          </div>
        ) : (
          <BalancedMasonryGrid frameWidth={200} gap={16}>
            {jobs.filter(j => j.status === 'completed').map(job => (
              <Frame key={job.id} width={job.width!} height={job.height!}>
                <GalleryImageCard job={job} onRemove={(id) => setJobs(prev => prev.filter(j => j.id !== id))} />
              </Frame>
            ))}
          </BalancedMasonryGrid>
        )}
      </main>
    </div>
  )
}