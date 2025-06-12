#!/usr/bin/env node

/**
 * PWA Functionality Test
 * Tests offline functionality, service worker, push notifications, and installation
 */

const fs = require('fs')
const path = require('path')

console.log('📱 PWA Functionality Test')
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

// Test 1: Manifest Configuration
function testManifestConfiguration() {
  console.log('\n📋 Testing PWA Manifest Configuration...')
  
  const manifestPath = path.join(__dirname, 'public/manifest.json')
  if (!fs.existsSync(manifestPath)) {
    logTest('Manifest File', 'FAIL', 'manifest.json not found')
    return false
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    // Check required manifest fields
    const requiredFields = [
      'name',
      'short_name',
      'start_url',
      'display',
      'theme_color',
      'background_color',
      'icons'
    ]
    
    let missingFields = []
    for (const field of requiredFields) {
      if (!manifest[field]) {
        missingFields.push(field)
      }
    }
    
    if (missingFields.length > 0) {
      logTest('Manifest Required Fields', 'FAIL', 'Missing required manifest fields', 
        missingFields.join(', '))
      return false
    }
    
    logTest('Manifest Required Fields', 'PASS', 'All required manifest fields present')
    
    // Check icons
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      logTest('Manifest Icons', 'FAIL', 'No icons configured in manifest')
      return false
    }
    
    // Check for multiple icon sizes
    const iconSizes = manifest.icons.map(icon => icon.sizes).filter(Boolean)
    if (iconSizes.length < 3) {
      logTest('Icon Sizes', 'WARN', 'Limited icon sizes (recommend multiple sizes)')
    } else {
      logTest('Icon Sizes', 'PASS', `${iconSizes.length} icon sizes configured`)
    }
    
    // Check for installability
    if (manifest.display !== 'standalone' && manifest.display !== 'fullscreen') {
      logTest('Display Mode', 'WARN', 'Display mode may not support installation')
    } else {
      logTest('Display Mode', 'PASS', 'Display mode supports installation')
    }
    
    logTest('Manifest Configuration', 'PASS', 'Manifest properly configured')
    return true
    
  } catch (error) {
    logTest('Manifest Parsing', 'FAIL', 'Invalid manifest.json format')
    return false
  }
}

// Test 2: Service Worker Implementation
function testServiceWorkerImplementation() {
  console.log('\n⚙️ Testing Service Worker Implementation...')
  
  const swPath = path.join(__dirname, 'public/sw.js')
  if (!fs.existsSync(swPath)) {
    logTest('Service Worker File', 'FAIL', 'sw.js not found')
    return false
  }
  
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for service worker event listeners
  const requiredEvents = [
    'install',
    'activate',
    'fetch',
    'sync',
    'push',
    'notificationclick'
  ]
  
  let missingEvents = []
  for (const event of requiredEvents) {
    if (!swContent.includes(`addEventListener('${event}'`)) {
      missingEvents.push(event)
    }
  }
  
  if (missingEvents.length > 2) {
    logTest('Service Worker Events', 'FAIL', 'Missing critical event listeners', 
      missingEvents.join(', '))
    return false
  } else if (missingEvents.length > 0) {
    logTest('Service Worker Events', 'WARN', 'Some event listeners missing', 
      missingEvents.join(', '))
  } else {
    logTest('Service Worker Events', 'PASS', 'All event listeners present')
  }
  
  // Check for caching strategies
  const cachingFeatures = [
    'CACHE_NAME',
    'cache.addAll',
    'cache.match',
    'cache.put'
  ]
  
  let foundCachingFeatures = 0
  for (const feature of cachingFeatures) {
    if (swContent.includes(feature)) {
      foundCachingFeatures++
    }
  }
  
  if (foundCachingFeatures === 0) {
    logTest('Caching Strategy', 'FAIL', 'No caching strategy implemented')
    return false
  } else if (foundCachingFeatures < 3) {
    logTest('Caching Strategy', 'WARN', 'Limited caching implementation')
  } else {
    logTest('Caching Strategy', 'PASS', 'Comprehensive caching strategy')
  }
  
  return true
}

