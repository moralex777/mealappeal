#!/usr/bin/env node

/**
 * Validates git branch names follow conventional format
 * Usage: node scripts/dev/check-branch-name.js
 */

const { execSync } = require('child_process');

// Valid branch prefixes
const VALID_PREFIXES = [
  'feat',      // New feature
  'fix',       // Bug fix
  'hotfix',    // Urgent production fix
  'chore',     // Maintenance
  'docs',      // Documentation
  'perf',      // Performance improvement
  'refactor',  // Code refactoring
  'test',      // Testing
  'style',     // Styling changes
  'revert',    // Revert previous commit
  'main',      // Main branch
  'master',    // Master branch (legacy)
];

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('❌ Error: Not in a git repository');
    process.exit(1);
  }
}

function validateBranchName(branchName) {
  // Check if it's main/master
  if (branchName === 'main' || branchName === 'master') {
    return { valid: true };
  }

  // Check format: prefix/description
  const parts = branchName.split('/');
  if (parts.length !== 2) {
    return {
      valid: false,
      error: 'Branch name should follow format: type/description (e.g., feat/add-export)'
    };
  }

  const [prefix, description] = parts;

  // Check if prefix is valid
  if (!VALID_PREFIXES.includes(prefix)) {
    return {
      valid: false,
      error: `Invalid prefix "${prefix}". Valid prefixes: ${VALID_PREFIXES.join(', ')}`
    };
  }

  // Check description format (kebab-case)
  if (!/^[a-z0-9-]+$/.test(description)) {
    return {
      valid: false,
      error: 'Description should be lowercase with hyphens (e.g., add-export-feature)'
    };
  }

  return { valid: true };
}

function main() {
  console.log('🔍 Checking branch name...\n');
  
  const currentBranch = getCurrentBranch();
  console.log(`Current branch: ${currentBranch}`);
  
  const validation = validateBranchName(currentBranch);
  
  if (validation.valid) {
    console.log('\n✅ Branch name is valid!');
    
    // Suggest commit format
    if (currentBranch !== 'main' && currentBranch !== 'master') {
      const prefix = currentBranch.split('/')[0];
      console.log(`\n💡 Suggested commit format:`);
      console.log(`   git commit -m "${prefix}: your commit message"`);
    }
  } else {
    console.error(`\n❌ Invalid branch name: ${validation.error}`);
    console.log('\n📚 Examples of valid branch names:');
    console.log('   feat/add-meal-sharing');
    console.log('   fix/camera-permissions');
    console.log('   hotfix/payment-processing');
    console.log('   chore/update-dependencies');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}