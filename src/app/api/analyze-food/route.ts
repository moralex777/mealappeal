import * as Sentry from '@sentry/nextjs'
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

import { getDbOperations, getSupabaseClient } from '@/lib/database'
import { validateImageDataUrl } from '@/lib/image-utils'
import { log } from '@/lib/logger'
import { checkRateLimit, getRateLimitInfo } from '@/lib/rate-limit'
import { analyzeRequestSchema, validateInput, corsHeaders, securityHeaders, sanitizeHtml } from '@/lib/validation'
import { getModelForTier, calculateAnalysisCost, shouldMigrateModel } from '@/lib/config/ai-models'


// Check required environment variables
if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY']) {
  log.error('Missing required Supabase environment variables', undefined, {
    hasSupabaseUrl: !!process.env['NEXT_PUBLIC_SUPABASE_URL'],
    hasServiceKey: !!process.env['SUPABASE_SERVICE_ROLE_KEY']
  })
}

// Initialize database operations
const db = getDbOperations()
const supabase = getSupabaseClient()

// Initialize OpenAI with fallback for development
const openai = process.env['OPENAI_API_KEY'] 
  ? new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
  : null

// Response cache for cost optimization
const analysisCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes default
const EXTENDED_CACHE_TTL = 30 * 60 * 1000 // 30 minutes for common foods

// Common foods that get extended cache time
const COMMON_FOODS = ['pizza', 'burger', 'salad', 'pasta', 'sandwich', 'chicken', 'rice', 'soup', 'steak', 'fish']

// USDA nutrition cache
const usdaCache = new Map<string, { data: any; timestamp: number }>()
const USDA_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Known allergens database
const COMMON_ALLERGENS = [
  'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 
  'wheat', 'soybeans', 'sesame', 'gluten', 'lactose'
]

interface IFoodAnalysis {
  foodName: string
  confidence: number
  ingredients: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    cholesterol?: number
    saturatedFat?: number
    transFat?: number
    vitamins?: Record<string, number>
    minerals?: Record<string, number>
    source?: string
  }
  portion: {
    estimatedWeight: number
    unit: string
    servingSize: string
    servingsDetected: number
  }
  allergens: {
    detected: string[]
    possible: string[]
    confidence: number
  }
  healthInsights: {
    score: number
    positives: string[]
    concerns: string[]
    recommendations: string[]
    dietaryInfo: string[]
  }
  description: string
  tags: string[]
  premiumAnalysis?: {
    [key: string]: {
      score: number
      insights: string[]
      metrics: Record<string, string>
      recommendations: string[]
      deepAnalysis?: string
    }
  }
}

