#!/usr/bin/env node

/**
 * Weekly Admin Dashboard Review Helper
 * Run this every Monday to get insights and recommendations
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

async function weeklyReview() {
  console.log('\n📊 MEALAPPEAL WEEKLY ADMIN REVIEW');
  console.log('================================');
  console.log(`Date: ${new Date().toLocaleDateString()}\n`);

  try {
    // 1. User Growth
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: weekOldUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const newUsersThisWeek = totalUsers - (weekOldUsers || 0);
    
    console.log('👥 USER METRICS:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   New This Week: ${newUsersThisWeek}`);
    console.log(`   Growth Rate: ${weekOldUsers ? ((newUsersThisWeek / weekOldUsers) * 100).toFixed(1) : 0}%`);

    // 2. Conversion Metrics
    const { count: premiumUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('subscription_tier', ['premium_monthly', 'premium_yearly']);
    
    const conversionRate = ((premiumUsers / totalUsers) * 100).toFixed(1);
    
    console.log('\n💰 REVENUE METRICS:');
    console.log(`   Premium Users: ${premiumUsers}`);
    console.log(`   Free Users: ${totalUsers - premiumUsers}`);
    console.log(`   Conversion Rate: ${conversionRate}% (Target: 15%)`);
    console.log(`   Estimated MRR: $${(premiumUsers * 4.99).toFixed(2)}`);

    // 3. Engagement Metrics
    const { count: weeklyMeals } = await supabase
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const mealsPerUser = (weeklyMeals / totalUsers).toFixed(1);
    
    console.log('\n📸 ENGAGEMENT METRICS:');
    console.log(`   Meals This Week: ${weeklyMeals}`);
    console.log(`   Avg Meals/User: ${mealsPerUser}`);
    console.log(`   Daily Average: ${(weeklyMeals / 7).toFixed(0)} meals/day`);

    // 4. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (conversionRate < 10) {
      console.log('   🔴 Conversion rate is LOW - Review upgrade flow');
      console.log('      - Check pricing competitiveness');
      console.log('      - Improve value proposition messaging');
      console.log('      - Add more premium features');
    } else if (conversionRate < 15) {
      console.log('   🟡 Conversion rate needs improvement');
      console.log('      - A/B test upgrade prompts');
      console.log('      - Add social proof to upgrade flow');
    } else {
      console.log('   ✅ Conversion rate is on target!');
    }

    if (mealsPerUser < 3) {
      console.log('   🔴 User engagement is LOW');
      console.log('      - Send engagement emails');
      console.log('      - Improve onboarding flow');
      console.log('      - Check for technical issues');
    }

    if (newUsersThisWeek < 5) {
      console.log('   🟡 User growth is slow');
      console.log('      - Time for marketing push');
      console.log('      - Consider referral program');
      console.log('      - Improve SEO/content');
    }

    // 5. Action Items
    console.log('\n📋 ACTION ITEMS FOR THIS WEEK:');
    console.log('   1. Check admin dashboard: https://www.mealappeal.app/admin');
    console.log('   2. Create backup if needed');
    console.log('   3. Review Stripe dashboard for payment issues');
    console.log('   4. Check Sentry for any errors');
    console.log('   5. Plan features based on user feedback');

  } catch (error) {
    console.error('\n❌ Error during review:', error.message);
  }
}

// Run the review
weeklyReview().then(() => {
  console.log('\n✅ Weekly review complete!\n');
  console.log('📅 Next review due:', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString());
}).catch(console.error);