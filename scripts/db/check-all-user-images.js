const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function checkAllUserImages() {
  console.log('🔍 CHECKING IMAGE TRUNCATION ACROSS ALL USERS')
  console.log('=============================================\n')

  try {
    // First, let's login as alex to get access
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      console.log('Trying to query without auth...')
    } else {
      console.log('✅ Authenticated as:', loginData.user.email)
    }

    // Get all meals to analyze image data
    const { data: meals, error } = await supabase
      .from('meals')
      .select('id, created_at, user_id, image_url, title')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching meals:', error.message)
      return
    }

    console.log(`\n📊 Analyzing ${meals.length} total meals:\n`)
    
    const stats = {
      total: meals.length,
      truncated: [],
      normal: [],
      noImage: [],
      byUser: {}
    }

    // Analyze each meal
    meals.forEach((meal) => {
      const userId = meal.user_id
      const imageLength = meal.image_url ? meal.image_url.length : 0
      
      // Initialize user stats if needed
      if (!stats.byUser[userId]) {
        stats.byUser[userId] = {
          total: 0,
          truncated: 0,
          normal: 0,
          noImage: 0
        }
      }
      
      stats.byUser[userId].total++
      
      if (!meal.image_url) {
        stats.noImage.push(meal)
        stats.byUser[userId].noImage++
      } else if (imageLength === 50000) {
        stats.truncated.push(meal)
        stats.byUser[userId].truncated++
        console.log(`⚠️  TRUNCATED: Meal ${meal.id} - "${meal.title || 'Untitled'}"`)
        console.log(`   User: ${userId}`)
        console.log(`   Date: ${new Date(meal.created_at).toLocaleDateString()}`)
        console.log(`   Image length: exactly 50,000 chars (DB truncation)\n`)
      } else {
        stats.normal.push(meal)
        stats.byUser[userId].normal++
      }
    })

    // Summary
    console.log('\n📈 OVERALL SUMMARY:')
    console.log(`- Total meals: ${stats.total}`)
    console.log(`- Truncated images: ${stats.truncated.length} (${(stats.truncated.length/stats.total*100).toFixed(1)}%)`)
    console.log(`- Normal images: ${stats.normal.length} (${(stats.normal.length/stats.total*100).toFixed(1)}%)`)
    console.log(`- No image: ${stats.noImage.length} (${(stats.noImage.length/stats.total*100).toFixed(1)}%)`)

    // User breakdown
    console.log('\n👥 BREAKDOWN BY USER:')
    const userIds = Object.keys(stats.byUser)
    userIds.forEach(userId => {
      const userStats = stats.byUser[userId]
      console.log(`\nUser ${userId}:`)
      console.log(`  Total meals: ${userStats.total}`)
      console.log(`  Truncated: ${userStats.truncated}`)
      console.log(`  Normal: ${userStats.normal}`)
      console.log(`  No image: ${userStats.noImage}`)
      
      if (userStats.truncated > 0) {
        console.log(`  ⚠️  This user has truncated images!`)
      }
    })

    // Check if alex's user is affected
    if (loginData && loginData.user) {
      const alexStats = stats.byUser[loginData.user.id]
      if (alexStats) {
        console.log(`\n🔍 ALEX@PROPERTYTALENTS.COM STATS:`)
        console.log(`  Total meals: ${alexStats.total}`)
        console.log(`  Truncated: ${alexStats.truncated}`)
        console.log(`  Normal: ${alexStats.normal}`)
        console.log(`  No image: ${alexStats.noImage}`)
      }
    }

    // Migration status
    if (stats.truncated.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED:')
      console.log('The database still has VARCHAR(50000) limit on image_url column!')
      console.log('You need to run the migration to change it to TEXT type.')
      console.log('\nMigration SQL:')
      console.log('ALTER TABLE public.meals ALTER COLUMN image_url TYPE TEXT;')
    } else {
      console.log('\n✅ GOOD NEWS:')
      console.log('No truncated images found! The migration may have already been applied.')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAllUserImages()