import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Create Supabase client with service role for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key in API routes
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// 🎯 REVOLUTIONARY FOCUS-DRIVEN ANALYSIS SYSTEM
// Following Development Guidelines: Engaging, personality-driven, social-first
const analysisFocusPrompts = {
  health_wellness: {
    name: '🪷 Health & Wellness',
    icon: '🪷',
    prompt: `You are an enthusiastic nutritionist and wellness expert! Analyze this food with excitement and wonder. Focus on health benefits that will make the user feel AMAZING about their choices.

🎯 ENGAGEMENT MISSION: Make this analysis so exciting they MUST share it!

Provide analysis emphasizing:
- Mind-blowing nutritional benefits and health superpowers this food gives them
- Specific micronutrients and their incredible bodily functions
- Motivating wellness tips that make them feel like a health champion
- Surprising health discoveries that spark curiosity
- Actionable advice that creates immediate value

Make every insight feel like a personal victory and health breakthrough!`,
    funFactStyle:
      'incredible health superpowers and mind-blowing wellness discoveries that make users feel like nutrition champions',
  },

  cultural_story: {
    name: '🌍 Cultural Adventure',
    icon: '🌍',
    prompt: `You are a passionate cultural anthropologist and food storyteller! Uncover the FASCINATING cultural secrets behind this dish that will amaze and delight.

🎯 ENGAGEMENT MISSION: Create "wow, I had no idea!" moments that demand sharing!

Provide analysis emphasizing:
- Incredible cultural origin stories that spark wonder
- Surprising traditional secrets and ancient wisdom
- Fascinating regional variations and authentic mysteries
- Mind-blowing historical significance and cultural legends
- Amazing dining customs and cultural connections

Make every insight feel like discovering hidden cultural treasures!`,
    funFactStyle:
      'incredible cultural secrets and fascinating historical mysteries that spark wonder and amazement',
  },

  chef_secrets: {
    name: '👨‍🍳 Culinary Mastery',
    icon: '👨‍🍳',
    prompt: `You are an excited Michelin-starred chef sharing exclusive kitchen secrets! Reveal the AMAZING culinary mastery behind this dish with infectious enthusiasm.

🎯 ENGAGEMENT MISSION: Make users feel like they're getting VIP chef secrets worth sharing!

Provide analysis emphasizing:
- Exclusive professional techniques that blow minds
- Secret ingredient insights that create "aha!" moments
- Master chef tips that make users feel like pros
- Incredible flavor science and culinary magic
- Step-by-step mastery guide with chef confidence boosts

Make every insight feel like exclusive access to culinary superpowers!`,
    funFactStyle:
      'exclusive culinary secrets and professional chef magic that makes users feel like kitchen masters',
  },

  science_lab: {
    name: '🔬 Food Science Magic',
    icon: '🔬',
    prompt: `You are an excited food scientist revealing the INCREDIBLE science behind this meal! Make complex nutrition feel like discovering superpowers.

🎯 ENGAGEMENT MISSION: Create "science is amazing!" moments that users can't wait to share!

Provide analysis emphasizing:
- Mind-blowing biochemical processes that sound like magic
- Fascinating nutrient interactions and metabolic wonders
- Amazing research discoveries that spark excitement
- Incredible cellular benefits that feel like health upgrades
- Scientific secrets that make users feel brilliant

Make every insight feel like unlocking the matrix of nutrition!`,
    funFactStyle:
      'incredible scientific discoveries and mind-blowing research facts that make nutrition feel like magic',
  },

  fitness_fuel: {
    name: '💪 Performance Beast',
    icon: '💪',
    prompt: `You are a high-energy sports nutritionist and fitness coach! Analyze this meal like it's the SECRET to athletic greatness and peak performance.

🎯 ENGAGEMENT MISSION: Make users feel like nutrition champions ready to conquer their goals!

Provide analysis emphasizing:
- POWERFUL pre/post workout benefits that boost confidence
- Incredible muscle-building and recovery superpowers
- Amazing energy optimization that feels like a performance upgrade
- Motivating athletic nutrition secrets
- Peak performance fuel that makes users feel unstoppable

Make every insight feel like unlocking athletic superpowers!`,
    funFactStyle:
      'incredible fitness secrets and performance superpowers that motivate athletic greatness',
  },

  budget_smart: {
    name: '💰 Smart Money Moves',
    icon: '💰',
    prompt: `You are an enthusiastic budget nutrition expert revealing AMAZING money-saving secrets! Show how smart nutrition creates incredible value.

🎯 ENGAGEMENT MISSION: Make users feel like nutrition geniuses saving money while eating amazingly!

Provide analysis emphasizing:
- Incredible cost-effective nutrition hacks that blow minds
- Amazing ingredient alternatives that save serious money
- Smart meal prep secrets that create massive value
- Brilliant budget optimization that feels like winning
- Economic nutrition strategies that build confidence

Make every insight feel like discovering financial nutrition superpowers!`,
    funFactStyle:
      'incredible money-saving nutrition hacks and brilliant budget secrets that make healthy eating affordable',
  },
}

