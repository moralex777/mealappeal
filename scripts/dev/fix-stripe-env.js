#!/usr/bin/env node

/**
 * Quick fix for Stripe environment variable naming issue
 * The code expects NEXT_PUBLIC_ prefix but .env might not have it
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔧 Fixing Stripe environment variable names...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ No .env.local file found!');
  console.log('Run: npm run setup or npm run setup:stripe');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
let updated = false;

// Check and fix price ID variables
const fixes = [
  {
    old: 'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    new: 'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    description: 'Monthly price ID'
  },
  {
    old: 'STRIPE_PREMIUM_YEARLY_PRICE_ID', 
    new: 'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID',
    description: 'Yearly price ID'
  },
  {
    old: 'STRIPE_PUBLISHABLE_KEY',
    new: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    description: 'Publishable key'
  }
];

for (const fix of fixes) {
  const oldRegex = new RegExp(`^${fix.old}=(.+)$`, 'm');
  const newRegex = new RegExp(`^${fix.new}=`, 'm');
  
  const oldMatch = envContent.match(oldRegex);
  
  if (oldMatch && !envContent.match(newRegex)) {
    // Found old variable but not new one, add it
    const value = oldMatch[1];
    envContent += `\n${fix.new}=${value}`;
    console.log(`✅ Added ${fix.new} (${fix.description})`);
    updated = true;
  } else if (!oldMatch && !envContent.match(newRegex)) {
    console.log(`⚠️  Missing ${fix.new} - you'll need to add this manually`);
  }
}

if (updated) {
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Environment variables fixed!');
  console.log('🔄 Please restart your dev server: npm run dev');
} else {
  console.log('\n📋 Current Stripe configuration:');
  
  const stripeVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    'STRIPE_PREMIUM_YEARLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID',
  ];
  
  for (const varName of stripeVars) {
    const regex = new RegExp(`^${varName}=(.*)$`, 'm');
    const match = envContent.match(regex);
    if (match) {
      const value = match[1];
      const masked = value.length > 10 ? value.substring(0, 10) + '...' : value;
      console.log(`  ${varName}: ${masked}`);
    } else {
      console.log(`  ${varName}: ❌ NOT SET`);
    }
  }
  
  console.log('\n💡 To set up Stripe properly, run:');
  console.log('   node scripts/dev/setup-stripe-dev.js');
}