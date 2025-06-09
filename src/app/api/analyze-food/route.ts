import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl, focusMode, userTier, randomSeed } = await request.json()

    // Get the user from the authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authorization required' }, { status: 401 })
    }

    // Verify the user token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ success: false, error: 'Invalid authorization' }, { status: 401 })
    }

    console.log('🔍 Analyzing food for user:', user.email)

    // Mock AI analysis (replace with OpenAI Vision API later)
    const mockFoodNames = [
      'Perfectly Ripe Banana',
      'Supercharged Energy Banana',
      'Golden Delight Banana',
      'Classic Margherita Pizza',
      'Avocado Toast with Egg',
      'Crisp Honeycrisp Apple',
      'Juicy Red Apple',
      'Mixed Roasted Nuts',
      'Mystery Superfood Blend',
    ]

    const mockName = mockFoodNames[randomSeed % mockFoodNames.length] || 'Delicious Meal'
    const baseCalories = focusMode === 'weight_loss' ? 200 : focusMode === 'muscle_gain' ? 400 : 300
    const calories = baseCalories + (randomSeed % 100)
    const protein = Math.max(1, Math.floor((calories * 0.15) / 4))
    const carbs = Math.max(5, Math.floor((calories * 0.5) / 4))
    const fat = Math.max(1, Math.floor((calories * 0.3) / 9))

    // Upload image to Supabase storage
    const imageBuffer = Buffer.from(imageDataUrl.split(',')[1], 'base64')
    const fileName = `meal_${user.id}_${Date.now()}_${randomSeed}.jpg`
    const filePath = `meals/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Image upload error:', uploadError)
      // Continue without image if upload fails
    }

    // Get public URL for the uploaded image
    let imageUrl = imageDataUrl // fallback to base64
    if (uploadData) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('meal-images').getPublicUrl(filePath)
      imageUrl = publicUrl
    }

    // Calculate scheduled deletion date (14 days for free users)
    const scheduledDeletion =
      userTier === 'premium' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    // Save meal to database
    const mealData = {
      user_id: user.id,
      title: mockName,
      image_url: imageUrl,
      image_path: uploadData ? filePath : null,
      focus: focusMode,
      basic_nutrition: {
        energy_kcal: calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
      },
      premium_nutrition:
        userTier === 'premium'
          ? {
              fiber_g: Math.floor(carbs * 0.1),
              sugar_g: Math.floor(carbs * 0.3),
              sodium_mg: 200 + (randomSeed % 300),
              vitamin_c_mg: 5 + (randomSeed % 20),
              iron_mg: 1 + (randomSeed % 5),
            }
          : null,
      health_score: Math.min(10, Math.max(6, 8 + (randomSeed % 3))),
      meal_tags: [
        focusMode.replace('_', ' '),
        calories < 250 ? 'light_meal' : calories > 400 ? 'hearty_meal' : 'balanced_meal',
        protein > 20 ? 'high_protein' : 'moderate_protein',
      ],
      ai_confidence_score: 0.85 + (randomSeed % 15) / 100,
      processing_status: 'completed',
      scheduled_deletion_date: scheduledDeletion,
      is_public: false,
      shared: false,
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

    // Return the analysis result
    const response = {
      success: true,
      mealId: savedMeal.id,
      analysis: {
        foodName: mockName,
        confidence: mealData.ai_confidence_score,
        nutrition: {
          calories,
          protein,
          carbs,
          fat,
        },
        focus_insights: [
          `This ${mockName.toLowerCase()} looks nutritious and well-balanced!`,
          `Great source of ${protein > 15 ? 'high-quality protein' : 'essential nutrients'}.`,
          `Perfect for your ${focusMode.replace('_', ' ')} goals! 🎯`,
        ],
        health_score: mealData.health_score,
        tags: mealData.meal_tags,
      },
    }

    console.log('🔍 Analysis completed successfully')
    return NextResponse.json(response)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
