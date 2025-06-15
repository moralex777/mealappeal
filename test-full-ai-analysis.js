const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function testFullAIAnalysis() {
  console.log('🔬 TESTING FULL AI ANALYSIS FLOW')
  console.log('=================================')

  try {
    // Login first
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      return
    }

    console.log('✅ Logged in as:', loginData.user.email)

    // Get the auth token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ No session found')
      return
    }

    console.log('🔑 Got auth token, length:', session.access_token.length)

    // Create a test image (small red pixel)
    const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

    console.log('📸 Testing AI analysis with sample image...')

    // Test the analyze-food endpoint
    const response = await fetch('http://localhost:3002/api/analyze-food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        imageDataUrl: testImageDataUrl,
        focusMode: 'health'
      })
    })

    console.log('📋 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Error response:', errorText)
      return
    }

    const result = await response.json()
    console.log('🎉 SUCCESS! AI Analysis completed:')
    console.log('📊 Result summary:')
    console.log('  - Success:', result.success)
    console.log('  - Food Name:', result.analysis?.foodName || result.foodName)
    console.log('  - Calories:', result.analysis?.nutrition?.calories || result.nutrition?.calories)
    console.log('  - Processing Time:', result.metadata?.processingTime)
    console.log('  - Mode:', result.metadata?.mode || 'normal')

    if (result.success) {
      console.log('\n✅ THE AI ANALYSIS 500 ERROR HAS BEEN FIXED! 🎯')
      console.log('🚀 Users can now analyze food photos successfully!')
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testFullAIAnalysis()