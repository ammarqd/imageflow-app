export interface Job {
    id: number
    original_filename: string
    stored_filename: string
    status: 'uploaded' | 'processing' | 'completed' | 'failed'
    output_filename: string | null
    thumbnail_filename: string | null
    width: number | null
    height: number | null
    created_at: string
}