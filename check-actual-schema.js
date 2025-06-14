/**
 * Check the actual database schema
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file')
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkActualSchema() {
  console.log('🔍 Checking actual database schema...')
  
  try {
    // Try to get one profile record to see available columns
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error querying profiles:', error.message)
    } else if (data && data.length > 0) {
      console.log('✅ Profiles table schema (from actual data):')
      console.log('Available columns:', Object.keys(data[0]))
      console.log('Sample record:', data[0])
    } else {
      console.log('⚠️  No profiles found, trying to create a test profile...')
      
      // Try with minimal columns
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id, full_name, subscription_tier')
        .limit(1)
      
      if (testError) {
        console.error('❌ Error with minimal query:', testError.message)
      } else {
        console.log('✅ Minimal query works')
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkActualSchema()