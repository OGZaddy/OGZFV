// TestTradingVerification.js - RUN THIS FIRST!
async function verifyTrading() {
  console.log('🔍 VERIFYING QUANTUM BEAST IS TRADING...\n');
  
  // Check if quantum core exists
  if (this.quantumCore) {
    console.log('✅ Quantum Core: FOUND');
    
    // Test each fix
    console.log('\nTesting Fixes:');
    
    // Test Fix #1: VQC Circuit
    const testFeatures = [0.5, 0.5, 0.5, 0.5];
    const vqc = await this.quantumCore.prepareVariationalQuantumCircuit(testFeatures);
    console.log(`✅ VQC Circuit: ${vqc.parameters ? 'WORKING' : 'FAILED'}`);
    
    // Test Fix #2: Failsafes
    const failsafe = this.quantumCore.quantumFailsafeSignal();
    console.log(`✅ Failsafe Action: ${failsafe.action} (${failsafe.action !== 'HOLD' ? 'FIXED' : 'BROKEN'})`);
    
    // Test Fix #3: Consensus
    const consensus = await this.quantumCore.quintupleVerifyPosition(1000, {});
    console.log(`✅ Consensus: ${(consensus.agreement * 100).toFixed(1)}% (${consensus.agreement > 0.3 ? 'FIXED' : 'BROKEN'})`);
    
    // Test Fix #4: Position Size
    const position = this.quantumCore.calculateUltraSafePosition(1000);
    console.log(`✅ Position Size: ${position} (${position > 100 ? 'FIXED' : 'BROKEN'})`);
    
    console.log('\n🎯 TRADING STATUS:');
    
    // Check config values
    if (this.config) {
      console.log(`   • Min Confidence: ${(this.config.minConfidenceThreshold || 0.01) * 100}%`);
      console.log(`   • Max Position: ${(this.config.maxPositionSize || 0.5) * 100}%`);
      console.log(`   • Aggressive Mode: ${this.config.aggressiveMode ? 'ON' : 'OFF'}`);
      console.log(`   • Safety Validation: ${this.config.enableSafetyValidation ? 'ON' : 'OFF'}`);
    }
    
    // Check global flags
    console.log('\n🌟 BEAST MODE FLAGS:');
    console.log(`   • QUANTUM_BEAST_UNLEASHED: ${global.QUANTUM_BEAST_UNLEASHED ? '✅' : '❌'}`);
    console.log(`   • BYPASS_ALL_SAFETY: ${global.BYPASS_ALL_SAFETY ? '✅' : '❌'}`);
    console.log(`   • MAXIMUM_AGGRESSION: ${global.MAXIMUM_AGGRESSION ? '✅' : '❌'}`);
    console.log(`   • IHOP_MODE: ${global.IHOP_MODE ? '✅ 🥞' : '❌'}`);
    
    // Final verdict
    const allFixed = 
      vqc.parameters && 
      failsafe.action !== 'HOLD' && 
      consensus.agreement > 0.3 && 
      position > 100;
    
    if (allFixed) {
      console.log('\n🔥🔥🔥 ALL SYSTEMS GO! THE BEAST IS READY TO TRADE! 🔥🔥🔥');
      console.log('💰 PREPARE FOR MAXIMUM PROFITS!');
      console.log('🥞 GO TO IHOP AND WATCH IT PRINT!');
    } else {
      console.log('\n⚠️ SOME FIXES NOT WORKING - CHECK ABOVE!');
    }
    
  } else {
    console.log('❌ Quantum Core NOT FOUND!');
    console.log('Make sure quantumCore is initialized first!');
  }
}

// Standalone test function
async function runStandaloneTest() {
  console.log('🧪 RUNNING STANDALONE VERIFICATION...\n');
  
  try {
    // Try to get the running instance
    const QuantumNeuromorphicCore = require('./core/QuantumNeuromorphicCore');
    const testCore = new QuantumNeuromorphicCore({
      aggressiveMode: true,
      consensusThreshold: 0.3
    });
    
    // Run verification on test instance
    await verifyTrading.call({ quantumCore: testCore, config: testCore.config });
    
  } catch (error) {
    console.log('❌ Error running standalone test:', error.message);
    console.log('Run this from within your main bot instead!');
  }
}

// Export for use in main bot
module.exports = { verifyTrading, runStandaloneTest };

// If run directly
if (require.main === module) {
  runStandaloneTest();
}