#!/usr/bin/env node

/**
 * Setup Stripe for Development
 * This script helps you configure Stripe for local development
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

console.log(`
🎯 MealAppeal Stripe Setup for Development
==========================================

This script will help you set up Stripe for local development.

You have two options:

1. TEST MODE (Recommended for development):
   - Use Stripe test keys and test products
   - No real charges will be made
   - Use test card: 4242 4242 4242 4242

2. QUICK START (For immediate testing):
   - Use pre-configured test values
   - Payments won't actually process
   - Good for UI/UX testing

`);

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  try {
    // Check if .env.local exists
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env.local file\n');
    } else {
      console.log('📝 Creating new .env.local file\n');
    }

    const choice = await question('Choose an option (1 for TEST MODE, 2 for QUICK START): ');

    if (choice === '1') {
      console.log(`
📋 TEST MODE Setup Instructions:
================================

1. Go to https://dashboard.stripe.com/test/dashboard
2. If you don't have a Stripe account, create one (it's free)
3. Make sure you're in TEST MODE (toggle in top right)

4. Get your test keys:
   - Go to Developers > API keys
   - Copy your test keys (they start with sk_test_ and pk_test_)

5. Create test products:
   - Go to Products > Add product
   - Create "MealAppeal Premium Monthly" ($4.99/month)
   - Create "MealAppeal Premium Yearly" ($49.99/year)
   - Copy the price IDs (they start with price_)

`);

      const secretKey = await question('Enter your Stripe SECRET key (sk_test_...): ');
      const publishableKey = await question('Enter your Stripe PUBLISHABLE key (pk_test_...): ');
      const monthlyPriceId = await question('Enter your Monthly price ID (price_...): ');
      const yearlyPriceId = await question('Enter your Yearly price ID (price_...): ');

      // Update environment variables
      const updates = {
        'STRIPE_SECRET_KEY': secretKey.trim(),
        'STRIPE_PUBLISHABLE_KEY': publishableKey.trim(),
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': publishableKey.trim(),
        'STRIPE_PREMIUM_MONTHLY_PRICE_ID': monthlyPriceId.trim(),
        'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID': monthlyPriceId.trim(),
        'STRIPE_PREMIUM_YEARLY_PRICE_ID': yearlyPriceId.trim(),
        'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID': yearlyPriceId.trim(),
      };

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }

      console.log('\n✅ Stripe TEST MODE configured successfully!');

    } else if (choice === '2') {
      console.log('\n🚀 Setting up QUICK START mode...\n');

      // Use dummy test values that will work for UI testing
      const updates = {
        'STRIPE_SECRET_KEY': 'sk_test_dummy_key_for_development_only',
        'STRIPE_PUBLISHABLE_KEY': 'pk_test_dummy_key_for_development_only',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_dummy_key_for_development_only',
        'STRIPE_PREMIUM_MONTHLY_PRICE_ID': 'price_dummy_monthly_development',
        'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID': 'price_dummy_monthly_development',
        'STRIPE_PREMIUM_YEARLY_PRICE_ID': 'price_dummy_yearly_development',
        'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID': 'price_dummy_yearly_development',
        'STRIPE_WEBHOOK_SECRET': 'whsec_dummy_webhook_development',
      };

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }

      console.log('✅ QUICK START mode configured!');
      console.log('⚠️  Note: Payments will fail with dummy keys. This is for UI testing only.');

    } else {
      console.log('❌ Invalid choice. Please run the script again.');
      rl.close();
      return;
    }

    // Write updated .env.local
    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log(`
🎉 Stripe setup complete!
========================

Next steps:
1. Restart your development server: npm run dev
2. Test the upgrade flow at http://localhost:3004/upgrade

${choice === '1' ? `Test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires auth: 4000 0025 0000 3155

Use any future date for expiry and any 3 digits for CVC.` : 
'To enable real payments, run this script again and choose option 1.'}

`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Also check current configuration
function checkCurrentConfig() {
  if (!fs.existsSync(envPath)) {
    console.log('❌ No .env.local file found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID'
  ];

  const missing = [];
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=.+$`, 'm');
    if (!envContent.match(regex)) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.log('⚠️  Missing Stripe environment variables:', missing.join(', '));
    return false;
  }

  console.log('✅ Stripe environment variables are configured');
  return true;
}

// Run the script
if (require.main === module) {
  console.log('Checking current Stripe configuration...\n');
  const isConfigured = checkCurrentConfig();
  
  if (isConfigured) {
    question('\nStripe is already configured. Do you want to reconfigure? (y/n): ').then((answer) => {
      if (answer.toLowerCase() === 'y') {
        main();
      } else {
        console.log('✅ Keeping existing configuration');
        rl.close();
      }
    });
  } else {
    main();
  }
}

module.exports = { checkCurrentConfig };