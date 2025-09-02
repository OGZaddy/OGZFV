/**
 * Test Harness Runner
 * Runs all production validation tests in sequence
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  { name: 'Production Match Test', file: 'prod-match-test.js' },
  { name: 'Scalper Cache Test', file: 'scalper-cache-test.js' },
  { name: 'Volatility Spike Test', file: 'volatility-spike-test.js' }
];

let passed = 0;
let failed = 0;

async function runTest(testFile, testName) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running ${testName}...`);
    console.log('='.repeat(50));
    
    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        passed++;
        console.log(`✅ ${testName} PASSED`);
      } else {
        failed++;
        console.log(`❌ ${testName} FAILED`);
      }
      resolve(code);
    });
    
    child.on('error', (err) => {
      failed++;
      console.error(`💥 ${testName} ERROR:`, err.message);
      resolve(1);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting OGZFV Test Harness Suite');
  console.log('=' .repeat(60));
  
  for (const test of tests) {
    await runTest(test.file, test.name);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is production-ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review output above.');
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('💥 Test runner error:', err);
  process.exit(1);
});