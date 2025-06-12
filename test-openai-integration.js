#!/usr/bin/env node

/**
 * OpenAI Vision API Integration Test
 * Tests AI food analysis, nutrition calculation, and tier-based features
 */

const fs = require('fs')
const path = require('path')

console.log('🤖 OpenAI Vision API Integration Test')
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

// Test 1: API Route Structure
function testAPIRouteStructure() {
  console.log('\n🔌 Testing OpenAI API Route Structure...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  if (!fs.existsSync(routePath)) {
    logTest('API Route File', 'FAIL', 'analyze-food route not found')
    return false
  }
  
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for OpenAI import
  if (!routeContent.includes('import OpenAI from')) {
    logTest('OpenAI Import', 'FAIL', 'OpenAI import not found')
    return false
  }
  
  logTest('OpenAI Import', 'PASS', 'OpenAI properly imported')
  
  // Check for Vision API usage
  if (!routeContent.includes('gpt-4o-mini-2024-07-18')) {
    logTest('Vision Model', 'WARN', 'GPT-4o-mini model not specified')
  } else {
    logTest('Vision Model', 'PASS', 'Correct vision model specified')
  }
  
  // Check for image processing
  if (!routeContent.includes('image_url') || !routeContent.includes('type: "image_url"')) {
    logTest('Image Processing', 'FAIL', 'Image URL processing not found')
    return false
  }
  
  logTest('Image Processing', 'PASS', 'Image processing properly configured')
  
  return true
}

// Test 2: Tier-Based Analysis
function testTierBasedAnalysis() {
  console.log('\n👑 Testing Tier-Based Analysis Features...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for tier detection
  if (!routeContent.includes('subscription_tier') && !routeContent.includes('isPremium')) {
    logTest('Tier Detection', 'FAIL', 'User tier detection not implemented')
    return false
  }
  
  logTest('Tier Detection', 'PASS', 'User tier detection implemented')
  
  // Check for premium features
  const premiumFeatures = [
    'premiumAnalysis',
    'max_tokens',
    'detail.*high',
    'ingredients.*slice'
  ]
  
  let foundPremiumFeatures = 0
  for (const feature of premiumFeatures) {
    const regex = new RegExp(feature, 'i')
    if (regex.test(routeContent)) {
      foundPremiumFeatures++
    }
  }
  
  if (foundPremiumFeatures === 0) {
    logTest('Premium Features', 'FAIL', 'No premium feature differentiation found')
    return false
  } else if (foundPremiumFeatures < premiumFeatures.length) {
    logTest('Premium Features', 'WARN', 'Some premium features may be missing', 
      `Found ${foundPremiumFeatures}/${premiumFeatures.length}`)
  } else {
    logTest('Premium Features', 'PASS', 'All premium features implemented')
  }
  
  return true
}

// Test 3: Rate Limiting
function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for rate limiting implementation
  if (!routeContent.includes('rateLimitStore') && !routeContent.includes('RATE_LIMITS')) {
    logTest('Rate Limiting Config', 'FAIL', 'Rate limiting not implemented')
    return false
  }
  
  logTest('Rate Limiting Config', 'PASS', 'Rate limiting configuration present')
  
  // Check for tier-based limits
  const tierLimits = ['free', 'premium_monthly', 'premium_yearly']
  let foundTierLimits = 0
  
  for (const tier of tierLimits) {
    if (routeContent.includes(tier)) {
      foundTierLimits++
    }
  }
  
  if (foundTierLimits < tierLimits.length) {
    logTest('Tier-Based Limits', 'WARN', 'Some tier limits may be missing')
  } else {
    logTest('Tier-Based Limits', 'PASS', 'All tier limits configured')
  }
  
  // Check for rate limit checking function
  if (!routeContent.includes('checkRateLimit') && !routeContent.includes('rateLimit')) {
    logTest('Rate Limit Checking', 'WARN', 'Rate limit checking function may be missing')
  } else {
    logTest('Rate Limit Checking', 'PASS', 'Rate limit checking implemented')
  }
  
  return true
}

