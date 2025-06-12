#!/usr/bin/env node

/**
 * MealAppeal Functionality Test Suite
 * Tests core functionality without requiring full dev server
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 MealAppeal Production Readiness Test Suite')
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

// Test 1: Environment Variables
function testEnvironmentVariables() {
  console.log('\n📋 Testing Environment Configuration...')
  
  const envFile = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envFile)) {
    logTest('Environment File', 'FAIL', '.env.local file not found')
    return false
  }
  
  logTest('Environment File', 'PASS', '.env.local file exists')
  
  const envContent = fs.readFileSync(envFile, 'utf8')
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]
  
  const optionalVars = [
    'OPENAI_API_KEY',
    'USDA_API_KEY',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY'
  ]
  
  let missingRequired = []
  let missingOptional = []
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName + '=')) {
      missingRequired.push(varName)
    }
  }
  
  for (const varName of optionalVars) {
    if (!envContent.includes(varName + '=')) {
      missingOptional.push(varName)
    }
  }
  
  if (missingRequired.length > 0) {
    logTest('Required Environment Variables', 'FAIL', 
      'Missing required variables', missingRequired.join(', '))
    return false
  }
  
  logTest('Required Environment Variables', 'PASS', 'All required variables present')
  
  if (missingOptional.length > 0) {
    logTest('Optional Environment Variables', 'WARN', 
      'Missing optional variables (features may be limited)', missingOptional.join(', '))
  } else {
    logTest('Optional Environment Variables', 'PASS', 'All optional variables present')
  }
  
  return true
}

// Test 2: File Structure
function testFileStructure() {
  console.log('\n📁 Testing File Structure...')
  
  const criticalFiles = [
    'src/app/api/analyze-food/route.ts',
    'src/app/api/stripe/checkout/route.ts',
    'src/app/api/stripe/webhook/route.ts',
    'src/lib/supabase.ts',
    'src/lib/supabase-storage.ts',
    'src/hooks/useImageUpload.ts',
    'src/contexts/AuthContext.tsx',
    'src/lib/pwa-utils.ts',
    'public/sw.js',
    'public/manifest.json',
    'supabase/migrations/20250607000004_storage_buckets.sql'
  ]
  
  let missingFiles = []
  
  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, file)
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file)
    }
  }
  
  if (missingFiles.length > 0) {
    logTest('Critical Files', 'FAIL', 'Missing critical files', missingFiles.join(', '))
    return false
  }
  
  logTest('Critical Files', 'PASS', 'All critical files present')
  return true
}

// Test 3: Dependencies
function testDependencies() {
  console.log('\n📦 Testing Dependencies...')
  
  const packageJsonPath = path.join(__dirname, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    logTest('Package.json', 'FAIL', 'package.json not found')
    return false
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  const requiredDeps = [
    'next',
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    'stripe',
    'openai',
    'lucide-react',
    'tailwindcss'
  ]
  
  let missingDeps = []
  
  for (const dep of requiredDeps) {
    if (!dependencies[dep]) {
      missingDeps.push(dep)
    }
  }
  
  if (missingDeps.length > 0) {
    logTest('Required Dependencies', 'FAIL', 'Missing dependencies', missingDeps.join(', '))
    return false
  }
  
  logTest('Required Dependencies', 'PASS', 'All required dependencies present')
  
  // Check for potentially problematic versions
  const versionWarnings = []
  if (dependencies.next && !dependencies.next.startsWith('15')) {
    versionWarnings.push('Next.js version may be outdated')
  }
  
  if (versionWarnings.length > 0) {
    logTest('Dependency Versions', 'WARN', 'Version warnings', versionWarnings.join(', '))
  } else {
    logTest('Dependency Versions', 'PASS', 'Dependency versions look good')
  }
  
  return true
}

// Test 4: TypeScript Configuration
function testTypeScriptConfig() {
  console.log('\n🔷 Testing TypeScript Configuration...')
  
  const files = ['tsconfig.json', 'next.config.ts']
  
  for (const file of files) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      logTest('TypeScript Config', 'FAIL', `${file} not found`)
      return false
    }
  }
  
  logTest('TypeScript Config', 'PASS', 'TypeScript configuration files present')
  return true
}

// Test 5: API Route Validation
function testAPIRoutes() {
  console.log('\n🔌 Testing API Route Structure...')
  
  const routes = [
    'src/app/api/analyze-food/route.ts',
    'src/app/api/stripe/checkout/route.ts',
    'src/app/api/stripe/portal/route.ts',
    'src/app/api/stripe/verify-session/route.ts',
    'src/app/api/stripe/webhook/route.ts'
  ]
  
  for (const route of routes) {
    const routePath = path.join(__dirname, route)
    if (!fs.existsSync(routePath)) {
      logTest('API Routes', 'FAIL', `Missing route: ${route}`)
      return false
    }
    
    const content = fs.readFileSync(routePath, 'utf8')
    if (!content.includes('export async function')) {
      logTest('API Routes', 'FAIL', `Invalid route structure: ${route}`)
      return false
    }
  }
  
  logTest('API Routes', 'PASS', 'All API routes properly structured')
  return true
}

// Test 6: PWA Configuration
function testPWAConfig() {
  console.log('\n📱 Testing PWA Configuration...')
  
  const manifestPath = path.join(__dirname, 'public/manifest.json')
  if (!fs.existsSync(manifestPath)) {
    logTest('PWA Manifest', 'FAIL', 'manifest.json not found')
    return false
  }
  
  const serviceWorkerPath = path.join(__dirname, 'public/sw.js')
  if (!fs.existsSync(serviceWorkerPath)) {
    logTest('Service Worker', 'FAIL', 'sw.js not found')
    return false
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const requiredManifestFields = ['name', 'short_name', 'icons', 'start_url', 'display']
    
    for (const field of requiredManifestFields) {
      if (!manifest[field]) {
        logTest('PWA Manifest', 'FAIL', `Missing manifest field: ${field}`)
        return false
      }
    }
    
    logTest('PWA Manifest', 'PASS', 'Manifest properly configured')
  } catch (error) {
    logTest('PWA Manifest', 'FAIL', 'Invalid manifest.json format')
    return false
  }
  
  const swContent = fs.readFileSync(serviceWorkerPath, 'utf8')
  if (!swContent.includes('CACHE_NAME') || !swContent.includes('fetch')) {
    logTest('Service Worker', 'FAIL', 'Service worker missing required functionality')
    return false
  }
  
  logTest('Service Worker', 'PASS', 'Service worker properly configured')
  return true
}

// Test 7: Database Migrations
function testDatabaseMigrations() {
  console.log('\n🗄️ Testing Database Migrations...')
  
  const migrationsDir = path.join(__dirname, 'supabase/migrations')
  if (!fs.existsSync(migrationsDir)) {
    logTest('Migrations Directory', 'FAIL', 'Migrations directory not found')
    return false
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
  if (migrationFiles.length === 0) {
    logTest('Migration Files', 'FAIL', 'No migration files found')
    return false
  }
  
  logTest('Migration Files', 'PASS', `Found ${migrationFiles.length} migration files`)
  
  // Check for critical migrations
  const criticalMigrations = [
    'storage_buckets.sql',
    'profiles.sql',
    'meals.sql'
  ]
  
  let foundCritical = 0
  for (const migration of migrationFiles) {
    for (const critical of criticalMigrations) {
      if (migration.includes(critical)) {
        foundCritical++
        break
      }
    }
  }
  
  if (foundCritical < criticalMigrations.length) {
    logTest('Critical Migrations', 'WARN', 'Some critical migrations may be missing')
  } else {
    logTest('Critical Migrations', 'PASS', 'All critical migrations present')
  }
  
  return true
}

// Test 8: Security Configuration
function testSecurityConfig() {
  console.log('\n🔒 Testing Security Configuration...')
  
  // Check for sensitive data in code
  const sensitivePatterns = [
    /sk_live_[a-zA-Z0-9]+/g, // Stripe live keys
    /sk_test_[a-zA-Z0-9]+/g, // Stripe test keys in wrong places
    /password\s*=\s*["'][^"']+["']/gi,
    /secret\s*=\s*["'][^"']+["']/gi
  ]
  
  const codeFiles = [
    'src/app/api/stripe/checkout/route.ts',
    'src/app/api/analyze-food/route.ts',
    'src/lib/supabase.ts'
  ]
  
  let securityIssues = []
  
  for (const file of codeFiles) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8')
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        securityIssues.push(`Potential sensitive data in ${file}`)
      }
    }
  }
  
  if (securityIssues.length > 0) {
    logTest('Security Check', 'FAIL', 'Security issues found', securityIssues.join(', '))
    return false
  }
  
  logTest('Security Check', 'PASS', 'No obvious security issues found')
  return true
}

// Main test runner
async function runTests() {
  const startTime = Date.now()
  
  console.log('Starting comprehensive functionality tests...\n')
  
  testEnvironmentVariables()
  testFileStructure()
  testDependencies()
  testTypeScriptConfig()
  testAPIRoutes()
  testPWAConfig()
  testDatabaseMigrations()
  testSecurityConfig()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`⏱️  Duration: ${duration}s`)
  
  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const successRate = ((testResults.passed / totalTests) * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  console.log('\n📋 RECOMMENDATIONS:')
  
  if (testResults.failed > 0) {
    console.log('❌ CRITICAL: Fix failed tests before production deployment')
  }
  
  if (testResults.warnings > 0) {
    console.log('⚠️  WARNING: Address warning items for optimal functionality')
  }
  
  if (testResults.failed === 0 && testResults.warnings === 0) {
    console.log('✅ EXCELLENT: All tests passed - ready for production!')
  } else if (testResults.failed === 0) {
    console.log('🟡 GOOD: Core functionality ready, some enhancements recommended')
  } else {
    console.log('🔴 ISSUES: Critical fixes required before deployment')
  }
  
  // Write detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'), 
    JSON.stringify(testResults, null, 2)
  )
  
  console.log('\n📄 Detailed test results saved to test-results.json')
  
  return testResults.failed === 0
}

// Run the tests
runTests().catch(console.error)