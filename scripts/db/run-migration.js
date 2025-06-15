/**
 * Run the billing_cycle migration manually
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🛠️  Running billing_cycle migration...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250614_ensure_billing_cycle.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration SQL loaded')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })
    
    if (error) {
      console.error('❌ Migration failed:', error.message)
      
      // Try alternative approach - run SQL directly
      console.log('🔄 Trying alternative migration approach...')
      
      // Add billing_cycle column
      const addColumnResult = await supabase.rpc('exec_sql', {
        sql: `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS billing_cycle text 
        CHECK (billing_cycle IN ('monthly', 'yearly', 'free')) 
        DEFAULT 'free';
        `
      })
      
      if (addColumnResult.error) {
        console.error('❌ Failed to add billing_cycle column:', addColumnResult.error.message)
      } else {
        console.log('✅ billing_cycle column added')
      }
      
      // Update existing records
      const updateResult = await supabase.rpc('exec_sql', {
        sql: `
        UPDATE public.profiles 
        SET billing_cycle = CASE 
          WHEN subscription_tier = 'free' THEN 'free'
          WHEN subscription_tier = 'premium_monthly' THEN 'monthly' 
          WHEN subscription_tier = 'premium_yearly' THEN 'yearly'
          ELSE 'free'
        END
        WHERE billing_cycle IS NULL;
        `
      })
      
      if (updateResult.error) {
        console.error('❌ Failed to update billing_cycle values:', updateResult.error.message)
      } else {
        console.log('✅ billing_cycle values updated')
      }
      
    } else {
      console.log('✅ Migration completed successfully')
    }
    
  } catch (error) {
    console.error('❌ Unexpected migration error:', error)
  }
}

runMigration().then(() => {
  console.log('🏁 Migration process completed')
})