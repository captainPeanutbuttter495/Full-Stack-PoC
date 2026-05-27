export type Document = {
  id: number
  title: string
  description: string
  file_url: string
  category: string | null
  suggested_price: number | null
  created_at: string | null
}

export type Submission = {
  id: string
  document_id: number
  amount: number
  email: string | null
  created_at: string | null
}