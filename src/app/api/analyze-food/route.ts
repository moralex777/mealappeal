import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Rate limiting - simple in-memory store for demo
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // requests per hour for free users
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour

// USDA nutrition cache
const usdaCache = new Map<string, any>()
const USDA_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl, focusMode, userTier = 'free' } = await request.json()
    
    // Check if we're in development mode without OpenAI setup
    const isDevelopmentMode = !process.env.OPENAI_API_KEY
    
    if (isDevelopmentMode) {
      console.log('🚧 Development mode: Using mocked AI analysis')
      // Return mocked data for development
      return NextResponse.json({
        success: true,
        analysis: {
          foodName: "Delicious Development Meal",
          confidence: 0.95,
          nutrition: {
            calories: 420,
            protein: 28,
            carbs: 45,
            fat: 12
          },
          description: "A beautifully composed meal perfect for testing our application. This development response ensures the UI works perfectly while you set up your OpenAI API key.",
          tags: ["healthy", "balanced", "development"],
          healthScore: 88
        },
        metadata: {
          processingTime: "0.5s",
          mode: "development",
          tier: userTier
        }
      })
    }
    
    // Validate image data
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image data provided' },
        { status: 400 }
      )
    }
    
    // Get the user from the authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Verify the user token
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
      .eq('user_id', user.id)
      .single()
      
    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    const isPremium = profile.subscription_tier === 'premium_monthly' || profile.subscription_tier === 'premium_yearly'
    
    // Rate limiting for free users
    if (!isPremium) {
      const now = Date.now()
      const userKey = user.id
      const userRateLimit = rateLimitStore.get(userKey)
      
      if (userRateLimit) {
        if (now < userRateLimit.resetTime) {
          if (userRateLimit.count >= RATE_LIMIT_MAX) {
            return NextResponse.json(
              { success: false, error: 'Rate limit exceeded. Upgrade to premium for unlimited analysis.' },
              { status: 429 }
            )
          }
          userRateLimit.count++
        } else {
          // Reset window
          rateLimitStore.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        }
      } else {
        rateLimitStore.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      }
    }

    console.log('🔍 Analyzing food for user:', user.email, 'tier:', profile.subscription_tier)
    
    // Real OpenAI Vision API Analysis
    let aiResponse
    try {
      const prompt = isPremium 
        ? generatePremiumPrompt(focusMode)
        : generateBasicPrompt()
        
      aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
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
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: isPremium ? 1500 : 300,
        temperature: 0.3
      })
      
      console.log('✅ OpenAI analysis completed')
    } catch (openaiError: any) {
      console.error('❌ OpenAI error:', openaiError.message)
      
      // Graceful fallback
      return NextResponse.json({
        success: false,
        error: 'AI analysis temporarily unavailable. Please try again in a few moments.',
        fallback: true
      }, { status: 503 })
    }
    
    // Parse AI response
    const analysisText = aiResponse.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis content received from AI')
    }
    
    let parsedAnalysis
    try {
      parsedAnalysis = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      throw new Error('Invalid AI response format')
    }

    // Enhance nutrition data with USDA API
    let enhancedNutrition = parsedAnalysis.nutrition
    try {
      const usdaNutrition = await getUSDANutrition(parsedAnalysis.foodName)
      if (usdaNutrition) {
        enhancedNutrition = {
          ...parsedAnalysis.nutrition,
          ...usdaNutrition,
          source: 'USDA + AI'
        }
        console.log('✅ Enhanced with USDA nutrition data')
      }
    } catch (usdaError) {
      console.log('⚠️ USDA data unavailable, using AI estimates:', usdaError)
      enhancedNutrition.source = 'AI estimate'
    }
    
    // Generate image path
    const timestamp = Date.now()
    const imagePath = `meals/meal_${user.id}_${timestamp}.jpg`
    
    // Prepare meal data based on tier
    const basicNutrition = {
      energy_kcal: enhancedNutrition.calories || 0,
      protein_g: enhancedNutrition.protein || 0,
      carbs_g: enhancedNutrition.carbs || 0,
      fat_g: enhancedNutrition.fat || 0
    }
    
    const mealData = {
      user_id: user.id,
      title: parsedAnalysis.foodName || 'Analyzed Meal',
      description: parsedAnalysis.description || null,
      image_url: imageDataUrl,
      image_path: imagePath,
      basic_nutrition: basicNutrition,
      premium_nutrition: isPremium ? parsedAnalysis.premiumAnalysis : null,
      health_score: parsedAnalysis.healthScore || null,
      ai_confidence_score: parsedAnalysis.confidence || 0.8,
      processing_status: 'completed',
      meal_tags: parsedAnalysis.tags || [],
      created_at: new Date().toISOString()
    }

    console.log('💾 Saving meal data:', { 
      user_id: user.id, 
      title: parsedAnalysis.foodName, 
      tier: profile.subscription_tier,
      has_premium_analysis: !!mealData.premium_nutrition,
      nutrition_source: enhancedNutrition.source
    })

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

    // Return tier-appropriate response
    const response = {
      success: true,
      mealId: savedMeal.id,
      analysis: {
        foodName: parsedAnalysis.foodName,
        description: parsedAnalysis.description,
        confidence: parsedAnalysis.confidence,
        nutrition: {
          ...basicNutrition,
          source: enhancedNutrition.source
        },
        healthScore: parsedAnalysis.healthScore,
        tags: parsedAnalysis.tags,
        // Premium analysis only for premium users
        premiumAnalysis: isPremium ? parsedAnalysis.premiumAnalysis : null,
        tier: profile.subscription_tier
      }
    }

    console.log('🔍 Analysis completed successfully')
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ Analysis error:', error.message)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message.includes('rate limit') 
          ? 'Rate limit exceeded. Please try again later or upgrade to premium.'
          : 'Analysis failed. Please try again in a moment.',
        code: error.code || 'ANALYSIS_ERROR'
      },
      { status: 500 }
    )
  }
}

