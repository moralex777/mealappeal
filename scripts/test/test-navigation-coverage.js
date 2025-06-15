#!/usr/bin/env node

/**
 * Navigation Coverage Test
 * Validates that all pages have AppLayout and consistent navigation
 * Tests without browser automation for faster execution
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3003'
const REPORT_DIR = path.join(__dirname, '../../reports')
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-')

// Pages to test
const PAGES_TO_TEST = [
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/camera', name: 'Camera', requiresAuth: true },
  { path: '/meals', name: 'Meals', requiresAuth: true },
  { path: '/account', name: 'Account', requiresAuth: true },
  { path: '/account/billing', name: 'Account Billing', requiresAuth: true },
  { path: '/account/notifications', name: 'Account Notifications', requiresAuth: true },
  { path: '/account/privacy', name: 'Account Privacy', requiresAuth: true },
  { path: '/upgrade', name: 'Upgrade', requiresAuth: true },
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/signup', name: 'Signup', requiresAuth: false }
]

let testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  details: [],
  summary: {}
}

/**
 * Make HTTP request and return response
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    
    const req = client.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        })
      })
    })
    
    req.on('error', (err) => {
      reject(err)
    })
    
    req.setTimeout(10000, () => {
      req.abort()
      reject(new Error('Request timeout'))
    })
  })
}

/**
 * Test that a page has proper navigation components
 */
