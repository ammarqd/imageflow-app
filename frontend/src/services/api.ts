import type { Job } from '../types'

const API_BASE_URL = "http://localhost:8000"
const NGINX_BASE_URL = "http://localhost:8080"

const BATCH_TARGET_BYTES = 40 * 1024 * 1024 // 40MB

function buildBatches(files: File[]): File[][] {
    const batches: File[][] = []
    let currentBatch: File[] = []
    let currentBytes = 0

    for (const file of files) {
        if (currentBatch.length > 0 && currentBytes + file.size > BATCH_TARGET_BYTES) {
            batches.push(currentBatch)
            currentBatch = []
            currentBytes = 0
        }
        currentBatch.push(file)
        currentBytes += file.size
    }
    if (currentBatch.length > 0) {
        batches.push(currentBatch)
    }
    return batches
}

export const api = {
    uploadImages: async (
        files: File[],
        onBatchComplete?: (jobs: Job[]) => void
    ): Promise<Job[]> => {
        const batches = buildBatches(files)
        const allJobs: Job[] = []

        for (const batch of batches) {
            const formData = new FormData()
            batch.forEach(file => {
                formData.append('files', file)
            })
            const response = await fetch(`${API_BASE_URL}/jobs/upload`, {
                method: 'POST',
                body: formData,
            })
            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`)
            }
            const batchJobs: Job[] = await response.json()
            allJobs.push(...batchJobs)
            onBatchComplete?.(batchJobs)
        }

        return allJobs
    },
    runJobs: async (ids: number[]): Promise<Job[]> => {
        const params = ids.map(id => `ids=${id}`).join('&')
        const response = await fetch(`${API_BASE_URL}/jobs/run?${params}`, {
            method: 'POST',
        })
        if (!response.ok) {
            throw new Error(`Run failed with status: ${response.status}`)
        }
        return response.json()
    },
    getJobs: async (ids: number[]): Promise<Job[]> => {
        const params = ids.map(id => `ids=${id}`).join('&')
        const response = await fetch(`${API_BASE_URL}/jobs?${params}`)
        return response.json()
    },
    getJobStatus: async (jobId: number): Promise<Job> => {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`)
        if (!response.ok) {
            throw new Error(`Failed to find status for job ${jobId}`)
        }
        return response.json()
    },
    getOutputUrl: (storedFilename: string): string => {
        return `${NGINX_BASE_URL}/outputs/${storedFilename}`
    },
    getUploadUrl: (storedFilename: string): string => {
        return `${NGINX_BASE_URL}/uploads/${storedFilename}`
    },
    getThumbnailUrl: (thumbnailFilename: string): string => {
        return `${NGINX_BASE_URL}/thumbnails/${thumbnailFilename}`
    },
}