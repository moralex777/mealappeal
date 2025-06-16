#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfile() {
  const userId = '2e30fa13-6e61-4de8-b1e4-c0cfd3a4f9d3';
  
  console.log('🔍 Checking profile for user:', userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id, email')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('❌ Error fetching profile:', error);
    return;
  }
  
  console.log('\n📋 Profile data:');
  console.log('- Email:', data?.email);
  console.log('- stripe_customer_id type:', typeof data?.stripe_customer_id);
  console.log('- stripe_customer_id length:', data?.stripe_customer_id?.length);
  console.log('- stripe_customer_id first 50 chars:', data?.stripe_customer_id?.substring(0, 50));
  
  // Check if it's stored as JSON
  if (data?.stripe_customer_id) {
    try {
      const parsed = JSON.parse(data.stripe_customer_id);
      console.log('\n⚠️  PROBLEM: stripe_customer_id is stored as JSON!');
      console.log('- Parsed object type:', parsed.object);
      console.log('- Actual customer ID:', parsed.id);
      console.log('\n✅ FIX: Should store only the ID:', parsed.id);
      
      // Fix it
      console.log('\n🔧 Fixing the issue...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: parsed.id })
        .eq('id', userId);
        
      if (updateError) {
        console.error('❌ Failed to fix:', updateError);
      } else {
        console.log('✅ Fixed! stripe_customer_id now contains only the ID');
      }
      
    } catch (e) {
      console.log('\n✅ Good: stripe_customer_id is stored as a plain string ID');
    }
  }
}

checkProfile().then(() => process.exit(0));