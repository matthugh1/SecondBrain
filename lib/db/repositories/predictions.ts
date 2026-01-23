import { prisma } from '../index'

export type PredictionType = 'capture' | 'action' | 'form_field'

export interface Prediction {
  id: number
  tenantId: string
  userId: string
  predictionType: PredictionType
  predictedValue: any
  confidence: number
  context?: Record<string, any>
  accepted?: boolean
  createdAt: Date
}

/**
 * Create prediction
 */
export async function createPrediction(
  tenantId: string,
  userId: string,
  prediction: {
    predictionType: PredictionType
    predictedValue: any
    confidence: number
    context?: Record<string, any>
  }
): Promise<number> {
  const result = await prisma.prediction.create({
    data: {
      tenantId,
      userId,
      predictionType: prediction.predictionType,
      predictedValue: JSON.stringify(prediction.predictedValue),
      confidence: prediction.confidence,
      context: prediction.context ? JSON.stringify(prediction.context) : null,
    },
  })
  return result.id
}

/**
 * Get recent predictions
 */
export async function getRecentPredictions(
  tenantId: string,
  userId: string,
  predictionType?: PredictionType,
  limit: number = 50
): Promise<Prediction[]> {
  const predictions = await prisma.prediction.findMany({
    where: {
      tenantId,
      userId,
      ...(predictionType ? { predictionType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return predictions.map(p => ({
    id: p.id,
    tenantId: p.tenantId,
    userId: p.userId,
    predictionType: p.predictionType as PredictionType,
    predictedValue: JSON.parse(p.predictedValue),
    confidence: p.confidence,
    context: p.context ? JSON.parse(p.context) : undefined,
    accepted: p.accepted || undefined,
    createdAt: p.createdAt,
  }))
}

/**
 * Update prediction acceptance
 */
export async function updatePredictionAcceptance(
  tenantId: string,
  userId: string,
  predictionId: number,
  accepted: boolean
): Promise<void> {
  await prisma.prediction.updateMany({
    where: {
      id: predictionId,
      tenantId,
      userId,
    },
    data: {
      accepted,
    },
  })
}
