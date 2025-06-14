import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

// Initialize OpenAI with fallback for development
const openai = process.env['OPENAI_API_KEY'] 
  ? new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
  : null

// Enhanced rate limiting with tiered limits
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMITS = {
  free: { max: 10, window: 60 * 60 * 1000 }, // 10 per hour
  premium_monthly: { max: 100, window: 60 * 60 * 1000 }, // 100 per hour
  premium_yearly: { max: 200, window: 60 * 60 * 1000 } // 200 per hour
}

// Response cache for cost optimization
const analysisCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { imageDataUrl, focusMode = 'health' } = await request.json()
    
    // Validate image data
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image data provided' },
        { status: 400 }
      )
    }
    
    // Get user authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Invalid authorization' },
        { status: 401 }
      )
    }
    
    // Get user profile for tier checking
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, meal_count')
      .eq('id', user.id)
      .single()
      
    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    const isPremium = profile.subscription_tier === 'premium_monthly' || 
                     profile.subscription_tier === 'premium_yearly'
    const userTierLevel = profile.subscription_tier || 'free'
    
    // Enhanced rate limiting
    const rateLimitConfig = RATE_LIMITS[userTierLevel as keyof typeof RATE_LIMITS] || RATE_LIMITS.free
    if (!checkRateLimit(user.id, rateLimitConfig)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Upgrade to premium for more analyses.',
          remainingTime: getRemainingTime(user.id)
        },
        { status: 429 }
      )
    }

    // Check cache first
    const cacheKey = generateCacheKey(imageDataUrl, focusMode, userTierLevel)
    const cached = analysisCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Returning cached analysis')
      return NextResponse.json({
        ...cached.data,
        cached: true
      })
    }

    console.log('🔍 Analyzing food for user:', user.email, 'tier:', userTierLevel)
    
    // Check if OpenAI is configured
    if (!openai) {
      console.log('🚧 OpenAI not configured, returning enhanced mock data')
      return NextResponse.json(getMockAnalysis(userTierLevel, focusMode))
    }

    // Perform real OpenAI Vision API analysis
    let analysis: IFoodAnalysis
    try {
      const startTime = Date.now()
      
      // Check if OpenAI is available
      if (!openai) {
        throw new Error('OpenAI API not configured')
      }
      
      // Generate comprehensive prompt based on tier
      const prompt = generateComprehensivePrompt(userTierLevel, focusMode)
      
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
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
        temperature: 0.2, // Lower temperature for more consistent results
        response_format: { type: "json_object" }
      })
      
      const processingTime = Date.now() - startTime
      console.log(`✅ OpenAI analysis completed in ${processingTime}ms`)
      
      // Parse and validate response
      const analysisText = aiResponse.choices[0]?.message?.content
      if (!analysisText) {
        throw new Error('No analysis content received from AI')
      }
      
      analysis = JSON.parse(analysisText) as IFoodAnalysis
      
      // Validate and enhance analysis
      analysis = await enhanceAnalysis(analysis)
      
    } catch (openaiError: any) {
      console.error('❌ OpenAI error:', openaiError.message)
      
      // Intelligent fallback based on error type
      if (openaiError.code === 'rate_limit_exceeded') {
        return NextResponse.json({
          success: false,
          error: 'AI service is busy. Please try again in a moment.',
          retryAfter: 10
        }, { status: 503 })
      }
      
      // Return enhanced fallback for other errors
      return NextResponse.json(getFallbackAnalysis(userTierLevel))
    }
    
    // Enhance nutrition data with USDA API
    if (analysis.foodName) {
      const usdaNutrition = await getUSDANutrition(analysis.foodName)
      if (usdaNutrition) {
        analysis.nutrition = {
          ...analysis.nutrition,
          ...usdaNutrition,
          source: 'USDA + AI'
        } as any
        console.log('✅ Enhanced with USDA nutrition data')
      }
    }
    
    // Upload image to Supabase Storage
    let imageUploadResult
    let storagePath: string | null = null
    let thumbnailPath: string | null = null
    let cdnUrl: string | null = null
    let imageSize: number | null = null
    let imageDimensions: any = null

    try {
      const { uploadImage, checkStorageQuota } = await import('@/lib/supabase-storage')
      
      // Check storage quota first
      const quotaInfo = await checkStorageQuota(supabase, user.id, userTierLevel)
      if (!quotaInfo.canUpload) {
        return NextResponse.json({
          success: false,
          error: quotaInfo.filesThisMonth >= quotaInfo.filesLimit
            ? 'Monthly upload limit reached. Upgrade to premium for unlimited uploads.'
            : 'Storage limit reached. Upgrade to premium for more storage.',
          quota: quotaInfo
        }, { status: 413 })
      }

      // Upload image to storage
      imageUploadResult = await uploadImage(supabase, imageDataUrl, {
        userId: user.id,
        bucket: 'meal-images',
        folder: 'meals',
        fileName: `meal_${Date.now()}`,
        quality: isPremium ? 90 : 80,
        resize: true,
        generateThumbnail: true,
        metadata: {
          userTier: userTierLevel,
          foodName: analysis.foodName || 'Unknown',
          analysisMode: focusMode,
          uploadSource: 'analysis'
        }
      })

      if (imageUploadResult.success) {
        storagePath = imageUploadResult.path || null
        thumbnailPath = imageUploadResult.thumbnailUrl || null
        cdnUrl = imageUploadResult.cdnUrl || null
        imageSize = imageUploadResult.size || null
        imageDimensions = imageUploadResult.dimensions || null
        console.log('✅ Image uploaded to storage:', storagePath)
      } else {
        console.error('❌ Image upload failed:', imageUploadResult.error)
        // Continue with analysis but without storage
      }
    } catch (uploadError: any) {
      console.error('❌ Storage upload error:', uploadError)
      // Continue with analysis but store base64 as fallback
    }

    // Save meal to database
    const mealData = {
      user_id: user.id,
      title: analysis.foodName || 'Analyzed Meal',
      description: analysis.description || null,
      image_url: storagePath ? null : imageDataUrl, // Fallback to base64 if storage failed
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      cdn_url: cdnUrl,
      image_size: imageSize,
      image_dimensions: imageDimensions,
      image_path: storagePath || `meals/${user.id}/${Date.now()}.jpg`, // Legacy field
      basic_nutrition: {
        energy_kcal: analysis.nutrition.calories || 0,
        protein_g: analysis.nutrition.protein || 0,
        carbs_g: analysis.nutrition.carbs || 0,
        fat_g: analysis.nutrition.fat || 0
      },
      premium_nutrition: isPremium ? {
        fiber_g: analysis.nutrition.fiber,
        sugar_g: analysis.nutrition.sugar,
        sodium_mg: analysis.nutrition.sodium,
        ingredients: analysis.ingredients,
        allergens: analysis.allergens,
        portion_info: analysis.portion,
        health_insights: analysis.healthInsights,
        vitamins: analysis.nutrition.vitamins,
        minerals: analysis.nutrition.minerals
      } : null,
      health_score: analysis.healthInsights.score || null,
      ai_confidence_score: analysis.confidence || 0.8,
      processing_status: 'completed',
      meal_tags: analysis.tags || [],
      created_at: new Date().toISOString()
    }

    const { data: savedMeal, error: saveError } = await supabase
      .from('meals')
      .insert(mealData)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving meal:', saveError)
      return NextResponse.json(
        { success: false, error: 'Failed to save meal analysis' },
        { status: 500 }
      )
    }

    console.log('✅ Meal saved successfully:', savedMeal.id)

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
        processingTime: `${Date.now() - Date.now()}ms`,
        model: 'gpt-4o-mini-2024-07-18',
        tier: userTierLevel,
        cached: false
      }
    }

    // Cache the response
    analysisCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    })

    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('❌ Analysis error:', error.message)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Analysis failed. Please try again.',
        code: error.code || 'ANALYSIS_ERROR'
      },
      { status: 500 }
    )
  }
}

