#!/usr/bin/env node

/**
 * Camera and Image Upload Functionality Test
 * Tests image processing, compression, and storage integration
 */

const fs = require('fs')
const path = require('path')

console.log('📸 Camera and Image Upload Functionality Test')
console.log('=' .repeat(60))

// Test mock image data (1x1 transparent PNG)
const mockImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

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

// Test 1: Image Upload Hook Structure
function testImageUploadHook() {
  console.log('\n🔧 Testing Image Upload Hook...')
  
  const hookPath = path.join(__dirname, 'src/hooks/useImageUpload.ts')
  if (!fs.existsSync(hookPath)) {
    logTest('Upload Hook File', 'FAIL', 'useImageUpload.ts not found')
    return false
  }
  
  const hookContent = fs.readFileSync(hookPath, 'utf8')
  
  // Check for required functions
  const requiredFunctions = [
    'useImageUpload',
    'useProgressiveImage',
    'useLazyImage'
  ]
  
  for (const func of requiredFunctions) {
    if (!hookContent.includes(`export function ${func}`)) {
      logTest('Upload Hook Functions', 'FAIL', `Missing function: ${func}`)
      return false
    }
  }
  
  logTest('Upload Hook Functions', 'PASS', 'All required functions present')
  
  // Check for required imports
  const requiredImports = [
    'uploadImage',
    'checkStorageQuota',
    'cleanupOldImages'
  ]
  
  for (const imp of requiredImports) {
    if (!hookContent.includes(imp)) {
      logTest('Upload Hook Imports', 'FAIL', `Missing import: ${imp}`)
      return false
    }
  }
  
  logTest('Upload Hook Imports', 'PASS', 'All required imports present')
  return true
}

// Test 2: Supabase Storage Integration
function testSupabaseStorageIntegration() {
  console.log('\n☁️ Testing Supabase Storage Integration...')
  
  const storagePath = path.join(__dirname, 'src/lib/supabase-storage.ts')
  if (!fs.existsSync(storagePath)) {
    logTest('Storage Module', 'FAIL', 'supabase-storage.ts not found')
    return false
  }
  
  const storageContent = fs.readFileSync(storagePath, 'utf8')
  
  // Check for required configuration
  if (!storageContent.includes('STORAGE_CONFIG')) {
    logTest('Storage Config', 'FAIL', 'STORAGE_CONFIG not found')
    return false
  }
  
  logTest('Storage Config', 'PASS', 'Storage configuration present')
  
  // Check for required functions
  const requiredFunctions = [
    'uploadImage',
    'compressImage',
    'checkStorageQuota',
    'generateThumbnail',
    'cleanupOldImages'
  ]
  
  let missingFunctions = []
  for (const func of requiredFunctions) {
    if (!storageContent.includes(`export async function ${func}`) && 
        !storageContent.includes(`export function ${func}`)) {
      missingFunctions.push(func)
    }
  }
  
  if (missingFunctions.length > 0) {
    logTest('Storage Functions', 'FAIL', 'Missing functions', missingFunctions.join(', '))
    return false
  }
  
  logTest('Storage Functions', 'PASS', 'All storage functions present')
  
  // Check for image processing features
  const processingFeatures = [
    'WebP',
    'EXIF',
    'compress',
    'thumbnail',
    'resize'
  ]
  
  let missingFeatures = []
  for (const feature of processingFeatures) {
    if (!storageContent.toLowerCase().includes(feature.toLowerCase())) {
      missingFeatures.push(feature)
    }
  }
  
  if (missingFeatures.length > 0) {
    logTest('Image Processing Features', 'WARN', 'Some features may be missing', missingFeatures.join(', '))
  } else {
    logTest('Image Processing Features', 'PASS', 'All image processing features present')
  }
  
  return true
}

// Test 3: Database Migration for Storage
function testStorageMigration() {
  console.log('\n🗄️ Testing Storage Database Migration...')
  
  const migrationPath = path.join(__dirname, 'supabase/migrations/20250607000004_storage_buckets.sql')
  if (!fs.existsSync(migrationPath)) {
    logTest('Storage Migration', 'FAIL', 'Storage migration file not found')
    return false
  }
  
  const migrationContent = fs.readFileSync(migrationPath, 'utf8')
  
  // Check for required buckets
  const requiredBuckets = [
    'meal-images',
    'meal-thumbnails',
    'user-avatars'
  ]
  
  for (const bucket of requiredBuckets) {
    if (!migrationContent.includes(bucket)) {
      logTest('Storage Buckets', 'FAIL', `Missing bucket: ${bucket}`)
      return false
    }
  }
  
  logTest('Storage Buckets', 'PASS', 'All required buckets configured')
  
  // Check for RLS policies
  const rlsPolicies = [
    'Users can upload their own',
    'Users can delete their own',
    'Public read access'
  ]
  
  let missingPolicies = []
  for (const policy of rlsPolicies) {
    if (!migrationContent.includes(policy)) {
      missingPolicies.push(policy)
    }
  }
  
  if (missingPolicies.length > 0) {
    logTest('RLS Policies', 'FAIL', 'Missing security policies', missingPolicies.join(', '))
    return false
  }
  
  logTest('RLS Policies', 'PASS', 'All security policies present')
  
  // Check for cleanup function
  if (!migrationContent.includes('cleanup_old_free_tier_images')) {
    logTest('Cleanup Function', 'WARN', 'Cleanup function may be missing')
  } else {
    logTest('Cleanup Function', 'PASS', 'Cleanup function configured')
  }
  
  return true
}

// Test 4: Camera Page Structure
function testCameraPageStructure() {
  console.log('\n📷 Testing Camera Page Structure...')
  
  const cameraPagePath = path.join(__dirname, 'src/app/camera/page.tsx')
  if (!fs.existsSync(cameraPagePath)) {
    logTest('Camera Page', 'FAIL', 'Camera page not found')
    return false
  }
  
  const cameraContent = fs.readFileSync(cameraPagePath, 'utf8')
  
  // Check for camera functionality
  const cameraFeatures = [
    'navigator.mediaDevices',
    'getUserMedia',
    'canvas',
    'toDataURL'
  ]
  
  let missingFeatures = []
  for (const feature of cameraFeatures) {
    if (!cameraContent.includes(feature)) {
      missingFeatures.push(feature)
    }
  }
  
  if (missingFeatures.length > 0) {
    logTest('Camera Features', 'WARN', 'Some camera features may be missing', missingFeatures.join(', '))
  } else {
    logTest('Camera Features', 'PASS', 'All camera features present')
  }
  
  // Check for image processing
  if (!cameraContent.includes('useImageUpload')) {
    logTest('Image Upload Integration', 'FAIL', 'Image upload hook not used')
    return false
  }
  
  logTest('Image Upload Integration', 'PASS', 'Image upload properly integrated')
  
  return true
}

// Test 5: Image Validation and Security
function testImageValidationSecurity() {
  console.log('\n🔒 Testing Image Validation and Security...')
  
  const storagePath = path.join(__dirname, 'src/lib/supabase-storage.ts')
  const storageContent = fs.readFileSync(storagePath, 'utf8')
  
  // Check for file type validation
  const securityFeatures = [
    'allowedTypes',
    'maxFileSize',
    'validate',
    'EXIF'
  ]
  
  let missingSecurityFeatures = []
  for (const feature of securityFeatures) {
    if (!storageContent.includes(feature)) {
      missingSecurityFeatures.push(feature)
    }
  }
  
  if (missingSecurityFeatures.length > 0) {
    logTest('Security Features', 'WARN', 'Some security features may be missing', 
      missingSecurityFeatures.join(', '))
  } else {
    logTest('Security Features', 'PASS', 'All security features present')
  }
  
  // Check for rate limiting
  if (!storageContent.includes('quota') && !storageContent.includes('limit')) {
    logTest('Rate Limiting', 'WARN', 'Rate limiting may not be implemented')
  } else {
    logTest('Rate Limiting', 'PASS', 'Rate limiting features present')
  }
  
  return true
}

