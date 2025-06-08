import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl, focusMode, userTier } = await request.json()
    
    // Mock response for testing - replace with OpenAI integration later
    const mockAnalysis = {
      success: true,
      analysis: {
        foodName: "Delicious Meal",
        confidence: 0.95,
        nutrition: {
          calories: 350,
          protein: 25,
          carbs: 40,
          fat: 12
        },
        focus_insights: [
          "This appears to be a nutritious and well-balanced meal.",
          "Great source of protein and healthy carbohydrates.",
          "Perfect for maintaining energy levels throughout the day!"
        ]
      }
    }

    console.log('🔍 Mock analysis completed for:', focusMode)
    return NextResponse.json(mockAnalysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