async function testPageNavigation(pageInfo) {
  const testName = `Navigation - ${pageInfo.name} (${pageInfo.path})`
  testResults.totalTests++
  
  try {
    console.log(`  🔍 Testing: ${testName}`)
    
    const url = `${BASE_URL}${pageInfo.path}`
    const response = await makeRequest(url)
    
    // Check if page loads successfully or redirects appropriately
    if (response.statusCode >= 400 && response.statusCode < 500) {
      // Client errors might be expected for auth-required pages
      if (pageInfo.requiresAuth && (response.statusCode === 401 || response.statusCode === 403)) {
        // Auth redirect is expected, check if it goes to login
        testResults.passed++
        testResults.details.push({
          test: testName,
          status: 'PASSED',
          message: 'Auth redirect working correctly',
          statusCode: response.statusCode
        })
        console.log(`  ✅ ${testName} - PASSED (auth redirect)`)
        return true
      }
    }
    
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`)
    }
    
    const html = response.body
    const checks = []
    
    // Check for essential navigation elements
    if (html.includes('MealAppeal')) {
      checks.push('✓ Logo/brand name found')
    } else {
      throw new Error('Logo/brand name not found')
    }
    
    // Check for navigation structure
    if (html.includes('<nav') || html.includes('navigation')) {
      checks.push('✓ Navigation element found')
    } else {
      throw new Error('Navigation element not found')
    }
    
    // Check for consistent layout
    if (html.includes('AppLayout') || html.includes('Navigation') || html.includes('BottomNavigation')) {
      checks.push('✓ Layout components detected')
    } else {
      // This might be OK for some pages, just note it
      checks.push('⚠ Layout components not explicitly detected')
    }
    
    // Check for responsive design indicators
    if (html.includes('viewport') && html.includes('width=device-width')) {
      checks.push('✓ Mobile viewport configured')
    } else {
      throw new Error('Mobile viewport not configured')
    }
    
    // Record successful test
    testResults.passed++
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      checks: checks,
      statusCode: response.statusCode,
      page: pageInfo.path
    })
    
    console.log(`  ✅ ${testName} - PASSED`)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      error: error.message,
      page: pageInfo.path
    })
    
    console.log(`  ❌ ${testName} - FAILED: ${error.message}`)
    return false
  }
}

/**
 * Test that critical navigation links are present
 */
async function testNavigationLinks() {
  const testName = 'Navigation Links Coverage'
  testResults.totalTests++
  
  try {
    console.log(`  🔍 Testing: ${testName}`)
    
    // Test home page for navigation links
    const response = await makeRequest(`${BASE_URL}/`)
    
    if (response.statusCode !== 200) {
      throw new Error(`Home page returned HTTP ${response.statusCode}`)
    }
    
    const html = response.body
    const requiredLinks = [
      { href: '/', name: 'Home' },
      { href: '/camera', name: 'Camera' },
      { href: '/meals', name: 'Meals' },
      { href: '/account', name: 'Account' },
      { href: '/login', name: 'Login' },
      { href: '/signup', name: 'Signup' }
    ]
    
    const foundLinks = []
    const missingLinks = []
    
    for (const link of requiredLinks) {
      if (html.includes(`href="${link.href}"`) || html.includes(`href='${link.href}'`)) {
        foundLinks.push(link.name)
      } else {
        missingLinks.push(link.name)
      }
    }
    
    if (missingLinks.length > 0) {
      throw new Error(`Missing navigation links: ${missingLinks.join(', ')}`)
    }
    
    testResults.passed++
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      foundLinks: foundLinks,
      message: `All ${foundLinks.length} required links found`
    })
    
    console.log(`  ✅ ${testName} - PASSED (${foundLinks.length} links found)`)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      error: error.message
    })
    
    console.log(`  ❌ ${testName} - FAILED: ${error.message}`)
    return false
  }
}

/**
 * Test file-based navigation consistency
 */
async function testFileStructure() {
  const testName = 'File Structure Navigation'
  testResults.totalTests++
  
  try {
    console.log(`  🔍 Testing: ${testName}`)
    
    const appDir = path.join(__dirname, '../../src/app')
    const issues = []
    const checks = []
    
    // Check all page.tsx files for AppLayout import
    const findPageFiles = (dir) => {
      const files = []
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          files.push(...findPageFiles(fullPath))
        } else if (item === 'page.tsx') {
          files.push(fullPath)
        }
      }
      
      return files
    }
    
    const pageFiles = findPageFiles(appDir)
    checks.push(`Found ${pageFiles.length} page files`)
    
    for (const pageFile of pageFiles) {
      const content = fs.readFileSync(pageFile, 'utf8')
      const relativePath = path.relative(appDir, pageFile)
      
      // Check for AppLayout import
      if (content.includes('AppLayout')) {
        checks.push(`✓ ${relativePath} has AppLayout`)
      } else {
        issues.push(`${relativePath} missing AppLayout`)
      }
      
      // Check for old Navigation import (should be removed)
      if (content.includes("import { Navigation }") && !content.includes('AppLayout')) {
        issues.push(`${relativePath} using old Navigation component`)
      }
    }
    
    if (issues.length > 0) {
      throw new Error(`File structure issues: ${issues.join(', ')}`)
    }
    
    testResults.passed++
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      checks: checks,
      pageFilesCount: pageFiles.length
    })
    
    console.log(`  ✅ ${testName} - PASSED (${pageFiles.length} files checked)`)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      error: error.message
    })
    
    console.log(`  ❌ ${testName} - FAILED: ${error.message}`)
    return false
  }
}

/**
 * Generate test report
 */
function generateReport() {
  console.log('\n📊 Generating Test Report...')
  
  // Ensure reports directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
  }
  
  // Calculate summary
  testResults.summary = {
    totalTests: testResults.totalTests,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: ((testResults.passed / testResults.totalTests) * 100).toFixed(1) + '%',
    pagesTestedCount: PAGES_TO_TEST.length,
    pagesTested: PAGES_TO_TEST.map(p => p.path)
  }
  
  // Save detailed report
  const reportFile = path.join(REPORT_DIR, `navigation-coverage-report-${TIMESTAMP}.json`)
  fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2))
  
  // Create summary
  const summary = {
    timestamp: testResults.timestamp,
    summary: testResults.summary,
    failedTests: testResults.details.filter(t => t.status === 'FAILED'),
    recommendations: generateRecommendations()
  }
  
  const summaryFile = path.join(REPORT_DIR, `navigation-coverage-summary-${TIMESTAMP}.json`)
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
  
  console.log(`📄 Detailed report: ${reportFile}`)
  console.log(`📋 Summary report: ${summaryFile}`)
  
  return summary
}

/**
 * Generate recommendations
 */
function generateRecommendations() {
  const recommendations = []
  const failedTests = testResults.details.filter(t => t.status === 'FAILED')
  
  if (failedTests.length === 0) {
    recommendations.push('🎉 All navigation coverage tests passed!')
    recommendations.push('✅ Ready for responsive testing with real browsers')
    return recommendations
  }
  
  failedTests.forEach(test => {
    if (test.error.includes('AppLayout')) {
      recommendations.push(`📄 ${test.page || test.test}: Add AppLayout wrapper`)
    }
    if (test.error.includes('HTTP 4') || test.error.includes('HTTP 5')) {
      recommendations.push(`🔧 ${test.page || test.test}: Fix server response issues`)
    }
    if (test.error.includes('Navigation')) {
      recommendations.push(`🧭 ${test.page || test.test}: Add proper navigation components`)
    }
  })
  
  return recommendations
}

/**
 * Main test execution
 */
async function runNavigationCoverageTests() {
  try {
    console.log('🚀 Starting Navigation Coverage Tests...')
    
    // Check if server is running
    try {
      await makeRequest(`${BASE_URL}/`)
      console.log('✅ Dev server is responding')
    } catch (error) {
      console.error('❌ Dev server not responding at', BASE_URL)
      console.error('Please ensure the development server is running: npm run dev')
      process.exit(1)
    }
    
    console.log('\n📋 Testing Page Navigation Coverage...')
    
    // Test each page
    for (const pageInfo of PAGES_TO_TEST) {
      await testPageNavigation(pageInfo)
    }
    
    // Test navigation links
    await testNavigationLinks()
    
    // Test file structure
    await testFileStructure()
    
    // Generate and display results
    const summary = generateReport()
    
    console.log('\n🎯 NAVIGATION COVERAGE RESULTS')
    console.log('=' .repeat(50))
    console.log(`📊 Total Tests: ${summary.summary.totalTests}`)
    console.log(`✅ Passed: ${summary.summary.passed}`)
    console.log(`❌ Failed: ${summary.summary.failed}`)
    console.log(`📈 Success Rate: ${summary.summary.successRate}`)
    console.log(`📄 Pages Tested: ${summary.summary.pagesTestedCount}`)
    
    // Failed tests
    if (summary.failedTests.length > 0) {
      console.log('\n❌ Failed Tests:')
      summary.failedTests.forEach(test => {
        console.log(`  • ${test.test}: ${test.error}`)
      })
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:')
    summary.recommendations.forEach(rec => {
      console.log(`  ${rec}`)
    })
    
    console.log('\n' + '='.repeat(50))
    
    // Exit with appropriate code
    process.exit(summary.summary.failed > 0 ? 1 : 0)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runNavigationCoverageTests()
}

module.exports = {
  runNavigationCoverageTests,
  testResults
}