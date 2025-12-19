// stubs/api/test-gigachat-simple.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log('🔧 Testing GigaChat with .env configuration...');
console.log('GIGA_AUTH:', process.env.GIGA_AUTH ? 'Present' : 'Missing');

if (!process.env.GIGA_AUTH) {
  console.error('❌ GIGA_AUTH not found in .env');
  process.exit(1);
}

const { GigaChat } = require('langchain-gigachat');
const { Agent } = require('node:https');

const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

const testLLM = new GigaChat({
  model: 'GigaChat-2-Max',
  temperature: 0.7,
  scope: 'GIGACHAT_API_PERS',
  streaming: false,
  credentials: process.env.GIGA_AUTH,
  httpsAgent,
});

async function testGigaChat() {
  try {
    console.log('📨 Sending test message to GigaChat...');
    const response = await testLLM.invoke('Привет! Ответь коротко: как дела?');

    console.log('✅ GigaChat Test SUCCESSFUL!');
    console.log('🤖 Response:', response.content);

  } catch (error) {
    console.error('❌ GigaChat Test failed:');

    if (error.response?.status === 401) {
      console.error('   Status: 401 Unauthorized');
      console.error('   🔑 Problem: Invalid GigaChat token');
      console.error('   💡 Solutions:');
      console.error('      1. Get new token from: https://developers.sber.ru/portal/products/gigachat-api');
      console.error('      2. Update GIGA_AUTH in .env file');
      console.error('      3. Format: Bearer_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    } else {
      console.error('   Error details:', error.message);
    }
  }
}

testGigaChat().then();