// Generate prompts based on user tier
function generateBasicPrompt(): string {
  return `Analyze this food image and return ONLY a JSON object with this exact structure:
{
  "foodName": "Name of the main food item",
  "description": "Brief 1-sentence description",
  "confidence": 0.85,
  "nutrition": {
    "calories": 250,
    "protein": 12,
    "carbs": 35,
    "fat": 8
  },
  "healthScore": 75,
  "tags": ["healthy", "protein-rich"]
}

Provide realistic nutrition estimates per serving. Be accurate and concise.`
}

function generatePremiumPrompt(focusMode: string = 'health'): string {
  const modeInstructions = {
    health: "Focus on health benefits, nutritional density, micronutrients, and wellness impact.",
    fitness: "Analyze for workout performance, recovery, muscle building, and athletic nutrition.", 
    cultural: "Explore cultural origins, traditional preparation methods, and regional significance.",
    chef: "Evaluate cooking techniques, plating, flavor profiles, and culinary craftsmanship.",
    science: "Provide molecular analysis, biochemistry, metabolic pathways, and nutritional science.",
    budget: "Assess cost-effectiveness, seasonal pricing, value nutrition, and money-saving tips."
  }

  return `Analyze this food image and return ONLY a JSON object with this exact structure:
{
  "foodName": "Name of the main food item",
  "description": "Detailed 2-sentence description",
  "confidence": 0.85,
  "nutrition": {
    "calories": 250,
    "protein": 12,
    "carbs": 35,
    "fat": 8
  },
  "healthScore": 75,
  "tags": ["healthy", "protein-rich", "balanced"],
  "premiumAnalysis": {
    "${focusMode}Mode": {
      "score": 85,
      "insights": [
        "Detailed insight 1 based on ${focusMode} focus",
        "Detailed insight 2 with specific data", 
        "Actionable recommendation"
      ],
      "metrics": {
        "primary": "Value with unit",
        "secondary": "Another value",
        "tertiary": "Third metric"
      },
      "recommendations": [
        "Specific actionable tip 1",
        "Specific actionable tip 2"
      ]
    }
  }
}

${modeInstructions[focusMode as keyof typeof modeInstructions] || modeInstructions.health}
Provide realistic nutrition estimates per serving. Be detailed and professional.`
}

// USDA FoodData Central API integration
async function getUSDANutrition(foodName: string): Promise<any | null> {
  const cacheKey = foodName.toLowerCase().trim()
  
  // Check cache first
  const cached = usdaCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < USDA_CACHE_TTL) {
    return cached.data
  }
  
  try {
    // USDA FoodData Central API is free but has rate limits
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&dataType=Foundation,SR%20Legacy&pageSize=1&api_key=DEMO_KEY`
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!searchResponse.ok) {
      throw new Error(`USDA search failed: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    
    if (!searchData.foods || searchData.foods.length === 0) {
      return null
    }
    
    const food = searchData.foods[0]
    const nutrients = food.foodNutrients || []
    
    // Extract key nutrients (USDA nutrient IDs)
    const nutrition = {
      calories: findNutrientValue(nutrients, [1008]) || null, // Energy
      protein: findNutrientValue(nutrients, [1003]) || null, // Protein
      carbs: findNutrientValue(nutrients, [1005]) || null,   // Carbohydrates
      fat: findNutrientValue(nutrients, [1004]) || null,     // Total lipid (fat)
      fiber: findNutrientValue(nutrients, [1079]) || null,   // Fiber
      sugar: findNutrientValue(nutrients, [2000]) || null,   // Total sugars
      sodium: findNutrientValue(nutrients, [1093]) || null   // Sodium
    }
    
    // Cache the result
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

// Helper function to find nutrient values by ID
function findNutrientValue(nutrients: any[], nutrientIds: number[]): number | null {
  for (const id of nutrientIds) {
    const nutrient = nutrients.find((n: any) => n.nutrientId === id)
    if (nutrient && typeof nutrient.value === 'number') {
      return Math.round(nutrient.value * 100) / 100 // Round to 2 decimal places
    }
  }
  return null
}