const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dxuabbcppncshcparsqd.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple test image (1x1 red pixel in base64)
const testImageData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

// Use curl instead of fetch for better compatibility
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

async function testAIAnalysis() {
  console.log('🤖 Testing AI Analysis System')
  console.log('==============================')

  try {
    // First authenticate
    console.log('\n1. Authenticating user...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ LOGIN FAILED:', loginError.message)
      return
    }

    console.log('✅ AUTHENTICATED!')
    console.log('User ID:', loginData.user?.id)

    // Get session token
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      console.log('❌ NO SESSION TOKEN')
      return
    }

    console.log('✅ SESSION TOKEN OBTAINED')

    // Test 2: Test AI Analysis API using curl
    console.log('\n2. Testing AI Analysis API...')

    const payload = JSON.stringify({
      imageDataUrl: testImageData,
      randomSeed: Math.floor(Math.random() * 1000000),
      focusMode: 'basic_nutrition',
      userTier: 'free',
    })

    const curlCommand = `curl -s -X POST http://localhost:3000/api/analyze-food \\
      -H "Content-Type: application/json" \\
      -H "Authorization: Bearer ${token}" \\
      -d '${payload}'`

    try {
      const { stdout, stderr } = await execPromise(curlCommand)

      if (stderr) {
        console.log('❌ CURL ERROR:', stderr)
      } else {
        console.log('✅ API RESPONSE RECEIVED')

        try {
          const result = JSON.parse(stdout)

          if (result.error) {
            console.log('⚠️ Analysis Error:', result.error)
            console.log('💡 Details:', result.details)
            console.log(
              '🎯 This is expected for a test image - AI analysis requires real food photos'
            )
          } else {
            console.log('🎉 ANALYSIS SUCCESSFUL!')
            console.log('Food detected:', result.analysis?.foodName || 'N/A')
            console.log('Calories:', result.analysis?.nutrition?.calories || 'N/A')
          }
        } catch (parseError) {
          console.log('❌ JSON PARSE ERROR:', parseError.message)
          console.log('Raw response:', stdout)
        }
      }
    } catch (curlError) {
      console.log('❌ API REQUEST ERROR:', curlError.message)
    }

    // Test 3: Check if meals are being saved
    console.log('\n3. Checking meal history...')
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', loginData.user.id)
      .limit(5)

    if (mealsError) {
      console.log('❌ MEALS ERROR:', mealsError.message)
    } else {
      console.log('✅ MEALS QUERY SUCCESSFUL!')
      console.log('Total meals found:', meals.length)
      if (meals.length > 0) {
        console.log('Latest meal:', {
          id: meals[0].id,
          food_name: meals[0].food_name,
          created_at: meals[0].created_at,
        })
      }
    }
  } catch (error) {
    console.log('❌ UNEXPECTED ERROR:', error.message)
  }

  console.log('\n==============================')
  console.log('🏁 AI Analysis Test Complete')
}

testAIAnalysis()
