#!/usr/bin/env node

/**
 * Check for User ID Mismatches in Profiles Table
 * 
 * This script diagnoses authentication issues caused by profiles
 * having mismatched or missing user_id values.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserIdMismatches() {
  console.log('🔍 Checking for User ID Mismatches in Profiles Table\n');

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching profiles:', error.message);
      return;
    }

    console.log(`📊 Total profiles: ${profiles.length}\n`);

    // Analyze mismatches
    const mismatches = {
      nullUserId: [],
      mismatchedIds: [],
      correct: []
    };

    profiles.forEach(profile => {
      if (!profile.user_id) {
        mismatches.nullUserId.push(profile);
      } else if (profile.user_id !== profile.id) {
        mismatches.mismatchedIds.push(profile);
      } else {
        mismatches.correct.push(profile);
      }
    });

    // Report findings
    console.log('📈 Analysis Results:');
    console.log(`✅ Correct (id = user_id): ${mismatches.correct.length} profiles`);
    console.log(`❌ NULL user_id: ${mismatches.nullUserId.length} profiles`);
    console.log(`⚠️  Mismatched IDs: ${mismatches.mismatchedIds.length} profiles\n`);

    // Show details of problematic profiles
    if (mismatches.nullUserId.length > 0) {
      console.log('🔴 Profiles with NULL user_id:');
      console.log('These profiles will cause authentication failures!');
      mismatches.nullUserId.forEach(p => {
        console.log(`  - ${p.email || 'No email'} (id: ${p.id}, created: ${p.created_at})`);
      });
      console.log('');
    }

    if (mismatches.mismatchedIds.length > 0) {
      console.log('🟡 Profiles with mismatched IDs:');
      mismatches.mismatchedIds.forEach(p => {
        console.log(`  - ${p.email || 'No email'} (id: ${p.id}, user_id: ${p.user_id})`);
      });
      console.log('');
    }

    // Check for orphaned auth users (users without profiles)
    console.log('🔍 Checking for orphaned auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️  Could not check auth users (requires admin permissions)');
    } else {
      const profileIds = new Set(profiles.map(p => p.id));
      const orphanedUsers = authUsers.users.filter(u => !profileIds.has(u.id));
      
      console.log(`📊 Total auth users: ${authUsers.users.length}`);
      console.log(`❌ Orphaned users (no profile): ${orphanedUsers.length}`);
      
      if (orphanedUsers.length > 0) {
        console.log('\n🔴 Users without profiles:');
        orphanedUsers.forEach(u => {
          console.log(`  - ${u.email} (id: ${u.id}, created: ${u.created_at})`);
        });
      }
    }

    // Provide fix recommendation
    if (mismatches.nullUserId.length > 0 || mismatches.mismatchedIds.length > 0) {
      console.log('\n🛠️  FIX REQUIRED:');
      console.log('Run the following SQL to fix the mismatches:');
      console.log('```sql');
      console.log('UPDATE public.profiles SET user_id = id WHERE user_id IS NULL OR user_id != id;');
      console.log('```');
      console.log('\nOr run the migration script:');
      console.log('psql $DATABASE_URL -f fix-profile-user-id-mismatch.sql');
    } else {
      console.log('\n✅ All profiles have correct user_id values!');
    }

    // Check sample queries
    console.log('\n🔍 Testing common query patterns:');
    
    // Test query by user_id (app pattern)
    const testUserId = profiles[0]?.id;
    if (testUserId) {
      const { data: byUserId, error: userIdError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', testUserId)
        .single();
      
      console.log(`Query by user_id (${testUserId}): ${userIdError ? '❌ Failed' : '✅ Success'}`);
      if (userIdError) console.log(`  Error: ${userIdError.message}`);
      
      // Test query by id (RLS pattern)
      const { data: byId, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      console.log(`Query by id (${testUserId}): ${idError ? '❌ Failed' : '✅ Success'}`);
      if (idError) console.log(`  Error: ${idError.message}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkUserIdMismatches();