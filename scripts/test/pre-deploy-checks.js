#!/usr/bin/env node

/**
 * Pre-deployment safety checks
 * Run this before deploying changes to ensure everything is safe
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }[type] || ''
  
  console.log(`${prefix} ${message}${colors.reset}`)
}

async function checkIngredientTableStructure() {
  try {
    log('Checking ingredients table structure...', 'info')
    
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .limit(1)

    if (error && error.code === '42P01') {
      log('Ingredients table does not exist!', 'error')
      return { passed: false, reason: 'Table missing' }
    }

    // Check if we can insert
    const testName = `test-check-${Date.now()}`
    const { error: insertError } = await supabase
      .from('ingredients')
      .insert({ name: testName })
      .select()
      .single()

    if (insertError) {
      log('Cannot insert into ingredients table', 'error')
      return { passed: false, reason: insertError.message }
    }

    // Clean up
    await supabase.from('ingredients').delete().eq('name', testName)

    log('Ingredients table structure OK', 'success')
    return { passed: true }
  } catch (error) {
    return { passed: false, reason: error.message }
  }
}

async function checkMealIngredientsTableStructure() {
  try {
    log('Checking meal_ingredients table structure...', 'info')
    
    const { data, error } = await supabase
      .from('meal_ingredients')
      .select('*')
      .limit(1)

    if (error && error.code === '42P01') {
      log('meal_ingredients table does not exist!', 'error')
      return { passed: false, reason: 'Table missing' }
    }

    log('meal_ingredients table structure OK', 'success')
    return { passed: true }
  } catch (error) {
    return { passed: false, reason: error.message }
  }
}

async function checkAPIEndpointResponsive() {
  try {
    log('Checking API endpoint responsiveness...', 'info')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004'}/api/health`)
    
    if (!response.ok) {
      log('API health check failed', 'error')
      return { passed: false, reason: `Status: ${response.status}` }
    }

    const data = await response.json()
    
    if (data.status !== 'healthy') {
      log('API reports unhealthy status', 'error')
      return { passed: false, reason: 'Unhealthy status' }
    }

    log('API endpoint responsive and healthy', 'success')
    return { passed: true }
  } catch (error) {
    log('Cannot reach API endpoint', 'error')
    return { passed: false, reason: error.message }
  }
}

async function checkDatabaseBackupRecent() {
  log('Checking database backup status...', 'info')
  log('(Manual check required - ensure backup exists)', 'warning')
  
  // In a real scenario, you might check Supabase API for backup status
  // For now, we'll prompt for manual verification
  
  return { 
    passed: true, 
    warning: 'Please manually verify database backup is recent' 
  }
}

async function checkNoTestDataInProduction() {
  try {
    log('Checking for test data in production...', 'info')
    
    // Check for test meals
    const { data: testMeals } = await supabase
      .from('meals')
      .select('id, title')
      .or('title.ilike.TEST_%,title.ilike.%test-ingredient%')
      .limit(10)

    if (testMeals && testMeals.length > 0) {
      log(`Found ${testMeals.length} test meals in database`, 'warning')
      return { 
        passed: true, 
        warning: `${testMeals.length} test meals found - consider cleanup` 
      }
    }

    // Check for test users
    const { data: testProfiles } = await supabase
      .from('profiles')
      .select('email')
      .or('email.ilike.%test%,email.ilike.%TEST%')
      .limit(10)

    if (testProfiles && testProfiles.length > 0) {
      log(`Found ${testProfiles.length} test profiles`, 'warning')
      return { 
        passed: true, 
        warning: `${testProfiles.length} test profiles found` 
      }
    }

    log('No obvious test data found', 'success')
    return { passed: true }
  } catch (error) {
    return { passed: false, reason: error.message }
  }
}

async function checkCodeChanges() {
  try {
    log('Checking code changes...', 'info')
    
    // Check if the analyze-food route has our changes
    const analyzeFilePath = path.join(__dirname, '../../src/app/api/analyze-food/route.ts')
    
    if (!fs.existsSync(analyzeFilePath)) {
      log('Cannot find analyze-food route file', 'error')
      return { passed: false, reason: 'File not found' }
    }

    const fileContent = fs.readFileSync(analyzeFilePath, 'utf8')
    
    // Check for ingredient saving code
    if (!fileContent.includes('Save ingredients and create relationships')) {
      log('Ingredient saving code not found in analyze-food route', 'warning')
      return { 
        passed: true, 
        warning: 'Ingredient code might not be deployed' 
      }
    }

    log('Code changes verified', 'success')
    return { passed: true }
  } catch (error) {
    return { passed: false, reason: error.message }
  }
}

async function checkEnvironmentVariables() {
  log('Checking environment variables...', 'info')
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    log(`Missing environment variables: ${missing.join(', ')}`, 'error')
    return { passed: false, reason: 'Missing env vars' }
  }

  log('All required environment variables present', 'success')
  return { passed: true }
}

async function runAllChecks() {
  console.log('🚀 Running Pre-Deployment Checks')
  console.log('================================\n')

  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Ingredients Table', fn: checkIngredientTableStructure },
    { name: 'Meal Ingredients Table', fn: checkMealIngredientsTableStructure },
    { name: 'API Endpoint', fn: checkAPIEndpointResponsive },
    { name: 'Database Backup', fn: checkDatabaseBackupRecent },
    { name: 'Test Data Check', fn: checkNoTestDataInProduction },
    { name: 'Code Changes', fn: checkCodeChanges }
  ]

  const results = []
  
  for (const check of checks) {
    console.log(`\nRunning: ${check.name}`)
    console.log('-'.repeat(40))
    
    const result = await check.fn()
    results.push({ ...result, name: check.name })
    
    if (result.warning) {
      log(result.warning, 'warning')
    }
  }

  // Summary
  console.log('\n\n📊 SUMMARY')
  console.log('==========\n')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const warnings = results.filter(r => r.warning).length

  console.log(`Total checks: ${results.length}`)
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`)
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`)
  console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`)

  if (failed > 0) {
    console.log('\n❌ DEPLOYMENT NOT RECOMMENDED')
    console.log('\nFailed checks:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.reason}`)
    })
    return false
  }

  if (warnings > 0) {
    console.log('\n⚠️  DEPLOYMENT POSSIBLE WITH CAUTION')
    console.log('\nWarnings to address:')
    results.filter(r => r.warning).forEach(r => {
      console.log(`  - ${r.name}: ${r.warning}`)
    })
  } else {
    console.log('\n✅ ALL CHECKS PASSED - SAFE TO DEPLOY')
  }

  return true
}

// Run if called directly
if (require.main === module) {
  runAllChecks()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Check script error:', error)
      process.exit(1)
    })
}

module.exports = { runAllChecks }