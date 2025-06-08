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
// Bandwidth protection - Add this to the end of supabase.ts
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const queryCache = new Map()

export const cachedQuery = async (key: string, queryFn: () => Promise<any>) => {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  const data = await queryFn()
  queryCache.set(key, { data, timestamp: Date.now() })
  return data
}