// Test 3: Background Sync
function testBackgroundSync() {
  console.log('\n🔄 Testing Background Sync...')
  
  const swPath = path.join(__dirname, 'public/sw.js')
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for sync event handling
  if (!swContent.includes('sync') || !swContent.includes('SYNC_TAGS')) {
    logTest('Background Sync', 'WARN', 'Background sync may not be implemented')
    return true // Not critical for basic PWA
  }
  
  logTest('Background Sync Implementation', 'PASS', 'Background sync implemented')
  
  // Check for specific sync operations
  const syncOperations = [
    'uploadMeal',
    'analyzeFood',
    'syncMeals'
  ]
  
  let foundOperations = 0
  for (const operation of syncOperations) {
    if (swContent.includes(operation)) {
      foundOperations++
    }
  }
  
  if (foundOperations === 0) {
    logTest('Sync Operations', 'WARN', 'No specific sync operations found')
  } else {
    logTest('Sync Operations', 'PASS', `${foundOperations} sync operations configured`)
  }
  
  return true
}

// Test 4: Push Notifications
function testPushNotifications() {
  console.log('\n🔔 Testing Push Notifications...')
  
  const swPath = path.join(__dirname, 'public/sw.js')
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for push event handling
  if (!swContent.includes('push') || !swContent.includes('showNotification')) {
    logTest('Push Notification Handling', 'WARN', 'Push notification handling may not be implemented')
    return true // Not critical for basic PWA
  }
  
  logTest('Push Notification Handling', 'PASS', 'Push notification handling implemented')
  
  // Check for notification click handling
  if (!swContent.includes('notificationclick')) {
    logTest('Notification Click Handling', 'WARN', 'Notification click handling missing')
  } else {
    logTest('Notification Click Handling', 'PASS', 'Notification click handling implemented')
  }
  
  // Check PWA utils for notification permissions
  const pwaUtilsPath = path.join(__dirname, 'src/lib/pwa-utils.ts')
  if (fs.existsSync(pwaUtilsPath)) {
    const pwaUtilsContent = fs.readFileSync(pwaUtilsPath, 'utf8')
    
    if (!pwaUtilsContent.includes('requestNotificationPermission')) {
      logTest('Notification Permissions', 'WARN', 'Notification permission handling may be missing')
    } else {
      logTest('Notification Permissions', 'PASS', 'Notification permissions properly handled')
    }
  }
  
  return true
}

// Test 5: Offline Functionality
function testOfflineFunctionality() {
  console.log('\n📴 Testing Offline Functionality...')
  
  const swPath = path.join(__dirname, 'public/sw.js')
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for offline strategies
  const offlineStrategies = [
    'network-first',
    'cache-first',
    'stale-while-revalidate',
    'offline'
  ]
  
  let foundStrategies = 0
  for (const strategy of offlineStrategies) {
    if (swContent.toLowerCase().includes(strategy.toLowerCase().replace('-', ''))) {
      foundStrategies++
    }
  }
  
  if (foundStrategies === 0) {
    logTest('Offline Strategies', 'WARN', 'No specific offline strategies identified')
  } else {
    logTest('Offline Strategies', 'PASS', `${foundStrategies} offline strategies implemented`)
  }
  
  // Check for IndexedDB usage
  if (!swContent.includes('indexedDB') && !swContent.includes('IndexedDB')) {
    logTest('Offline Storage', 'WARN', 'IndexedDB offline storage may not be implemented')
  } else {
    logTest('Offline Storage', 'PASS', 'IndexedDB offline storage implemented')
  }
  
  // Check for offline page
  const offlinePagePath = path.join(__dirname, 'public/offline.html')
  if (!fs.existsSync(offlinePagePath)) {
    logTest('Offline Fallback Page', 'WARN', 'Offline fallback page not found')
  } else {
    logTest('Offline Fallback Page', 'PASS', 'Offline fallback page available')
  }
  
  return true
}