// Helper function to create secure responses
function createSecureResponse(data: any, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init)
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// Handle CORS preflight requests
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStartTime = Date.now()
  const requestId = crypto.randomUUID()
  
  // Set correlation ID for request tracing
  Sentry.setTag('requestId', requestId)
  
  log.apiRequest('POST', '/api/analyze-food', undefined, { requestId })
  
  // Variables that need to be accessible in catch block
  let user: any = null
  let userTierLevel = 'free'
  let modelUsed = 'gpt-4o-mini-2024-07-18'
  let migrationCheck: any = { shouldMigrate: false }
  let fallbackAttempted = false
  let modelConfig: any = null
  let aiResponse: any = null
  let analysis: IFoodAnalysis | null = null
  let estimatedCost = 0
  
  try {
    // Check if Supabase is properly configured
    if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY']) {
      log.warn('Supabase not properly configured, returning mock data', { requestId })
      return createSecureResponse(getMockAnalysis('free', 'health'))
    }
    
    // Check OpenAI configuration
    if (!process.env['OPENAI_API_KEY']) {
      log.warn('OPENAI_API_KEY not found in environment variables, returning mock data', { requestId })
      return createSecureResponse(getMockAnalysis('free', 'health'))
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validation = validateInput(analyzeRequestSchema, body)
    
    if (!validation.success) {
      log.security('Invalid input validation', 'medium', {
        requestId,
        errors: validation.errors,
        userAgent: request.headers.get('user-agent')
      })
      
      return createSecureResponse(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validation.errors
        },
        { status: 400 }
      )
    }
    
    const { imageDataUrl, focusMode } = validation.data!
    
    // Get user authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return createSecureResponse(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Verify user token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    user = authUser
    
    if (authError || !user) {
      log.security('Invalid auth token', 'medium', { 
        requestId, 
        authError: authError?.message 
      })
      return createSecureResponse(
        { success: false, error: 'Invalid authorization' },
        { status: 401 }
      )
    }
    
    // Update request context with user info
    Sentry.setUser({ id: user.id, email: user.email })
    log.apiRequest('POST', '/api/analyze-food', user.id, { requestId })
    
    // Get user profile for tier checking with optimized database operation
    const profile = await db.getProfile(user.id)
      
    if (!profile) {
      log.error('Profile fetch failed', undefined, { 
        requestId, 
        userId: user.id 
      })
      return createSecureResponse(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    const isPremium = profile.subscription_tier === 'premium_monthly' || 
                     profile.subscription_tier === 'premium_yearly'
    userTierLevel = profile.subscription_tier || 'free'
    
    // Get model configuration based on user tier
    try {
      modelConfig = getModelForTier(userTierLevel as 'free' | 'premium_monthly' | 'premium_yearly')
    } catch (configError) {
      log.error('Failed to get model configuration', configError, {
        userTier: userTierLevel
      })
      // Use safe fallback
      modelConfig = {
        modelId: 'gpt-4o-mini-2024-07-18',
        displayName: 'GPT-4o Mini (Fallback)',
        maxTokens: 500,
        temperature: 0.3,
        imageDetail: 'low' as const,
        costPerMillionTokens: { input: 0.15, output: 0.60 },
        features: {
          premiumAnalysis: false,
          enhancedAccuracy: false,
          longContext: false
        }
      }
    }
    
    // Log model selection for debugging
    log.info('Model selected for analysis', {
      userTier: userTierLevel,
      modelId: modelConfig.modelId,
      modelDisplayName: modelConfig.displayName,
      hasModelId: !!modelConfig.modelId
    })
    
    // Ensure we have a valid model
    if (!modelConfig.modelId) {
      log.error('Invalid model configuration', undefined, {
        userTier: userTierLevel,
        config: modelConfig
      })
      // Use hardcoded fallback
      modelConfig.modelId = 'gpt-4o-mini-2024-07-18'
    }
    
    // Check if current model needs migration
    migrationCheck = shouldMigrateModel(modelConfig.modelId)
    if (migrationCheck.shouldMigrate) {
      log.warn('Model migration recommended', {
        currentModel: modelConfig.modelId,
        reason: migrationCheck.reason,
        suggestedModel: migrationCheck.suggestedModel
      })
    }
    
    // Enhanced rate limiting with Redis
    const rateLimitResult = await checkRateLimit(user.id, userTierLevel as 'free' | 'premium_monthly' | 'premium_yearly')
    
    log.rateLimit(user.id, userTierLevel, rateLimitResult.success, rateLimitResult.remaining, { requestId })
    
    if (!rateLimitResult.success) {
      const rateLimitInfo = getRateLimitInfo(userTierLevel as 'free' | 'premium_monthly' | 'premium_yearly')
      
      log.security('Rate limit exceeded', 'low', {
        requestId,
        userId: user.id,
        tier: userTierLevel,
        remaining: rateLimitResult.remaining
      })
      
      return createSecureResponse(
        { 
          success: false, 
          error: 'Rate limit exceeded. Upgrade to premium for more analyses.',
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          limit: rateLimitInfo.max
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitInfo.max.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    // Check daily limits for free users with optimized query
    if (userTierLevel === 'free') {
      try {
        const dailyMeals = await db.getMealCountToday(user.id)
        
        if (dailyMeals >= 3) {
          log.security('Daily meal limit exceeded', 'low', {
            requestId,
            userId: user.id,
            dailyCount: dailyMeals
          })
          
          return createSecureResponse(
            { 
              success: false, 
              error: 'Daily meal limit reached. Free users can analyze 3 meals per day.',
              dailyCount: dailyMeals,
              limit: 3,
              upgradeRequired: true
            },
            { status: 429 }
          )
        }
      } catch (error) {
        log.error('Failed to check daily meal count', error as Error, { requestId, userId: user.id })
        // Continue with request if count check fails - don't block user
      }
    }

    // Validate image before processing
    const imageValidation = validateImageDataUrl(imageDataUrl)
    if (!imageValidation.valid) {
      return createSecureResponse(
        {
          success: false,
          error: imageValidation.error || 'Invalid image format'
        },
        { status: 400 }
      )
    }

    // Log image size for monitoring
    if (imageValidation.sizeKB) {
      log.info('Processing image', {
        requestId,
        userId: user.id,
        imageSizeKB: imageValidation.sizeKB,
        needsCompression: imageValidation.sizeKB > 45
      })
    }

    // Check cache first
    const cacheKey = generateCacheKey(imageDataUrl, focusMode, userTierLevel)
    const cached = analysisCache.get(cacheKey)
    if (cached) {
      // Determine cache expiry based on food type
      const isCommonFood = cached.data?.analysis?.foodName && 
        COMMON_FOODS.some(food => 
          cached.data.analysis.foodName.toLowerCase().includes(food.toLowerCase())
        )
      const cacheExpiry = isCommonFood ? EXTENDED_CACHE_TTL : CACHE_TTL
      
      if (Date.now() - cached.timestamp < cacheExpiry) {
        console.log(`📦 Returning cached analysis (${isCommonFood ? 'extended' : 'standard'} cache)`)
        return createSecureResponse({
          ...cached.data,
          cached: true
        })
      }
    }

    console.log('🔍 Analyzing food for user:', user.email, 'tier:', userTierLevel)
    console.log('📊 OpenAI configured:', !!openai)
    console.log('🔑 API Key configured:', !!process.env['OPENAI_API_KEY'])
    
    // Check if OpenAI is configured
    if (!openai) {
      console.log('🚧 OpenAI not configured, returning enhanced mock data')
      return createSecureResponse(getMockAnalysis(userTierLevel, focusMode))
    }

    // Perform real OpenAI Vision API analysis
    const analysisStartTime = Date.now()
    
    try {
      console.log('🤖 Starting OpenAI Vision API call...')
      
      // Check if OpenAI is available
      if (!openai) {
        throw new Error('OpenAI API not configured')
      }
      
      // Generate comprehensive prompt based on tier
      const prompt = generateComprehensivePrompt(userTierLevel, focusMode)
      
      // Attempt analysis with configured model
      modelUsed = modelConfig.modelId
      fallbackAttempted = false
      estimatedCost = 0
      
      try {
        console.log(`🎯 Calling OpenAI with model: ${modelConfig.modelId}`)
        aiResponse = await openai.chat.completions.create({
          model: modelConfig.modelId,
          messages: [
            {
              role: "system",
              content: "You are an expert nutritionist and food analyst. Provide accurate, detailed food analysis in valid JSON format only."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageDataUrl,
                    detail: modelConfig.imageDetail
                  }
                }
              ]
            }
          ],
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          seed: 42, // Consistent results for same meals
          response_format: { type: "json_object" }
        })
        console.log('✅ OpenAI call successful')
      } catch (modelError: any) {
        console.error('❌ OpenAI API Error:', {
          error: modelError.message,
          code: modelError.code,
          status: modelError.status,
          model: modelConfig.modelId
        })
        
        // Handle model-specific errors
        if (modelError.code === 'model_not_found' || modelError.status === 404) {
          log.warn('Primary model not available, attempting fallback', {
            primaryModel: modelConfig.modelId,
            error: modelError.message
          })
          
          // Try fallback model if available
          if (modelConfig.fallbackModel) {
            fallbackAttempted = true
            modelUsed = modelConfig.fallbackModel
            
            aiResponse = await openai.chat.completions.create({
              model: modelConfig.fallbackModel,
              messages: [
                {
                  role: "system",
                  content: "You are an expert nutritionist and food analyst. Provide accurate, detailed food analysis in valid JSON format only."
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: prompt
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageDataUrl,
                        detail: isPremium ? "high" : "low"
                      }
                    }
                  ]
                }
              ],
              max_tokens: isPremium ? 2000 : 500,
              temperature: 0.3,
              seed: 42,
              response_format: { type: "json_object" }
            })
          } else {
            throw modelError
          }
        } else {
          throw modelError
        }
      }
      
      const processingTime = Date.now() - analysisStartTime
      console.log(`✅ OpenAI analysis completed in ${processingTime}ms using model: ${modelUsed}`)
      
      // Calculate cost if usage data is available
      if (aiResponse.usage) {
        estimatedCost = calculateAnalysisCost(
          modelConfig,
          aiResponse.usage.prompt_tokens || 0,
          aiResponse.usage.completion_tokens || 0
        )
        console.log(`💰 Analysis cost: $${estimatedCost.toFixed(4)} (${aiResponse.usage.total_tokens} tokens)`)
      }
      
      // Parse and validate response
      const analysisText = aiResponse.choices[0]?.message?.content
      console.log('📝 Raw AI response length:', analysisText?.length || 0)
      
      if (!analysisText) {
        throw new Error('No analysis content received from AI')
      }
      
      try {
        analysis = JSON.parse(analysisText) as IFoodAnalysis
        console.log('✅ Successfully parsed AI response')
      } catch (parseError: any) {
        console.error('❌ JSON parse error:', parseError.message)
        console.error('📝 Raw response preview:', `${analysisText?.substring(0, 200)  }...`)
        throw new Error(`Failed to parse AI response: ${parseError.message}`)
      }
      
      // Validate and enhance analysis
      analysis = await enhanceAnalysis(analysis)
      
    } catch (openaiError: any) {
      console.error('❌ OpenAI error:', openaiError.message)
      console.error('🔍 Error details:', {
        code: openaiError.code,
        status: openaiError.status,
        type: openaiError.type
      })
      
      // Intelligent fallback based on error type
      if (openaiError.code === 'rate_limit_exceeded') {
        return createSecureResponse({
          success: false,
          error: 'Analysis service is busy. Please try again in a moment.',
          retryAfter: 10
        }, { status: 503 })
      }
      
      // Return enhanced fallback for other errors
      return createSecureResponse(getFallbackAnalysis(userTierLevel))
    }
    
    // USDA enhancement for premium users
    if (isPremium) {
      console.log('🧬 Enhancing with USDA nutrition data for premium user')
      try {
        const usdaData = await getUSDANutrition(analysis.foodName)
        if (usdaData) {
          // Enhance nutrition data with USDA scientific values
          analysis.nutrition = {
            ...analysis.nutrition,
            ...usdaData,
            // Keep original values as fallback and mark enhanced
            source: 'USDA Enhanced'
          }
          console.log('✅ Successfully enhanced with USDA nutrition data')
        } else {
          console.log('⚠️ No USDA data found for this food, using OpenAI analysis')
        }
      } catch (error) {
        console.error('❌ USDA enhancement failed:', error)
        console.log('🔄 Continuing with OpenAI analysis as fallback')
      }
    } else {
      console.log('⏭️ Free user - using smart estimates only')
    }
    
    // Skip image upload for now - focus on basic functionality
    console.log('⏭️ Skipping image upload - storing base64 directly')

    // Save meal to database with sanitized data
    const mealData = {
      user_id: user.id,
      title: sanitizeHtml(analysis.foodName || 'Analyzed Meal').substring(0, 200),
      description: analysis.description ? sanitizeHtml(analysis.description).substring(0, 1000) : null,
      image_url: imageDataUrl, // Store full image, no truncation
      image_path: `meals/${user.id}/${Date.now()}.jpg`, // Required field
      basic_nutrition: {
        energy_kcal: Math.max(0, Math.min(9999, analysis.nutrition.calories || 0)),
        protein_g: Math.max(0, Math.min(999, analysis.nutrition.protein || 0)),
        carbs_g: Math.max(0, Math.min(999, analysis.nutrition.carbs || 0)),
        fat_g: Math.max(0, Math.min(999, analysis.nutrition.fat || 0))
      },
      health_score: Math.max(0, Math.min(100, analysis.healthInsights?.score || 75)),
      meal_tags: (analysis.tags || []).map(tag => sanitizeHtml(tag)).slice(0, 20),
      created_at: new Date().toISOString()
    }
    
    log.info('Saving meal to database', {
      requestId,
      userId: user.id,
      foodName: analysis.foodName,
      imageUrlLength: mealData.image_url?.length || 0
    })

    let savedMeal: any
    try {
      savedMeal = await db.createMeal(mealData)
      
      log.info('Meal saved successfully', {
        requestId,
        userId: user.id,
        mealId: savedMeal.id,
        foodName: analysis.foodName
      })
      
      // Save ingredients and create relationships
      if (analysis.ingredients && analysis.ingredients.length > 0) {
        log.info('Saving ingredients', {
          requestId,
          mealId: savedMeal.id,
          ingredientCount: analysis.ingredients.length
        })
        
        try {
          for (const ingredientName of analysis.ingredients) {
            // Sanitize and normalize ingredient name
            const normalizedName = sanitizeHtml(ingredientName.trim().toLowerCase())
            
            if (normalizedName) {
              // Insert or get existing ingredient
              const { data: ingredient, error: ingredientError } = await supabase
                .from('ingredients')
                .upsert({ 
                  name: normalizedName,
                  // Basic nutritional estimates could be added here in the future
                }, {
                  onConflict: 'name'
                })
                .select()
                .single()
              
              if (ingredientError) {
                log.warn('Failed to save ingredient', {
                  requestId,
                  ingredient: normalizedName,
                  error: ingredientError.message
                })
                continue
              }
              
              // Create meal-ingredient relationship
              if (ingredient) {
                const { error: linkError } = await supabase
                  .from('meal_ingredients')
                  .insert({
                    meal_id: savedMeal.id,
                    ingredient_id: ingredient.id,
                    quantity: 100, // Default quantity, could be enhanced with portion data
                    unit: 'g' // Default unit
                  })
                
                if (linkError) {
                  log.warn('Failed to link ingredient to meal', {
                    requestId,
                    mealId: savedMeal.id,
                    ingredientId: ingredient.id,
                    error: linkError.message
                  })
                }
              }
            }
          }
          
          log.info('Ingredients saved successfully', {
            requestId,
            mealId: savedMeal.id
          })
        } catch (ingredientError) {
          // Don't fail the whole request if ingredient saving fails
          log.error('Error saving ingredients', ingredientError as Error, {
            requestId,
            mealId: savedMeal.id
          })
        }
      }
    } catch (saveError: any) {
      log.error('Database save error', saveError, {
        requestId,
        userId: user.id,
        errorCode: saveError.code,
        errorDetails: saveError.details
      })
      
      return createSecureResponse(
        { 
          success: false, 
          error: 'Failed to save meal analysis',
          requestId
        },
        { status: 500 }
      )
    }

    // Prepare response
    const response = {
      success: true,
      mealId: savedMeal.id,
      analysis: {
        foodName: analysis.foodName,
        description: analysis.description,
        confidence: analysis.confidence,
        nutrition: analysis.nutrition,
        ingredients: isPremium ? analysis.ingredients : analysis.ingredients.slice(0, 3),
        portion: analysis.portion,
        allergens: isPremium ? analysis.allergens : {
          detected: analysis.allergens.detected,
          possible: [],
          confidence: analysis.allergens.confidence
        },
        healthInsights: analysis.healthInsights,
        tags: analysis.tags,
        premiumAnalysis: isPremium ? analysis.premiumAnalysis : undefined,
        tier: userTierLevel
      },
      metadata: {
        processingTime: `${Date.now() - requestStartTime}ms`,
        model: modelUsed,
        modelVersion: modelConfig.displayName,
        fallbackUsed: fallbackAttempted,
        tier: userTierLevel,
        cached: false,
        seed: 42,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        imageDetail: modelConfig.imageDetail,
        estimatedCost: estimatedCost ? `$${estimatedCost.toFixed(4)}` : undefined,
        usage: aiResponse?.usage
      }
    }

    // Cache the response
    analysisCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    })

    // Log successful response
    const duration = Date.now() - requestStartTime
    log.apiResponse('POST', '/api/analyze-food', 200, duration, user.id, { 
      requestId,
      tier: userTierLevel,
      cached: false,
      foodName: analysis.foodName
    })
    
    log.metric('food_analysis_success', 1, 'count', {
      requestId,
      userId: user.id,
      tier: userTierLevel,
      duration,
      model: modelUsed,
      fallbackUsed: fallbackAttempted
    })
    
    // Log deprecation warning if needed
    if (migrationCheck.shouldMigrate) {
      log.metric('deprecated_model_usage', 1, 'count', {
        model: modelConfig.modelId,
        suggestedModel: migrationCheck.suggestedModel,
        userId: user.id
      })
    }

    return createSecureResponse(response)
    
  } catch (error: any) {
    const duration = Date.now() - requestStartTime
    
    // Log error with full context
    log.error('Food analysis failed', error, {
      requestId,
      userId: user?.id,
      tier: userTierLevel,
      duration,
      errorCode: error.code,
      errorName: error.name
    })
    
    // Report to Sentry
    Sentry.captureException(error, {
      tags: {
        requestId,
        operation: 'food_analysis'
      },
      extra: {
        userId: user?.id,
        tier: userTierLevel,
        duration
      }
    })
    
    log.apiResponse('POST', '/api/analyze-food', 500, duration, user?.id, { 
      requestId,
      error: error.message
    })
    
    return createSecureResponse(
      { 
        success: false, 
        error: 'Analysis failed. Please try again.',
        requestId // Include for support
      },
      { status: 500 }
    )
  }
}

