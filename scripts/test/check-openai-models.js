#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function checkModels() {
  console.log('🔍 Checking OpenAI models availability...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  try {
    // List all available models
    console.log('📋 Fetching available models...');
    const models = await openai.models.list();
    
    // Filter for vision-capable GPT models
    const visionModels = models.data
      .filter(m => 
        (m.id.includes('gpt-4') || m.id.includes('gpt-3')) && 
        !m.id.includes('instruct') && 
        !m.id.includes('turbo-16k')
      )
      .map(m => m.id)
      .sort();
    
    console.log('\n✅ Available Vision-capable models:');
    visionModels.forEach(m => console.log(`  - ${m}`));

    // Check specific models from our config
    console.log('\n🔍 Checking models from ai-models.ts config:');
    const modelsToCheck = [
      'gpt-4o-mini-2024-07-18',
      'gpt-4.1-mini',  // Future model
      'gpt-4.1',       // Future model
      'gpt-4o-2024-08-06',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4-vision-preview'
    ];

    for (const modelId of modelsToCheck) {
      const exists = models.data.some(m => m.id === modelId);
      console.log(`  ${exists ? '✅' : '❌'} ${modelId} ${exists ? '(available)' : '(NOT FOUND)'}`);
    }

    // Test a simple vision API call with the current production model
    console.log('\n🧪 Testing vision API with gpt-4o-mini-2024-07-18...');
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Say "API test successful" in 5 words or less.' }
            ]
          }
        ],
        max_tokens: 50
      });
      console.log('✅ API Test Response:', response.choices[0].message.content);
    } catch (error) {
      console.error('❌ API Test Failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    process.exit(1);
  }
}

checkModels();