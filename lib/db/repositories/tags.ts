import { prisma } from '../index'

export interface Tag {
  id: number
  name: string
  created_at?: string
}

export async function createTag(tenantId: string, name: string): Promise<number> {
  const tag = await prisma.tag.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name,
      },
    },
    create: {
      tenantId,
      name,
    },
    update: {},
  })
  return tag.id
}

export async function getTagById(tenantId: string, id: number): Promise<Tag | null> {
  const tag = await prisma.tag.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!tag) return null
  return {
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt.toISOString(),
  }
}

export async function getTagByName(tenantId: string, name: string): Promise<Tag | null> {
  const tag = await prisma.tag.findUnique({
    where: {
      tenantId_name: {
        tenantId,
        name,
      },
    },
  })
  if (!tag) return null
  return {
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt.toISOString(),
  }
}

export async function getAllTags(tenantId: string): Promise<Tag[]> {
  const tags = await prisma.tag.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt.toISOString(),
  }))
}

export async function getTagsForItem(tenantId: string, itemType: string, itemId: number): Promise<Tag[]> {
  const itemTags = await prisma.itemTag.findMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
    include: {
      tag: true,
    },
  })
  return itemTags.map(itemTag => ({
    id: itemTag.tag.id,
    name: itemTag.tag.name,
    created_at: itemTag.tag.createdAt.toISOString(),
  }))
}

export async function setTagsForItem(tenantId: string, itemType: string, itemId: number, tagNames: string[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Remove existing tags
    await tx.itemTag.deleteMany({
      where: {
        tenantId,
        itemType,
        itemId,
      },
    })

    // Create or get tags and create item_tags
    for (const tagName of tagNames) {
      const trimmed = tagName.trim()
      if (trimmed.length === 0) continue

      // Upsert tag
      const tag = await tx.tag.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: trimmed,
          },
        },
        create: {
          tenantId,
          name: trimmed,
        },
        update: {},
      })

      // Create item_tag
      await tx.itemTag.create({
        data: {
          tenantId,
          itemType,
          itemId,
          tagId: tag.id,
        },
      })
    }
  })
}

export async function addTagToItem(tenantId: string, itemType: string, itemId: number, tagName: string): Promise<void> {
  const trimmed = tagName.trim()
  if (trimmed.length === 0) return

  const tag = await prisma.tag.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name: trimmed,
      },
    },
    create: {
      tenantId,
      name: trimmed,
    },
    update: {},
  })

  await prisma.itemTag.upsert({
    where: {
      tenantId_itemType_itemId_tagId: {
        tenantId,
        itemType,
        itemId,
        tagId: tag.id,
      },
    },
    create: {
      tenantId,
      itemType,
      itemId,
      tagId: tag.id,
    },
    update: {},
  })
}

export async function removeTagFromItem(tenantId: string, itemType: string, itemId: number, tagId: number): Promise<void> {
  await prisma.itemTag.deleteMany({
    where: {
      tenantId,
      itemType,
      itemId,
      tagId,
    },
  })
}

export async function deleteTag(tenantId: string, tagId: number): Promise<void> {
  await prisma.tag.deleteMany({
    where: {
      id: tagId,
      tenantId,
    },
  })
}

export async function searchTags(tenantId: string, query: string): Promise<Tag[]> {
  const tags = await prisma.tag.findMany({
    where: {
      tenantId,
      name: {
        contains: query,
        mode: 'insensitive',
      },
    },
    orderBy: { name: 'asc' },
  })
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt.toISOString(),
  }))
}
