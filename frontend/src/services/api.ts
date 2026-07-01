import type { Job } from '../types'

const API_BASE_URL = "http://localhost:8000"
const NGINX_BASE_URL = "http://localhost:8080"

export const api = {
    uploadImages: async (files: File[]): Promise<Job[]> => {
        const formData = new FormData()

        files.forEach(file => {
            formData.append('files', file)
        })

        const response = await fetch(`${API_BASE_URL}/jobs/upload`, {
            method: 'POST',
            body: formData,
        })

        if(!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`)
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
        if(!response.ok) {
            throw new Error(`Failed to find status for job ${jobId}`)
        }
        return response.json()
    },

    getOutputUrl: (storedFilename: string): string => {
        return `${NGINX_BASE_URL}/outputs/${storedFilename}`
    },
}