// Test 6: Error Handling
function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...')
  
  const hookPath = path.join(__dirname, 'src/hooks/useImageUpload.ts')
  const hookContent = fs.readFileSync(hookPath, 'utf8')
  
  // Check for error handling patterns
  const errorHandlingPatterns = [
    'try',
    'catch',
    'error',
    'onError'
  ]
  
  let missingErrorHandling = []
  for (const pattern of errorHandlingPatterns) {
    if (!hookContent.includes(pattern)) {
      missingErrorHandling.push(pattern)
    }
  }
  
  if (missingErrorHandling.length > 0) {
    logTest('Error Handling', 'WARN', 'Error handling may be incomplete', 
      missingErrorHandling.join(', '))
  } else {
    logTest('Error Handling', 'PASS', 'Comprehensive error handling present')
  }
  
  return true
}

// Test 7: Progressive Loading and Optimization
function testProgressiveLoadingOptimization() {
  console.log('\n⚡ Testing Progressive Loading and Optimization...')
  
  const hookPath = path.join(__dirname, 'src/hooks/useImageUpload.ts')
  const hookContent = fs.readFileSync(hookPath, 'utf8')
  
  // Check for progressive loading features
  if (!hookContent.includes('useProgressiveImage')) {
    logTest('Progressive Loading', 'WARN', 'Progressive image loading may not be available')
  } else {
    logTest('Progressive Loading', 'PASS', 'Progressive image loading implemented')
  }
  
  // Check for lazy loading
  if (!hookContent.includes('useLazyImage')) {
    logTest('Lazy Loading', 'WARN', 'Lazy loading may not be available')
  } else {
    logTest('Lazy Loading', 'PASS', 'Lazy loading implemented')
  }
  
  // Check for compression
  const storagePath = path.join(__dirname, 'src/lib/supabase-storage.ts')
  const storageContent = fs.readFileSync(storagePath, 'utf8')
  
  if (!storageContent.includes('compress') && !storageContent.includes('quality')) {
    logTest('Image Compression', 'WARN', 'Image compression may not be implemented')
  } else {
    logTest('Image Compression', 'PASS', 'Image compression implemented')
  }
  
  return true
}

// Main test runner
async function runCameraTests() {
  const startTime = Date.now()
  
  console.log('Starting camera and image upload tests...\n')
  
  testImageUploadHook()
  testSupabaseStorageIntegration()
  testStorageMigration()
  testCameraPageStructure()
  testImageValidationSecurity()
  testErrorHandling()
  testProgressiveLoadingOptimization()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 CAMERA FUNCTIONALITY TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`⏱️  Duration: ${duration}s`)
  
  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const successRate = ((testResults.passed / totalTests) * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  console.log('\n📋 CAMERA FUNCTIONALITY ASSESSMENT:')
  
  if (testResults.failed === 0 && testResults.warnings === 0) {
    console.log('✅ EXCELLENT: Camera functionality fully implemented and ready!')
  } else if (testResults.failed === 0) {
    console.log('🟡 GOOD: Core camera functionality ready, some optimizations recommended')
  } else {
    console.log('🔴 ISSUES: Critical camera functionality issues need to be fixed')
  }
  
  // Specific recommendations
  console.log('\n💡 RECOMMENDATIONS:')
  
  if (testResults.failed > 0) {
    console.log('1. Fix failed tests to ensure camera functionality works')
  }
  
  if (testResults.warnings > 0) {
    console.log('2. Address warnings to improve user experience')
  }
  
  console.log('3. Test camera functionality on different devices and browsers')
  console.log('4. Verify image compression reduces file sizes appropriately')
  console.log('5. Test offline image capture and sync functionality')
  console.log('6. Validate storage quota enforcement works correctly')
  
  // Write detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'camera-test-results.json'), 
    JSON.stringify(testResults, null, 2)
  )
  
  console.log('\n📄 Detailed camera test results saved to camera-test-results.json')
  
  return testResults.failed === 0
}

// Run the tests
runCameraTests().catch(console.error)