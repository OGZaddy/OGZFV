/**
 * Test 1: Production-match confirmation
 * Compares UnifiedTradingCore decisions in BACKTEST vs PAPER on identical data.
 * Adjust require paths to match your repo if needed.
 */

const path = require('path');

// ---- Adjust these requires to your structure if different ----
const UnifiedTradingCore = require(path.resolve(__dirname, '../../core/UnifiedTradingCore.js'));

// Build a tiny synthetic dataset of candles with a subtle trend
function makeCandles(n=120, start=50000, drift=0.0008, vol=0.002) {
  const candles = [];
  let price = start;
  for (let i=0; i<n; i++) {
    const noise = (Math.random()-0.5) * 2 * vol * price;
    const open = price;
    price = price * (1 + drift) + noise;
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random()*0.0015);
    const low  = Math.min(open, close) * (1 - Math.random()*0.0015);
    const volume = 1000 + Math.random()*500;
    candles.push({ timestamp: Date.now()+i*60000, open, high, low, close, volume });
  }
  return candles;
}

function core(profileName, mode){
  return new UnifiedTradingCore({
    name: profileName,
    mode,
    tier: 'test',
    tiers: ['tier1','tier2','tier3'], // enables a wide set of modules if present
    config: { },
    weights: { } // default weights
  });
}

async function runOnce(mode, candles){
  const engine = core('prod_match_profile', mode);
  // Feed last candle as "data point"
  const last = candles[candles.length-1];
  const dataPoint = { price: last.close, volatility: 0.01, timestamp: last.timestamp };
  // UnifiedTradingCore expects generateSignals/makeDecision via processMarketData
  const result = await engine.processMarketData({ price: last.close, volatility: 0.01, timestamp: last.timestamp });
  return result.decision || result;
}

(async () => {
  const candles = makeCandles(200);
  const backtest = await runOnce('BACKTEST', candles);
  const paper    = await runOnce('PAPER', candles);

  const sameAction = backtest.action === paper.action;
  const diff = Math.abs((backtest.confidence||0) - (paper.confidence||0));

  console.log('BACKTEST decision:', backtest);
  console.log('PAPER    decision:', paper);
  console.log('Action equal:', sameAction, '| Confidence delta:', diff.toFixed(4));

  const PASS_ACTION = sameAction;
  const PASS_CONF   = diff <= 0.05; // ≤5% tolerance
  if (PASS_ACTION && PASS_CONF) {
    console.log('✅ PASS: Backtest and Paper use the same logic within tolerance.');
    process.exit(0);
  } else {
    console.error('❌ FAIL: Decisions diverged beyond tolerance.');
    process.exit(1);
  }
})();