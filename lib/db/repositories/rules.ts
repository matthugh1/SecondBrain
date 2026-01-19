import { prisma } from '../index'

export interface RuleSettings {
  id: number
  confidence_threshold: number
  default_project_status: string
  default_admin_status: string
  learning_enabled: number
  max_learning_examples: number
  example_timeframe_days: number
  updated_at: string
}

export interface RuleCategory {
  id: number
  category_key: string
  label: string
  description: string | null
  enabled: number
  field_schema: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface RulePrompt {
  id: number
  name: string
  template: string
  active: number
  created_at: string
  updated_at: string
}

export interface RuleRouting {
  id: number
  category_key: string
  destination_table: string
  field_mapping: string | null
  created_at: string
  updated_at: string
}

// Rule Settings
export async function getRuleSettings(tenantId: string): Promise<RuleSettings | null> {
  const result = await prisma.ruleSettings.findUnique({
    where: { tenantId },
  })
  if (!result) return null
  return {
    id: result.id,
    confidence_threshold: result.confidenceThreshold,
    default_project_status: result.defaultProjectStatus,
    default_admin_status: result.defaultAdminStatus,
    learning_enabled: result.learningEnabled ?? 1,
    max_learning_examples: result.maxLearningExamples ?? 5,
    example_timeframe_days: result.exampleTimeframeDays ?? 30,
    updated_at: result.updatedAt.toISOString(),
  }
}

export async function updateRuleSettings(tenantId: string, updates: Partial<Omit<RuleSettings, 'id' | 'updated_at'>>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.confidence_threshold !== undefined) {
    data.confidenceThreshold = updates.confidence_threshold
  }
  if (updates.default_project_status !== undefined) {
    data.defaultProjectStatus = updates.default_project_status
  }
  if (updates.default_admin_status !== undefined) {
    data.defaultAdminStatus = updates.default_admin_status
  }
  if (updates.learning_enabled !== undefined) {
    data.learningEnabled = updates.learning_enabled
  }
  if (updates.max_learning_examples !== undefined) {
    data.maxLearningExamples = updates.max_learning_examples
  }
  if (updates.example_timeframe_days !== undefined) {
    data.exampleTimeframeDays = updates.example_timeframe_days
  }
  
  await prisma.ruleSettings.update({
    where: { tenantId },
    data,
  })
}

// Rule Categories
export async function getAllRuleCategories(tenantId: string): Promise<RuleCategory[]> {
  const results = await prisma.ruleCategory.findMany({
    where: { tenantId },
    orderBy: [{ displayOrder: 'asc' }, { categoryKey: 'asc' }],
  })
  return results.map(row => ({
    id: row.id,
    category_key: row.categoryKey,
    label: row.label,
    description: row.description,
    enabled: row.enabled,
    field_schema: row.fieldSchema,
    display_order: row.displayOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }))
}

export async function getEnabledRuleCategories(tenantId: string): Promise<RuleCategory[]> {
  const results = await prisma.ruleCategory.findMany({
    where: {
      tenantId,
      enabled: 1,
    },
    orderBy: [{ displayOrder: 'asc' }, { categoryKey: 'asc' }],
  })
  return results.map(row => ({
    id: row.id,
    category_key: row.categoryKey,
    label: row.label,
    description: row.description,
    enabled: row.enabled,
    field_schema: row.fieldSchema,
    display_order: row.displayOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }))
}

export async function getRuleCategoryByKey(tenantId: string, categoryKey: string): Promise<RuleCategory | null> {
  const result = await prisma.ruleCategory.findFirst({
    where: {
      tenantId,
      categoryKey,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    category_key: result.categoryKey,
    label: result.label,
    description: result.description,
    enabled: result.enabled,
    field_schema: result.fieldSchema,
    display_order: result.displayOrder,
    created_at: result.createdAt.toISOString(),
    updated_at: result.updatedAt.toISOString(),
  }
}

export async function createRuleCategory(tenantId: string, category: Omit<RuleCategory, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const result = await prisma.ruleCategory.create({
    data: {
      tenantId,
      categoryKey: category.category_key,
      label: category.label,
      description: category.description || null,
      enabled: category.enabled,
      fieldSchema: category.field_schema || null,
      displayOrder: category.display_order,
    },
  })
  return result.id
}

export async function updateRuleCategory(tenantId: string, id: number, updates: Partial<Omit<RuleCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.category_key !== undefined) data.categoryKey = updates.category_key
  if (updates.label !== undefined) data.label = updates.label
  if (updates.description !== undefined) data.description = updates.description || null
  if (updates.enabled !== undefined) data.enabled = updates.enabled
  if (updates.field_schema !== undefined) data.fieldSchema = updates.field_schema || null
  if (updates.display_order !== undefined) data.displayOrder = updates.display_order
  
  await prisma.ruleCategory.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deleteRuleCategory(tenantId: string, id: number): Promise<void> {
  await prisma.ruleCategory.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}

// Rule Prompts
export async function getAllRulePrompts(tenantId: string): Promise<RulePrompt[]> {
  const results = await prisma.rulePrompt.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
  return results.map(row => ({
    id: row.id,
    name: row.name,
    template: row.template,
    active: row.active,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }))
}

export async function getActiveRulePrompt(tenantId: string, name: string): Promise<RulePrompt | null> {
  const result = await prisma.rulePrompt.findFirst({
    where: {
      tenantId,
      name,
      active: 1,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    template: result.template,
    active: result.active,
    created_at: result.createdAt.toISOString(),
    updated_at: result.updatedAt.toISOString(),
  }
}

export async function createRulePrompt(tenantId: string, prompt: Omit<RulePrompt, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const result = await prisma.rulePrompt.create({
    data: {
      tenantId,
      name: prompt.name,
      template: prompt.template,
      active: prompt.active,
    },
  })
  return result.id
}

export async function updateRulePrompt(tenantId: string, id: number, updates: Partial<Omit<RulePrompt, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  console.log('🔄 Updating rule prompt:', { tenantId, id, updatesKeys: Object.keys(updates), hasTemplate: 'template' in updates })
  
  const data: any = {}
  
  if (updates.name !== undefined) data.name = updates.name
  if (updates.template !== undefined) {
    console.log('📝 Template update detected, length:', updates.template?.length)
    data.template = updates.template
  }
  if (updates.active !== undefined) data.active = updates.active
  
  // If no fields to update, return early
  if (Object.keys(data).length === 0) {
    console.log('⚠️ No fields to update')
    return
  }
  
  console.log('📦 Data to update:', { ...data, templateLength: data.template?.length })
  
  try {
    // Use findFirst to check if record exists
    const existing = await prisma.rulePrompt.findFirst({
      where: { id, tenantId },
    })
    
    if (!existing) {
      console.error('❌ Prompt not found:', { id, tenantId })
      throw new Error(`Prompt with id ${id} not found for tenant ${tenantId}`)
    }
    
    console.log('✅ Found existing prompt:', { id, name: existing.name, currentTemplateLength: existing.template.length })
    
    // Use update instead of updateMany for better error handling
    const result = await prisma.rulePrompt.update({
      where: {
        id,
      },
      data,
    })
    
    console.log('✅ Update successful:', { id, updatedTemplateLength: result.template.length })
  } catch (error) {
    console.error('❌ Error in updateRulePrompt:', error)
    throw error
  }
}

export async function setActivePrompt(tenantId: string, name: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.rulePrompt.updateMany({
      where: { tenantId },
      data: { active: 0 },
    })
    await tx.rulePrompt.updateMany({
      where: {
        tenantId,
        name,
      },
      data: {
        active: 1,
        updatedAt: new Date(),
      },
    })
  })
}

export async function deleteRulePrompt(tenantId: string, id: number): Promise<void> {
  await prisma.rulePrompt.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}

// Rule Routing
export async function getAllRuleRouting(tenantId: string): Promise<RuleRouting[]> {
  const results = await prisma.ruleRouting.findMany({
    where: { tenantId },
    orderBy: { categoryKey: 'asc' },
  })
  return results.map(row => ({
    id: row.id,
    category_key: row.categoryKey,
    destination_table: row.destinationTable,
    field_mapping: row.fieldMapping,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }))
}

export async function getRuleRoutingByCategory(tenantId: string, categoryKey: string): Promise<RuleRouting | null> {
  const result = await prisma.ruleRouting.findFirst({
    where: {
      tenantId,
      categoryKey,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    category_key: result.categoryKey,
    destination_table: result.destinationTable,
    field_mapping: result.fieldMapping,
    created_at: result.createdAt.toISOString(),
    updated_at: result.updatedAt.toISOString(),
  }
}

export async function createRuleRouting(tenantId: string, routing: Omit<RuleRouting, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const result = await prisma.ruleRouting.create({
    data: {
      tenantId,
      categoryKey: routing.category_key,
      destinationTable: routing.destination_table,
      fieldMapping: routing.field_mapping || null,
    },
  })
  return result.id
}

export async function updateRuleRouting(tenantId: string, id: number, updates: Partial<Omit<RuleRouting, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.category_key !== undefined) data.categoryKey = updates.category_key
  if (updates.destination_table !== undefined) data.destinationTable = updates.destination_table
  if (updates.field_mapping !== undefined) data.fieldMapping = updates.field_mapping || null
  
  await prisma.ruleRouting.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deleteRuleRouting(tenantId: string, id: number): Promise<void> {
  await prisma.ruleRouting.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
