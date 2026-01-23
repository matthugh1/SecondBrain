import { z } from 'zod'

/**
 * Validation schemas for API requests
 * All schemas use Zod for type-safe validation
 */

// Capture endpoint schema
export const captureSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long (max 10000 characters)')
    .trim(),
})

export type CaptureRequest = z.infer<typeof captureSchema>

// Auth signin schema
export const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type SigninRequest = z.infer<typeof signinSchema>

// Auth register schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
})

export type RegisterRequest = z.infer<typeof registerSchema>

// Query endpoint schema
export const querySchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(5000, 'Query too long (max 5000 characters)')
    .trim(),
  message: z
    .string()
    .max(5000, 'Message too long (max 5000 characters)')
    .trim()
    .optional(),
})

export type QueryRequest = z.infer<typeof querySchema>

// Database CRUD schemas
export const createPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500, 'Name too long'),
  context: z.string().max(10000, 'Context too long').optional(),
  follow_ups: z.string().max(10000, 'Follow-ups too long').optional(),
  last_touched: z.string().optional(),
  tags: z.string().max(1000, 'Tags too long').optional(),
})

export type CreatePersonRequest = z.infer<typeof createPersonSchema>

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500, 'Name too long'),
  status: z.enum(['Active', 'Waiting', 'Blocked', 'Someday', 'Done']).optional(),
  next_action: z.string().max(1000, 'Next action too long').optional(),
  notes: z.string().max(50000, 'Notes too long').optional(),
})

export type CreateProjectRequest = z.infer<typeof createProjectSchema>

export const createIdeaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500, 'Name too long'),
  one_liner: z.string().max(500, 'One-liner too long').optional(),
  notes: z.string().max(50000, 'Notes too long').optional(),
  last_touched: z.string().optional(),
  tags: z.string().max(1000, 'Tags too long').optional(),
})

export type CreateIdeaRequest = z.infer<typeof createIdeaSchema>

export const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500, 'Name too long'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional(),
  status: z
    .enum(['Todo', 'In Progress', 'Blocked', 'Done'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().max(50000, 'Notes too long').optional(),
  projectId: z.number().int().positive().optional(),
  parentTaskId: z.number().int().positive().optional(),
})

export type CreateAdminRequest = z.infer<typeof createAdminSchema>

// Update schemas (all fields optional)
export const updatePersonSchema = createPersonSchema.partial()
export const updateProjectSchema = createProjectSchema.partial()
export const updateIdeaSchema = createIdeaSchema.partial()
export const updateAdminSchema = createAdminSchema.partial()

export type UpdatePersonRequest = z.infer<typeof updatePersonSchema>
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>
export type UpdateIdeaRequest = z.infer<typeof updateIdeaSchema>
export type UpdateAdminRequest = z.infer<typeof updateAdminSchema>

// Email endpoint schemas
export const emailSyncSchema = z.object({
  sync: z.literal('gmail'),
})

export const emailWebhookSchema = z.object({
  messageId: z.string().optional(),
  subject: z.string().max(500, 'Subject too long').optional(),
  body: z.string().max(100000, 'Body too long').optional(),
  text: z.string().max(100000, 'Text too long').optional(),
  senderEmail: z.string().email('Invalid sender email').optional(),
  from: z.string().email('Invalid from email').optional(),
  senderName: z.string().max(200, 'Sender name too long').optional(),
  recipientEmail: z.string().email('Invalid recipient email').optional(),
  to: z.string().email('Invalid to email').optional(),
  receivedAt: z.string().datetime().optional(),
  attachments: z.array(z.any()).optional(),
})

export const emailPostSchema = z.union([emailSyncSchema, emailWebhookSchema])

export type EmailPostRequest = z.infer<typeof emailPostSchema>

// Actions endpoint schema
export const createActionSchema = z.object({
  actionType: z.enum([
    'create',
    'update',
    'delete',
    'link',
    'notify',
    'schedule',
  ]),
  targetType: z.enum(['people', 'projects', 'ideas', 'admin']).optional(),
  targetId: z.number().int().positive().optional(),
  parameters: z.record(z.any()).optional(),
  requiresApproval: z.boolean().optional(),
  executeImmediately: z.boolean().optional(),
})

export type CreateActionRequest = z.infer<typeof createActionSchema>

// Workflows endpoint schema
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  trigger: z.object({
    type: z.enum(['item_created', 'item_updated', 'item_deleted', 'status_changed', 'scheduled']),
    itemType: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any().default(null), // Explicitly required (default to null if needed, but field must exist)
    })).optional(),
    schedule: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      time: z.string().optional(),
      day: z.number().int().optional(),
    }).optional(),
  }),
  actions: z.array(z.object({
    actionType: z.string(),
    targetType: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  })).min(1, 'At least one action is required'),
  priority: z.number().int().min(0).max(100).optional(),
  enabled: z.boolean().optional(),
})

export type CreateWorkflowRequest = z.infer<typeof createWorkflowSchema>
