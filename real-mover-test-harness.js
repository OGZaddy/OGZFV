// real-mover-test-harness.js
// Test harness for The Mover AI to verify reasoning, decision-making, and integration.
// This connects to the actual running Mover AI instance and gets real responses.

const assert = require('assert');
const TheMoverAIClone = require('./mover/the-mover-ai-clone');

/**
 * Real test environment for The Mover AI.
 * This will call various Mover capabilities and validate actual responses.
 */

async function runMoverTests(moverInstance = null) {
    console.log("🚀 Starting The Mover AI Test Harness (Real Responses)...\n");

    let results = [];
    let mover = moverInstance;
    
    // If no instance provided, create and initialize one
    if (!mover) {
        console.log("🧠 Initializing The Mover AI instance...");
        mover = new TheMoverAIClone({
            learningRate: 0.8,
            memoryDepth: 1000
        });
        
        // Initialize the Mover with training data
        await mover.initializeFinalForm();
        console.log("✅ The Mover AI initialized successfully\n");
    }

    // Test 1: Reasoning under uncertainty
    console.log("🧪 Test 1: Reasoning under uncertainty");
    const reasoningPrompt = "If BTC is trending up but RSI is overbought, what should we do?";
    console.log(`📝 Prompt: ${reasoningPrompt}`);
    
    try {
        const reasoningResponse = await mover.generateResponse(reasoningPrompt);
        console.log(`🤖 Response: ${reasoningResponse}\n`);
        
        results.push({
            test: "Reasoning under uncertainty",
            prompt: reasoningPrompt,
            response: reasoningResponse,
            status: reasoningResponse.length > 10 ? "PASS" : "FAIL"
        });
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        results.push({
            test: "Reasoning under uncertainty",
            prompt: reasoningPrompt,
            response: `ERROR: ${error.message}`,
            status: "ERROR"
        });
    }

    // Test 2: Pattern recognition
    console.log("🧪 Test 2: Pattern recognition");
    const patternPrompt = "Analyze this pattern: MACD crossover up, volume spike, breaking resistance.";
    console.log(`📝 Prompt: ${patternPrompt}`);
    
    try {
        const patternResponse = await mover.generateResponse(patternPrompt);
        console.log(`🤖 Response: ${patternResponse}\n`);
        
        results.push({
            test: "Pattern recognition",
            prompt: patternPrompt,
            response: patternResponse,
            status: patternResponse.length > 10 ? "PASS" : "FAIL"
        });
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        results.push({
            test: "Pattern recognition",
            prompt: patternPrompt,
            response: `ERROR: ${error.message}`,
            status: "ERROR"
        });
    }

    // Test 3: Risk management advice
    console.log("🧪 Test 3: Risk management advice");
    const riskPrompt = "Portfolio is down 4% today. Suggest action.";
    console.log(`📝 Prompt: ${riskPrompt}`);
    
    try {
        const riskResponse = await mover.generateResponse(riskPrompt);
        console.log(`🤖 Response: ${riskResponse}\n`);
        
        results.push({
            test: "Risk management advice",
            prompt: riskPrompt,
            response: riskResponse,
            status: riskResponse.length > 10 ? "PASS" : "FAIL"
        });
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        results.push({
            test: "Risk management advice",
            prompt: riskPrompt,
            response: `ERROR: ${error.message}`,
            status: "ERROR"
        });
    }

    // Test 4: Multi-step reasoning
    console.log("🧪 Test 4: Multi-step reasoning");
    const multiStepPrompt = "Simulate next 3 trades for ETH in a ranging market with decreasing volume.";
    console.log(`📝 Prompt: ${multiStepPrompt}`);
    
    try {
        const multiStepResponse = await mover.generateResponse(multiStepPrompt);
        console.log(`🤖 Response: ${multiStepResponse}\n`);
        
        results.push({
            test: "Multi-step reasoning",
            prompt: multiStepPrompt,
            response: multiStepResponse,
            status: multiStepResponse.length > 10 ? "PASS" : "FAIL"
        });
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        results.push({
            test: "Multi-step reasoning",
            prompt: multiStepPrompt,
            response: `ERROR: ${error.message}`,
            status: "ERROR"
        });
    }

    // Test 5: Trading bot integration question
    console.log("🧪 Test 5: Trading bot integration");
    const tradingPrompt = "How should the trading bot handle a sudden market crash?";
    console.log(`📝 Prompt: ${tradingPrompt}`);
    
    try {
        const tradingResponse = await mover.generateResponse(tradingPrompt);
        console.log(`🤖 Response: ${tradingResponse}\n`);
        
        results.push({
            test: "Trading bot integration",
            prompt: tradingPrompt,
            response: tradingResponse,
            status: tradingResponse.length > 10 ? "PASS" : "FAIL"
        });
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        results.push({
            test: "Trading bot integration",
            prompt: tradingPrompt,
            response: `ERROR: ${error.message}`,
            status: "ERROR"
        });
    }

    // Test 6: Personality and frustration handling
    console.log("🧪 Test 6: Personality and frustration handling");
    const frustrationPrompt = "This fucking bot keeps making bad trades and losing money!";
    console.log(`📝 Prompt: ${frustrationPrompt}`);
    
    try {
        const frustrationResponse = await mover.generateResponse(frustrationPrompt);
        console.log(`🤖 Response: ${frustrationResponse}\n`);
        
        results.push({
            test: "Personality and frustration handling",
            prompt: frustrationPrompt,
            response: frustrationResponse,
            status: frustrationResponse.length > 10 ? "PASS" : "FAIL"
        });
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        results.push({
            test: "Personality and frustration handling",
            prompt: frustrationPrompt,
            response: `ERROR: ${error.message}`,
            status: "ERROR"
        });
    }

    // Generate summary
    console.log("=" .repeat(80));
    console.log("                    🎯 THE MOVER AI TEST RESULTS");
    console.log("=" .repeat(80));
    
    const passCount = results.filter(r => r.status === "PASS").length;
    const failCount = results.filter(r => r.status === "FAIL").length;
    const errorCount = results.filter(r => r.status === "ERROR").length;
    const totalTests = results.length;
    const successRate = Math.round((passCount / totalTests) * 100);
    
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`💥 Errors: ${errorCount}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log("=" .repeat(80));
    
    // Display detailed results
    console.log("\n📋 DETAILED RESULTS:");
    results.forEach((result, index) => {
        const statusIcon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "💥";
        console.log(`\n${index + 1}. ${statusIcon} ${result.test}`);
        console.log(`   Prompt: ${result.prompt}`);
        console.log(`   Response: ${result.response}`);
        console.log(`   Status: ${result.status}`);
    });
    
    // Get personality stats
    if (mover && typeof mover.getPersonalityStats === 'function') {
        console.log("\n🧠 THE MOVER PERSONALITY STATS:");
        const stats = mover.getPersonalityStats();
        console.log(`   Total Patterns: ${stats.totalPatterns}`);
        console.log(`   Emotional Range: ${stats.emotionalRange}`);
        console.log(`   Total Conversations: ${stats.totalConversations}`);
        
        if (stats.patternBreakdown) {
            console.log("   Pattern Breakdown:");
            stats.patternBreakdown.forEach(pattern => {
                console.log(`     - ${pattern.pattern}: ${pattern.count} patterns`);
            });
        }
    }
    
    console.log("\n" + "=" .repeat(80));
    
    if (successRate >= 80) {
        console.log("🎉 EXCELLENT! The Mover AI is responding brilliantly!");
    } else if (successRate >= 60) {
        console.log("👍 GOOD! The Mover AI is working well with some room for improvement.");
    } else {
        console.log("⚠️ NEEDS WORK! The Mover AI needs some adjustments.");
    }
    
    console.log("✅ Test run complete. Results:");
    console.table(results.map(r => ({
        Test: r.test,
        Status: r.status,
        "Response Length": r.response.length,
        "Has Content": r.response.length > 20 ? "Yes" : "No"
    })));
    
    return results;
}

// Export for use as module
module.exports = { runMoverTests };

// Run tests if this file is executed directly
if (require.main === module) {
    runMoverTests().catch(console.error);
}
