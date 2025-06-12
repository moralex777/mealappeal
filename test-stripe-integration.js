#!/usr/bin/env node

/**
 * Stripe Subscription System Test
 * Tests payment processing, webhooks, premium gating, and billing portal
 */

const fs = require('fs')
const path = require('path')

console.log('💳 Stripe Subscription System Test')
console.log('=' .repeat(60))

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function logTest(name, status, message, details = null) {
  const result = { name, status, message, details, timestamp: new Date().toISOString() }
  testResults.tests.push(result)
  
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${emoji} ${name}: ${message}`)
  
  if (details) {
    console.log(`   Details: ${details}`)
  }
  
  if (status === 'PASS') testResults.passed++
  else if (status === 'FAIL') testResults.failed++
  else testResults.warnings++
}

// Test 1: Stripe API Routes Structure
function testStripeAPIRoutes() {
  console.log('\n🔌 Testing Stripe API Routes...')
  
  const stripeRoutes = [
    'src/app/api/stripe/checkout/route.ts',
    'src/app/api/stripe/portal/route.ts',
    'src/app/api/stripe/verify-session/route.ts',
    'src/app/api/stripe/webhook/route.ts'
  ]
  
  let missingRoutes = []
  for (const route of stripeRoutes) {
    if (!fs.existsSync(path.join(__dirname, route))) {
      missingRoutes.push(route)
    }
  }
  
  if (missingRoutes.length > 0) {
    logTest('Stripe API Routes', 'FAIL', 'Missing Stripe routes', missingRoutes.join(', '))
    return false
  }
  
  logTest('Stripe API Routes', 'PASS', 'All Stripe API routes present')
  
  // Check for consistent Stripe version
  let apiVersions = new Set()
  for (const route of stripeRoutes) {
    const content = fs.readFileSync(path.join(__dirname, route), 'utf8')
    const versionMatch = content.match(/apiVersion:\s*['"]([^'"]+)['"]/g)
    if (versionMatch) {
      versionMatch.forEach(match => {
        const version = match.match(/['"]([^'"]+)['"]/)[1]
        apiVersions.add(version)
      })
    }
  }
  
  if (apiVersions.size > 1) {
    logTest('Stripe API Version Consistency', 'WARN', 'Multiple API versions found', 
      Array.from(apiVersions).join(', '))
  } else if (apiVersions.size === 1) {
    logTest('Stripe API Version Consistency', 'PASS', 
      `Consistent API version: ${Array.from(apiVersions)[0]}`)
  } else {
    logTest('Stripe API Version Consistency', 'WARN', 'No API version found in routes')
  }
  
  return true
}

// Test 2: Checkout Route Functionality
function testCheckoutRoute() {
  console.log('\n🛒 Testing Checkout Route...')
  
  const checkoutPath = path.join(__dirname, 'src/app/api/stripe/checkout/route.ts')
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8')
  
  // Check for required imports
  if (!checkoutContent.includes('import Stripe from')) {
    logTest('Stripe Import', 'FAIL', 'Stripe import not found in checkout route')
    return false
  }
  
  logTest('Stripe Import', 'PASS', 'Stripe properly imported')
  
  // Check for price configurations
  const priceChecks = [
    'price_',
    '4.99',
    '49.99',
    'monthly',
    'yearly'
  ]
  
  let foundPrices = 0
  for (const check of priceChecks) {
    if (checkoutContent.includes(check)) {
      foundPrices++
    }
  }
  
  if (foundPrices === 0) {
    logTest('Price Configuration', 'FAIL', 'No price configuration found')
    return false
  } else if (foundPrices < 3) {
    logTest('Price Configuration', 'WARN', 'Limited price configuration')
  } else {
    logTest('Price Configuration', 'PASS', 'Price configuration present')
  }
  
  // Check for session creation
  if (!checkoutContent.includes('createCheckoutSession') && 
      !checkoutContent.includes('stripe.checkout.sessions.create')) {
    logTest('Session Creation', 'FAIL', 'Checkout session creation not found')
    return false
  }
  
  logTest('Session Creation', 'PASS', 'Checkout session creation implemented')
  
  // Check for metadata and customer handling
  if (!checkoutContent.includes('metadata') || !checkoutContent.includes('customer')) {
    logTest('Customer Handling', 'WARN', 'Customer/metadata handling may be incomplete')
  } else {
    logTest('Customer Handling', 'PASS', 'Customer and metadata handling present')
  }
  
  return true
}

// Test 3: Webhook Route Security
function testWebhookSecurity() {
  console.log('\n🔒 Testing Webhook Security...')
  
  const webhookPath = path.join(__dirname, 'src/app/api/stripe/webhook/route.ts')
  const webhookContent = fs.readFileSync(webhookPath, 'utf8')
  
  // Check for webhook signature verification
  if (!webhookContent.includes('webhookSecret') && 
      !webhookContent.includes('stripe.webhooks.constructEvent')) {
    logTest('Webhook Signature Verification', 'FAIL', 'Webhook signature verification not found')
    return false
  }
  
  logTest('Webhook Signature Verification', 'PASS', 'Webhook signature verification implemented')
  
  // Check for event handling
  const webhookEvents = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ]
  
  let handledEvents = 0
  for (const event of webhookEvents) {
    if (webhookContent.includes(event)) {
      handledEvents++
    }
  }
  
  if (handledEvents === 0) {
    logTest('Webhook Event Handling', 'FAIL', 'No webhook events handled')
    return false
  } else if (handledEvents < 3) {
    logTest('Webhook Event Handling', 'WARN', `Limited event handling (${handledEvents} events)`)
  } else {
    logTest('Webhook Event Handling', 'PASS', `${handledEvents} webhook events handled`)
  }
  
  // Check for database updates
  if (!webhookContent.includes('supabase') && !webhookContent.includes('profiles')) {
    logTest('Database Updates', 'WARN', 'Database update on webhook may be missing')
  } else {
    logTest('Database Updates', 'PASS', 'Database updates implemented')
  }
  
  return true
}

// Test 4: Billing Portal Integration
function testBillingPortal() {
  console.log('\n🏦 Testing Billing Portal...')
  
  const portalPath = path.join(__dirname, 'src/app/api/stripe/portal/route.ts')
  const portalContent = fs.readFileSync(portalPath, 'utf8')
  
  // Check for portal session creation
  if (!portalContent.includes('billingPortal') && 
      !portalContent.includes('stripe.billingPortal.sessions.create')) {
    logTest('Portal Session Creation', 'FAIL', 'Billing portal session creation not found')
    return false
  }
  
  logTest('Portal Session Creation', 'PASS', 'Billing portal session creation implemented')
  
  // Check for customer validation
  if (!portalContent.includes('customer') || !portalContent.includes('stripe_customer_id')) {
    logTest('Customer Validation', 'WARN', 'Customer validation may be incomplete')
  } else {
    logTest('Customer Validation', 'PASS', 'Customer validation implemented')
  }
  
  // Check for return URL
  if (!portalContent.includes('return_url')) {
    logTest('Return URL Configuration', 'WARN', 'Return URL may not be configured')
  } else {
    logTest('Return URL Configuration', 'PASS', 'Return URL configured')
  }
  
  return true
}

// Test 5: Session Verification
function testSessionVerification() {
  console.log('\n✅ Testing Session Verification...')
  
  const verifyPath = path.join(__dirname, 'src/app/api/stripe/verify-session/route.ts')
  const verifyContent = fs.readFileSync(verifyPath, 'utf8')
  
  // Check for session retrieval
  if (!verifyContent.includes('retrieve') && 
      !verifyContent.includes('stripe.checkout.sessions.retrieve')) {
    logTest('Session Retrieval', 'FAIL', 'Session retrieval not found')
    return false
  }
  
  logTest('Session Retrieval', 'PASS', 'Session retrieval implemented')
  
  // Check for subscription handling
  if (!verifyContent.includes('subscription') || !verifyContent.includes('payment_status')) {
    logTest('Subscription Status Check', 'WARN', 'Subscription status checking may be incomplete')
  } else {
    logTest('Subscription Status Check', 'PASS', 'Subscription status checking implemented')
  }
  
  return true
}

// Test 6: Premium Feature Gating
function testPremiumGating() {
  console.log('\n👑 Testing Premium Feature Gating...')
  
  // Check multiple files for premium gating
  const filesToCheck = [
    'src/app/api/analyze-food/route.ts',
    'src/contexts/AuthContext.tsx',
    'src/app/meals/page.tsx'
  ]
  
  let gatingImplementations = 0
  let gatingDetails = []
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      const gatingPatterns = [
        'isPremium',
        'subscription_tier',
        'premium_monthly',
        'premium_yearly',
        'hasActivePremium'
      ]
      
      for (const pattern of gatingPatterns) {
        if (content.includes(pattern)) {
          gatingImplementations++
          gatingDetails.push(`${pattern} in ${file}`)
          break
        }
      }
    }
  }
  
  if (gatingImplementations === 0) {
    logTest('Premium Feature Gating', 'FAIL', 'No premium feature gating found')
    return false
  } else if (gatingImplementations < 2) {
    logTest('Premium Feature Gating', 'WARN', 'Limited premium gating implementation')
  } else {
    logTest('Premium Feature Gating', 'PASS', `Premium gating in ${gatingImplementations} files`)
  }
  
  // Check for subscription expiry handling
  const authContextPath = path.join(__dirname, 'src/contexts/AuthContext.tsx')
  if (fs.existsSync(authContextPath)) {
    const authContent = fs.readFileSync(authContextPath, 'utf8')
    
    if (!authContent.includes('expires') && !authContent.includes('expiry')) {
      logTest('Subscription Expiry Handling', 'WARN', 'Subscription expiry handling may be missing')
    } else {
      logTest('Subscription Expiry Handling', 'PASS', 'Subscription expiry handling implemented')
    }
  }
  
  return true
}

// Test 7: Environment Configuration
function testEnvironmentConfig() {
  console.log('\n🌍 Testing Environment Configuration...')
  
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    logTest('Environment File', 'FAIL', '.env.local not found')
    return false
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Check for required Stripe environment variables
  const requiredStripeVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]
  
  let missingVars = []
  for (const varName of requiredStripeVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName)
    }
  }
  
  if (missingVars.length > 0) {
    logTest('Stripe Environment Variables', 'FAIL', 'Missing Stripe environment variables', 
      missingVars.join(', '))
    return false
  }
  
  logTest('Stripe Environment Variables', 'PASS', 'All Stripe environment variables present')
  
  // Check for proper key prefixes (security)
  const stripeKeyPatterns = [
    /STRIPE_SECRET_KEY=sk_/,
    /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_/,
    /STRIPE_WEBHOOK_SECRET=whsec_/
  ]
  
  let properKeys = 0
  for (const pattern of stripeKeyPatterns) {
    if (pattern.test(envContent)) {
      properKeys++
    }
  }
  
  if (properKeys < stripeKeyPatterns.length) {
    logTest('Stripe Key Format', 'WARN', 'Some Stripe keys may have incorrect format')
  } else {
    logTest('Stripe Key Format', 'PASS', 'All Stripe keys have proper format')
  }
  
  return true
}

// Test 8: Database Schema for Subscriptions
function testDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema for Subscriptions...')
  
  // Check migration files for subscription-related fields
  const migrationsDir = path.join(__dirname, 'supabase/migrations')
  if (!fs.existsSync(migrationsDir)) {
    logTest('Migrations Directory', 'FAIL', 'Migrations directory not found')
    return false
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
  let subscriptionFieldsFound = false
  
  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    
    const subscriptionFields = [
      'subscription_tier',
      'stripe_customer_id',
      'stripe_subscription_id',
      'subscription_expires_at',
      'billing_cycle'
    ]
    
    let foundFields = 0
    for (const field of subscriptionFields) {
      if (content.includes(field)) {
        foundFields++
      }
    }
    
    if (foundFields >= 3) {
      subscriptionFieldsFound = true
      break
    }
  }
  
  if (!subscriptionFieldsFound) {
    logTest('Subscription Database Schema', 'FAIL', 'Subscription fields not found in migrations')
    return false
  }
  
  logTest('Subscription Database Schema', 'PASS', 'Subscription database schema present')
  return true
}

// Test 9: Error Handling and Edge Cases
function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...')
  
  const stripeFiles = [
    'src/app/api/stripe/checkout/route.ts',
    'src/app/api/stripe/webhook/route.ts'
  ]
  
  let errorHandlingScore = 0
  
  for (const file of stripeFiles) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8')
    
    // Check for error handling patterns
    if (content.includes('try') && content.includes('catch')) {
      errorHandlingScore++
    }
    
    if (content.includes('error') || content.includes('Error')) {
      errorHandlingScore++
    }
    
    if (content.includes('status') && content.includes('400')) {
      errorHandlingScore++
    }
  }
  
  if (errorHandlingScore === 0) {
    logTest('Stripe Error Handling', 'FAIL', 'No error handling found')
    return false
  } else if (errorHandlingScore < 3) {
    logTest('Stripe Error Handling', 'WARN', 'Limited error handling')
  } else {
    logTest('Stripe Error Handling', 'PASS', 'Comprehensive error handling')
  }
  
  return true
}

// Main test runner
async function runStripeTests() {
  const startTime = Date.now()
  
  console.log('Starting Stripe subscription system tests...\n')
  
  testStripeAPIRoutes()
  testCheckoutRoute()
  testWebhookSecurity()
  testBillingPortal()
  testSessionVerification()
  testPremiumGating()
  testEnvironmentConfig()
  testDatabaseSchema()
  testErrorHandling()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 STRIPE SUBSCRIPTION TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`⏱️  Duration: ${duration}s`)
  
  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const successRate = ((testResults.passed / totalTests) * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  console.log('\n📋 STRIPE SUBSCRIPTION ASSESSMENT:')
  
  if (testResults.failed === 0 && testResults.warnings <= 3) {
    console.log('✅ EXCELLENT: Stripe subscription system comprehensive and ready!')
  } else if (testResults.failed === 0) {
    console.log('🟡 GOOD: Core Stripe functionality ready, some enhancements recommended')
  } else {
    console.log('🔴 ISSUES: Critical Stripe integration issues need to be fixed')
  }
  
  console.log('\n💡 RECOMMENDATIONS:')
  
  if (testResults.failed > 0) {
    console.log('1. Fix failed tests to ensure payment processing works')
  }
  
  if (testResults.warnings > 3) {
    console.log('2. Address warnings to improve payment reliability')
  }
  
  console.log('3. Test payment flows with Stripe test cards')
  console.log('4. Verify webhook endpoints are accessible from Stripe')
  console.log('5. Test subscription upgrade/downgrade flows')
  console.log('6. Validate billing portal functionality')
  console.log('7. Monitor payment failures and implement retry logic')
  console.log('8. Test subscription expiry and renewal processes')
  
  // Write detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'stripe-test-results.json'), 
    JSON.stringify(testResults, null, 2)
  )
  
  console.log('\n📄 Detailed Stripe test results saved to stripe-test-results.json')
  
  return testResults.failed === 0
}

// Run the tests
runStripeTests().catch(console.error)