// 🎯 Smart auto-selection with personality
function getSmartAutoFocus(userTier: string, timeOfDay: number, randomSeed: number): string {
  const allFocuses = Object.keys(analysisFocusPrompts)
  const freeFocuses = ['health_wellness', 'cultural_story', 'budget_smart']

  const availableFocuses = userTier === 'premium' ? allFocuses : freeFocuses

  // Context-based weighting with engagement optimization
  const weights: { [key: string]: number } = {}
  availableFocuses.forEach(focus => (weights[focus] = 1))

  // Time-based preferences for maximum engagement
  if (timeOfDay >= 6 && timeOfDay <= 10) {
    // Morning energy boost
    weights['fitness_fuel'] = 3
    weights['health_wellness'] = 2
  } else if (timeOfDay >= 12 && timeOfDay <= 14) {
    // Lunch discovery
    weights['cultural_story'] = 2
    weights['chef_secrets'] = 1.5
  } else if (timeOfDay >= 18 && timeOfDay <= 22) {
    // Evening social
    weights['cultural_story'] = 2
    weights['chef_secrets'] = 2
  }

  // Add randomness for delightful variety
  const focusIndex = randomSeed % availableFocuses.length
  return availableFocuses[focusIndex]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Analysis started')

    const { imageDataUrl, randomSeed, focusMode, userTier } = await request.json()
    console.log('📝 Request data:', { hasImage: !!imageDataUrl, randomSeed, focusMode, userTier })

    if (!imageDataUrl) {
      console.log('❌ No image provided')
      return NextResponse.json(
        {
          error: '📸 Oops! We need a delicious photo to work our magic!',
          suggestion: "Try capturing your meal again - we can't wait to analyze it!",
        },
        { status: 400 }
      )
    }

    // 🔐 ENHANCED AUTHENTICATION WITH ENGAGING FEEDBACK
    let userId = null
    let isPremium = false

    try {
      // Method 1: Session-based auth
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (session?.user) {
        userId = session.user.id
        console.log('✅🎉 User authenticated:', userId)
      } else {
        // Method 2: Token auth
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '')
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser(token)
          if (user && !error) {
            userId = user.id
            console.log('✅🔑 Token auth successful:', userId)
          }
        }
      }

      // Method 3: Cookie fallback
      if (!userId) {
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').reduce(
            (acc, cookie) => {
              const [key, value] = cookie.trim().split('=')
              acc[key] = value
              return acc
            },
            {} as Record<string, string>
          )

          const sessionCookie = cookies['sb-access-token'] || cookies['supabase-auth-token']
          if (sessionCookie) {
            try {
              const {
                data: { user },
                error,
              } = await supabase.auth.getUser(sessionCookie)
              if (user && !error) {
                userId = user.id
                console.log('✅🍪 Cookie auth successful:', userId)
              }
            } catch (cookieError) {
              console.log('⚠️ Cookie auth failed:', cookieError)
            }
          }
        }
      }
    } catch (authError) {
      console.log('⚠️ Authentication error:', authError)
    }

    // Get user profile with engaging feedback
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', userId)
          .single()

        isPremium = profile?.subscription_tier === 'premium'
        console.log(
          `✅🎯 User profile loaded: ${isPremium ? '👑 Premium Champion' : '🌱 Growing Strong'} tier`
        )
      } catch (profileError) {
        console.log('⚠️ Could not load user profile:', profileError)
      }
    }

    // Continue with engaging demo mode if no user
    if (!userId) {
      console.log('🎯 Demo mode: Creating amazing analysis for new user!')
    }

    // 🎯 DETERMINE ANALYSIS FOCUS WITH PERSONALITY
    let selectedFocus = focusMode || 'health_wellness'
    if (selectedFocus === 'smart_auto') {
      const currentHour = new Date().getHours()
      selectedFocus = getSmartAutoFocus(userTier || 'free', currentHour, randomSeed)
    }

    const focusData =
      analysisFocusPrompts[selectedFocus as keyof typeof analysisFocusPrompts] ||
      analysisFocusPrompts.health_wellness

    // 🎯 BUILD DYNAMIC PROMPT WITH ENGAGEMENT OPTIMIZATION
    const effectiveUserTier = userTier || (isPremium ? 'premium' : 'free')
    const premiumNutrients =
      effectiveUserTier === 'premium'
        ? `
    "fiber": number,
    "sodium": number,
    "sugar": number,
    "saturated_fat": number,
    "cholesterol": number,
    "potassium": number`
        : ''

    const premiumFactCount = effectiveUserTier === 'premium' ? 4 : 2

    const ENHANCED_ANALYSIS_PROMPT = `${focusData.prompt}

🎯 CRITICAL ENGAGEMENT REQUIREMENT: Return ONLY valid JSON in this EXACT format:
{
  "analysis_focus": "${focusData.name}",
  "focus_icon": "${focusData.icon}",
  "foodName": "detected food name (make it appetizing and specific)",
  "confidence": 0.95,
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number${premiumNutrients}
  },
  "focus_insights": [
    "🎯 First incredible insight specific to ${focusData.name} that creates excitement",
    "💡 Second amazing ${focusData.name} insight that sparks curiosity",
    "✨ Third mind-blowing insight that demands sharing"
  ],
  "funFacts": [
    ${Array(premiumFactCount).fill(`"🤯 ${focusData.funFactStyle} that creates WOW moments"`).join(',\n    ')}
  ],
  "shareableQuote": "Perfect viral one-liner for social media that creates FOMO and curiosity",
  "health_score": number (1-10 rating that feels rewarding),
  "meal_tags": ["engaging_tag1", "shareable_tag2", "curiosity_tag3"]
}

🎯 ENGAGEMENT REQUIREMENTS:
- Make focus_insights SO specific to ${focusData.name} that users feel like experts
- Ensure funFacts are ${focusData.funFactStyle} that create "I must share this!" moments
- Keep shareableQuote under 280 characters and irresistibly social media friendly
- Make ALL content create excitement, wonder, and sharing desire
- Use specific numbers and data that feel like discoveries
- Include emojis that amplify personality and engagement

🚀 MISSION: Create analysis so engaging and surprising that users immediately want to:
1. Screenshot and share
2. Try another photo immediately
3. Tell friends about the app
4. Feel amazing about their food choice

NO additional text outside the JSON object.`

    console.log('🔍✨ Analyzing with focus:', selectedFocus)
    console.log('🎯🚀 Focus mode:', focusData.name)

    // 🖼️ ENSURE PROPER IMAGE FORMAT FOR OPENAI WITH ENHANCED VALIDATION
    let processedImageUrl = imageDataUrl

    // Add detailed logging for debugging
    console.log('📸 Original image data URL length:', imageDataUrl.length)
    console.log('📸 Image data URL prefix:', imageDataUrl.substring(0, 50))

    // Validate and process image data
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      throw new Error('Invalid image data: must be a non-empty string')
    }

    // Check if it's a data URL and ensure it's properly formatted
    if (imageDataUrl.startsWith('data:image/')) {
      // Validate the data URL format
      const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/
      const match = imageDataUrl.match(dataUrlPattern)

      if (!match) {
        throw new Error('Invalid data URL format. Expected: data:image/{type};base64,{data}')
      }

      const [, imageType, base64Data] = match

      // Validate base64 data
      if (!base64Data) {
        throw new Error('Missing base64 data in image URL')
      }

      try {
        // Test if base64 is valid by trying to decode it
        // Use Buffer in Node.js environment instead of atob
        if (typeof Buffer !== 'undefined') {
          Buffer.from(base64Data.substring(0, 100), 'base64').toString('binary')
        } else if (typeof atob !== 'undefined') {
          atob(base64Data.substring(0, 100)) // Test first 100 chars
        }
      } catch (base64Error) {
        throw new Error('Invalid base64 image data')
      }

      console.log('✅ Image is properly formatted as data URL, type:', imageType)
      console.log('✅ Base64 data length:', base64Data.length)
      processedImageUrl = imageDataUrl
    } else {
      // If it's just base64, add the proper prefix
      // First validate it's valid base64
      try {
        // Use Buffer in Node.js environment instead of atob
        if (typeof Buffer !== 'undefined') {
          Buffer.from(imageDataUrl.substring(0, 100), 'base64').toString('binary')
        } else if (typeof atob !== 'undefined') {
          atob(imageDataUrl.substring(0, 100)) // Test first 100 chars
        }
        processedImageUrl = `data:image/jpeg;base64,${imageDataUrl}`
        console.log('✅ Added data URL prefix to base64 image')
      } catch (base64Error) {
        throw new Error('Invalid base64 image data provided')
      }
    }

    // Final validation before sending to OpenAI
    if (processedImageUrl.length < 100) {
      throw new Error('Image data appears to be too short to be valid')
    }

    // Additional validation: Check if image is large enough for OpenAI Vision API
    // OpenAI requires images to be at least 20x20 pixels
    if (processedImageUrl.length < 1000) {
      throw new Error(
        'Image appears to be too small for analysis. Please use a larger, clearer image of your food (minimum 20x20 pixels).'
      )
    }

    console.log('🎯 Final processed image URL length:', processedImageUrl.length)
    console.log('🎯 Sending to OpenAI Vision API...')

    // 🤖 AI ANALYSIS WITH ENHANCED CREATIVITY
    let response
    try {
      console.log('🤖 Calling OpenAI with model: gpt-4o-mini-2024-07-18')
      console.log('🔄 Processing image with OpenAI Vision...')

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ENHANCED_ANALYSIS_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: processedImageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.8 + (randomSeed % 100) / 1000, // Enhanced creativity for engagement
      })

      console.log('✅ OpenAI response received successfully!')
      console.log('📊 Response tokens used:', response.usage?.total_tokens || 'unknown')
    } catch (openaiError) {
      console.error('❌ OpenAI API Error:', openaiError)
      console.error(
        '❌ OpenAI Error Details:',
        openaiError instanceof Error ? openaiError.message : String(openaiError)
      )

      // Check if it's an invalid image error and provide helpful feedback
      const errorMessage = openaiError instanceof Error ? openaiError.message : String(openaiError)
      if (
        errorMessage.includes('Invalid base64 image_url') ||
        errorMessage.includes('invalid image')
      ) {
        throw new Error(
          '📸 Image quality issue detected! Please try taking a new photo with better lighting and make sure your food is clearly visible. Our AI works best with clear, well-lit food photos!'
        )
      }

      throw new Error(
        `OpenAI API failed: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`
      )
    }

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('🤖 Our AI chef took a coffee break! Please try again.')
    }

    console.log('🔄✨ Parsing magical AI response...')
    let analysisResult

    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim()
      analysisResult = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.log('Raw content:', content)
      throw new Error('🤖 Our AI got a bit too creative! Trying again...')
    }

    // 🎯 GENERATE VIRAL SHAREABLE CONTENT
    const shareableContent = generateViralContent(analysisResult, selectedFocus)

    // 💾 SAVE MEAL TO DATABASE WITH FULL NUTRITION DATA
    let mealId = null
    let scheduledDeletion = null

    if (userId) {
      try {
        console.log('💾🎉 Saving your amazing meal to database...')

        if (!isPremium) {
          scheduledDeletion = new Date()
          scheduledDeletion.setDate(scheduledDeletion.getDate() + 14)
        }

        // 🎯 FIXED DATABASE SAVE WITH CORRECT SCHEMA
        const { data: meal, error: mealError } = await supabase
          .from('meals')
          .insert({
            user_id: userId,
            title: analysisResult.foodName || 'Amazing Mystery Food',
            description: `${focusData.name} Analysis: ${analysisResult.shareableQuote || 'Incredible food discovery!'} 🍽️✨ #MealAppeal #${selectedFocus}`,
            image_url: imageDataUrl,
            image_path: `meals/${userId}/${Date.now()}.jpg`,
            is_public: false,
            ai_confidence_score: analysisResult.confidence || 0.95,
            processing_status: 'completed',
            scheduled_deletion_date: scheduledDeletion?.toISOString() || null,
            grace_period_notified: false,
            view_count: 0,
            like_count: 0,
            basic_nutrition: {
              energy_kcal: analysisResult.nutrition?.calories || 0,
              protein_g: analysisResult.nutrition?.protein || 0,
              carbs_g: analysisResult.nutrition?.carbs || 0,
              fat_g: analysisResult.nutrition?.fat || 0,
            },
            premium_nutrition: isPremium
              ? {
                  fiber_g: analysisResult.nutrition?.fiber || 0,
                  sugar_g: analysisResult.nutrition?.sugar || 0,
                  sodium_mg: analysisResult.nutrition?.sodium || 0,
                  calcium_mg: analysisResult.nutrition?.calcium || 0,
                  iron_mg: analysisResult.nutrition?.iron || 0,
                  vitaminC_mg: analysisResult.nutrition?.vitaminC || 0,
                  focus_insights: analysisResult.focus_insights || [],
                  funFacts: analysisResult.funFacts || [],
                }
              : null,
            health_score: analysisResult.health_score || 8,
            meal_tags: analysisResult.meal_tags || ['delicious', 'analyzed', 'awesome'],
          })
          .select()
          .single()

        if (mealError) {
          console.error('❌ Database error:', mealError)
          // Continue without throwing - user still gets analysis
        } else if (meal) {
          mealId = meal.id

          // 📊 UPDATE USER'S MEAL COUNT WITH CELEBRATION (SIMPLIFIED)
          try {
            console.log('✅🎉 Meal saved successfully! User:', userId, 'Meal ID:', meal.id)

            // Optional: Update meal count in background (don't fail if it errors)
            supabase
              .from('profiles')
              .select('meal_count')
              .eq('id', userId)
              .single()
              .then(({ data: currentProfile }) => {
                if (currentProfile) {
                  const newMealCount = (currentProfile.meal_count || 0) + 1
                  return supabase
                    .from('profiles')
                    .update({
                      meal_count: newMealCount,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', userId)
                }
              })
              .then(() => {
                console.log('✅ Meal count updated in background')
              })
              .catch(err => {
                console.log('⚠️ Meal count update failed (non-critical):', err)
              })
          } catch (countError) {
            console.log('⚠️ Meal count update error (non-critical):', countError)
          }
        }
      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError)
        // Continue - analysis still valuable without storage
      }
    }

    console.log('✅🎉 Analysis complete with focus:', selectedFocus)

    // 🎯 ENGAGING SUCCESS RESPONSE
    const celebrationMessage = userId
      ? isPremium
        ? '🎉👑 Premium analysis complete! Your meal is saved forever and ready to amaze!'
        : '🎉🌱 Amazing analysis complete! 14 days to enjoy this discovery!'
      : '🎉✨ Incredible analysis complete! Sign up to save your food journey!'

    return NextResponse.json({
      success: true,
      message: celebrationMessage,
      analysis: {
        ...analysisResult,
        mealId,
        focusMode: selectedFocus,
      },
      scheduledDeletion: scheduledDeletion?.toISOString() || null,
      shareableContent,
      focusUsed: focusData.name,
      // 🎯 ENGAGEMENT TRIGGERS
      engagementTriggers: {
        celebrationEmoji: '🎉',
        sharePrompt: 'This is too cool not to share!',
        nextActionSuggestion: 'Try another photo with a different focus mode!',
        premiumTeaser: !isPremium ? 'Unlock 3 more analysis modes with Premium!' : null,
      },
    })
  } catch (error) {
    console.error('❌ Analysis error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: '🤖 Oops! Our AI chef got a bit overwhelmed by your amazing food!',
        details: 'Please try again - we promise the next analysis will blow your mind! 🚀',
        suggestion: 'Maybe try a different angle or lighting? Every photo tells a unique story!',
        emoji: '😅',
        // Add debug info in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            actualError: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        }),
      },
      { status: 500 }
    )
  }
}

