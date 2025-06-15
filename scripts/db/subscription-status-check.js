#!/usr/bin/env node

// Comprehensive subscription flow status check
console.log('🔍 MEALAPPEAL SUBSCRIPTION FLOW STATUS CHECK')
console.log('=' .repeat(50))

const checks = []

// Check 1: Environment Variables
console.log('\n📋 1. ENVIRONMENT CONFIGURATION')
try {
  const fs = require('fs')
  const envContent = fs.readFileSync('.env.local', 'utf8')
  
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'STRIPE_SECRET_KEY', 
    'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    'STRIPE_PREMIUM_YEARLY_PRICE_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing = []
  const found = []
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName + '=')) {
      found.push(varName)
      console.log(`✅ ${varName}`)
    } else {
      missing.push(varName)
      console.log(`❌ ${varName} - MISSING`)
    }
  })
  
  // Check app URL port
  if (envContent.includes('NEXT_PUBLIC_APP_URL=http://localhost:3001')) {
    console.log('✅ App URL correctly set to port 3001')
  } else if (envContent.includes('NEXT_PUBLIC_APP_URL=http://localhost:3000')) {
    console.log('❌ App URL set to wrong port (3000 instead of 3001)')
  }
  
  checks.push({
    name: 'Environment Variables',
    status: missing.length === 0 ? 'PASS' : 'FAIL',
    details: `${found.length}/${requiredVars.length} required variables found`
  })
  
} catch (error) {
  console.log('❌ Could not read .env.local file')
  checks.push({ name: 'Environment Variables', status: 'FAIL', details: 'File not readable' })
}

// Check 2: API Route Files
console.log('\n📋 2. API ROUTE FILES')
const apiFiles = [
  'src/app/api/stripe/checkout/route.ts',
  'src/app/api/stripe/portal/route.ts', 
  'src/app/api/stripe/webhook/route.ts'
]

let apiFilesOk = 0
apiFiles.forEach(file => {
  try {
    const fs = require('fs')
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`)
      apiFilesOk++
    } else {
      console.log(`❌ ${file} - MISSING`)
    }
  } catch (error) {
    console.log(`❌ ${file} - ERROR`)
  }
})

checks.push({
  name: 'API Route Files', 
  status: apiFilesOk === apiFiles.length ? 'PASS' : 'FAIL',
  details: `${apiFilesOk}/${apiFiles.length} API files found`
})

// Check 3: Key Component Files
console.log('\n📋 3. COMPONENT FILES')
const componentFiles = [
  'src/app/upgrade/page.tsx',
  'src/contexts/AuthContext.tsx',
  'src/lib/supabase.ts'
]

let componentFilesOk = 0
componentFiles.forEach(file => {
  try {
    const fs = require('fs')
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`)
      componentFilesOk++
    } else {
      console.log(`❌ ${file} - MISSING`)
    }
  } catch (error) {
    console.log(`❌ ${file} - ERROR`)
  }
})

checks.push({
  name: 'Component Files',
  status: componentFilesOk === componentFiles.length ? 'PASS' : 'FAIL', 
  details: `${componentFilesOk}/${componentFiles.length} components found`
})

// Check 4: Code Quality Checks
console.log('\n📋 4. CODE QUALITY CHECKS')
try {
  const fs = require('fs')
  
  // Check upgrade page for proper auth handling
  const upgradePage = fs.readFileSync('src/app/upgrade/page.tsx', 'utf8')
  
  const qualityChecks = [
    { name: 'Auth loading state', test: upgradePage.includes('authLoading') },
    { name: 'User validation', test: upgradePage.includes('user?.id') },
    { name: 'Email validation', test: upgradePage.includes('user?.email') },
    { name: 'Error handling', test: upgradePage.includes('setError') },
    { name: 'Stripe checkout API call', test: upgradePage.includes('/api/stripe/checkout') },
    { name: 'Monthly plan handler', test: upgradePage.includes("handleSubscribe('monthly')") },
    { name: 'Yearly plan handler', test: upgradePage.includes("handleSubscribe('yearly')") }
  ]
  
  let qualityScore = 0
  qualityChecks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
      qualityScore++
    } else {
      console.log(`❌ ${check.name}`)
    }
  })
  
  checks.push({
    name: 'Code Quality',
    status: qualityScore === qualityChecks.length ? 'PASS' : 'PARTIAL',
    details: `${qualityScore}/${qualityChecks.length} quality checks passed`
  })
  
} catch (error) {
  console.log('❌ Could not analyze code quality')
  checks.push({ name: 'Code Quality', status: 'FAIL', details: 'Analysis failed' })
}

