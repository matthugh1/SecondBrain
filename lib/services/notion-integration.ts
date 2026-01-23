import * as integrationsRepo from '@/lib/db/repositories/integrations'
import { prisma } from '@/lib/db/index'

/**
 * Sync item to Notion
 */
export async function syncItemToNotion(
  tenantId: string,
  itemType: string,
  itemId: number,
  notionDatabaseId?: string
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'notion')
  if (!integration || integration.status !== 'active') {
    return { success: false, error: 'Notion integration not active' }
  }

  const accessToken = integration.config.accessToken
  if (!accessToken) {
    return { success: false, error: 'No access token available' }
  }

  // Get item data based on type
  let itemData: any
  try {
    switch (itemType) {
      case 'people': {
        const { getPersonById } = await import('@/lib/db/repositories/people')
        const person = await getPersonById(tenantId, itemId)
        if (!person) throw new Error('Person not found')
        itemData = {
          Name: { title: [{ text: { content: person.name } }] },
          Context: person.context ? { rich_text: [{ text: { content: person.context } }] } : undefined,
        }
        break
      }
      case 'projects': {
        const { getProjectById } = await import('@/lib/db/repositories/projects')
        const project = await getProjectById(tenantId, itemId)
        if (!project) throw new Error('Project not found')
        itemData = {
          Name: { title: [{ text: { content: project.name } }] },
          Status: { select: { name: project.status } },
          Notes: project.notes ? { rich_text: [{ text: { content: project.notes } }] } : undefined,
        }
        break
      }
      case 'ideas': {
        const { getIdeaById } = await import('@/lib/db/repositories/ideas')
        const idea = await getIdeaById(tenantId, itemId)
        if (!idea) throw new Error('Idea not found')
        itemData = {
          Name: { title: [{ text: { content: idea.name } }] },
          Notes: idea.notes ? { rich_text: [{ text: { content: idea.notes } }] } : undefined,
        }
        break
      }
      case 'admin': {
        const { getAdminById } = await import('@/lib/db/repositories/admin')
        const task = await getAdminById(tenantId, itemId)
        if (!task) throw new Error('Task not found')
        itemData = {
          Name: { title: [{ text: { content: task.name } }] },
          Due: task.due_date ? { date: { start: new Date(task.due_date).toISOString() } } : undefined,
          Notes: task.notes ? { rich_text: [{ text: { content: task.notes } }] } : undefined,
        }
        break
      }
      default:
        throw new Error(`Unknown item type: ${itemType}`)
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }

  // Remove undefined fields
  Object.keys(itemData).forEach(key => {
    if (itemData[key] === undefined) {
      delete itemData[key]
    }
  })

  try {
    const databaseId = notionDatabaseId || integration.config.defaultDatabaseId
    if (!databaseId) {
      return { success: false, error: 'No Notion database configured' }
    }

    // Create page in Notion (with retry and timeout)
    const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
    const response = await fetchWithRetryAndTimeout('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: itemData,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notion API error: ${error}`)
    }

    const page = await response.json()

    // Store sync record
    await prisma.notionSync.create({
      data: {
        tenantId,
        integrationId: integration.id,
        itemType,
        itemId,
        notionPageId: page.id,
        notionDatabaseId: databaseId,
        syncDirection: 'to_notion',
      },
    })

    return { success: true, pageId: page.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create Notion page from capture
 */
export async function createNotionPageFromCapture(
  tenantId: string,
  captureText: string,
  captureCategory: string,
  notionDatabaseId?: string
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'notion')
  if (!integration || integration.status !== 'active') {
    return { success: false, error: 'Notion integration not active' }
  }

  const accessToken = integration.config.accessToken
  if (!accessToken) {
    return { success: false, error: 'No access token available' }
  }

  try {
    const databaseId = notionDatabaseId || integration.config.defaultDatabaseId
    if (!databaseId) {
      return { success: false, error: 'No Notion database configured' }
    }

    // Create page with capture content (with retry and timeout)
    const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
    const response = await fetchWithRetryAndTimeout('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: captureText.substring(0, 100) } }] },
          Category: { select: { name: captureCategory } },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: captureText } }],
            },
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notion API error: ${error}`)
    }

    const page = await response.json()
    return { success: true, pageId: page.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
