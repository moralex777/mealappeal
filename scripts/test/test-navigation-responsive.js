#!/usr/bin/env node

/**
 * Comprehensive Navigation Testing Script
 * Tests responsive multi-device navigation implementation
 * Validates all navigation components work correctly across device types
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3003'
const REPORT_DIR = path.join(__dirname, '../../reports')
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-')

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456'
}

// Device configurations for responsive testing
const DEVICES = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' }, 
  desktop: { width: 1440, height: 900, name: 'Desktop' }
}

// All pages that should have navigation
const PAGES_TO_TEST = [
  '/',
  '/camera', 
  '/meals',
  '/account',
  '/account/billing',
  '/account/notifications',
  '/account/privacy',
  '/upgrade',
  '/upgrade/success?session_id=test',
  '/upgrade/cancel',
  '/login',
  '/signup'
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
 * Initialize test environment
 */
async function setupTest() {
  console.log('🚀 Starting Comprehensive Navigation Testing...')
  
  // Ensure reports directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
  }

  // Check if dev server is running
  try {
    const response = await fetch(`${BASE_URL}/api/health`)
    if (!response.ok) {
      throw new Error('Dev server health check failed')
    }
    console.log('✅ Dev server is running')
  } catch (error) {
    console.error('❌ Dev server not running at', BASE_URL)
    console.error('Please run: npm run dev')
    process.exit(1)
  }
}

/**
 * Test navigation component exists and is functional
 */
async function testNavigationComponent(page, deviceType, pagePath) {
  const testName = `Navigation Component - ${deviceType} - ${pagePath}`
  testResults.totalTests++
  
  try {
    console.log(`  🔍 Testing: ${testName}`)
    
    await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle0' })
    
    // Test top navigation exists
    const topNav = await page.$('nav')
    if (!topNav) {
      throw new Error('Top navigation not found')
    }
    
    // Test MealAppeal logo exists and is clickable
    const logo = await page.$('a[href="/"]')
    if (!logo) {
      throw new Error('Logo/home link not found')
    }
    
    // Device-specific navigation tests
    let navTests = []
    
    if (deviceType === 'desktop') {
      // Desktop should show full navigation
      navTests = await testDesktopNavigation(page)
    } else if (deviceType === 'tablet') {
      // Tablet should show hybrid navigation
      navTests = await testTabletNavigation(page)
    } else if (deviceType === 'mobile') {
      // Mobile should show hamburger + bottom nav
      navTests = await testMobileNavigation(page)
    }
    
    // Record successful test
    testResults.passed++
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      details: navTests,
      page: pagePath,
      device: deviceType
    })
    
    console.log(`  ✅ ${testName} - PASSED`)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      error: error.message,
      page: pagePath,
      device: deviceType
    })
    
    console.log(`  ❌ ${testName} - FAILED: ${error.message}`)
    return false
  }
}

/**
 * Test desktop navigation (≥1024px)
 */
async function testDesktopNavigation(page) {
  const tests = []
  
  // Should show full horizontal navigation
  const navLinks = await page.$$('nav a, nav button')
  tests.push(`Found ${navLinks.length} navigation elements`)
  
  // Should not show hamburger menu
  const hamburger = await page.$('[aria-label="Toggle mobile menu"]')
  if (hamburger) {
    const isVisible = await page.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }, hamburger)
    
    if (isVisible) {
      throw new Error('Hamburger menu should not be visible on desktop')
    }
  }
  tests.push('Hamburger menu properly hidden')
  
  // Should not show bottom navigation
  const bottomNav = await page.$('.fixed.bottom-0')
  if (bottomNav) {
    const isVisible = await page.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }, bottomNav)
    
    if (isVisible) {
      throw new Error('Bottom navigation should not be visible on desktop')
    }
  }
  tests.push('Bottom navigation properly hidden')
  
  return tests
}

/**
 * Test tablet navigation (768px-1023px)
 */
async function testTabletNavigation(page) {
  const tests = []
  
  // Should show priority nav items + hamburger
  const visibleNavLinks = await page.$$eval('nav a:not(.sr-only)', elements => 
    elements.filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }).length
  )
  tests.push(`Found ${visibleNavLinks} visible navigation links`)
  
  // Should show hamburger menu for additional items
  const hamburger = await page.$('[aria-label="Toggle mobile menu"]')
  if (!hamburger) {
    throw new Error('Hamburger menu not found on tablet')
  }
  
  // Test hamburger menu functionality
  await hamburger.click()
  await page.waitForTimeout(500) // Wait for animation
  
  const mobileMenu = await page.$('.fixed.inset-0')
  if (!mobileMenu) {
    throw new Error('Mobile menu overlay not found')
  }
  tests.push('Hamburger menu opens correctly')
  
  // Close menu
  await page.click('.fixed.inset-0')
  await page.waitForTimeout(500)
  tests.push('Mobile menu closes correctly')
  
  return tests
}

/**
 * Test mobile navigation (≤767px)
 */