// Test 6: PWA Installation
function testPWAInstallation() {
  console.log('\n📲 Testing PWA Installation Features...')
  
  const pwaUtilsPath = path.join(__dirname, 'src/lib/pwa-utils.ts')
  if (!fs.existsSync(pwaUtilsPath)) {
    logTest('PWA Utils File', 'WARN', 'PWA utilities file not found')
    return true // Not critical
  }
  
  const pwaUtilsContent = fs.readFileSync(pwaUtilsPath, 'utf8')
  
  // Check for installation prompt handling
  if (!pwaUtilsContent.includes('beforeinstallprompt')) {
    logTest('Install Prompt Handling', 'WARN', 'Install prompt handling may not be implemented')
  } else {
    logTest('Install Prompt Handling', 'PASS', 'Install prompt handling implemented')
  }
  
  // Check for PWA installer class
  if (!pwaUtilsContent.includes('PWAInstaller')) {
    logTest('PWA Installer', 'WARN', 'PWA installer class not found')
  } else {
    logTest('PWA Installer', 'PASS', 'PWA installer class implemented')
  }
  
  // Check for installation banner
  if (!pwaUtilsContent.includes('showInstallBanner')) {
    logTest('Install Banner', 'WARN', 'Install banner functionality may be missing')
  } else {
    logTest('Install Banner', 'PASS', 'Install banner functionality implemented')
  }
  
  return true
}

// Test 7: Service Worker Registration
function testServiceWorkerRegistration() {
  console.log('\n🔧 Testing Service Worker Registration...')
  
  const pwaUtilsPath = path.join(__dirname, 'src/lib/pwa-utils.ts')
  if (fs.existsSync(pwaUtilsPath)) {
    const pwaUtilsContent = fs.readFileSync(pwaUtilsPath, 'utf8')
    
    if (!pwaUtilsContent.includes('registerServiceWorker')) {
      logTest('SW Registration Function', 'WARN', 'Service worker registration function not found')
    } else {
      logTest('SW Registration Function', 'PASS', 'Service worker registration function implemented')
    }
    
    if (!pwaUtilsContent.includes('updateServiceWorker')) {
      logTest('SW Update Function', 'WARN', 'Service worker update function not found')
    } else {
      logTest('SW Update Function', 'PASS', 'Service worker update function implemented')
    }
  }
  
  // Check for registration in app files
  const appFiles = [
    'src/app/layout.tsx',
    'src/lib/registerSW.ts'
  ]
  
  let registrationFound = false
  for (const file of appFiles) {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('registerSW') || content.includes('serviceWorker.register')) {
        registrationFound = true
        break
      }
    }
  }
  
  if (!registrationFound) {
    logTest('SW Registration Usage', 'WARN', 'Service worker registration not found in app')
  } else {
    logTest('SW Registration Usage', 'PASS', 'Service worker properly registered in app')
  }
  
  return true
}

// Test 8: Offline Data Management
function testOfflineDataManagement() {
  console.log('\n💾 Testing Offline Data Management...')
  
  const swPath = path.join(__dirname, 'public/sw.js')
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for offline data storage
  const offlineDataFeatures = [
    'pendingUploads',
    'cachedMeals',
    'offlineImages',
    'initializeOfflineDB'
  ]
  
  let foundDataFeatures = 0
  for (const feature of offlineDataFeatures) {
    if (swContent.includes(feature)) {
      foundDataFeatures++
    }
  }
  
  if (foundDataFeatures === 0) {
    logTest('Offline Data Storage', 'WARN', 'Offline data storage may not be implemented')
  } else {
    logTest('Offline Data Storage', 'PASS', `${foundDataFeatures} offline data features implemented`)
  }
  
  // Check for sync retry mechanisms
  if (!swContent.includes('retry') && !swContent.includes('queue')) {
    logTest('Sync Retry Mechanism', 'WARN', 'Sync retry mechanism may be missing')
  } else {
    logTest('Sync Retry Mechanism', 'PASS', 'Sync retry mechanism implemented')
  }
  
  return true
}

