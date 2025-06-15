/**
 * Discover the actual database schema by testing queries
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

async function discoverSchema() {
  console.log('🔍 Discovering actual database schema...')
  
  // List of columns to test
  const columnsToTest = [
    'id',
    'user_id', 
    'full_name',
    'avatar_url',
    'subscription_tier',
    'subscription_expires_at',
    'billing_cycle',
    'meal_count',
    'monthly_shares_used',
    'created_at',
    'updated_at',
    'stripe_customer_id',
    'stripe_subscription_id'
  ]
  
  const existingColumns = []
  
  for (const column of columnsToTest) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(column)
        .limit(1)
      
      if (!error) {
        existingColumns.push(column)
        console.log(`✅ ${column}`)
      } else {
        console.log(`❌ ${column} - ${error.message}`)
      }
    } catch (error) {
      console.log(`❌ ${column} - ${error.message}`)
    }
  }
  
  console.log('\n📋 EXISTING COLUMNS:', existingColumns)
  
  // Try to get an actual profile record
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (!error && data && data.length > 0) {
      console.log('\n📊 SAMPLE DATA:')
      console.log(data[0])
      console.log('\n🔑 ACTUAL COLUMNS:', Object.keys(data[0]))
    } else {
      console.log('\n⚠️  No profile data found')
    }
  } catch (error) {
    console.log('\n❌ Could not fetch sample data:', error.message)
  }
}

discoverSchema()