import * as workflowsRepo from '@/lib/db/repositories/workflows'

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES = [
  {
    name: 'Archive Completed Projects',
    description: 'Automatically archive projects after they are marked as Done for 7 days',
    trigger: {
      type: 'status_changed' as const,
      itemType: 'projects',
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'Done',
        },
      ],
    },
    actions: [
      {
        actionType: 'update',
        targetType: 'projects',
        parameters: {
          archived: 1,
        },
      },
    ],
    priority: 0,
  },
  {
    name: 'Create Contact for Frequent Mentions',
    description: 'If a person is mentioned in 3+ projects, suggest creating a contact',
    trigger: {
      type: 'item_updated' as const,
      itemType: 'people',
      conditions: [],
    },
    actions: [
      {
        actionType: 'notify',
        parameters: {
          title: 'Frequent Contact',
          message: 'This person is mentioned in multiple projects. Consider creating a contact.',
        },
      },
    ],
    priority: 0,
  },
  {
    name: 'Remind Before Due Date',
    description: 'Send reminder for admin tasks due tomorrow',
    trigger: {
      type: 'scheduled' as const,
      schedule: {
        frequency: 'daily' as const,
        time: '09:00',
      },
    },
    actions: [
      {
        actionType: 'schedule',
        parameters: {
          reminderType: 'due_date',
          title: 'Task Due Tomorrow',
          message: 'You have tasks due tomorrow',
        },
      },
    ],
    priority: 0,
  },
  {
    name: 'Convert Popular Ideas',
    description: 'If an idea is mentioned 5+ times, suggest converting to project',
    trigger: {
      type: 'item_updated' as const,
      itemType: 'ideas',
      conditions: [],
    },
    actions: [
      {
        actionType: 'notify',
        parameters: {
          title: 'Idea Ready for Project',
          message: 'This idea has been mentioned multiple times. Consider converting it to a project.',
        },
      },
    ],
    priority: 0,
  },
]

/**
 * Create workflow from template
 */
export async function createWorkflowFromTemplate(
  tenantId: string,
  templateName: string,
  customizations?: {
    name?: string
    description?: string
    trigger?: workflowsRepo.WorkflowTrigger
    actions?: workflowsRepo.WorkflowAction[]
    priority?: number
  }
): Promise<number> {
  const template = WORKFLOW_TEMPLATES.find(t => t.name === templateName)
  if (!template) {
    throw new Error(`Template "${templateName}" not found`)
  }

  return await workflowsRepo.createWorkflow(tenantId, {
    name: customizations?.name || template.name,
    description: customizations?.description || template.description,
    trigger: customizations?.trigger || template.trigger,
    actions: customizations?.actions || template.actions,
    priority: customizations?.priority ?? template.priority,
    enabled: true,
  })
}
