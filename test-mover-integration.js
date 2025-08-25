#!/usr/bin/env node

// Test The Mover integration with quantum branch
console.log('🤖 Testing The Mover integration...\n');

const TheMoverAIClone = require('./mover/the-mover-ai-clone');

async function testMover() {
  try {
    // Initialize The Mover
    console.log('1. Creating Mover instance...');
    const mover = new TheMoverAIClone({
      memoryPath: '/root/OGZFV-valhalla/data/mover-memory',
      learningRate: 0.8,
      responseStyle: 'authentic_og'
    });
    
    // Initialize final form
    console.log('2. Initializing final form...');
    await mover.initializeFinalForm();
    console.log('✅ Initialization complete!');
    
    // Test response generation
    console.log('\n3. Testing response generation...');
    const testMessage = "Hey Mover, how are you doing?";
    console.log(`Input: "${testMessage}"`);
    
    const response = mover.generateResponse(testMessage);
    console.log(`Response: "${response}"`);
    
    // Test trading question
    console.log('\n4. Testing trading question...');
    const tradingQuestion = "What do you think about the current market?";
    console.log(`Input: "${tradingQuestion}"`);
    
    const tradingResponse = mover.generateResponse(tradingQuestion);
    console.log(`Response: "${tradingResponse}"`);
    
    console.log('\n🎉 All tests passed! The Mover is ready for integration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMover();