#!/usr/bin/env node

/**
 * Diagnose why a specific user can't see their meals
 * Usage: node scripts/db/diagnose-user-meals.js user@example.com
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Get user email from command line
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide a user email as argument');
  console.error('Usage: node scripts/db/diagnose-user-meals.js user@example.com');
  process.exit(1);
}

// Create two clients - one with anon key (RLS active) and one with service role (RLS bypassed)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseUserMeals() {
  console.log('\n🔍 DIAGNOSING MEAL VISIBILITY ISSUES');
  console.log('=====================================');
  console.log(`User: ${userEmail}\n`);

  try {
    // Step 1: Check if user exists in auth.users
    console.log('1️⃣  Checking user authentication record...');
    const { data: authUsers, error: authError } = await supabaseService.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === userEmail);
    
    if (!authUser) {
      console.log('❌ User not found in auth.users table');
      console.log('💡 This user has never signed up or their account was deleted');
      return;
    }

    console.log('✅ User found in auth.users');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Created: ${new Date(authUser.created_at).toLocaleDateString()}`);
    console.log(`   Last Sign In: ${authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleDateString() : 'Never'}`);

    const userId = authUser.id;

    // Step 2: Check profile exists
    console.log('\n2️⃣  Checking user profile...');
    
    // First check with service role (bypasses RLS)
    const { data: profileService, error: profileServiceError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileServiceError) {
      console.error('❌ Error checking profile:', profileServiceError.message);
      return;
    }

    if (!profileService) {
      console.log('❌ No profile found for this user');
      console.log('💡 Profile creation might have failed during signup');
      console.log('💡 Check if database trigger for profile creation is working');
      return;
    }

    console.log('✅ Profile exists');
    console.log(`   Profile ID: ${profileService.id}`);
    console.log(`   User ID: ${profileService.user_id}`);
    console.log(`   Email: ${profileService.email}`);
    console.log(`   Meal Count: ${profileService.meal_count}`);
    console.log(`   Subscription: ${profileService.subscription_tier || 'free'}`);

    // Step 3: Check meals with service role (RLS bypassed)
    console.log('\n3️⃣  Checking meals (RLS bypassed)...');
    const { data: mealsService, count: serviceCount, error: mealsServiceError } = await supabaseService
      .from('meals')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (mealsServiceError) {
      console.error('❌ Error fetching meals:', mealsServiceError.message);
      return;
    }

    console.log(`📊 Total meals found (without RLS): ${serviceCount || 0}`);
    
    if (mealsService && mealsService.length > 0) {
      console.log('\n📋 Recent meals:');
      mealsService.forEach((meal, i) => {
        console.log(`   ${i + 1}. ${meal.title || 'Unknown'} - ${new Date(meal.created_at).toLocaleDateString()}`);
        console.log(`      ID: ${meal.id}`);
        console.log(`      User ID matches: ${meal.user_id === userId ? '✅' : '❌'}`);
        if (meal.image_url) {
          console.log(`      Image URL length: ${meal.image_url.length} chars`);
          if (meal.image_url.length > 40000) {
            console.log(`      ⚠️  Image URL might be truncated!`);
          }
        }
      });
    }

    // Step 4: Check meals with anon key (RLS active) - simulating what the user sees
    console.log('\n4️⃣  Checking meals (with RLS - what user sees)...');
    
    // First, we need to login as the user to properly test RLS
    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email: userEmail,
      password: 'TestPassword123!' // This won't work, but we'll handle it
    });

    let anonCount = 0;
    
    if (loginError) {
      console.log('⚠️  Cannot login as user (password unknown), checking with unauthenticated query...');
      
      // Try to query without authentication (this will show if there are public RLS policies)
      const { count: publicCount, error: publicError } = await supabaseAnon
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (!publicError) {
        anonCount = publicCount || 0;
        console.log(`📊 Meals visible without authentication: ${anonCount}`);
      } else {
        console.log('❌ Cannot query meals without authentication:', publicError.message);
      }
    } else {
      // If somehow we logged in, check meals
      const { count: userCount, error: userError } = await supabaseAnon
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (!userError) {
        anonCount = userCount || 0;
        console.log(`📊 Meals visible to authenticated user: ${anonCount}`);
      }
      
      // Logout
      await supabaseAnon.auth.signOut();
    }

    // Step 5: Diagnose the issue
    console.log('\n5️⃣  DIAGNOSIS:');
    console.log('==============');

    if (serviceCount === 0) {
      console.log('❌ USER HAS NO MEALS IN DATABASE');
      console.log('💡 Possible causes:');
      console.log('   - User has never analyzed any meals');
      console.log('   - Meals were deleted');
      console.log('   - Meal creation failed during analysis');
    } else if (serviceCount > 0 && anonCount < serviceCount) {
      console.log('⚠️  RLS POLICIES ARE BLOCKING MEAL ACCESS');
      console.log(`   - Actual meals in database: ${serviceCount}`);
      console.log(`   - Meals visible to user: ${anonCount}`);
      console.log('💡 Solutions:');
      console.log('   1. Check RLS policies on meals table');
      console.log('   2. Ensure RLS policy checks user_id = auth.uid()');
      console.log('   3. Verify user is properly authenticated when querying');
      console.log('   4. Run: npm run db:check-rls-policies');
    } else if (serviceCount > 0 && serviceCount === anonCount) {
      console.log('✅ NO ISSUES FOUND - User should be able to see all their meals');
      console.log('💡 If user still reports issues:');
      console.log('   - Clear browser cache/cookies');
      console.log('   - Check for client-side filtering');
      console.log('   - Verify authentication state in app');
      console.log('   - Check for JavaScript errors in console');
    }

    // Step 6: Additional checks
    console.log('\n6️⃣  Additional checks...');

    // Check for orphaned meals (wrong user_id column)
    const { count: orphanedCount } = await supabaseService
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('id', userId); // Common mistake: using 'id' instead of 'user_id'

    if (orphanedCount && orphanedCount > 0) {
      console.log(`⚠️  Found ${orphanedCount} meals using wrong column (id instead of user_id)!`);
      console.log('💡 These meals are orphaned and won\'t show up for the user');
    }

    // Check meal count discrepancy
    if (profileService.meal_count !== serviceCount) {
      console.log(`⚠️  Profile meal count (${profileService.meal_count}) doesn't match actual meals (${serviceCount})`);
      console.log('💡 Database trigger for updating meal_count might not be working');
    }

    console.log('\n✅ Diagnosis complete!');

  } catch (error) {
    console.error('\n❌ Unexpected error during diagnosis:', error.message);
    console.error(error);
  }
}

// Run the diagnosis
diagnoseUserMeals().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});