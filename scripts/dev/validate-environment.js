#!/usr/bin/env node

// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const { validateEnvironment, getEnvironmentInfo } = require('../../dist/src/lib/env-validation');

async function validateCompleteEnvironment() {
  console.log('🔍 Validating Complete Environment Configuration');
  console.log('================================================');
  
  try {
    // Run validation
    const validation = validateEnvironment();
    const info = getEnvironmentInfo();

    console.log(`📊 Environment: ${info.nodeEnv}`);
    console.log(`🏗️  Platform: ${info.platform}`);
    console.log(`📦 Version: ${info.version}`);
    console.log('');

    // Service status
    console.log('🔧 Service Configuration:');
    console.log(`├─ Supabase: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`);
    console.log(`├─ OpenAI: ${!!process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log(`├─ Stripe: ${!!process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
    console.log(`├─ Redis: ${info.hasRedis ? '✅' : '⚠️  (optional)'}`);
    console.log(`├─ Sentry: ${info.hasSentry ? '✅' : '⚠️  (optional)'}`);
    console.log(`└─ USDA: ${info.hasUSDA ? '✅' : '⚠️  (optional)'}`);
    console.log('');

    // Validation results
    if (validation.isValid) {
      console.log('✅ Environment validation PASSED');
      
      if (validation.warnings.length > 0) {
        console.log('');
        console.log('⚠️  Warnings:');
        validation.warnings.slice(0, 5).forEach(warning => {
          console.log(`   ${warning}`);
        });
        if (validation.warnings.length > 5) {
          console.log(`   ... and ${validation.warnings.length - 5} more`);
        }
      }
    } else {
      console.log('❌ Environment validation FAILED');
      console.log('');
      console.log('🚨 Critical Issues:');
      validation.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }

    console.log('');

    // Next steps
    if (validation.isValid) {
      console.log('🚀 Ready for MVP launch!');
      console.log('');
      console.log('💡 Next steps:');
      console.log('   1. Run: npm run dev');
      console.log('   2. Test: npm run test:all');
      console.log('   3. Deploy to production');
      
      if (!info.hasRedis) {
        console.log('');
        console.log('📈 For production scalability, consider:');
        console.log('   - Setting up Redis for distributed rate limiting');
        console.log('   - Configuring Sentry for error monitoring');
      }
    } else {
      console.log('⚙️  Setup required:');
      console.log('   1. Copy .env.example to .env.local');
      console.log('   2. Fill in the missing environment variables');
      console.log('   3. Run this validation again');
      console.log('');
      console.log('📖 See .env.example for setup instructions');
    }

    process.exit(validation.isValid ? 0 : 1);

  } catch (error) {
    console.error('💥 Validation script failed:', error.message);
    process.exit(1);
  }
}

validateCompleteEnvironment();