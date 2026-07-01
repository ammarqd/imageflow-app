export interface Job {
    id: number
    original_filename: string
    stored_filename: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    output_filename: string | null
    width: number | null
    height: number | null
    created_at: string
}