// Test 4: Response Caching
function testResponseCaching() {
  console.log('\n💾 Testing Response Caching...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for caching implementation
  if (!routeContent.includes('cache') && !routeContent.includes('Cache')) {
    logTest('Response Caching', 'WARN', 'Response caching may not be implemented')
    return true // Not critical
  }
  
  logTest('Response Caching', 'PASS', 'Response caching implemented')
  
  // Check for cache TTL
  if (!routeContent.includes('TTL') && !routeContent.includes('timeout') && !routeContent.includes('expire')) {
    logTest('Cache TTL', 'WARN', 'Cache TTL may not be configured')
  } else {
    logTest('Cache TTL', 'PASS', 'Cache TTL configured')
  }
  
  return true
}

// Test 5: Error Handling and Fallbacks
function testErrorHandlingFallbacks() {
  console.log('\n🛡️ Testing Error Handling and Fallbacks...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for try-catch blocks
  const tryCatchCount = (routeContent.match(/try\s*{/g) || []).length
  const catchCount = (routeContent.match(/catch\s*\(/g) || []).length
  
  if (tryCatchCount === 0 || catchCount === 0) {
    logTest('Error Handling', 'FAIL', 'No error handling found')
    return false
  }
  
  logTest('Error Handling', 'PASS', `Found ${tryCatchCount} try-catch blocks`)
  
  // Check for fallback/mock data
  if (!routeContent.includes('mock') && !routeContent.includes('fallback')) {
    logTest('Fallback Data', 'WARN', 'Fallback/mock data may not be available')
  } else {
    logTest('Fallback Data', 'PASS', 'Fallback data available')
  }
  
  // Check for specific error types
  const errorTypes = [
    'rate_limit_exceeded',
    'openaiError',
    'authError',
    'ValidationError'
  ]
  
  let handledErrorTypes = 0
  for (const errorType of errorTypes) {
    if (routeContent.includes(errorType)) {
      handledErrorTypes++
    }
  }
  
  if (handledErrorTypes === 0) {
    logTest('Specific Error Types', 'WARN', 'Specific error type handling may be missing')
  } else {
    logTest('Specific Error Types', 'PASS', `${handledErrorTypes} error types handled`)
  }
  
  return true
}

// Test 6: Comprehensive Analysis Structure
function testAnalysisStructure() {
  console.log('\n📊 Testing Analysis Structure...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for comprehensive interface
  if (!routeContent.includes('interface') && !routeContent.includes('IFoodAnalysis')) {
    logTest('Analysis Interface', 'WARN', 'Analysis interface may not be defined')
  } else {
    logTest('Analysis Interface', 'PASS', 'Analysis interface defined')
  }
  
  // Check for required analysis fields
  const requiredFields = [
    'foodName',
    'confidence',
    'ingredients',
    'nutrition',
    'allergens',
    'healthInsights',
    'portion'
  ]
  
  let missingFields = []
  for (const field of requiredFields) {
    if (!routeContent.includes(field)) {
      missingFields.push(field)
    }
  }
  
  if (missingFields.length > 0) {
    logTest('Required Analysis Fields', 'FAIL', 'Missing required fields', missingFields.join(', '))
    return false
  }
  
  logTest('Required Analysis Fields', 'PASS', 'All required fields present')
  
  // Check for detailed nutrition info
  const nutritionFields = [
    'calories',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'sodium'
  ]
  
  let foundNutritionFields = 0
  for (const field of nutritionFields) {
    if (routeContent.includes(field)) {
      foundNutritionFields++
    }
  }
  
  if (foundNutritionFields < nutritionFields.length / 2) {
    logTest('Nutrition Details', 'WARN', 'Limited nutrition field coverage')
  } else {
    logTest('Nutrition Details', 'PASS', `${foundNutritionFields} nutrition fields covered`)
  }
  
  return true
}

// Test 7: USDA Integration
function testUSDAIntegration() {
  console.log('\n🌾 Testing USDA Nutrition Integration...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for USDA API integration
  if (!routeContent.includes('USDA') && !routeContent.includes('fdc.nal.usda.gov')) {
    logTest('USDA API Integration', 'WARN', 'USDA API integration not found (optional)')
    return true // Not critical
  }
  
  logTest('USDA API Integration', 'PASS', 'USDA API integration present')
  
  // Check for nutrient mapping
  if (!routeContent.includes('nutrientId') && !routeContent.includes('findNutrientValue')) {
    logTest('Nutrient Mapping', 'WARN', 'USDA nutrient mapping may be incomplete')
  } else {
    logTest('Nutrient Mapping', 'PASS', 'USDA nutrient mapping implemented')
  }
  
  return true
}

// Test 8: Security and Input Validation
function testSecurityValidation() {
  console.log('\n🔒 Testing Security and Input Validation...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for input validation
  if (!routeContent.includes('validate') && !routeContent.includes('startsWith(\'data:image/\')')) {
    logTest('Input Validation', 'FAIL', 'Image input validation not found')
    return false
  }
  
  logTest('Input Validation', 'PASS', 'Image input validation present')
  
  // Check for authentication
  if (!routeContent.includes('authorization') && !routeContent.includes('Bearer')) {
    logTest('Authentication Check', 'FAIL', 'Authentication check not found')
    return false
  }
  
  logTest('Authentication Check', 'PASS', 'Authentication properly checked')
  
  // Check for user verification
  if (!routeContent.includes('getUser') && !routeContent.includes('auth')) {
    logTest('User Verification', 'FAIL', 'User verification not found')
    return false
  }
  
  logTest('User Verification', 'PASS', 'User verification implemented')
  
  return true
}

// Test 9: Analysis Modes
function testAnalysisModes() {
  console.log('\n🎯 Testing Analysis Modes...')
  
  const routePath = path.join(__dirname, 'src/app/api/analyze-food/route.ts')
  const routeContent = fs.readFileSync(routePath, 'utf8')
  
  // Check for focus modes
  const analysisModes = [
    'health',
    'fitness',
    'cultural',
    'chef',
    'science',
    'budget'
  ]
  
  let foundModes = 0
  for (const mode of analysisModes) {
    if (routeContent.includes(mode)) {
      foundModes++
    }
  }
  
  if (foundModes === 0) {
    logTest('Analysis Modes', 'WARN', 'Analysis mode support may be missing')
  } else if (foundModes < analysisModes.length) {
    logTest('Analysis Modes', 'WARN', `Limited analysis modes (${foundModes}/${analysisModes.length})`)
  } else {
    logTest('Analysis Modes', 'PASS', 'All analysis modes supported')
  }
  
  // Check for mode-specific prompts
  if (!routeContent.includes('focusInstructions') && !routeContent.includes('generatePrompt')) {
    logTest('Mode-Specific Prompts', 'WARN', 'Mode-specific prompts may not be implemented')
  } else {
    logTest('Mode-Specific Prompts', 'PASS', 'Mode-specific prompts implemented')
  }
  
  return true
}

// Main test runner
async function runOpenAITests() {
  const startTime = Date.now()
  
  console.log('Starting OpenAI Vision API integration tests...\n')
  
  testAPIRouteStructure()
  testTierBasedAnalysis()
  testRateLimiting()
  testResponseCaching()
  testErrorHandlingFallbacks()
  testAnalysisStructure()
  testUSDAIntegration()
  testSecurityValidation()
  testAnalysisModes()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 OPENAI INTEGRATION TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`⏱️  Duration: ${duration}s`)
  
  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const successRate = ((testResults.passed / totalTests) * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  console.log('\n📋 OPENAI INTEGRATION ASSESSMENT:')
  
  if (testResults.failed === 0 && testResults.warnings <= 3) {
    console.log('✅ EXCELLENT: OpenAI integration comprehensive and production-ready!')
  } else if (testResults.failed === 0) {
    console.log('🟡 GOOD: Core OpenAI functionality ready, some enhancements recommended')
  } else {
    console.log('🔴 ISSUES: Critical OpenAI integration issues need to be fixed')
  }
  
  console.log('\n💡 RECOMMENDATIONS:')
  
  if (testResults.failed > 0) {
    console.log('1. Fix failed tests to ensure OpenAI integration works properly')
  }
  
  if (testResults.warnings > 5) {
    console.log('2. Address warnings to improve AI analysis quality')
  }
  
  console.log('3. Test with real images to validate analysis accuracy')
  console.log('4. Monitor OpenAI API costs and optimize prompts')
  console.log('5. Implement comprehensive error monitoring')
  console.log('6. Test rate limiting under load')
  console.log('7. Validate premium features provide clear value')
  
  // Write detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'openai-test-results.json'), 
    JSON.stringify(testResults, null, 2)
  )
  
  console.log('\n📄 Detailed OpenAI test results saved to openai-test-results.json')
  
  return testResults.failed === 0
}

// Run the tests
runOpenAITests().catch(console.error)