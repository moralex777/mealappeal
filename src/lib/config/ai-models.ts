/**
 * AI Model Configuration
 * Centralized configuration for OpenAI models with tier-based routing
 */

export interface ModelConfig {
  modelId: string
  displayName: string
  maxTokens: number
  temperature: number
  imageDetail: 'low' | 'high' | 'auto'
  costPerMillionTokens: {
    input: number
    output: number
  }
  features: {
    premiumAnalysis: boolean
    enhancedAccuracy: boolean
    longContext: boolean
  }
  deprecated?: boolean
  deprecationDate?: string
  fallbackModel?: string
}

export interface TierModelConfig {
  free: ModelConfig
  premium_monthly: ModelConfig
  premium_yearly: ModelConfig
}

// Model definitions
export const AI_MODELS: Record<string, ModelConfig> = {
  // Current production model
  'gpt-4o-mini-2024-07-18': {
    modelId: 'gpt-4o-mini-2024-07-18',
    displayName: 'GPT-4o Mini',
    maxTokens: 500,
    temperature: 0.3,
    imageDetail: 'low',
    costPerMillionTokens: {
      input: 0.15,
      output: 0.60
    },
    features: {
      premiumAnalysis: false,
      enhancedAccuracy: false,
      longContext: false
    }
  },
  
  // New GPT-4.1 models (when available)
  'gpt-4.1-mini': {
    modelId: 'gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    maxTokens: 1000,
    temperature: 0.3,
    imageDetail: 'high',
    costPerMillionTokens: {
      input: 0.15, // Update when pricing is announced
      output: 0.60
    },
    features: {
      premiumAnalysis: true,
      enhancedAccuracy: true,
      longContext: false
    }
  },
  
  'gpt-4.1': {
    modelId: 'gpt-4.1',
    displayName: 'GPT-4.1',
    maxTokens: 2000,
    temperature: 0.3,
    imageDetail: 'high',
    costPerMillionTokens: {
      input: 0.30, // Update when pricing is announced
      output: 1.20
    },
    features: {
      premiumAnalysis: true,
      enhancedAccuracy: true,
      longContext: true
    }
  },
  
  // Currently available GPT-4o model
  'gpt-4o-2024-05-13': {
    modelId: 'gpt-4o-2024-05-13',
    displayName: 'GPT-4o Latest',
    maxTokens: 2000,
    temperature: 0.3,
    imageDetail: 'high',
    costPerMillionTokens: {
      input: 5.00,
      output: 15.00
    },
    features: {
      premiumAnalysis: true,
      enhancedAccuracy: true,
      longContext: true
    }
  },
  
  // Fallback models
  'gpt-4o-2024-08-06': {
    modelId: 'gpt-4o-2024-08-06',
    displayName: 'GPT-4o',
    maxTokens: 1500,
    temperature: 0.3,
    imageDetail: 'high',
    costPerMillionTokens: {
      input: 2.50,
      output: 10.00
    },
    features: {
      premiumAnalysis: true,
      enhancedAccuracy: true,
      longContext: false
    },
    deprecated: true,
    deprecationDate: '2024-08-06',
    fallbackModel: 'gpt-4o-2024-05-13'
  }
}

// Tier-based model routing configuration
export const TIER_MODEL_CONFIG: TierModelConfig = {
  free: {
    ...AI_MODELS['gpt-4o-mini-2024-07-18'],
    maxTokens: 500,
    imageDetail: 'low'
  },
  premium_monthly: {
    ...AI_MODELS['gpt-4o-mini-2024-07-18'],
    maxTokens: 1000,
    imageDetail: 'high',
    features: {
      premiumAnalysis: true,
      enhancedAccuracy: true,
      longContext: false
    }
  },
  premium_yearly: {
    ...AI_MODELS['gpt-4o-2024-05-13'],
    maxTokens: 2000,
    imageDetail: 'high',
    features: {
      premiumAnalysis: true,
      enhancedAccuracy: true,
      longContext: true
    }
  }
}