// Enhanced prompt generation
function generateComprehensivePrompt(tier: string, focusMode: string): string {
  const basePrompt = `Analyze this food image and provide nutritional information. Return ONLY valid JSON matching this EXACT structure with NO additional text or formatting:

{
  "foodName": "Specific name of the food item",
  "confidence": 0.95,
  "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
  "nutrition": {
    "calories": 250,
    "protein": 12,
    "carbs": 35,
    "fat": 8,
    "fiber": 4,
    "sugar": 8,
    "sodium": 450
  },
  "portion": {
    "estimatedWeight": 200,
    "unit": "grams",
    "servingSize": "1 plate",
    "servingsDetected": 1
  },
  "allergens": {
    "detected": ["wheat", "milk"],
    "possible": ["eggs"],
    "confidence": 0.9
  },
  "healthInsights": {
    "score": 75,
    "positives": ["High in protein", "Good fiber content"],
    "concerns": ["High sodium"],
    "recommendations": ["Add more vegetables"],
    "dietaryInfo": ["vegetarian-friendly"]
  },
  "description": "Brief description of the food",
  "tags": ["healthy", "protein-rich", "homemade"]`

  const premiumAdditions = tier !== 'free' ? `,
  "premiumAnalysis": {
    "${focusMode}Mode": {
      "score": 85,
      "insights": [
        "Detailed ${focusMode}-specific insight 1",
        "Detailed ${focusMode}-specific insight 2",
        "Detailed ${focusMode}-specific insight 3"
      ],
      "metrics": {
        "key1": "value with unit",
        "key2": "value with unit",
        "key3": "value with unit"
      },
      "recommendations": [
        "Specific actionable recommendation 1",
        "Specific actionable recommendation 2"
      ],
      "deepAnalysis": "Comprehensive ${focusMode}-focused analysis paragraph"
    }
  }` : ''

  const focusInstructions = {
    health: `Focus on nutritional density, micronutrients, antioxidants, and overall health impact. Analyze vitamins, minerals, and phytonutrients.`,
    fitness: `Analyze for pre/post workout suitability, muscle recovery, protein quality, glycemic index, and athletic performance optimization.`,
    cultural: `Identify cultural origins, traditional preparation methods, regional variations, and cultural significance of ingredients and cooking style.`,
    chef: `Evaluate cooking techniques, ingredient quality, plating aesthetics, flavor profiles, texture combinations, and culinary skill level.`,
    science: `Provide biochemical analysis, metabolic pathways, nutrient bioavailability, food chemistry, and molecular gastronomy aspects.`,
    budget: `Assess ingredient costs, seasonal pricing, nutritional value per dollar, cost-saving substitutions, and meal prep efficiency.`
  }

  return `${basePrompt}${premiumAdditions}
}

${focusInstructions[focusMode as keyof typeof focusInstructions] || focusInstructions.health}

Be accurate with portion estimation based on visual cues. Identify all visible ingredients. Check for common allergens carefully. Provide realistic nutritional values.`
}

