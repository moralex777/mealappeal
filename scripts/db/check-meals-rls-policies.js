#!/usr/bin/env node

/**
 * Check RLS policies specifically on the meals table
 * This script examines Row Level Security configurations for the meals table
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function checkMealsRLS() {
  console.log('\n🔍 Checking Row Level Security (RLS) on Meals Table\n');
  console.log('==================================================\n');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    return;
  }

  // Create service role client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check if RLS is enabled on meals table
    console.log('1️⃣  Checking RLS status on meals table...\n');
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'meals';
        `
      });

    if (rlsError) {
      // Try alternative query method
      console.log('   Trying alternative query method...');
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'meals');
      
      if (tablesError) {
        console.error('❌ Error checking RLS status:', tablesError.message);
        console.log('\n💡 Note: You may need to run this query directly in Supabase SQL editor:');
        console.log(`
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'meals';
        `);
      }
    } else if (rlsStatus && rlsStatus.length > 0) {
      const tableInfo = rlsStatus[0];
      console.log(`   Table: ${tableInfo.schemaname}.${tableInfo.tablename}`);
      console.log(`   RLS Enabled: ${tableInfo.rowsecurity ? '✅ YES' : '❌ NO'}`);
      
      if (!tableInfo.rowsecurity) {
        console.log('\n⚠️  WARNING: RLS is NOT enabled on the meals table!');
        console.log('   This means all users can potentially access all meals.');
        console.log('\n💡 To enable RLS, run this SQL command:');
        console.log('   ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;');
      }
    }

    // 2. List all policies on meals table
    console.log('\n2️⃣  Fetching RLS policies for meals table...\n');
    
    const policiesQuery = `
      SELECT 
        policyname,
        cmd,
        qual,
        with_check,
        roles
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'meals'
      ORDER BY policyname;
    `;

    console.log('💡 Run this query in Supabase SQL editor to see all policies:\n');
    console.log(policiesQuery);

    // 3. Check specific common policies
    console.log('\n3️⃣  Common RLS Policy Patterns for meals table:\n');
    
    console.log('📋 SELECT Policy (Users can view their own meals):');
    console.log(`
CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);
    `);

    console.log('\n📋 INSERT Policy (Users can create their own meals):');
    console.log(`
CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
    `);

    console.log('\n📋 UPDATE Policy (Users can update their own meals):');
    console.log(`
CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);
    `);

    console.log('\n📋 DELETE Policy (Users can delete their own meals):');
    console.log(`
CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);
    `);

    // 4. Test current access
    console.log('\n4️⃣  Testing meal access with different keys...\n');

    // Test with anon key
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { count: anonCount, error: anonError } = await supabaseAnon
      .from('meals')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Meals accessible with ANON key (unauthenticated): ${anonCount !== null ? anonCount : 'Error'}`);
    if (anonError) console.log(`   Error: ${anonError.message}`);

    // Test with service role key
    const { count: serviceCount, error: serviceError } = await supabase
      .from('meals')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Meals accessible with SERVICE key (RLS bypassed): ${serviceCount !== null ? serviceCount : 'Error'}`);
    if (serviceError) console.log(`   Error: ${serviceError.message}`);

    // 5. Recommendations
    console.log('\n5️⃣  Recommendations:\n');
    
    if (anonCount > 0) {
      console.log('⚠️  WARNING: Unauthenticated users can see meals!');
      console.log('   This could be a security issue unless meals are meant to be public.');
      console.log('\n💡 To fix this, ensure all policies require authentication:');
      console.log('   - Use auth.uid() in policy conditions');
      console.log('   - Remove any policies that allow public access');
    }

    console.log('\n📚 To view current policies in Supabase Dashboard:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to Authentication > Policies');
    console.log('   3. Select the "meals" table');
    console.log('   4. Review all active policies');

    console.log('\n🔧 To fix missing or incorrect policies:');
    console.log('   1. Go to SQL Editor in Supabase Dashboard');
    console.log('   2. Run the policy creation commands shown above');
    console.log('   3. Test with npm run debug:login to verify user access');

  } catch (error) {
    console.error('\n❌ Error checking RLS policies:', error.message);
    console.error(error);
  }
}

// Run the check
checkMealsRLS().then(() => {
  console.log('\n✅ RLS check complete!\n');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});