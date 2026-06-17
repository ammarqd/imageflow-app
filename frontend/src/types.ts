export interface Job {
    id: number
    original_filename: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    output_path: string | null
    created_at: string
}