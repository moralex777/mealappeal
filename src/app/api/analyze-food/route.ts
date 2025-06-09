import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl, focusMode, userTier } = await request.json()
    
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

    console.log('🔍 Analyzing food for user:', user.email)
    
    // Mock AI analysis
    const mockFoodNames = [
      "Perfectly Ripe Banana", "Golden Delight Banana", 
      "Classic Margherita Pizza", "Avocado Toast with Egg", 
      "Crisp Honeycrisp Apple", "Juicy Red Apple"
    ]
    
    const mockName = mockFoodNames[Math.floor(Math.random() * mockFoodNames.length)] || "Delicious Meal"
    const calories = 200 + Math.floor(Math.random() * 200)
    const protein = Math.max(1, Math.floor(calories * 0.15 / 4))
    const carbs = Math.max(5, Math.floor(calories * 0.5 / 4))
    const fat = Math.max(1, Math.floor(calories * 0.3 / 9))
    
    // Save meal with ONLY the basic columns that definitely exist
    const mealData = {
      user_id: user.id,
      title: mockName,
      image_url: imageDataUrl,
      created_at: new Date().toISOString()
    }

    console.log('💾 Saving minimal meal data:', { user_id: user.id, title: mockName })

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
        confidence: 0.9,
        nutrition: {
          calories,
          protein,
          carbs,
          fat
        },
        focus_insights: [
          `This ${mockName.toLowerCase()} looks nutritious and well-balanced!`,
          `Great source of ${protein > 15 ? 'high-quality protein' : 'essential nutrients'}.`,
          `Perfect for your ${focusMode.replace('_', ' ')} goals! 🎯`
        ]
      }
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