// Cache key generation
function generateCacheKey(image: string, mode: string, tier: string): string {
  // Simple hash of image data for caching
  const imageHash = image.slice(-20) // Use last 20 chars as simple hash
  return `${tier}-${mode}-${imageHash}`
}

// Analysis enhancement
async function enhanceAnalysis(analysis: IFoodAnalysis): Promise<IFoodAnalysis> {
  // Ensure all required fields are present
  analysis.confidence = analysis.confidence || 0.85
  analysis.ingredients = analysis.ingredients || []
  analysis.tags = analysis.tags || []
  
  // Enhance allergen detection
  if (!analysis.allergens) {
    analysis.allergens = detectAllergens(analysis.ingredients)
  }
  
  // Calculate health score if not provided
  if (!analysis.healthInsights?.score) {
    analysis.healthInsights = calculateHealthInsights(analysis.nutrition)
  }
  
  // Estimate portion if not provided
  if (!analysis.portion) {
    analysis.portion = estimatePortion(analysis.foodName)
  }
  
  return analysis
}

// Allergen detection
function detectAllergens(ingredients: string[]): IFoodAnalysis['allergens'] {
  const detected: string[] = []
  const possible: string[] = []
  
  const ingredientText = ingredients.join(' ').toLowerCase()
  
  for (const allergen of COMMON_ALLERGENS) {
    if (ingredientText.includes(allergen)) {
      detected.push(allergen)
    } else if (ingredientText.includes(allergen.slice(0, 3))) {
      possible.push(allergen)
    }
  }
  
  return {
    detected,
    possible,
    confidence: detected.length > 0 ? 0.9 : 0.7
  }
}

// Health insights calculation
function calculateHealthInsights(nutrition: IFoodAnalysis['nutrition']): IFoodAnalysis['healthInsights'] {
  const positives: string[] = []
  const concerns: string[] = []
  const recommendations: string[] = []
  const dietaryInfo: string[] = []
  
  // Analyze macros
  if (nutrition.protein > 20) {positives.push('High in protein')}
  if (nutrition.fiber && nutrition.fiber > 5) {positives.push('Excellent fiber source')}
  if (nutrition.calories < 300) {positives.push('Low calorie option')}
  
  if (nutrition.sodium && nutrition.sodium > 1000) {concerns.push('High sodium content')}
  if (nutrition.saturatedFat && nutrition.saturatedFat > 10) {concerns.push('High in saturated fat')}
  if (nutrition.sugar && nutrition.sugar > 20) {concerns.push('High sugar content')}
  
  // Calculate health score
  let score = 70
  score += positives.length * 5
  score -= concerns.length * 10
  score = Math.max(0, Math.min(100, score))
  
  // Add recommendations
  if (nutrition.fiber && nutrition.fiber < 3) {recommendations.push('Add more fiber-rich foods')}
  if (nutrition.protein < 10) {recommendations.push('Consider adding a protein source')}
  
  return { score, positives, concerns, recommendations, dietaryInfo }
}