// 🎯 GENERATE VIRAL-WORTHY SHAREABLE CONTENT
function generateViralContent(analysis: any, focusMode: string) {
  const viralTemplates: Record<string, string[]> = {
    health_wellness: [
      `💪 Just discovered my meal has ${analysis.nutrition?.protein || 'X'}g of muscle-building protein! Health score: ${analysis.health_score || 8}/10 🔥 #HealthHero #MealAppeal`,
      `🌟 My food analysis just revealed incredible health superpowers! ${analysis.shareableQuote || 'Nutrition wins!'} Try yours! #WellnessWin #MealAppeal`,
      `🥗 Plot twist: My ${analysis.foodName || 'meal'} scored ${analysis.health_score || 8}/10 for health! What's YOUR meal's secret score? #HealthChampion #MealAppeal`,
    ],
    basic_nutrition: [
      `🍽️ Just analyzed my ${analysis.foodName || 'meal'} - ${analysis.nutrition?.calories || 'X'} calories and packed with nutrients! Health score: ${analysis.health_score || 8}/10 ⭐ #NutritionFacts #MealAppeal`,
      `📊 My food analysis is in! ${analysis.shareableQuote || 'Amazing nutrition discovered!'} What's your meal hiding? #NutritionWins #MealAppeal`,
      `🥘 Surprise! My ${analysis.foodName || 'meal'} has ${analysis.nutrition?.protein || 'X'}g protein + ${analysis.nutrition?.carbs || 'X'}g carbs. Perfect fuel! #BalancedEating #MealAppeal`,
    ],
    cultural_story: [
      `🌍 Mind = BLOWN! Just learned the incredible cultural story behind my ${analysis.foodName || 'meal'}! ${analysis.shareableQuote || 'Food connects worlds!'} #FoodCulture #MealAppeal`,
      `📚 TIL: ${analysis.funFacts?.[0] || 'Amazing cultural food secret!'} Who else wants their mind blown? #CulturalFoodie #MealAppeal`,
      `🌎 Trivia time: ${analysis.funFacts?.[1] || 'Another mind-blowing cultural fact!'} Share if you're as amazed as I am! #CulturalFoodie #MealAppeal`,
    ],
    chef_secrets: [
      `👨‍🍳 Chef secrets revealed! My ${analysis.foodName || 'meal'} is made with ${analysis.focus_insights?.[0] || 'exclusive technique'}! ${analysis.shareableQuote || 'Master the art of cooking!'} #ChefMasterclass #MealAppeal`,
      `🔑 Pro tip: ${analysis.focus_insights?.[1] || 'Chef secret'} for a perfect meal every time! #ChefHacks #MealAppeal`,
      `🍴 Behind the scenes: ${analysis.focus_insights?.[2] || 'Chef magic'} that makes my meal amazing! #BehindTheScenes #MealAppeal`,
    ],
    science_lab: [
      `🔬 Just discovered the incredible science behind my ${analysis.foodName || 'meal'}! ${analysis.shareableQuote || 'Science is amazing!'} #ScienceFoodie #MealAppeal`,
      `💡 Did you know: ${analysis.funFacts?.[0] || 'Amazing food science fact!'} Share if you're as amazed as I am! #ScienceFoodie #MealAppeal`,
      `🧪 Trivia time: ${analysis.funFacts?.[1] || 'Another mind-blowing food science fact!'} #ScienceFoodie #MealAppeal`,
    ],
    fitness_fuel: [
      `💪 Just fueled up for my workout with ${analysis.nutrition?.carbs || 'X'}g of energy-boosting carbs! Health score: ${analysis.health_score || 8}/10 🔥 #FitnessFuel #MealAppeal`,
      `🏋️‍♀️ My food analysis just revealed incredible fitness secrets! ${analysis.shareableQuote || 'Fuel your goals!'} Try yours! #FitnessFuel #MealAppeal`,
      `🏆 Trivia time: ${analysis.funFacts?.[0] || 'Amazing fitness fact!'} Share if you're as motivated as I am! #FitnessFuel #MealAppeal`,
    ],
    budget_smart: [
      `💰 Just saved $X on my meal! ${analysis.shareableQuote || 'Smart nutrition is amazing!'} #BudgetSmart #MealAppeal`,
      `💡 Did you know: ${analysis.funFacts?.[0] || 'Amazing budget nutrition tip!'} Share if you're as smart as I am! #BudgetSmart #MealAppeal`,
      `📉 Trivia time: ${analysis.funFacts?.[1] || 'Another mind-blowing budget nutrition fact!'} #BudgetSmart #MealAppeal`,
    ],
  }

  // Map focus mode to viral template key with fallback
  const templates = viralTemplates[focusMode] || viralTemplates['basic_nutrition']

  if (!templates || templates.length === 0) {
    return `🍽️ Just analyzed my amazing ${analysis.foodName || 'meal'} with MealAppeal! ${analysis.shareableQuote || 'Food discovery is incredible!'} #MealAppeal #FoodAnalysis`
  }

  const templateIndex = Math.floor(Math.random() * templates.length)
  return templates[templateIndex]
}
