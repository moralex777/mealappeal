#!/usr/bin/env node

/**
 * Comprehensive Test Runner - Runs all tests in organized manner
 * Provides detailed reporting and handles test dependencies
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TEST_DIR = __dirname;
const REPORTS_DIR = path.join(__dirname, '../../reports');

// Test categories and their execution order
const TEST_CATEGORIES = {
  'environment': ['test-billing-cycle-fix.js'],
  'auth': ['test-login.js'],
  'database': ['test-functionality.js'],
  'navigation': ['test-navigation-responsive.js'],
  'ai-analysis': ['test-ai-analysis.js', 'test-full-ai-analysis.js'],
  'payment': ['test-stripe-integration.js', 'test-subscription-tiers.js'],
  'mobile': ['test-camera-functionality.js', 'test-pwa-functionality.js'],
  'comprehensive': ['test-comprehensive-system-validation.js', 'test-user-journey-comprehensive.js']
};

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function getAvailableTests() {
  try {
    const files = fs.readdirSync(TEST_DIR);
    return files.filter(file => file.endsWith('.js') && file !== 'run-all-tests.js');
  } catch {
    return [];
  }
}

function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(TEST_DIR, testFile);
    console.log(`\\n🧪 Running: ${testFile}`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const status = code === 0 ? '✅ PASSED' : '❌ FAILED';
      
      console.log('─'.repeat(50));
      console.log(`${status} ${testFile} (${duration}ms)`);
      
      resolve({
        test: testFile,
        passed: code === 0,
        duration,
        exitCode: code
      });
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error running ${testFile}:`, error.message);
      resolve({
        test: testFile,
        passed: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    });
  });
}

async function runTestCategory(categoryName, tests) {
  console.log(`\\n🏷️  Category: ${categoryName.toUpperCase()}`);
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const test of tests) {
    const testPath = path.join(TEST_DIR, test);
    if (fs.existsSync(testPath)) {
      const result = await runTest(test);
      results.push(result);
    } else {
      console.log(`⚠️  Test not found: ${test}`);
      results.push({
        test,
        passed: false,
        duration: 0,
        error: 'Test file not found'
      });
    }
  }
  
  return results;
}

async function runAllTests() {
  console.log('🚀 MealAppeal Comprehensive Test Suite');
  console.log('====================================');
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  ensureReportsDir();
  
  const startTime = Date.now();
  const allResults = [];
  
  // Run tests by category
  for (const [category, tests] of Object.entries(TEST_CATEGORIES)) {
    const categoryResults = await runTestCategory(category, tests);
    allResults.push(...categoryResults);
  }
  
  // Run any remaining tests not in categories
  const availableTests = getAvailableTests();
  const categorizedTests = Object.values(TEST_CATEGORIES).flat();
  const remainingTests = availableTests.filter(test => !categorizedTests.includes(test));
  
  if (remainingTests.length > 0) {
    const remainingResults = await runTestCategory('uncategorized', remainingTests);
    allResults.push(...remainingResults);
  }
  
  // Generate summary
  const totalDuration = Date.now() - startTime;
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const total = allResults.length;
  
  console.log('\\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
  console.log(`Total Duration: ${totalDuration}ms`);
  
  // Detailed results
  if (failed > 0) {
    console.log('\\n❌ FAILED TESTS:');
    allResults.filter(r => !r.passed).forEach(result => {
      console.log(`   ${result.test}: ${result.error || 'Exit code ' + result.exitCode}`);
    });
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, successRate: Math.round((passed / total) * 100) },
    duration: totalDuration,
    results: allResults
  };
  
  const reportPath = path.join(REPORTS_DIR, `test-run-${Date.now()}.json`);
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\\n📄 Report saved: ${path.relative(process.cwd(), reportPath)}`);
  } catch (error) {
    console.warn(`⚠️  Could not save report: ${error.message}`);
  }
  
  if (failed > 0) {
    console.log('\\n💡 Tips:');
    console.log('  - Check environment variables in .env.local');
    console.log('  - Ensure database is running and accessible');
    console.log('  - Run individual tests with: node scripts/test/<test-name>');
    process.exit(1);
  } else {
    console.log('\\n🎉 All tests passed!');
  }
}

function showHelp() {
  console.log('MealAppeal Test Runner');
  console.log('====================');
  console.log('');
  console.log('Usage:');
  console.log('  npm run test:all           # Run all tests');
  console.log('  node scripts/test/run-all-tests.js  # Direct execution');
  console.log('');
  console.log('Test Categories:');
  Object.entries(TEST_CATEGORIES).forEach(([category, tests]) => {
    console.log(`  ${category}:`);
    tests.forEach(test => console.log(`    - ${test}`));
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else {
    runAllTests().catch(console.error);
  }
}

module.exports = { runAllTests, runTestCategory };