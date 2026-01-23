import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/index'
import type { Category } from '@/types'
import { retryAICall } from '@/lib/utils/retry'
import { timeoutAICall } from '@/lib/utils/timeout'

const aiProvider = process.env.AI_PROVIDER || 'openai'

/**
 * Generate embedding for text using OpenAI or Anthropic
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = aiProvider === 'anthropic' 
    ? process.env.ANTHROPIC_API_KEY 
    : process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(`${aiProvider === 'anthropic' ? 'ANTHROPIC' : 'OPENAI'}_API_KEY not configured`)
  }

  try {
    if (aiProvider === 'anthropic') {
      // Anthropic doesn't have a direct embeddings API, so we'll use OpenAI's embedding model
      // For now, fall back to OpenAI embeddings even if provider is Anthropic
      const openaiKey = process.env.OPENAI_API_KEY
      if (!openaiKey) {
        throw new Error('OpenAI API key required for embeddings (even when using Anthropic for chat)')
      }
      const openai = new OpenAI({ apiKey: openaiKey })
      // Apply retry and timeout to embedding API call
      const response = await retryAICall(() =>
        timeoutAICall(
          openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
          })
        )
      )
      return response.data[0].embedding
    } else {
      const openai = new OpenAI({ apiKey })
      // Apply retry and timeout to embedding API call
      const response = await retryAICall(() =>
        timeoutAICall(
          openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
          })
        )
      )
      return response.data[0].embedding
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Store or update embedding for an item
 */
export async function storeEmbedding(
  tenantId: string,
  itemType: Category,
  itemId: number,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text)
  const embeddingJson = JSON.stringify(embedding)

  await prisma.embedding.upsert({
    where: {
      tenantId_itemType_itemId: {
        tenantId,
        itemType,
        itemId,
      },
    },
    create: {
      tenantId,
      itemType,
      itemId,
      text,
      embedding: embeddingJson,
    },
    update: {
      text,
      embedding: embeddingJson,
      updatedAt: new Date(),
    },
  })
}

/**
 * Find semantically similar items
 */
export async function findSimilarItems(
  tenantId: string,
  queryText: string,
  itemTypes?: Category[],
  limit: number = 20
): Promise<Array<{
  itemType: Category
  itemId: number
  similarity: number
  text: string
}>> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText)

  // Get all embeddings for the tenant
  const embeddings = await prisma.embedding.findMany({
    where: {
      tenantId,
      ...(itemTypes && itemTypes.length > 0 ? { itemType: { in: itemTypes } } : {}),
    },
  })

  // Calculate similarities
  const similarities = embeddings.map((emb) => {
    const embedding = JSON.parse(emb.embedding) as number[]
    const similarity = cosineSimilarity(queryEmbedding, embedding)
    return {
      itemType: emb.itemType as Category,
      itemId: emb.itemId,
      similarity,
      text: emb.text,
    }
  })

  // Sort by similarity and return top results
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .filter((s) => s.similarity > 0.3) // Filter out very low similarity
    .slice(0, limit)
}

/**
 * Generate and store embeddings for an item's text content
 */
export async function generateAndStoreEmbedding(
  tenantId: string,
  itemType: Category,
  itemId: number,
  title: string,
  content: string
): Promise<void> {
  const combinedText = `${title} ${content}`.trim()
  if (combinedText.length === 0) {
    return
  }

  // Truncate to reasonable length (embeddings have token limits)
  const maxLength = 8000 // characters
  const truncatedText = combinedText.length > maxLength 
    ? combinedText.substring(0, maxLength) 
    : combinedText

  await storeEmbedding(tenantId, itemType, itemId, truncatedText)
}

/**
 * Delete embedding for an item
 */
export async function deleteEmbedding(
  tenantId: string,
  itemType: Category,
  itemId: number
): Promise<void> {
  await prisma.embedding.deleteMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
  })
}
