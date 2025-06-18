const { createClient } = require('@supabase/supabase-js')

// Using anon key for read-only operations
const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function checkImageUrlColumn() {
  console.log('🔍 CHECKING IMAGE_URL COLUMN TYPE')
  console.log('=================================\n')

  try {
    // Query the database schema
    const { data: schemaInfo, error } = await supabase
      .from('meals')
      .select('image_url')
      .limit(0) // We don't need actual data, just schema info
    
    // Get column information from information_schema
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_column_info', {
        table_name: 'meals',
        column_name: 'image_url'
      })
      .single()

    if (columnError) {
      // If the RPC doesn't exist, try a different approach
      console.log('⚠️  Cannot query column info directly, checking actual data...')
      
      // Get meals with long image_urls to check for truncation
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('id, created_at, user_id, image_url')
        .order('created_at', { ascending: false })
        .limit(10)

      if (mealsError) {
        console.error('❌ Error fetching meals:', mealsError.message)
        return
      }

      console.log(`\n📊 Checking ${meals.length} recent meals for truncation:\n`)
      
      let truncatedCount = 0
      let normalCount = 0
      let noImageCount = 0

      meals.forEach((meal, index) => {
        const imageLength = meal.image_url ? meal.image_url.length : 0
        
        if (!meal.image_url) {
          noImageCount++
          console.log(`${index + 1}. Meal ${meal.id}: No image`)
        } else if (imageLength === 50000) {
          truncatedCount++
          console.log(`${index + 1}. Meal ${meal.id}: ⚠️  TRUNCATED (exactly 50,000 chars)`)
          console.log(`   Created: ${new Date(meal.created_at).toLocaleDateString()}`)
          console.log(`   User: ${meal.user_id}`)
        } else {
          normalCount++
          console.log(`${index + 1}. Meal ${meal.id}: ✅ Normal (${imageLength} chars)`)
        }
      })

      console.log('\n📈 SUMMARY:')
      console.log(`- Truncated images: ${truncatedCount}`)
      console.log(`- Normal images: ${normalCount}`)
      console.log(`- No image: ${noImageCount}`)

      if (truncatedCount > 0) {
        console.log('\n⚠️  WARNING: Found truncated images!')
        console.log('The image_url column is likely still VARCHAR(50000)')
        console.log('Migration needs to be applied to change it to TEXT')
      } else {
        console.log('\n✅ No truncated images found in recent meals')
        console.log('The column might already be TEXT type')
      }

      // Check for specific patterns in user IDs
      console.log('\n🔍 Checking for patterns in truncated vs normal images...')

    } else {
      // Display column info if we got it
      console.log('✅ Column Information:')
      console.log(columnInfo)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Add RPC function creation script
async function createColumnInfoRPC() {
  const sql = `
    CREATE OR REPLACE FUNCTION get_column_info(table_name text, column_name text)
    RETURNS TABLE (
      data_type text,
      character_maximum_length integer,
      is_nullable text
    )
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2;
    $$;
  `
  
  console.log('\n💡 To check column type directly, run this SQL in Supabase:')
  console.log(sql)
}

checkImageUrlColumn()