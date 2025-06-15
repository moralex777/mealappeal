const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function checkMeals() {
  console.log('🍽️ CHECKING YOUR MEAL HISTORY')
  console.log('===============================')

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

  // Get meals
  const { data: meals, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', loginData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.log('❌ Error fetching meals:', error.message)
  } else if (meals.length === 0) {
    console.log('📭 No meals found yet - time to capture your first meal!')
  } else {
    console.log(`\n🎉 Found ${meals.length} meals in your history:\n`)

    meals.forEach((meal, i) => {
      console.log(`${i + 1}. 🍽️ ${meal.title || 'Unknown Food'}`)
      console.log(`   📅 Date: ${new Date(meal.created_at).toLocaleDateString()}`)
      console.log(`   🔥 Calories: ${meal.basic_nutrition?.energy_kcal || 'N/A'}`)
      console.log(`   💪 Protein: ${meal.basic_nutrition?.protein_g || 'N/A'}g`)
      console.log(`   🌾 Carbs: ${meal.basic_nutrition?.carbs_g || 'N/A'}g`)
      console.log(`   🥑 Fat: ${meal.basic_nutrition?.fat_g || 'N/A'}g`)
      console.log(`   ⭐ Health Score: ${meal.health_score || 'N/A'}/10`)
      console.log(`   🏷️ Tags: ${meal.meal_tags ? meal.meal_tags.join(', ') : 'None'}`)
      console.log(`   🆔 ID: ${meal.id}`)
      console.log('')
    })
  }

  // Also check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', loginData.user.id)
    .single()

  if (profile) {
    console.log('👤 Your Profile Info:')
    console.log(`   📊 Total Meals: ${profile.meal_count}`)
    console.log(`   🎯 Subscription: ${profile.subscription_tier}`)
    console.log(`   📤 Monthly Shares Used: ${profile.monthly_shares_used}`)
  }
}

checkMeals()
