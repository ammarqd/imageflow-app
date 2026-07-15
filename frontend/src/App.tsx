import { useState, useCallback, useEffect, useRef } from 'react'
import { BalancedMasonryGrid, Frame } from '@masonry-grid/react'
import { api } from './services/api'
import type { Job } from './types'

type Tab = 'original' | 'processed'

const BTN_BASE =
  'flex items-center gap-1.5 text-label px-3.5 h-9 text-fg border border-border rounded-control bg-surface/30 hover:bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface/30'

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

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-1 pb-2.5 text-label transition-colors cursor-pointer ${active ? 'text-fg' : 'text-fg-muted hover:text-fg'}`}
    >
      {label}
      <span className="ml-1.5 text-caption text-fg-muted tabular-nums">{count}</span>
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent rounded-full" />}
    </button>
  )
}

function GalleryImageCard({ imgUrl, alt, failed, onRemove }: { imgUrl: string | null; alt: string; failed?: boolean; onRemove: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false)

  if (!imgUrl) {
    return <div className="h-full" />
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-bg border border-border shadow-md group h-full">
      <img
        src={imgUrl}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {failed && (
        <span className="absolute top-2 left-2 text-caption bg-bg/80 text-fg-muted border border-border rounded-md px-1.5 py-0.5">
          Failed
        </span>
      )}
      {isLoaded && (
        <button
          onClick={onRemove}
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
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('original')
  const inputRef = useRef<HTMLInputElement>(null)
  const jobsRef = useRef(jobs)

  const completedCount = jobs.filter(j => j.status === 'completed').length
  const totalCount = jobs.length
  const failedCount = jobs.filter(j => j.status === 'failed').length
  const runnableCount = jobs.filter(j => j.status === 'uploaded' || j.status === 'failed').length
  const isBusy = uploading || running || jobs.some(j => j.status === 'processing')

  useEffect(() => { jobsRef.current = jobs }, [jobs])

  useEffect(() => {
    const interval = setInterval(async () => {
      const active = jobsRef.current.filter(
        j => j.status === 'processing' || j.thumbnail_filename === null
      )
      if (active.length === 0) return
      const updated = await api.getJobs(active.map(j => j.id))
      setJobs(prev => prev.map(j => updated.find(u => u.id === j.id) ?? j))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    setUploading(true)
    setActiveTab('original')
    setUploadTarget(jobsRef.current.length + files.length)
    try {
      await api.uploadImages(files, (batchJobs) => {
        setJobs(prev => [...prev, ...batchJobs])
      })
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      setUploadTarget(null)
    }
  }, [])

  const handleRun = useCallback(async () => {
    const idsToRun = jobsRef.current
      .filter(j => j.status === 'uploaded' || j.status === 'failed')
      .map(j => j.id)
    if (idsToRun.length === 0) return
    setRunning(true)
    setHasRun(true)
    try {
      const updated = await api.runJobs(idsToRun)
      setJobs(prev => prev.map(j => updated.find(u => u.id === j.id) ?? j))
      setActiveTab('processed')
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }, [])

  const handleRemove = useCallback((id: number) => {
    setJobs(prev => prev.filter(j => j.id !== id))
  }, [])

  const handleReset = () => {
    setJobs([])
    setActiveTab('original')
    setHasRun(false)
  }

  const processedItems = jobs.filter(j => j.status === 'completed' && j.output_filename)
  const visibleItems = activeTab === 'original' ? jobs : processedItems
  const showDropzone = jobs.length === 0 && !uploading
  const showUploadWaiting = uploading && jobs.length === 0
  const showProcessedWaiting = activeTab === 'processed' && jobs.length > 0 && processedItems.length === 0

  const counterText = uploading
    ? `${jobs.length}/${uploadTarget ?? jobs.length} images uploaded`
    : hasRun
      ? `${completedCount}/${totalCount} images processed`
      : `${totalCount}/${totalCount} images uploaded`

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

          <button onClick={handleRun} disabled={runnableCount === 0 || running} className={BTN_BASE}>
            <IconArrowRight />
            {running ? 'Running…' : 'Run Smart Crop'}
          </button>
        </div>

        <div className="flex items-center gap-4">
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

      <div className="flex items-center justify-between gap-6 px-6 pt-3 border-b border-border shrink-0">
        <div className="flex items-center gap-6">
          <TabButton label="Original" count={totalCount} active={activeTab === 'original'} onClick={() => setActiveTab('original')} />
          <TabButton label="Processed" count={completedCount} active={activeTab === 'processed'} onClick={() => setActiveTab('processed')} />
        </div>
        <span className="text-caption text-fg-muted tabular-nums pb-2.5">
          {counterText}
        </span>
      </div>

      {isBusy && (
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent shrink-0 animate-pulse" />
      )}

      <main
        className="flex-1 overflow-y-auto p-6 relative"
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files)) }}
      >
        {showDropzone ? (
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
        ) : showUploadWaiting ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <p className="text-body font-medium text-fg">
              Uploading your images…
            </p>
          </div>
        ) : showProcessedWaiting ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <p className="text-body font-medium text-fg">
              {isBusy
                ? 'Processing your images…'
                : failedCount > 0
                  ? `${failedCount} image${failedCount > 1 ? 's' : ''} failed to process — click Run to retry`
                  : 'Click Run Smart Crop to process your images'}
            </p>
          </div>
        ) : (
          <BalancedMasonryGrid frameWidth={200} gap={16}>
            {visibleItems.map(job => (
              <Frame key={job.id} width={job.width!} height={job.height!}>
                <GalleryImageCard
                  imgUrl={
                    activeTab === 'original'
                      ? (job.thumbnail_filename ? api.getThumbnailUrl(job.thumbnail_filename) : null)
                      : api.getOutputUrl(job.output_filename!)
                  }
                  alt={job.original_filename}
                  failed={job.status === 'failed'}
                  onRemove={() => handleRemove(job.id)}
                />
              </Frame>
            ))}
          </BalancedMasonryGrid>
        )}
      </main>
    </div>
  )
}