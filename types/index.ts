export type Category = 'people' | 'projects' | 'ideas' | 'admin'

export type ProjectStatus = 'Active' | 'Waiting' | 'Blocked' | 'Someday' | 'Done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'Todo' | 'In Progress' | 'Blocked' | 'Waiting' | 'Done' | 'Cancelled'
export type AdminStatus = TaskStatus | 'Todo' | 'Done' // Keep for backward compatibility
export type InboxLogStatus = 'Filed' | 'Needs Review' | 'Fixed'
export type InboxLogFiledTo = Category | 'Needs Review'
export type TaskDependencyType = 'blocks' | 'blocked_by'

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
  startDate?: string
  status?: TaskStatus
  priority?: TaskPriority
  notes?: string
  completedAt?: string
  estimatedDuration?: number // minutes
  actualDuration?: number // minutes
  recurrenceRule?: string // JSON for recurring tasks
  parentTaskId?: number // for sub-tasks
  projectId?: number // explicit link to projects
  assigneeId?: string // userId for future multi-user
  created?: string
  archived?: number // 0 or 1
  archivedAt?: string
}

export interface TaskDependency {
  id?: number
  taskId: number
  dependsOnTaskId: number
  dependencyType: TaskDependencyType
}

export interface TaskTemplate {
  id?: number
  name: string
  description?: string
  fields: string // JSON with template fields
  defaultValues?: string // JSON with default values
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
