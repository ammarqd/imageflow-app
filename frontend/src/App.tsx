import { useState, useCallback, useEffect, useRef } from 'react'
import { BalancedMasonryGrid, Frame } from '@masonry-grid/react'
import { api } from './services/api'
import type { Job } from './types'

type TransformType = 'webp' | 'crop' | 'rembg'

const TRANSFORM_LABELS: Record<TransformType, string> = {
  webp: 'WebP Optimisation',
  crop: 'Smart Crop',
  rembg: 'Remove Background',
}

const BTN_BASE =
  'flex items-center gap-1.5 text-label px-3.5 h-9 text-fg border border-border rounded-control bg-surface/30 hover:bg-surface transition-colors cursor-pointer'

function IconCheck() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconImageUpload({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      <path d="M19 16v6" />
      <path d="m16 19 3-3 3 3" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function GalleryImageCard({ job, onRemove }: { job: Job; onRemove: (id: number) => void }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const imgUrl = api.getOutputUrl(job.output_filename!)

  return (
    <div className="relative rounded-xl overflow-hidden bg-bg border border-border shadow-md group h-full">
      <img
        src={imgUrl}
        alt={job.original_filename}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {isLoaded && (
        <button
          onClick={() => onRemove(job.id)}
          className="absolute top-2 right-2 bg-bg/60 text-fg-muted hover:text-accent rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hasUploaded, setHasUploaded] = useState(false)
  const [transformType, setTransformType] = useState<TransformType>('webp')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const jobsRef = useRef(jobs)

  const completedCount = jobs.filter(j => j.status === 'completed').length
  const totalCount = jobs.length

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
    setUploading(true)
    setHasUploaded(true)
    try {
      const newJobs = await api.uploadImages(files)
      setJobs(prev => [...newJobs, ...prev])
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }, [])

  const completed = jobs.filter(j => j.status === 'completed' && j.width && j.height)

  const handleReset = () => {
    setJobs([])
    setHasUploaded(false)
  }

  return (
    <div className="h-screen bg-bg text-fg flex flex-col overflow-hidden">
      <header className="h-12 border-b border-border flex items-center px-6 shrink-0">
        <span className="text-heading font-semibold tracking-tight text-fg">ImageFlow</span>
      </header>

      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => inputRef.current?.click()} className={BTN_BASE}>
            <IconImageUpload /> Upload
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const f = Array.from(e.target.files ?? [])
              if (f.length) handleFiles(f)
              e.target.value = ''
            }}
          />

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center justify-between pl-3.5 pr-3 h-9 text-fg border border-border rounded-l-control text-label hover:bg-surface/50 bg-surface/30 cursor-pointer transition-colors w-[180px]"
              >
                {TRANSFORM_LABELS[transformType]}
                <IconChevron />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 w-full bg-surface border border-border rounded-control overflow-hidden z-50 shadow-xl">
                  {(Object.keys(TRANSFORM_LABELS) as TransformType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => { setTransformType(type); setDropdownOpen(false) }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-label transition-colors hover:bg-accent/10 text-fg"
                    >
                      {TRANSFORM_LABELS[type]}
                      {transformType === type && <IconCheck />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className={BTN_BASE + " rounded-l-none"}>
              <IconArrowRight />
              Run
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-caption text-fg-muted tabular-nums">
            {uploading ? 'Queuing jobs...' : `${completedCount}/${totalCount} images processed`}
          </span>

          <button onClick={handleReset} className={BTN_BASE}>
            Reset images
          </button>

          <button
            disabled={completedCount === 0}
            onClick={() => {
              jobs
                .filter(j => j.status === 'completed' && j.output_filename)
                .forEach(j => {
                  const a = document.createElement('a')
                  a.href = api.getOutputUrl(j.output_filename!)
                  a.download = j.original_filename.replace(/\.[^.]+$/, '.webp')
                  a.click()
                })
            }}
            className={BTN_BASE}
          >
            Download all
            <IconDownload />
          </button>
        </div>
      </div>

      {uploading && (
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent shrink-0 animate-pulse" />
      )}

      <main
        className="flex-1 overflow-y-auto p-6 relative"
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files)) }}
      >
        {!hasUploaded ? (
          <div className={`h-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors duration-200 ${
            dragging ? 'border-accent/20 bg-accent/10' : 'border-border'
          }`}>
            <p className="text-body font-medium text-fg">
              Drag and drop images to start
            </p>
            <p className="text-label text-fg-muted">
              Supports JPG, PNG (Max 10MB per file)
            </p>
          </div>
        ) : (
          <BalancedMasonryGrid frameWidth={200} gap={16}>
            {completed.map(job => (
              <Frame key={job.id} width={job.width!} height={job.height!}>
                <GalleryImageCard
                  job={job}
                  onRemove={(id) => {
                    const newJobs = jobs.filter(j => j.id !== id)
                    setJobs(newJobs)
                    if (newJobs.length === 0) setHasUploaded(false)
                  }}
                />
              </Frame>
            ))}
          </BalancedMasonryGrid>
        )}
      </main>
    </div>
  )
}