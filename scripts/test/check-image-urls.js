#!/usr/bin/env node

/**
 * Check image URLs in the database to identify truncated images
 * This helps diagnose the image display issue where base64 images are cut off
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkImageUrls() {
  console.log('🔍 Checking image URLs in database...\n')

  try {
    // Fetch all meals with their image URLs
    const { data: meals, error } = await supabase
      .from('meals')
      .select('id, title, created_at, image_url')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    if (!meals || meals.length === 0) {
      console.log('No meals found in database')
      return
    }

    console.log(`Found ${meals.length} meals\n`)

    let truncatedCount = 0
    let validCount = 0
    let missingCount = 0

    for (const meal of meals) {
      const imageUrlLength = meal.image_url ? meal.image_url.length : 0
      const isTruncated = imageUrlLength === 50000
      const date = new Date(meal.created_at).toLocaleString()

      console.log(`📸 ${meal.title || 'Untitled Meal'}`)
      console.log(`   ID: ${meal.id}`)
      console.log(`   Date: ${date}`)
      
      if (!meal.image_url) {
        console.log(`   ❌ No image URL`)
        missingCount++
      } else if (isTruncated) {
        console.log(`   ⚠️  TRUNCATED: Image URL is exactly 50,000 characters (column limit)`)
        truncatedCount++
      } else {
        console.log(`   ✅ Valid: Image URL is ${imageUrlLength.toLocaleString()} characters`)
        validCount++
      }

      // Check if it's a valid base64 image
      if (meal.image_url) {
        const isBase64 = meal.image_url.startsWith('data:image/')
        const hasValidEnding = !isTruncated || meal.image_url.endsWith('=') || /[A-Za-z0-9+/]$/.test(meal.image_url)
        
        if (!isBase64) {
          console.log(`   ⚠️  Not a base64 data URL`)
        } else if (isTruncated && !hasValidEnding) {
          console.log(`   ⚠️  Base64 string appears incomplete (truncated mid-character)`)
        }
      }

      console.log('')
    }

    // Summary
    console.log('📊 Summary:')
    console.log(`   ✅ Valid images: ${validCount}`)
    console.log(`   ⚠️  Truncated images: ${truncatedCount}`)
    console.log(`   ❌ Missing images: ${missingCount}`)

    if (truncatedCount > 0) {
      console.log('\n⚠️  ISSUE DETECTED: Images are being truncated at 50,000 characters')
      console.log('   This is causing the grey placeholder issue.')
      console.log('\n   To fix this:')
      console.log('   1. Run the migration: supabase/migrations/20250616_fix_image_url_column.sql')
      console.log('   2. This will change the column from VARCHAR(50000) to TEXT')
      console.log('   3. New images will then be stored without truncation')
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message)
    process.exit(1)
  }
}

checkImageUrls()