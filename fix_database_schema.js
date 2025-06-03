const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function fixDatabaseSchema() {
  console.log('🔧 FIXING DATABASE SCHEMA')
  console.log('==========================')

  try {
    // First, let's see the current structure of a meal
    console.log('\n1. Checking current meals table structure...')

    const { data: sampleMeal, error: sampleError } = await supabase
      .from('meals')
      .select('*')
      .limit(1)
      .single()

    if (sampleMeal) {
      console.log('✅ Current meal columns:', Object.keys(sampleMeal))
      console.log('📊 Sample meal data:', sampleMeal)
    }

    // Let's try to add the missing columns one by one
    console.log('\n2. Attempting to add missing columns...')

    // The analysis column should be JSONB for storing the full analysis
    const alterQueries = [
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS food_name TEXT',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS calories INTEGER',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS focus_mode TEXT',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS tags TEXT[]',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS analysis JSONB',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS health_score INTEGER',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS nutrition JSONB',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS shareable_quote TEXT',
      'ALTER TABLE meals ADD COLUMN IF NOT EXISTS fun_facts TEXT[]',
    ]

    console.log('📝 Columns to add:')
    alterQueries.forEach((query, i) => {
      console.log(`   ${i + 1}. ${query}`)
    })

    // Since we can't execute DDL through the API, let's check what we can do
    console.log('\n3. Testing column access...')

    const { data: testData, error: testError } = await supabase
      .from('meals')
      .select('id, food_name, calories, analysis, health_score')
      .limit(1)

    if (testError) {
      console.log('❌ Missing columns detected:', testError.message)
      console.log('\n🚨 SOLUTION NEEDED:')
      console.log('   The database schema needs to be updated in Supabase dashboard')
      console.log('   Or we need to modify the code to use existing columns')
    } else {
      console.log('✅ Columns exist! Testing successful')
    }

    // Let's see what columns actually exist
    console.log('\n4. Discovering actual table structure...')
    const { data: allMeals, error: allError } = await supabase.from('meals').select('*').limit(1)

    if (allMeals && allMeals[0]) {
      console.log('📋 Actual available columns:', Object.keys(allMeals[0]))
    }
  } catch (error) {
    console.error('❌ Schema check error:', error)
  }
}

fixDatabaseSchema()
