#!/usr/bin/env node

/**
 * Create Stripe Products and Prices for MealAppeal
 * This script creates the subscription products in your Stripe account
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

console.log(`
🎯 MealAppeal Stripe Product Setup
==================================

This script will help you create the subscription products in Stripe.

You have your Stripe test keys configured, so we can:

1. Manually create products in Stripe Dashboard (Recommended)
2. Use Stripe CLI to create products automatically
3. Use temporary price IDs for immediate testing

`);

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function updateEnvFile(updates) {
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
}

async function main() {
  try {
    const choice = await question('Choose an option (1, 2, or 3): ');

    if (choice === '1') {
      console.log(`
📋 Manual Setup Instructions:
=============================

1. Open https://dashboard.stripe.com/test/products
   (Make sure you're in TEST mode - toggle in top right)

2. Click "Add product" and create:

   Product 1: MealAppeal Premium Monthly
   - Name: MealAppeal Premium Monthly
   - Price: $4.99
   - Billing: Recurring
   - Billing period: Monthly

   Product 2: MealAppeal Premium Yearly
   - Name: MealAppeal Premium Yearly  
   - Price: $49.99
   - Billing: Recurring
   - Billing period: Yearly

3. After creating each product, click on it and copy the Price ID
   (it starts with "price_" and is shown under the price details)

`);

      const monthlyPriceId = await question('Enter the Monthly Price ID (price_...): ');
      const yearlyPriceId = await question('Enter the Yearly Price ID (price_...): ');

      await updateEnvFile({
        'STRIPE_PREMIUM_MONTHLY_PRICE_ID': monthlyPriceId.trim(),
        'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID': monthlyPriceId.trim(),
        'STRIPE_PREMIUM_YEARLY_PRICE_ID': yearlyPriceId.trim(),
        'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID': yearlyPriceId.trim(),
      });

      console.log('\n✅ Price IDs configured successfully!');

    } else if (choice === '2') {
      console.log(`
🚀 Stripe CLI Setup:
===================

To use this option, you need the Stripe CLI installed.

1. Install Stripe CLI:
   - Mac: brew install stripe/stripe-cli/stripe
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Linux: Follow instructions at https://stripe.com/docs/stripe-cli

2. Login to Stripe CLI:
   stripe login

3. Run these commands:

# Create Monthly Product
stripe products create \\
  --name="MealAppeal Premium Monthly" \\
  --description="Unlimited analyses, USDA data, and premium features"

stripe prices create \\
  --product=PRODUCT_ID_FROM_ABOVE \\
  --unit-amount=499 \\
  --currency=usd \\
  --recurring[interval]=month

# Create Yearly Product  
stripe products create \\
  --name="MealAppeal Premium Yearly" \\
  --description="Best value! Save 17% with yearly billing"

stripe prices create \\
  --product=PRODUCT_ID_FROM_ABOVE \\
  --unit-amount=4999 \\
  --currency=usd \\
  --recurring[interval]=year

4. Copy the price IDs from the command output

`);

      const hasStripeCLI = await question('Do you have Stripe CLI installed? (y/n): ');
      
      if (hasStripeCLI.toLowerCase() === 'y') {
        console.log('\nAfter running the commands above, enter the price IDs:\n');
        const monthlyPriceId = await question('Monthly Price ID (price_...): ');
        const yearlyPriceId = await question('Yearly Price ID (price_...): ');

        await updateEnvFile({
          'STRIPE_PREMIUM_MONTHLY_PRICE_ID': monthlyPriceId.trim(),
          'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID': monthlyPriceId.trim(),
          'STRIPE_PREMIUM_YEARLY_PRICE_ID': yearlyPriceId.trim(),
          'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID': yearlyPriceId.trim(),
        });

        console.log('\n✅ Price IDs configured successfully!');
      } else {
        console.log('\nPlease install Stripe CLI first or choose option 1 for manual setup.');
      }

    } else if (choice === '3') {
      console.log('\n🚧 Setting up temporary price IDs for testing...\n');

      // For quick testing, we'll use placeholder price IDs
      // These won't work with real Stripe but will let you test the UI
      await updateEnvFile({
        'STRIPE_PREMIUM_MONTHLY_PRICE_ID': 'price_temp_monthly_dev',
        'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID': 'price_temp_monthly_dev',
        'STRIPE_PREMIUM_YEARLY_PRICE_ID': 'price_temp_yearly_dev',
        'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID': 'price_temp_yearly_dev',
      });

      console.log('✅ Temporary price IDs configured!');
      console.log('⚠️  Note: These are placeholder IDs. The checkout will use mock mode.');
      console.log('    To enable real payments, run this script again and choose option 1.');

    } else {
      console.log('❌ Invalid choice. Please run the script again.');
      rl.close();
      return;
    }

    console.log(`
🎉 Setup complete!
==================

Next steps:
1. Restart your development server: npm run dev
2. Test the upgrade flow at http://localhost:3004/upgrade
3. Click on a plan to test the checkout process

${choice === '3' ? 
'⚠️  Remember: You\'re using temporary IDs, so checkout will use mock mode.' : 
'✅ You\'re using real Stripe test products!'}

Test card for Stripe checkout:
- Number: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Check current price configuration
function checkPriceConfig() {
  if (!fs.existsSync(envPath)) {
    return { configured: false, missing: ['env file'] };
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const priceVars = [
    'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID'
  ];

  const missing = [];
  const found = [];
  
  for (const varName of priceVars) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    if (match && match[1] && !match[1].includes('placeholder')) {
      found.push({ name: varName, value: match[1] });
    } else {
      missing.push(varName);
    }
  }

  return { configured: missing.length === 0, missing, found };
}

// Run the script
if (require.main === module) {
  console.log('Checking current Stripe product configuration...\n');
  
  const config = checkPriceConfig();
  
  if (config.configured) {
    console.log('✅ Stripe price IDs are already configured:');
    config.found.forEach(item => {
      console.log(`   ${item.name}: ${item.value}`);
    });
    
    question('\nDo you want to reconfigure? (y/n): ').then((answer) => {
      if (answer.toLowerCase() === 'y') {
        main();
      } else {
        console.log('\n✅ Keeping existing configuration');
        console.log('   Run: npm run dev');
        console.log('   Visit: http://localhost:3004/upgrade');
        rl.close();
      }
    });
  } else {
    console.log('⚠️  Missing Stripe price IDs:', config.missing.join(', '));
    main();
  }
}

module.exports = { checkPriceConfig };