#!/usr/bin/env node

/**
 * Development Cleanup Tool - Maintains organized development environment
 * Cleans temporary files, old reports, and maintains directory structure
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Cleanup configuration
const CLEANUP_CONFIG = {
  // Files older than this will be cleaned up
  MAX_AGE_DAYS: {
    reports: 7,      // Test reports
    temp: 1,         // Temporary files
    logs: 3          // Log files
  },
  
  // Directories to clean
  CLEAN_DIRS: [
    'reports',
    'temp',
    'logs'
  ],
  
  // File patterns to clean up
  CLEANUP_PATTERNS: [
    /\.log$/,
    /\.tmp$/,
    /\.cache$/,
    /-report\.json$/,
    /debug-.*\.js$/,
    /test-.*\.html$/
  ]
};

function getFileAge(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const now = new Date();
    const fileTime = stats.mtime;
    return (now - fileTime) / (1000 * 60 * 60 * 24); // days
  } catch {
    return 0;
  }
}

function shouldCleanFile(filePath, maxAgeDays) {
  const age = getFileAge(filePath);
  const fileName = path.basename(filePath);
  
  // Check age
  if (age > maxAgeDays) return true;
  
  // Check patterns
  return CLEANUP_CONFIG.CLEANUP_PATTERNS.some(pattern => pattern.test(fileName));
}

function cleanDirectory(dirPath, maxAgeDays, dryRun = false) {
  const cleaned = [];
  
  if (!fs.existsSync(dirPath)) {
    return cleaned;
  }
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isFile()) {
        if (shouldCleanFile(fullPath, maxAgeDays)) {
          if (!dryRun) {
            fs.unlinkSync(fullPath);
          }
          cleaned.push({
            path: fullPath,
            age: getFileAge(fullPath),
            size: stats.size
          });
        }
      } else if (stats.isDirectory()) {
        // Recursively clean subdirectories
        const subCleaned = cleanDirectory(fullPath, maxAgeDays, dryRun);
        cleaned.push(...subCleaned);
        
        // Remove empty directories
        try {
          if (!dryRun && fs.readdirSync(fullPath).length === 0) {
            fs.rmdirSync(fullPath);
            cleaned.push({ path: fullPath, type: 'empty-dir' });
          }
        } catch {
          // Directory not empty or permission issue
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not clean ${dirPath}: ${error.message}`);
  }
  
  return cleaned;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function runCleanup(dryRun = false) {
  console.log(dryRun ? '🔍 Cleanup Preview (dry run)' : '🧹 Running Cleanup');
  console.log('========================');
  
  let totalCleaned = [];
  let totalSize = 0;
  
  // Clean each configured directory
  CLEANUP_CONFIG.CLEAN_DIRS.forEach(dir => {
    const dirPath = path.join(PROJECT_ROOT, dir);
    const maxAge = CLEANUP_CONFIG.MAX_AGE_DAYS[dir] || 7;
    
    console.log(`\\n📁 Cleaning ${dir}/ (files older than ${maxAge} days)...`);
    
    const cleaned = cleanDirectory(dirPath, maxAge, dryRun);
    
    if (cleaned.length === 0) {
      console.log('   ✅ No files to clean');
    } else {
      cleaned.forEach(item => {
        if (item.type === 'empty-dir') {
          console.log(`   🗂️  ${dryRun ? 'Would remove' : 'Removed'} empty directory: ${path.relative(PROJECT_ROOT, item.path)}`);
        } else {
          console.log(`   🗑️  ${dryRun ? 'Would remove' : 'Removed'}: ${path.relative(PROJECT_ROOT, item.path)} (${formatFileSize(item.size)}, ${item.age.toFixed(1)} days old)`);
          totalSize += item.size;
        }
      });
    }
    
    totalCleaned.push(...cleaned);
  });
  
  // Summary
  console.log('\\n📊 Cleanup Summary');
  console.log('==================');
  console.log(`Files ${dryRun ? 'to be cleaned' : 'cleaned'}: ${totalCleaned.length}`);
  console.log(`Space ${dryRun ? 'to be freed' : 'freed'}: ${formatFileSize(totalSize)}`);
  
  if (dryRun && totalCleaned.length > 0) {
    console.log('\\n💡 Run without --dry-run to actually clean files');
  }
  
  return totalCleaned;
}

function ensureCleanDirectories() {
  console.log('📁 Ensuring clean directory structure...');
  
  CLEANUP_CONFIG.CLEAN_DIRS.forEach(dir => {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`   ✅ Created ${dir}/`);
    }
  });
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const help = args.includes('--help') || args.includes('-h');
  
  if (help) {
    console.log('MealAppeal Development Cleanup Tool');
    console.log('==================================');
    console.log('');
    console.log('Usage:');
    console.log('  npm run clean           # Clean old files and directories');
    console.log('  npm run clean -- --dry-run  # Preview what would be cleaned');
    console.log('  node tools/cleanup.js --help # Show this help');
    console.log('');
    console.log('What gets cleaned:');
    console.log('  - Test reports older than 7 days');
    console.log('  - Temporary files older than 1 day');
    console.log('  - Log files older than 3 days');
    console.log('  - Empty directories');
    console.log('  - Development artifacts matching cleanup patterns');
    return;
  }
  
  ensureCleanDirectories();
  runCleanup(dryRun);
  
  if (!dryRun) {
    console.log('\\n✨ Development environment cleaned!');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runCleanup, cleanDirectory };