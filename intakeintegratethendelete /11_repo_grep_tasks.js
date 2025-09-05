// CI-friendly checks for forbidden patterns in LIVE.
// Usage: node 11_repo_grep_tasks.js

const { execSync } = require('child_process');
const checks = [
  { name:'no RNG in live', cmd:`rg -n "Math\\.random|randomTradeChance|forceFirstTrade" -- . -g '!node_modules'` },
  { name:'no paper/sim in live', cmd:`rg -n "paperTrade|sandboxMode|simulateTrade" -- . -g '!node_modules'` },
];
let fail = false;
for (const c of checks) {
  try {
    const out = execSync(c.cmd, { stdio: 'pipe', encoding:'utf8' });
    if (out.trim()) { console.error('FORBIDDEN ('+c.name+'):\n'+out); fail = true; }
  } catch (e) { /* no matches -> OK */ }
}
process.exit(fail ? 1 : 0);
