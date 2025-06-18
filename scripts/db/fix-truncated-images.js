const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function fixTruncatedImages() {
  console.log('🔧 FIXING TRUNCATED IMAGES')
  console.log('==========================\n')

  try {
    // First authenticate to get access
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      return
    }

    console.log('✅ Authenticated successfully\n')
    // Get all truncated meals
    const { data: truncatedMeals, error } = await supabase
      .from('meals')
      .select('id, user_id, title, created_at')
      .eq('LENGTH(image_url)', 50000)

    if (error) {
      // LENGTH function might not work, try different approach
      const { data: allMeals, error: allError } = await supabase
        .from('meals')
        .select('id, user_id, title, created_at, image_url')
        .not('image_url', 'is', null)

      if (allError) {
        console.error('❌ Error fetching meals:', allError.message)
        return
      }

      // Filter truncated meals manually
      const truncated = allMeals.filter(meal => meal.image_url?.length === 50000)
      
      console.log(`Found ${truncated.length} truncated images\n`)

      if (truncated.length === 0) {
        console.log('✅ No truncated images found!')
        return
      }

      // Group by user
      const byUser = {}
      truncated.forEach(meal => {
        if (!byUser[meal.user_id]) {
          byUser[meal.user_id] = []
        }
        byUser[meal.user_id].push(meal)
      })

      console.log('AFFECTED USERS AND MEALS:')
      console.log('========================\n')

      Object.entries(byUser).forEach(([userId, meals]) => {
        console.log(`User ${userId}:`)
        console.log(`  ${meals.length} truncated images`)
        meals.forEach(meal => {
          console.log(`  - ${meal.title || 'Untitled'} (${new Date(meal.created_at).toLocaleDateString()})`)
        })
        console.log('')
      })

      console.log('RECOMMENDED ACTIONS:')
      console.log('===================\n')
      console.log('1. IMMEDIATE: Run the migration SQL in Supabase to fix the column:')
      console.log('   ALTER TABLE public.meals ALTER COLUMN image_url TYPE TEXT;\n')
      console.log('2. FOR USERS: After migration, users will need to:')
      console.log('   - Re-analyze affected meals to get new images')
      console.log('   - Or delete and re-capture these meals\n')
      console.log('3. OPTIONAL: Add a notification in the app for affected users')

      // Generate SQL to identify affected meals
      console.log('\n\nSQL TO FIND AFFECTED MEALS:')
      console.log('===========================')
      console.log(`
SELECT 
    m.id,
    m.title,
    m.created_at,
    p.email as user_email
FROM meals m
JOIN auth.users u ON m.user_id = u.id
JOIN profiles p ON p.id = u.id
WHERE LENGTH(m.image_url) = 50000
ORDER BY m.created_at DESC;
      `)

    } else {
      console.log(`Found ${truncatedMeals.length} truncated images`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixTruncatedImages()