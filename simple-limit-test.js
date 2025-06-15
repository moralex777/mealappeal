#!/usr/bin/env node

/**
 * Simple test: Add 3 meals to free user, verify daily count function
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODUzNjkwMCwiZXhwIjoyMDY0MTEyOTAwfQ.DgxBwWPIAqKV7yPd-8eX18YdT3jQ0RgNqs5Cs4QZ9FE'
)

async function testDailyLimits() {
  const userId = '05221a48-b943-4e2a-a9d0-9faf6cc6bb7c'
  
  console.log('🧪 SIMPLE DAILY LIMITS TEST')
  console.log('============================')
  
  // Add 2 more meals directly to database (we already have 1)
  console.log('📝 Adding 2 more test meals...')
  
  for (let i = 2; i <= 3; i++) {
    const { error } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        title: `Test Meal ${i}`,
        description: `Daily limit test meal ${i}`,
        image_url: 'data:image/png;base64,test',
        image_path: `test/${i}.jpg`,
        basic_nutrition: {
          energy_kcal: 100 + i,
          protein_g: 10,
          carbs_g: 20,
          fat_g: 5
        },
        health_score: 75
      })
      
    if (error) {
      console.log(`❌ Error adding meal ${i}:`, error.message)
    } else {
      console.log(`✅ Added meal ${i}`)
    }
  }
  
  // Check daily count function
  console.log('\n📊 Testing daily count function...')
  const { data: dailyCount, error: countError } = await supabase
    .rpc('get_daily_meal_count', { user_id: userId })
    
  if (countError) {
    console.log('❌ Daily count error:', countError.message)
  } else {
    console.log('📅 Daily meals:', dailyCount)
  }
  
  // Check profile total count
  const { data: profile } = await supabase
    .from('profiles')
    .select('meal_count, subscription_tier')
    .eq('user_id', userId)
    .single()
    
  console.log('📊 Profile:', {
    total_meals: profile.meal_count,
    tier: profile.subscription_tier
  })
  
  // Test can_user_create_meal function
  console.log('\n🚫 Testing limit enforcement...')
  const { data: canCreate, error: limitError } = await supabase
    .rpc('can_user_create_meal', { user_id: userId })
    
  if (limitError) {
    console.log('❌ Limit check error:', limitError.message)
  } else {
    console.log('🎯 Can create meal:', canCreate ? 'YES' : 'NO (LIMIT REACHED)')
  }
  
  console.log('\n✅ TEST COMPLETE')
  console.log(`Expected: 3 daily meals, limit reached (can_create = false)`)
  console.log(`Actual: ${dailyCount} daily meals, can_create = ${canCreate}`)
  console.log(`Result: ${dailyCount === 3 && !canCreate ? 'PASSED ✅' : 'FAILED ❌'}`)
}

testDailyLimits()