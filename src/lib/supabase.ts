import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Simple environment variables
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  throw new Error('Missing Supabase configuration')
}

// Create simple client - no complexity
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
})

console.log('✅ Supabase client created successfully')
