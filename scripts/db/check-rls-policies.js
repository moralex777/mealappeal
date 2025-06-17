#!/usr/bin/env node

/**
 * Check RLS policies on profiles table
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function checkRLS() {
  console.log('\n🔍 Checking RLS and Profile Access\n');

  // Test with anon key (what the admin dashboard uses)
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test with service role key (bypasses RLS)
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Count with anon key (RLS active)
    const { count: anonCount, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles visible with ANON key (RLS active): ${anonCount || 0}`);
    if (anonError) console.log(`   Error: ${anonError.message}`);

    // 2. Count with service role key (RLS bypassed)
    const { count: serviceCount, error: serviceError } = await supabaseService
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles visible with SERVICE key (RLS bypassed): ${serviceCount || 0}`);
    if (serviceError) console.log(`   Error: ${serviceError.message}`);

    // 3. Check if RLS is the issue
    if (anonCount !== serviceCount) {
      console.log(`\n⚠️  RLS is limiting profile visibility!`);
      console.log(`   The admin dashboard can only see ${anonCount} out of ${serviceCount} profiles.`);
      console.log(`\n💡 Solution: The admin dashboard needs to use a different approach or RLS policies need updating.`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkRLS().then(() => {
  console.log('\n✅ RLS check complete!\n');
}).catch(console.error);