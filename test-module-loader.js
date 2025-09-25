// Test ModuleAutoLoader before refactoring main bot
const loader = require('./core/ModuleAutoLoader');

console.log('🧪 Testing ModuleAutoLoader...\n');

try {
  // Test loading core modules
  console.log('📦 Loading core modules...');
  const coreModules = loader.loadDirectory('core', {
    required: [
      'RiskManager',
      'TradingSafetyNet',
      'MultiDirectionalTrader',
      'PerformanceAnalyzer'
    ]
  });

  console.log('\n✅ Successfully loaded modules:');
  console.log('- Total modules:', Object.keys(coreModules).length);
  console.log('- Available:', Object.keys(coreModules).slice(0, 10).join(', '), '...');

  // Test module access
  if (coreModules.RiskManager) {
    console.log('\n✅ RiskManager loaded successfully');
    console.log('- Type:', typeof coreModules.RiskManager);
  }

  if (coreModules.TradingSafetyNet) {
    console.log('\n✅ TradingSafetyNet loaded successfully');
    console.log('- Type:', typeof coreModules.TradingSafetyNet);
  }

  console.log('\n🎉 ModuleAutoLoader test PASSED!');
  console.log('Safe to proceed with refactoring.');

} catch (error) {
  console.error('\n❌ ModuleAutoLoader test FAILED!');
  console.error('Error:', error.message);
  console.error('\n⚠️  DO NOT proceed with refactoring!');
  process.exit(1);
}