async function testMobileNavigation(page) {
  const tests = []
  
  // Should show hamburger menu in top nav
  const hamburger = await page.$('[aria-label="Toggle mobile menu"]')
  if (!hamburger) {
    throw new Error('Hamburger menu not found on mobile')
  }
  
  // Test hamburger menu functionality
  await hamburger.click()
  await page.waitForTimeout(500)
  
  const mobileMenu = await page.$('.fixed.inset-0')
  if (!mobileMenu) {
    throw new Error('Mobile menu overlay not found')
  }
  tests.push('Mobile hamburger menu works')
  
  // Should show bottom navigation
  const bottomNav = await page.$('.fixed.bottom-0')
  if (!bottomNav) {
    throw new Error('Bottom navigation not found on mobile')
  }
  
  const bottomNavVisible = await page.evaluate(el => {
    const style = window.getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden'
  }, bottomNav)
  
  if (!bottomNavVisible) {
    throw new Error('Bottom navigation should be visible on mobile')
  }
  tests.push('Bottom navigation visible')
  
  // Test bottom navigation links
  const bottomNavLinks = await page.$$('.fixed.bottom-0 a')
  if (bottomNavLinks.length < 3) {
    throw new Error(`Bottom nav should have at least 3 links, found ${bottomNavLinks.length}`)
  }
  tests.push(`Bottom navigation has ${bottomNavLinks.length} links`)
  
  // Close mobile menu
  await page.click('.fixed.inset-0')
  await page.waitForTimeout(500)
  
  return tests
}

/**
 * Test navigation paths - ensure all pages are reachable
 */
async function testNavigationPaths(page, deviceType) {
  const testName = `Navigation Paths - ${deviceType}`
  testResults.totalTests++
  
  try {
    console.log(`  🔍 Testing: ${testName}`)
    
    // Start from home page
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
    
    const pathTests = []
    const unreachablePages = []
    
    for (const targetPage of ['/camera', '/meals', '/account', '/upgrade']) {
      try {
        // Try to navigate to page via navigation
        const linkFound = await tryNavigateToPage(page, targetPage, deviceType)
        if (linkFound) {
          pathTests.push(`Can navigate to ${targetPage}`)
        } else {
          unreachablePages.push(targetPage)
        }
      } catch (error) {
        unreachablePages.push(`${targetPage} (${error.message})`)
      }
    }
    
    if (unreachablePages.length > 0) {
      throw new Error(`Unreachable pages: ${unreachablePages.join(', ')}`)
    }
    
    testResults.passed++
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      details: pathTests,
      device: deviceType
    })
    
    console.log(`  ✅ ${testName} - PASSED`)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      error: error.message,
      device: deviceType
    })
    
    console.log(`  ❌ ${testName} - FAILED: ${error.message}`)
    return false
  }
}

/**
 * Try to navigate to a page via the navigation
 */
async function tryNavigateToPage(page, targetPage, deviceType) {
  // Try direct link first
  let link = await page.$(`nav a[href="${targetPage}"]`)
  
  if (link) {
    await link.click()
    await page.waitForTimeout(1000)
    return true
  }
  
  // If not found, try via mobile menu (for mobile/tablet)
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    const hamburger = await page.$('[aria-label="Toggle mobile menu"]')
    if (hamburger) {
      await hamburger.click()
      await page.waitForTimeout(500)
      
      link = await page.$(`a[href="${targetPage}"]`)
      if (link) {
        await link.click()
        await page.waitForTimeout(1000)
        return true
      }
      
      // Close menu if we opened it
      await page.click('.fixed.inset-0')
      await page.waitForTimeout(500)
    }
  }
  
  // Try bottom navigation (mobile only)
  if (deviceType === 'mobile') {
    link = await page.$(`.fixed.bottom-0 a[href="${targetPage}"]`)
    if (link) {
      await link.click()
      await page.waitForTimeout(1000)
      return true
    }
  }
  
  return false
}

/**
 * Test authentication-based navigation differences
 */
async function testAuthenticationNavigation(page, deviceType) {
  const testName = `Auth Navigation - ${deviceType}`
  testResults.totalTests++
  
  try {
    console.log(`  🔍 Testing: ${testName}`)
    
    const authTests = []
    
    // Test unauthenticated navigation
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
    
    const guestNavItems = await page.$$eval('nav a', links => 
      links.map(link => link.getAttribute('href')).filter(href => href)
    )
    authTests.push(`Guest navigation has ${guestNavItems.length} items`)
    
    // Should show login/signup links for guests
    const loginLink = await page.$('a[href="/login"]')
    const signupLink = await page.$('a[href="/signup"]')
    
    if (!loginLink && !signupLink) {
      throw new Error('Login/Signup links not found for guest users')
    }
    authTests.push('Guest navigation includes auth links')
    
    testResults.passed++
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      details: authTests,
      device: deviceType
    })
    
    console.log(`  ✅ ${testName} - PASSED`)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      error: error.message,
      device: deviceType
    })
    
    console.log(`  ❌ ${testName} - FAILED: ${error.message}`)
    return false
  }
}

/**
 * Run all navigation tests for a specific device
 */
async function runDeviceTests(deviceType, viewport) {
  console.log(`\n📱 Testing ${deviceType.toUpperCase()} Navigation (${viewport.width}x${viewport.height})`)
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    await page.setViewport(viewport)
    
    // Test each page
    for (const pagePath of PAGES_TO_TEST) {
      await testNavigationComponent(page, deviceType, pagePath)
    }
    
    // Test navigation paths
    await testNavigationPaths(page, deviceType)
    
    // Test authentication differences
    await testAuthenticationNavigation(page, deviceType)
    
  } finally {
    await browser.close()
  }
}

/**
 * Generate comprehensive test report
 */
function generateReport() {
  console.log('\n📊 Generating Test Report...')
  
  // Calculate summary
  testResults.summary = {
    totalTests: testResults.totalTests,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: ((testResults.passed / testResults.totalTests) * 100).toFixed(1) + '%',
    devices: Object.keys(DEVICES),
    pagesTestedCount: PAGES_TO_TEST.length,
    pagesTested: PAGES_TO_TEST
  }
  
  // Group results by device
  const deviceResults = {}
  testResults.details.forEach(result => {
    if (!deviceResults[result.device]) {
      deviceResults[result.device] = { passed: 0, failed: 0, tests: [] }
    }
    
    if (result.status === 'PASSED') {
      deviceResults[result.device].passed++
    } else {
      deviceResults[result.device].failed++
    }
    
    deviceResults[result.device].tests.push(result)
  })
  
  testResults.deviceBreakdown = deviceResults
  
  // Save detailed report
  const reportFile = path.join(REPORT_DIR, `navigation-test-report-${TIMESTAMP}.json`)
  fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2))
  
  // Create summary report
  const summary = {
    timestamp: testResults.timestamp,
    summary: testResults.summary,
    deviceBreakdown: Object.keys(deviceResults).map(device => ({
      device,
      passed: deviceResults[device].passed,
      failed: deviceResults[device].failed,
      successRate: ((deviceResults[device].passed / (deviceResults[device].passed + deviceResults[device].failed)) * 100).toFixed(1) + '%'
    })),
    failedTests: testResults.details.filter(t => t.status === 'FAILED'),
    recommendations: generateRecommendations()
  }
  
  const summaryFile = path.join(REPORT_DIR, `navigation-test-summary-${TIMESTAMP}.json`)
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
  
  console.log(`📄 Detailed report: ${reportFile}`)
  console.log(`📋 Summary report: ${summaryFile}`)
  
  return summary
}

/**
 * Generate actionable recommendations based on test results
 */
function generateRecommendations() {
  const recommendations = []
  const failedTests = testResults.details.filter(t => t.status === 'FAILED')
  
  if (failedTests.length === 0) {
    recommendations.push('🎉 All navigation tests passed! System is ready for deployment.')
    return recommendations
  }
  
  // Check for device-specific issues
  const deviceIssues = {}
  failedTests.forEach(test => {
    if (!deviceIssues[test.device]) deviceIssues[test.device] = []
    deviceIssues[test.device].push(test)
  })
  
  Object.keys(deviceIssues).forEach(device => {
    const issues = deviceIssues[device]
    recommendations.push(`📱 ${device.toUpperCase()}: ${issues.length} issues found - check responsive breakpoints`)
  })
  
  // Check for page-specific issues
  const pageIssues = {}
  failedTests.forEach(test => {
    if (test.page) {
      if (!pageIssues[test.page]) pageIssues[test.page] = []
      pageIssues[test.page].push(test)
    }
  })
  
  Object.keys(pageIssues).forEach(page => {
    const issues = pageIssues[page]
    recommendations.push(`📄 ${page}: ${issues.length} navigation issues - verify AppLayout implementation`)
  })
  
  return recommendations
}

/**
 * Main test execution
 */
async function runNavigationTests() {
  try {
    await setupTest()
    
    // Run tests for each device type
    for (const [deviceType, viewport] of Object.entries(DEVICES)) {
      await runDeviceTests(deviceType, viewport)
    }
    
    // Generate and display results
    const summary = generateReport()
    
    console.log('\n🎯 NAVIGATION TEST RESULTS')
    console.log('=' .repeat(50))
    console.log(`📊 Total Tests: ${summary.summary.totalTests}`)
    console.log(`✅ Passed: ${summary.summary.passed}`)
    console.log(`❌ Failed: ${summary.summary.failed}`)
    console.log(`📈 Success Rate: ${summary.summary.successRate}`)
    console.log('')
    
    // Device breakdown
    console.log('📱 Device Breakdown:')
    summary.deviceBreakdown.forEach(device => {
      console.log(`  ${device.device}: ${device.passed}/${device.passed + device.failed} (${device.successRate})`)
    })
    
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
  runNavigationTests()
}

module.exports = {
  runNavigationTests,
  testResults
}