// Get model configuration based on user tier
export function getModelForTier(tier: 'free' | 'premium_monthly' | 'premium_yearly'): ModelConfig {
  console.log(`[DEBUG] getModelForTier called with tier: ${tier}`)
  
  // Check environment variables for overrides
  const envModelKey = `OPENAI_MODEL_${tier.toUpperCase()}`
  const envModelId = process.env[envModelKey]
  
  if (envModelId && AI_MODELS[envModelId]) {
    console.log(`[DEBUG] Using env override model: ${envModelId}`)
    return AI_MODELS[envModelId]
  }
  
  // Use default tier configuration
  const config = TIER_MODEL_CONFIG[tier]
  console.log(`[DEBUG] Tier config:`, {
    tier,
    hasConfig: !!config,
    modelId: config?.modelId,
    displayName: config?.displayName
  })
  
  // Ensure config is valid
  if (!config || !config.modelId) {
    console.error(`[ERROR] Invalid config for tier ${tier}`)
    // Return safe default
    return AI_MODELS['gpt-4o-mini-2024-07-18']
  }
  
  // For premium tiers, check if the future models exist, otherwise use fallback
  if (tier === 'premium_monthly' || tier === 'premium_yearly') {
    // Since config might reference a non-existent model, we need to handle this
    const fallbackModelId = tier === 'premium_monthly' ? 'gpt-4o-mini-2024-07-18' : 'gpt-4o-2024-08-06'
    
    // If the config has a modelId that doesn't exist in AI_MODELS, use fallback
    if (config.modelId && !AI_MODELS[config.modelId]) {
      console.warn(`Model ${config.modelId} not available. Using fallback: ${fallbackModelId}`)
      return AI_MODELS[fallbackModelId]
    }
  }
  
  // Check if model is deprecated
  if (config.deprecated && config.fallbackModel) {
    console.warn(`Model ${config.modelId} is deprecated. Using fallback: ${config.fallbackModel}`)
    return AI_MODELS[config.fallbackModel] || config
  }
  
  console.log(`[DEBUG] Returning config with modelId: ${config.modelId}`)
  return config
}

// Get model by ID with fallback
export function getModelById(modelId: string): ModelConfig | null {
  const model = AI_MODELS[modelId]
  
  if (!model) {
    console.error(`Model ${modelId} not found in configuration`)
    return null
  }
  
  if (model.deprecated && model.fallbackModel) {
    console.warn(`Model ${modelId} is deprecated. Suggesting fallback: ${model.fallbackModel}`)
  }
  
  return model
}

// Calculate estimated cost for analysis
export function calculateAnalysisCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * model.costPerMillionTokens.input
  const outputCost = (outputTokens / 1_000_000) * model.costPerMillionTokens.output
  return inputCost + outputCost
}

// Check if model supports a feature
export function modelSupportsFeature(
  model: ModelConfig,
  feature: keyof ModelConfig['features']
): boolean {
  return model.features[feature] || false
}

// Get all available models
export function getAvailableModels(): ModelConfig[] {
  return Object.values(AI_MODELS).filter(model => !model.deprecated)
}

// Get recommended model for a specific use case
export function getRecommendedModel(useCase: 'accuracy' | 'speed' | 'cost'): ModelConfig {
  switch (useCase) {
    case 'accuracy':
      return AI_MODELS['gpt-4.1'] || AI_MODELS['gpt-4o-2024-08-06']
    case 'speed':
      return AI_MODELS['gpt-4o-mini-2024-07-18']
    case 'cost':
      return AI_MODELS['gpt-4o-mini-2024-07-18']
    default:
      return AI_MODELS['gpt-4o-mini-2024-07-18']
  }
}

// Model migration helper
export function shouldMigrateModel(currentModelId: string): {
  shouldMigrate: boolean
  reason?: string
  suggestedModel?: string
} {
  const model = AI_MODELS[currentModelId]
  
  if (!model) {
    return {
      shouldMigrate: true,
      reason: 'Model not found in configuration',
      suggestedModel: 'gpt-4o-mini-2024-07-18'
    }
  }
  
  if (model.deprecated) {
    return {
      shouldMigrate: true,
      reason: `Model deprecated${model.deprecationDate ? ` on ${model.deprecationDate}` : ''}`,
      suggestedModel: model.fallbackModel || 'gpt-4o-mini-2024-07-18'
    }
  }
  
  return { shouldMigrate: false }
}

// Export model IDs for easy access
export const MODEL_IDS = {
  GPT_4O_MINI: 'gpt-4o-mini-2024-07-18',
  GPT_4O_LATEST: 'gpt-4o-2024-05-13',
  GPT_41_MINI: 'gpt-4.1-mini',  // Future model placeholder
  GPT_41: 'gpt-4.1',            // Future model placeholder
  GPT_4O: 'gpt-4o-2024-08-06'   // Deprecated, use GPT_4O_LATEST
} as const

// Model feature flags
export const MODEL_FEATURES = {
  VISION: 'vision',
  JSON_MODE: 'json_mode',
  FUNCTION_CALLING: 'function_calling',
  SEED_PARAMETER: 'seed_parameter'
} as const