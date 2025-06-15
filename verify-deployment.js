#!/usr/bin/env node

/**
 * MealAppeal Deployment Verification Script
 * Run this after deployment to verify everything is working
 */

const https = require('https');

const DOMAIN = 'https://www.mealappeal.app';

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const tests = [
  {
    name: 'Homepage loads',
    url: '/',
    check: (body) => body.includes('MealAppeal') && body.includes('Smart Nutrition')
  },
  {
    name: 'API Health Check',
    url: '/api/health',
    check: (body) => {
      try {
        const data = JSON.parse(body);
        return data.status === 'healthy';
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Manifest.json available',
    url: '/manifest.json',
    check: (body) => {
      try {
        const data = JSON.parse(body);
        return data.name === 'MealAppeal';
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Service Worker available',
    url: '/sw.js',
    check: (body) => body.includes('self.addEventListener')
  },
  {
    name: 'Login page loads',
    url: '/login',
    check: (body) => body.includes('Sign in') || body.includes('Login')
  },
  {
    name: 'Signup page loads',
    url: '/signup',
    check: (body) => body.includes('Sign up') || body.includes('Create')
  },
  {
    name: 'Pricing page loads',
    url: '/pricing',
    check: (body) => body.includes('Premium') || body.includes('Free')
  }
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', (err) => resolve({ status: 0, body: '', error: err.message }));
  });
}

async function runTests() {
  console.log('🚀 MealAppeal Deployment Verification\n');
  console.log(`Testing: ${DOMAIN}\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const url = `${DOMAIN}${test.url}`;
    const result = await checkUrl(url);
    
    if (result.status === 200 && test.check(result.body)) {
      console.log(`${colors.green}✓${colors.reset} ${test.name}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${test.name}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      } else {
        console.log(`  Status: ${result.status}`);
      }
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(40));
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✅ Deployment verification passed!${colors.reset}`);
    console.log('Your app is ready for users!\n');
    
    console.log('Next steps:');
    console.log('1. Test user signup/login flow');
    console.log('2. Configure Stripe webhook');
    console.log('3. Test camera functionality on mobile');
    console.log('4. Monitor error logs in Vercel dashboard');
  } else {
    console.log(`\n${colors.red}❌ Deployment verification failed!${colors.reset}`);
    console.log('Please check the failed tests above.\n');
    
    console.log('Common issues:');
    console.log('- Environment variables not set correctly');
    console.log('- DNS propagation still in progress (wait 5-10 minutes)');
    console.log('- Build errors in Vercel dashboard');
  }
}

// Run the tests
runTests().catch(console.error);