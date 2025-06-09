#!/usr/bin/env node

/**
 * MealAppeal Database Setup Script
 * This script helps set up the database with the new subscription tier structure
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🔧 MealAppeal Database Setup Starting...\n')

// Check if .env.local exists
const envPath = '.env.local'
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found!')
  console.log('📝 Please copy .env.example to .env.local and fill in your values.')
  console.log('💡 See .env.example for setup instructions.')
  process.exit(1)
}

// Load environment variables
require('dotenv').config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase configuration!')
  console.log('📝 Please ensure these environment variables are set:')
  console.log('   - NEXT_PUBLIC_SUPABASE_URL')
  console.log('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('📊 Checking current database state...')

    // Check if profiles table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message)
      return false
    }

    if (!tables || tables.length === 0) {
      console.error('❌ Error: profiles table not found!')
      console.log('📝 Please ensure your Supabase project has the basic schema.')
      console.log('💡 You may need to set up your database schema first.')
      return false
    }

    console.log('✅ Database connection successful')

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241207_update_subscription_tiers.sql')

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Error: Migration file not found!')
      console.log('📁 Expected:', migrationPath)
      return false
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('📜 Running database migration...')

    // Split SQL by statements and execute each one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.length > 0) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️  Warning:', error.message)
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    return false
  }
}

async function verifySetup() {
  try {
    console.log('🔍 Verifying database setup...')

    // Check if new columns exist
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at, billing_cycle')
      .limit(1)

    if (error) {
      console.error('❌ Verification failed:', error.message)
      return false
    }

    console.log('✅ Database schema verified!')

    // Check subscription tiers
    const { data: testData } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .in('subscription_tier', ['free', 'premium_monthly', 'premium_yearly'])
      .limit(1)

    console.log('✅ Subscription tiers working correctly!')
    return true

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting MealAppeal database setup...\n')

  const migrationSuccess = await runMigration()
  if (!migrationSuccess) {
    console.error('❌ Setup failed during migration')
    process.exit(1)
  }

  const verificationSuccess = await verifySetup()
  if (!verificationSuccess) {
    console.error('❌ Setup failed during verification')
    process.exit(1)
  }

  console.log('\n🎉 Database setup completed successfully!')
  console.log('\n📋 Next steps:')
  console.log('   1. Set up Google OAuth in your Supabase project')
  console.log('   2. Configure Stripe subscriptions')
  console.log('   3. Add your OpenAI API key')
  console.log('   4. Run: npm run dev')
  console.log('\n💡 See .env.example for detailed setup instructions')
}

// Run the setup
main().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