// Enhanced prompt generation
function generateComprehensivePrompt(tier: string, focusMode: string): string {
  const basePrompt = `Analyze this food image and provide a comprehensive nutritional analysis. Return ONLY valid JSON matching this exact structure:

{
  "foodName": "Specific name of the food item",
  "confidence": 0.95,
  "ingredients": ["ingredient1", "ingredient2", "..."],
  "nutrition": {
    "calories": 250,
    "protein": 12,
    "carbs": 35,
    "fat": 8,
    "fiber": 4,
    "sugar": 8,
    "sodium": 450,
    "cholesterol": 30,
    "saturatedFat": 3,
    "transFat": 0
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
    "recommendations": ["Add more vegetables", "Reduce salt"],
    "dietaryInfo": ["vegetarian-friendly", "contains-gluten"]
  },
  "description": "Detailed description of the food, preparation method, and visual appearance",
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

// Rate limiting functions
function checkRateLimit(userId: string, config: { max: number; window: number }): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)
  
  if (!userLimit || now >= userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + config.window })
    return true
  }
  
  if (userLimit.count >= config.max) {
    return false
  }
  
  userLimit.count++
  return true
}

function getRemainingTime(userId: string): number {
  const userLimit = rateLimitStore.get(userId)
  if (!userLimit) return 0
  return Math.max(0, userLimit.resetTime - Date.now())
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
  if (nutrition.protein > 20) positives.push('High in protein')
  if (nutrition.fiber && nutrition.fiber > 5) positives.push('Excellent fiber source')
  if (nutrition.calories < 300) positives.push('Low calorie option')
  
  if (nutrition.sodium && nutrition.sodium > 1000) concerns.push('High sodium content')
  if (nutrition.saturatedFat && nutrition.saturatedFat > 10) concerns.push('High in saturated fat')
  if (nutrition.sugar && nutrition.sugar > 20) concerns.push('High sugar content')
  
  // Calculate health score
  let score = 70
  score += positives.length * 5
  score -= concerns.length * 10
  score = Math.max(0, Math.min(100, score))
  
  // Add recommendations
  if (nutrition.fiber && nutrition.fiber < 3) recommendations.push('Add more fiber-rich foods')
  if (nutrition.protein < 10) recommendations.push('Consider adding a protein source')
  
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
        source: 'AI estimate (dev mode)'
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