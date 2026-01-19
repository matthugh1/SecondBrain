export type Category = 'people' | 'projects' | 'ideas' | 'admin'

export type ProjectStatus = 'Active' | 'Waiting' | 'Blocked' | 'Someday' | 'Done'
export type AdminStatus = 'Todo' | 'Done'
export type InboxLogStatus = 'Filed' | 'Needs Review' | 'Fixed'
export type InboxLogFiledTo = Category | 'Needs Review'

export interface Person {
  id?: number
  name: string
  context?: string
  follow_ups?: string
  last_touched?: string
  tags?: string
}

export interface Project {
  id?: number
  name: string
  status?: ProjectStatus
  next_action?: string
  notes?: string
}

export interface Idea {
  id?: number
  name: string
  one_liner?: string
  notes?: string
  last_touched?: string
  tags?: string
}

export interface Admin {
  id?: number
  name: string
  due_date?: string
  status?: AdminStatus
  notes?: string
  created?: string
}

export interface InboxLog {
  id?: number
  original_text: string
  filed_to: InboxLogFiledTo
  destination_name?: string
  destination_url?: string
  confidence?: number
  status: InboxLogStatus
  created?: string
  notion_record_id?: string
}

export interface ClassificationResult {
  category: Category
  fields: Record<string, any>
  confidence: number
  reasoning?: string
}
