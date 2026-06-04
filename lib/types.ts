export type Document = {
  id: number
  title: string
  description: string
  file_url: string
  category: string | null
  suggested_price: number | null
  created_at: string | null
  isOwned: boolean
}

export type Submission = {
  id: string
  document_id: number
  user_id: string | null
  amount: number
  created_at: string | null
}