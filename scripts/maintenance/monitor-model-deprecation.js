#!/usr/bin/env node

/**
 * OpenAI Model Deprecation Monitor
 * Checks for model deprecation notices and alerts on upcoming changes
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

console.log('🔍 OpenAI Model Deprecation Monitor')
console.log('=' .repeat(60))

// Models to monitor
const MONITORED_MODELS = [
  'gpt-4o-mini-2024-07-18',
  'gpt-4o-2024-08-06',
  'gpt-4.1-mini',
  'gpt-4.1'
]

// Known deprecations (manually maintained)
const KNOWN_DEPRECATIONS = {
  'gpt-4-vision-preview': {
    deprecated: true,
    deprecationDate: '2024-04-09',
    replacement: 'gpt-4o',
    note: 'Replaced by GPT-4o with native vision support'
  }
}

// Check results
const checkResults = {
  timestamp: new Date().toISOString(),
  modelsChecked: [],
  warnings: [],
  recommendations: []
}

// Check OpenAI models endpoint
async function checkModelsEndpoint() {
  console.log('\n📡 Checking OpenAI models endpoint...')
  
  const options = {
    hostname: 'api.openai.com',
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
  
  return new Promise((resolve) => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  No OPENAI_API_KEY found, skipping API check')
      resolve(null)
      return
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          if (response.data) {
            console.log(`✅ Found ${response.data.length} models`)
            resolve(response.data)
          } else {
            console.log('❌ No model data received')
            resolve(null)
          }
        } catch (error) {
          console.log('❌ Failed to parse API response')
          resolve(null)
        }
      })
    })
    
    req.on('error', (error) => {
      console.log('❌ API request failed:', error.message)
      resolve(null)
    })
    
    req.end()
  })
}

// Check current model configuration
function checkCurrentConfiguration() {
  console.log('\n🔧 Checking current model configuration...')
  
  const configPath = path.join(__dirname, '../../src/lib/config/ai-models.ts')
  if (fs.existsSync(configPath)) {
    console.log('✅ Model configuration file found')
    
    const content = fs.readFileSync(configPath, 'utf8')
    MONITORED_MODELS.forEach(model => {
      if (content.includes(model)) {
        console.log(`   ✓ ${model} is configured`)
        checkResults.modelsChecked.push(model)
      }
    })
  } else {
    console.log('⚠️  Model configuration file not found')
    checkResults.warnings.push('Model configuration file missing')
  }
}

// Check production usage
function checkProductionUsage() {
  console.log('\n🚀 Checking production model usage...')
  
  const routePath = path.join(__dirname, '../../src/app/api/analyze-food/route.ts')
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8')
    
    // Find model references
    const modelMatches = content.match(/model:\s*["']([^"']+)["']/g)
    if (modelMatches) {
      modelMatches.forEach(match => {
        const model = match.match(/["']([^"']+)["']/)[1]
        console.log(`   📍 Found model in use: ${model}`)
        
        // Check if model is deprecated
        if (KNOWN_DEPRECATIONS[model]) {
          const dep = KNOWN_DEPRECATIONS[model]
          checkResults.warnings.push({
            type: 'deprecated_model_in_use',
            model: model,
            deprecationDate: dep.deprecationDate,
            replacement: dep.replacement
          })
          console.log(`   ⚠️  WARNING: This model is deprecated!`)
          console.log(`      Replacement: ${dep.replacement}`)
        }
      })
    }
  }
}

// Generate recommendations
function generateRecommendations() {
  console.log('\n💡 Generating recommendations...')
  
  // Check for GPT-4.1 availability
  if (!checkResults.modelsChecked.includes('gpt-4.1-mini')) {
    checkResults.recommendations.push({
      priority: 'HIGH',
      action: 'Monitor GPT-4.1 model availability',
      reason: 'New models promise better performance and accuracy',
      steps: [
        'Check OpenAI announcements weekly',
        'Run model comparison tests when available',
        'Update configuration to include new models'
      ]
    })
  }
  
  // Check for deprecated models
  if (checkResults.warnings.some(w => w.type === 'deprecated_model_in_use')) {
    checkResults.recommendations.push({
      priority: 'CRITICAL',
      action: 'Migrate from deprecated models',
      reason: 'Deprecated models may stop working without notice',
      steps: [
        'Update model configuration immediately',
        'Test replacement models thoroughly',
        'Deploy changes to production'
      ]
    })
  }
  
  // General maintenance
  checkResults.recommendations.push({
    priority: 'MEDIUM',
    action: 'Regular model monitoring',
    reason: 'Stay ahead of deprecations and new features',
    steps: [
      'Run this script weekly',
      'Subscribe to OpenAI changelog',
      'Document model migration procedures'
    ]
  })
}

// Display results
function displayResults() {
  console.log('\n📊 Deprecation Check Results')
  console.log('=' .repeat(60))
  
  console.log('\n✅ Models Checked:')
  checkResults.modelsChecked.forEach(model => {
    console.log(`   • ${model}`)
  })
  
  if (checkResults.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    checkResults.warnings.forEach(warning => {
      if (typeof warning === 'string') {
        console.log(`   • ${warning}`)
      } else {
        console.log(`   • ${warning.type}: ${warning.model}`)
        if (warning.replacement) {
          console.log(`     → Migrate to: ${warning.replacement}`)
        }
      }
    })
  } else {
    console.log('\n✅ No deprecation warnings found')
  }
  
  console.log('\n📋 Recommendations:')
  checkResults.recommendations.forEach(rec => {
    console.log(`\n   [${rec.priority}] ${rec.action}`)
    console.log(`   Reason: ${rec.reason}`)
    console.log('   Steps:')
    rec.steps.forEach(step => {
      console.log(`     • ${step}`)
    })
  })
}

// Save report
function saveReport() {
  const reportPath = path.join(__dirname, 'model-deprecation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(checkResults, null, 2))
  console.log(`\n💾 Full report saved to: ${reportPath}`)
}

// Integration with weekly maintenance
function checkIfWeeklyMaintenance() {
  // Check if called from weekly maintenance script
  if (process.argv.includes('--weekly')) {
    console.log('\n🔄 Running as part of weekly maintenance')
    return true
  }
  return false
}

// Main execution
async function main() {
  console.log('Starting deprecation check...')
  console.log(`Timestamp: ${new Date().toISOString()}`)
  
  // Run checks
  checkCurrentConfiguration()
  checkProductionUsage()
  
  // Optional: Check API if key is available
  const apiModels = await checkModelsEndpoint()
  if (apiModels) {
    console.log('\n📝 Available models from API:')
    const visionModels = apiModels.filter(m => 
      m.id.includes('gpt-4') || m.id.includes('gpt-3.5')
    )
    visionModels.slice(0, 10).forEach(model => {
      console.log(`   • ${model.id}`)
    })
  }
  
  // Generate recommendations
  generateRecommendations()
  
  // Display results
  displayResults()
  
  // Save report
  saveReport()
  
  // Return status for weekly maintenance
  if (checkIfWeeklyMaintenance()) {
    return checkResults.warnings.length === 0 ? 0 : 1
  }
  
  console.log('\n✅ Deprecation check completed!')
}

// Run the monitor
main().catch(error => {
  console.error('❌ Monitor failed:', error)
  process.exit(1)
})