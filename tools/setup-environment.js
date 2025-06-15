#!/usr/bin/env node

/**
 * Environment Setup Tool - One-command development environment setup
 * Validates environment, creates missing files, and guides setup
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, '.env.local');
const ENV_EXAMPLE_PATH = path.join(PROJECT_ROOT, '.env.example');

// Required environment variables
const REQUIRED_ENV_VARS = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Your Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Your Supabase anonymous key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Your Supabase service role key',
  'OPENAI_API_KEY': 'Your OpenAI API key (for food analysis)',
  'STRIPE_SECRET_KEY': 'Your Stripe secret key',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Your Stripe publishable key'
};

// Optional environment variables
const OPTIONAL_ENV_VARS = {
  'STRIPE_WEBHOOK_SECRET': 'Stripe webhook secret (for production)',
  'USDA_API_KEY': 'USDA API key (for enhanced nutrition data)',
  'RESEND_API_KEY': 'Resend API key (for transactional emails)',
  'DEBUG_EMAIL': 'Email for development testing',
  'DEBUG_PASSWORD': 'Password for development testing'
};

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function createEnvLocalFromExample() {
  if (!checkFileExists(ENV_EXAMPLE_PATH)) {
    console.error('❌ .env.example not found! Cannot create .env.local');
    return false;
  }
  
  try {
    const exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    fs.writeFileSync(ENV_LOCAL_PATH, exampleContent);
    console.log('✅ Created .env.local from .env.example');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env.local:', error.message);
    return false;
  }
}

function loadEnvFile() {
  if (!checkFileExists(ENV_LOCAL_PATH)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
      }
    });
    
    return env;
  } catch (error) {
    console.error('❌ Failed to read .env.local:', error.message);
    return {};
  }
}

function validateEnvironment() {
  console.log('🔍 Checking environment configuration...');
  
  const env = loadEnvFile();
  const missing = [];
  const incomplete = [];
  
  // Check required variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    if (!env[key]) {
      missing.push({ key, description, required: true });
    } else if (env[key].includes('your-') || env[key].includes('example')) {
      incomplete.push({ key, description, required: true });
    }
  });
  
  // Check optional variables
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, description]) => {
    if (!env[key]) {
      missing.push({ key, description, required: false });
    } else if (env[key].includes('your-') || env[key].includes('example')) {
      incomplete.push({ key, description, required: false });
    }
  });
  
  return { missing, incomplete, env };
}

function displaySetupInstructions(missing, incomplete) {
  if (missing.length === 0 && incomplete.length === 0) {
    console.log('✅ Environment configuration is complete!');
    return true;
  }
  
  console.log('📝 Environment Setup Required:');
  console.log('===============================');
  
  if (incomplete.length > 0) {
    console.log('\\n🔧 Update these placeholder values in .env.local:');
    incomplete.forEach(({ key, description, required }) => {
      const status = required ? '❌ REQUIRED' : '⚠️  OPTIONAL';
      console.log(`   ${status} ${key}`);
      console.log(`      ${description}`);
    });
  }
  
  if (missing.filter(v => v.required).length > 0) {
    console.log('\\n📋 Add these required variables to .env.local:');
    missing.filter(v => v.required).forEach(({ key, description }) => {
      console.log(`   ❌ ${key}`);
      console.log(`      ${description}`);
    });
  }
  
  if (missing.filter(v => !v.required).length > 0) {
    console.log('\\n🎯 Optional enhancements (.env.local):');
    missing.filter(v => !v.required).forEach(({ key, description }) => {
      console.log(`   ⭐ ${key}`);
      console.log(`      ${description}`);
    });
  }
  
  console.log('\\n📚 Setup Guide:');
  console.log('1. Edit .env.local with your actual values');
  console.log('2. Supabase: https://supabase.com > Create Project > Settings > API');
  console.log('3. OpenAI: https://platform.openai.com/api-keys');
  console.log('4. Stripe: https://dashboard.stripe.com/apikeys');
  console.log('5. Run: npm run setup again to validate');
  
  return false;
}

function validateNodeModules() {
  const nodeModulesPath = path.join(PROJECT_ROOT, 'node_modules');
  if (!checkFileExists(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    console.log('Run: npm install');
    return false;
  }
  return true;
}

function createDirectoryStructure() {
  console.log('📁 Ensuring directory structure...');
  
  const dirs = [
    'scripts/dev',
    'scripts/test', 
    'scripts/db',
    'scripts/deployment',
    'scripts/maintenance',
    'tools',
    'reports',
    'temp',
    'docs/development',
    '.dev'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (!checkFileExists(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✅ Created ${dir}/`);
    }
  });
}

function main() {
  console.log('🚀 MealAppeal Development Environment Setup');
  console.log('===========================================\\n');
  
  // 1. Check if .env.local exists
  if (!checkFileExists(ENV_LOCAL_PATH)) {
    console.log('📋 .env.local not found - creating from template...');
    if (!createEnvLocalFromExample()) {
      process.exit(1);
    }
    console.log('');
  }
  
  // 2. Ensure directory structure
  createDirectoryStructure();
  console.log('');
  
  // 3. Validate Node modules
  if (!validateNodeModules()) {
    console.log('');
  }
  
  // 4. Validate environment
  const { missing, incomplete } = validateEnvironment();
  const isComplete = displaySetupInstructions(missing, incomplete);
  
  if (isComplete) {
    console.log('\\n🎉 Development environment is ready!');
    console.log('\\n🛠️  Next steps:');
    console.log('   npm run dev          # Start development server');
    console.log('   npm run test:all     # Run comprehensive tests');
    console.log('   npm run clean        # Clean temporary files');
    console.log('   npm run security:scan # Check for credential issues');
  } else {
    console.log('\\n⚠️  Environment setup incomplete');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, createEnvLocalFromExample };