// Check 5: Checkout API Implementation
console.log('\n📋 5. CHECKOUT API IMPLEMENTATION') 
try {
  const fs = require('fs')
  const checkoutAPI = fs.readFileSync('src/app/api/stripe/checkout/route.ts', 'utf8')
  
  const apiChecks = [
    { name: 'User ID validation', test: checkoutAPI.includes('!userId') },
    { name: 'Plan type handling', test: checkoutAPI.includes('planType') },
    { name: 'Price ID mapping', test: checkoutAPI.includes('STRIPE_PREMIUM_YEARLY_PRICE_ID') },
    { name: 'Profile creation fallback', test: checkoutAPI.includes('auth.admin.getUserById') },
    { name: 'Stripe customer creation', test: checkoutAPI.includes('stripe.customers.create') },
    { name: 'Checkout session creation', test: checkoutAPI.includes('stripe.checkout.sessions.create') },
    { name: 'Error logging', test: checkoutAPI.includes('console.error') },
    { name: 'Proper return URLs', test: checkoutAPI.includes('success_url') }
  ]
  
  let apiScore = 0
  apiChecks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
      apiScore++
    } else {
      console.log(`❌ ${check.name}`)
    }
  })
  
  checks.push({
    name: 'Checkout API Implementation',
    status: apiScore === apiChecks.length ? 'PASS' : 'PARTIAL',
    details: `${apiScore}/${apiChecks.length} API features implemented`
  })
  
} catch (error) {
  console.log('❌ Could not analyze checkout API')
  checks.push({ name: 'Checkout API Implementation', status: 'FAIL', details: 'Analysis failed' })
}

// Summary Report
console.log('\n' + '=' .repeat(50))
console.log('📊 FINAL STATUS REPORT')
console.log('=' .repeat(50))

const passCount = checks.filter(c => c.status === 'PASS').length
const partialCount = checks.filter(c => c.status === 'PARTIAL').length  
const failCount = checks.filter(c => c.status === 'FAIL').length

checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : check.status === 'PARTIAL' ? '⚠️' : '❌'
  console.log(`${icon} ${check.name}: ${check.status}`)
  console.log(`   ${check.details}`)
})

console.log('\n📈 OVERALL SCORE:')
console.log(`✅ PASS: ${passCount}`)
console.log(`⚠️ PARTIAL: ${partialCount}`)
console.log(`❌ FAIL: ${failCount}`)

const overallStatus = failCount === 0 ? (partialCount === 0 ? 'EXCELLENT' : 'GOOD') : 'NEEDS ATTENTION'
console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`)

if (overallStatus === 'EXCELLENT') {
  console.log('\n🚀 All systems appear to be working correctly!')
  console.log('✅ Ready for subscription testing')
} else if (overallStatus === 'GOOD') {
  console.log('\n✅ Core functionality is working')
  console.log('⚠️ Some improvements recommended')
} else {
  console.log('\n❌ Critical issues need to be addressed')
  console.log('🔧 Fix failing checks before testing')
}

console.log('\n🧪 NEXT STEPS:')
console.log('1. Start the dev server: npm run dev')
console.log('2. Visit: http://localhost:3001/upgrade')
console.log('3. Sign in with a test account')
console.log('4. Test both monthly and yearly subscription flows')
console.log('5. Monitor browser console for detailed logs')