// Portion estimation
function estimatePortion(foodName: string): IFoodAnalysis['portion'] {
  // Simple estimation based on common portions
  const commonPortions: Record<string, any> = {
    'salad': { weight: 150, unit: 'grams', size: '1 bowl' },
    'sandwich': { weight: 200, unit: 'grams', size: '1 sandwich' },
    'pasta': { weight: 250, unit: 'grams', size: '1 plate' },
    'pizza': { weight: 150, unit: 'grams', size: '1 slice' },
    'burger': { weight: 250, unit: 'grams', size: '1 burger' }
  }
  
  const lowerFood = foodName.toLowerCase()
  for (const [key, portion] of Object.entries(commonPortions)) {
    if (lowerFood.includes(key)) {
      return {
        estimatedWeight: portion.weight,
        unit: portion.unit,
        servingSize: portion.size,
        servingsDetected: 1
      }
    }
  }
  
  // Default portion
  return {
    estimatedWeight: 200,
    unit: 'grams',
    servingSize: '1 serving',
    servingsDetected: 1
  }
}

// USDA nutrition lookup
async function getUSDANutrition(foodName: string): Promise<any | null> {
  const cacheKey = foodName.toLowerCase().trim()
  
  // Check cache
  const cached = usdaCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < USDA_CACHE_TTL) {
    return cached.data
  }
  
  try {
    const apiKey = process.env['USDA_API_KEY'] || 'DEMO_KEY'
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&dataType=Foundation,SR%20Legacy&pageSize=1&api_key=${apiKey}`
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }
    
    const data = await response.json()
    if (!data.foods || data.foods.length === 0) {
      return null
    }
    
    const food = data.foods[0]
    const nutrients = food.foodNutrients || []
    
    // Extract nutrients with proper unit conversion
    const nutrition = {
      calories: findNutrientValue(nutrients, [1008]),
      protein: findNutrientValue(nutrients, [1003]),
      carbs: findNutrientValue(nutrients, [1005]),
      fat: findNutrientValue(nutrients, [1004]),
      fiber: findNutrientValue(nutrients, [1079]),
      sugar: findNutrientValue(nutrients, [2000]),
      sodium: findNutrientValue(nutrients, [1093]),
      cholesterol: findNutrientValue(nutrients, [1253]),
      saturatedFat: findNutrientValue(nutrients, [1258]),
      transFat: findNutrientValue(nutrients, [1257])
    }
    
    // Cache result
    usdaCache.set(cacheKey, {
      data: nutrition,
      timestamp: Date.now()
    })
    
    return nutrition
    
  } catch (error) {
    console.error('USDA API error:', error)
    return null
  }
}

// Helper for nutrient extraction
function findNutrientValue(nutrients: any[], nutrientIds: number[]): number | null {
  for (const id of nutrientIds) {
    const nutrient = nutrients.find((n: any) => n.nutrientId === id)
    if (nutrient && typeof nutrient.value === 'number') {
      return Math.round(nutrient.value * 100) / 100
    }
  }
  return null
}

// Mock data for development
function getMockAnalysis(tier: string, focusMode: string): any {
  const isPremium = tier !== 'free'
  return {
    success: true,
    analysis: {
      foodName: "Grilled Chicken Salad",
      confidence: 0.95,
      nutrition: {
        calories: 320,
        protein: 35,
        carbs: 12,
        fat: 15,
        fiber: 4,
        sugar: 6,
        sodium: 580,
        source: tier === 'free' ? 'Smart estimate (dev mode)' : 'USDA Enhanced (dev mode)'
      },
      ingredients: isPremium 
        ? ["grilled chicken breast", "mixed greens", "cherry tomatoes", "cucumber", "feta cheese", "olive oil", "lemon"]
        : ["chicken", "vegetables", "cheese"],
      portion: {
        estimatedWeight: 350,
        unit: "grams",
        servingSize: "1 large bowl",
        servingsDetected: 1
      },
      allergens: {
        detected: ["milk"],
        possible: isPremium ? ["eggs"] : [],
        confidence: 0.85
      },
      healthInsights: {
        score: 88,
        positives: ["High protein", "Low carb", "Rich in vitamins"],
        concerns: ["Moderate sodium"],
        recommendations: isPremium 
          ? ["Add whole grains for sustained energy", "Include more colorful vegetables"]
          : ["Healthy choice!"],
        dietaryInfo: ["gluten-free", "keto-friendly"]
      },
      description: "A nutritious grilled chicken salad with fresh vegetables and a light dressing. Perfect for a healthy lunch.",
      tags: ["healthy", "high-protein", "low-carb", "salad"],
      premiumAnalysis: isPremium ? {
        [`${focusMode}Mode`]: {
          score: 92,
          insights: [
            "Excellent protein-to-calorie ratio for muscle maintenance",
            "Antioxidant-rich vegetables support recovery",
            "Balanced macros for sustained energy"
          ],
          metrics: {
            "proteinQuality": "Complete amino acid profile",
            "glycemicIndex": "Low (< 40)",
            "satietyScore": "High (8/10)"
          },
          recommendations: [
            "Add quinoa for post-workout carb replenishment",
            "Include avocado for healthy fats and satiety"
          ],
          deepAnalysis: "This meal provides an optimal balance of lean protein and micronutrients..."
        }
      } : undefined,
      tier
    },
    metadata: {
      processingTime: "0.8s",
      mode: "development",
      tier,
      cached: false
    }
  }
}

// Fallback analysis for errors
function getFallbackAnalysis(tier: string): any {
  return {
    success: true,
    fallback: true,
    analysis: {
      foodName: "Analyzed Meal",
      confidence: 0.7,
      nutrition: {
        calories: 400,
        protein: 20,
        carbs: 45,
        fat: 15,
        source: 'Fallback estimate'
      },
      ingredients: ["various ingredients"],
      portion: {
        estimatedWeight: 250,
        unit: "grams",
        servingSize: "1 serving",
        servingsDetected: 1
      },
      allergens: {
        detected: [],
        possible: ["Please review ingredients"],
        confidence: 0.5
      },
      healthInsights: {
        score: 70,
        positives: ["Balanced meal"],
        concerns: [],
        recommendations: ["Analysis limited - please try again"],
        dietaryInfo: []
      },
      description: "Unable to perform detailed analysis. Please try again for accurate results.",
      tags: ["meal"],
      tier
    },
    metadata: {
      processingTime: "0.1s",
      mode: "fallback",
      tier,
      cached: false
    }
  }
}