/**
 * Pricing information for AI models (per 1M tokens)
 * Prices are in USD and should be updated periodically
 * Last updated: 2024
 */

export interface ModelPricing {
  inputPricePerMillion: number // Price per 1M input/prompt tokens
  outputPricePerMillion: number // Price per 1M output/completion tokens
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI Models
  'gpt-4o-mini': {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
  },
  'gpt-4o': {
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
  },
  'gpt-4-turbo': {
    inputPricePerMillion: 10.00,
    outputPricePerMillion: 30.00,
  },
  'gpt-3.5-turbo': {
    inputPricePerMillion: 0.50,
    outputPricePerMillion: 1.50,
  },

  // Anthropic Models
  'claude-3-5-haiku-20241022': {
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
  },
  'claude-3-5-sonnet-20241022': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
  'claude-3-opus-20240229': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
  },
  'claude-3-haiku-20240307': {
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
  },
  'claude-3-sonnet-20240229': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) {
    console.warn(`No pricing found for model: ${model}`)
    return 0
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPricePerMillion
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPricePerMillion

  return inputCost + outputCost
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}¢`
  }
  return `$${cost.toFixed(4)}`
}
