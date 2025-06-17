#!/usr/bin/env node

/**
 * Check AI Platform Documentation Updates
 * 
 * This script checks both Claude (Anthropic) and OpenAI documentation for 
 * updates that might benefit the MealAppeal project. It focuses on:
 * 
 * Claude/Anthropic:
 * - New Claude models and features
 * - Claude Code improvements
 * - Tool usage pattern updates
 * 
 * OpenAI (CRITICAL for meal analysis):
 * - Vision API improvements
 * - New models (especially vision models)
 * - API changes that affect meal analysis
 * - Pricing updates
 * 
 * Run weekly with: npm run check:ai-updates
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const CACHE_FILE = path.join(__dirname, '../../.ai-docs-cache.json');
const UPDATE_LOG = path.join(__dirname, '../../docs/AI_UPDATES.md');

const CLAUDE_DOCS = [
  {
    name: 'Claude Code',
    url: 'https://docs.anthropic.com/en/docs/claude-code',
    relevance: 'Core development tool - check for new features and best practices',
    platform: 'Claude'
  },
  {
    name: 'Claude Vision API',
    url: 'https://docs.anthropic.com/en/docs/capabilities/vision',
    relevance: 'Future potential - Claude vision could replace OpenAI for meal analysis',
    platform: 'Claude'
  },
  {
    name: 'Claude Models',
    url: 'https://docs.anthropic.com/en/docs/models/models-overview',
    relevance: 'New models might offer better performance for development',
    platform: 'Claude'
  },
  {
    name: 'Claude Tool Usage',
    url: 'https://docs.anthropic.com/en/docs/tools/tool-use',
    relevance: 'Better patterns could improve development efficiency',
    platform: 'Claude'
  }
];

const OPENAI_DOCS = [
  {
    name: 'OpenAI Vision Guide',
    url: 'https://platform.openai.com/docs/guides/vision',
    relevance: '🔴 CRITICAL - Direct impact on meal analysis accuracy and features',
    platform: 'OpenAI'
  },
  {
    name: 'OpenAI Models',
    url: 'https://platform.openai.com/docs/models',
    relevance: '🟡 HIGH - Newer models might reduce costs or improve accuracy',
    platform: 'OpenAI'
  },
  {
    name: 'OpenAI API Reference',
    url: 'https://platform.openai.com/docs/api-reference/chat',
    relevance: '🟡 HIGH - New parameters could enhance meal analysis quality',
    platform: 'OpenAI'
  },
  {
    name: 'OpenAI Pricing',
    url: 'https://openai.com/api/pricing',
    relevance: '🟡 HIGH - Price changes directly affect profit margins',
    platform: 'OpenAI'
  }
];

const ALL_DOCS = [...CLAUDE_DOCS, ...OPENAI_DOCS];

// Utility to fetch URL content
async function fetchContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MealAppeal-Update-Checker' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Load cached checksums
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

// Save cache
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Check for updates
async function checkForUpdates() {
  console.log('🔍 Checking AI platform documentation for updates...\n');
  
  const cache = await loadCache();
  const updates = [];
  const now = new Date().toISOString();
  
  // Check all documentation
  for (const platform of ['Claude', 'OpenAI']) {
    console.log(`\n📚 ${platform} Documentation:`);
    const platformDocs = ALL_DOCS.filter(doc => doc.platform === platform);
    
    for (const doc of platformDocs) {
      try {
        console.log(`Checking ${doc.name}...`);
        const content = await fetchContent(doc.url);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (cache[doc.url] && cache[doc.url].hash !== hash) {
          updates.push({
            ...doc,
            status: '🔄 UPDATED',
            lastChecked: cache[doc.url].lastChecked,
            message: 'Content has changed since last check'
          });
        } else if (!cache[doc.url]) {
          updates.push({
            ...doc,
            status: '🆕 NEW',
            message: 'First time checking this documentation'
          });
        } else {
          console.log(`  ✅ No changes detected`);
        }
        
        // Update cache
        cache[doc.url] = {
          hash,
          lastChecked: now,
          name: doc.name,
          platform: doc.platform
        };
        
      } catch (error) {
        console.error(`  ❌ Error checking ${doc.name}:`, error.message);
      }
    }
  }
  
  await saveCache(cache);
  
  return { updates, timestamp: now };
}

// Generate recommendations based on updates
function generateRecommendations(updates) {
  const recommendations = [];
  
  for (const update of updates) {
    // OpenAI recommendations (CRITICAL for meal analysis)
    if (update.name === 'OpenAI Vision Guide') {
      recommendations.push({
        title: '🔴 CRITICAL: Review OpenAI Vision API Changes',
        action: 'Check for new vision features that could improve meal analysis accuracy',
        files: ['/src/app/api/analyze-food/route.ts'],
        priority: 'HIGH'
      });
    } else if (update.name === 'OpenAI Models') {
      recommendations.push({
        title: '🟡 Evaluate New OpenAI Models',
        action: `Compare new models with current gpt-4o-mini-2024-07-18 for cost/accuracy`,
        files: ['/src/app/api/analyze-food/route.ts', '/.env.example'],
        priority: 'HIGH'
      });
    } else if (update.name === 'OpenAI API Reference') {
      recommendations.push({
        title: '🟡 Review OpenAI API Changes',
        action: 'Check for new parameters or features for vision analysis',
        files: ['/src/app/api/analyze-food/route.ts'],
        priority: 'HIGH'
      });
    } else if (update.name === 'OpenAI Pricing') {
      recommendations.push({
        title: '💰 URGENT: Check OpenAI Pricing Changes',
        action: 'Update cost calculations and consider tier adjustments',
        files: ['/src/app/api/analyze-food/route.ts', '/CLAUDE.md'],
        priority: 'CRITICAL'
      });
    }
    
    // Claude recommendations
    else if (update.name === 'Claude Vision API') {
      recommendations.push({
        title: 'Investigate Claude Vision as Alternative',
        action: 'Evaluate if Claude vision could replace OpenAI for meal analysis',
        files: ['/src/app/api/analyze-food/route.ts'],
        priority: 'MEDIUM'
      });
    } else if (update.name === 'Claude Models') {
      recommendations.push({
        title: 'Check New Claude Models',
        action: 'See if new models improve development efficiency',
        files: ['/CLAUDE.md'],
        priority: 'LOW'
      });
    } else if (update.name === 'Claude Code') {
      recommendations.push({
        title: 'Update Development Workflow',
        action: 'Implement new Claude Code features or best practices',
        files: ['/CLAUDE.md', '/.claude/CLAUDE.md'],
        priority: 'LOW'
      });
    }
  }
  
  // Sort by priority
  const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

// Main execution
async function main() {
  const { updates, timestamp } = await checkForUpdates();
  
  console.log('\n📊 Update Summary');
  console.log('================\n');
  
  if (updates.length === 0) {
    console.log('✅ All documentation is up to date!');
    console.log(`Last checked: ${timestamp}`);
  } else {
    console.log(`Found ${updates.length} update(s):\n`);
    
    for (const update of updates) {
      console.log(`${update.status} ${update.name}`);
      console.log(`  📎 ${update.url}`);
      console.log(`  💡 ${update.relevance}`);
      console.log(`  📝 ${update.message}\n`);
    }
    
    const recommendations = generateRecommendations(updates);
    
    if (recommendations.length > 0) {
      console.log('\n🎯 Recommended Actions');
      console.log('====================\n');
      
      for (const rec of recommendations) {
        console.log(`• ${rec.title}`);
        console.log(`  Priority: ${rec.priority}`);
        console.log(`  Action: ${rec.action}`);
        console.log(`  Files: ${rec.files.join(', ')}\n`);
      }
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Review the updated documentation pages');
    console.log('2. Update /docs/AI_UPDATES.md with findings');
    console.log('3. Implement relevant changes in the codebase');
    console.log('4. Update configuration files with new patterns');
    console.log('5. Test any model or API changes thoroughly\n');
  }
  
  // Update TODO.md with last checked date
  try {
    const todoPath = path.join(__dirname, '../../TODO.md');
    let todoContent = await fs.readFile(todoPath, 'utf8');
    
    // Update the "Last Checked" line
    const dateStr = new Date().toISOString().split('T')[0];
    todoContent = todoContent.replace(
      /(\*\*Last Checked\*\*: ).*$/m,
      `$1${dateStr}`
    );
    
    await fs.writeFile(todoPath, todoContent);
    console.log(`✅ Updated TODO.md with last check date: ${dateStr}`);
  } catch (error) {
    console.error('⚠️  Could not update TODO.md:', error.message);
  }
}

// Run the script
main().catch(console.error);