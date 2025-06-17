#!/usr/bin/env node

/**
 * Check user counts in both auth.users and profiles tables
 * This helps diagnose discrepancies in user counts
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserCounts() {
  console.log('\n🔍 Checking User Counts in Database\n');

  try {
    // 1. Count total auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
    } else {
      console.log(`📊 Total users in auth.users: ${authUsers.users.length}`);
      
      // Show some user details
      console.log('\n👥 First 5 users:');
      authUsers.users.slice(0, 5).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
      });
    }

    // 2. Count profiles
    const { count: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profileError) {
      console.error('\n❌ Error counting profiles:', profileError.message);
    } else {
      console.log(`\n📊 Total profiles in profiles table: ${profileCount}`);
    }

    // 3. Check for users without profiles
    if (authUsers && !authError && profileCount !== null && !profileError) {
      const missingProfiles = authUsers.users.length - profileCount;
      
      if (missingProfiles > 0) {
        console.log(`\n⚠️  ${missingProfiles} users don't have profiles!`);
        
        // Find which users are missing profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id');
        
        const profileUserIds = new Set(profiles.map(p => p.user_id));
        const usersWithoutProfiles = authUsers.users.filter(u => !profileUserIds.has(u.id));
        
        console.log('\n🚨 Users without profiles:');
        usersWithoutProfiles.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        });
      } else if (missingProfiles < 0) {
        console.log(`\n⚠️  There are ${Math.abs(missingProfiles)} extra profiles (orphaned)?`);
      } else {
        console.log('\n✅ All users have profiles!');
      }
    }

    // 4. Check subscription tiers
    const { data: tiers, error: tierError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .order('subscription_tier');
    
    if (!tierError && tiers) {
      const tierCounts = tiers.reduce((acc, { subscription_tier }) => {
        acc[subscription_tier || 'null'] = (acc[subscription_tier || 'null'] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n💎 Subscription Tier Breakdown:');
      Object.entries(tierCounts).forEach(([tier, count]) => {
        console.log(`   ${tier}: ${count} users`);
      });
    }

    // 5. Check recent registrations
    const { data: recentProfiles } = await supabase
      .from('profiles')
      .select('email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentProfiles) {
      console.log('\n🆕 Most Recent Registrations:');
      recentProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${new Date(profile.created_at).toLocaleDateString()})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

// Run the check
checkUserCounts().then(() => {
  console.log('\n✅ User count check complete!\n');
}).catch(console.error);