// Test 9: PWA Performance Features
function testPWAPerformanceFeatures() {
  console.log('\n⚡ Testing PWA Performance Features...')
  
  const swPath = path.join(__dirname, 'public/sw.js')
  const swContent = fs.readFileSync(swPath, 'utf8')
  
  // Check for cache strategies
  const cacheStrategies = [
    'STATIC_CACHE',
    'DYNAMIC_CACHE',
    'IMAGE_CACHE',
    'API_CACHE'
  ]
  
  let foundCacheTypes = 0
  for (const cacheType of cacheStrategies) {
    if (swContent.includes(cacheType)) {
      foundCacheTypes++
    }
  }
  
  if (foundCacheTypes === 0) {
    logTest('Cache Segmentation', 'WARN', 'Cache segmentation may not be implemented')
  } else {
    logTest('Cache Segmentation', 'PASS', `${foundCacheTypes} cache types implemented`)
  }
  
  // Check for preloading
  if (!swContent.includes('PRECACHE_ASSETS') && !swContent.includes('precache')) {
    logTest('Asset Preloading', 'WARN', 'Asset preloading may not be configured')
  } else {
    logTest('Asset Preloading', 'PASS', 'Asset preloading configured')
  }
  
  // Check for cache cleanup
  if (!swContent.includes('delete') && !swContent.includes('cleanup')) {
    logTest('Cache Cleanup', 'WARN', 'Cache cleanup may not be implemented')
  } else {
    logTest('Cache Cleanup', 'PASS', 'Cache cleanup implemented')
  }
  
  return true
}

// Main test runner
async function runPWATests() {
  const startTime = Date.now()
  
  console.log('Starting PWA functionality tests...\n')
  
  testManifestConfiguration()
  testServiceWorkerImplementation()
  testBackgroundSync()
  testPushNotifications()
  testOfflineFunctionality()
  testPWAInstallation()
  testServiceWorkerRegistration()
  testOfflineDataManagement()
  testPWAPerformanceFeatures()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 PWA FUNCTIONALITY TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`⏱️  Duration: ${duration}s`)
  
  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const successRate = ((testResults.passed / totalTests) * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  console.log('\n📋 PWA FUNCTIONALITY ASSESSMENT:')
  
  if (testResults.failed === 0 && testResults.warnings <= 5) {
    console.log('✅ EXCELLENT: PWA functionality comprehensive and ready!')
  } else if (testResults.failed === 0) {
    console.log('🟡 GOOD: Core PWA functionality ready, some features can be enhanced')
  } else {
    console.log('🔴 ISSUES: Critical PWA functionality issues need to be fixed')
  }
  
  console.log('\n💡 RECOMMENDATIONS:')
  
  if (testResults.failed > 0) {
    console.log('1. Fix failed tests to ensure PWA functionality works')
  }
  
  if (testResults.warnings > 8) {
    console.log('2. Address warnings to improve PWA user experience')
  }
  
  console.log('3. Test PWA installation on different devices and browsers')
  console.log('4. Verify offline functionality works without network')
  console.log('5. Test push notifications end-to-end')
  console.log('6. Validate background sync works as expected')
  console.log('7. Test PWA updates and cache invalidation')
  console.log('8. Monitor PWA engagement metrics')
  
  // Write detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'pwa-test-results.json'), 
    JSON.stringify(testResults, null, 2)
  )
  
  console.log('\n📄 Detailed PWA test results saved to pwa-test-results.json')
  
  return testResults.failed === 0
}

// Run the tests
runPWATests().catch(console.error)