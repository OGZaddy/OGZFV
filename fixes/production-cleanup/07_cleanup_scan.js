// Utility script to verify cleanup
// Run this to find any remaining issues

const { execSync } = require('child_process');

const checks = [
  {
    name: 'Random functions',
    pattern: 'Math\\.random',
    expectedCount: 0
  },
  {
    name: 'Paper/Sandbox modes',
    pattern: 'paperTrade|sandboxMode|simulateTrade',
    expectedCount: 0
  },
  {
    name: 'Aggressive flags',
    pattern: 'aggressiveMode.*true|forceFirstTrade.*true|randomTradeChance.*[^0]',
    expectedCount: 0
  },
  {
    name: 'Localhost references',
    pattern: 'localhost',
    expectedCount: 0
  },
  {
    name: 'Non-3010 ports',
    pattern: ':(3011|3012|8080)',
    expectedCount: 0
  }
];

console.log('🔍 Scanning for issues...\n');

checks.forEach(check => {
  try {
    const result = execSync(
      `rg "${check.pattern}" -c -g '!node_modules' -g '!*.md' | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    
    const count = parseInt(result) || 0;
    const status = count === check.expectedCount ? '✅' : '❌';
    
    console.log(`${status} ${check.name}: ${count} occurrences`);
    
    if (count > check.expectedCount) {
      const files = execSync(
        `rg "${check.pattern}" -l -g '!node_modules' -g '!*.md'`,
        { encoding: 'utf8' }
      ).trim();
      console.log(`   Found in: ${files.split('\n').join(', ')}`);
    }
  } catch (e) {
    console.log(`✅ ${check.name}: 0 occurrences`);
  }
});

console.log('\n🎯 Cleanup verification complete!');