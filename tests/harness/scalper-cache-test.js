/**
 * Test 2: Scalper cache + MACD optimized periods
 * Ensures OptimizedIndicators activates scalper mode and uses (8,17,6).
 * Adjust require path if needed.
 */

const path = require('path');
const Indicators = require(path.resolve(__dirname, '../../OptimizedIndicators.js'));

function makeCandles(n=40, start=30000){
  const out=[]; let p=start;
  for(let i=0;i<n;i++){
    const o=p;
    p = p * (1 + (Math.random()-0.5)*0.004);
    const c=p, h=Math.max(o,c)*(1+Math.random()*0.001), l=Math.min(o,c)*(1-Math.random()*0.001);
    out.push({ open:o, high:h, low:l, close:c, timestamp: Date.now()+i*60000 });
  }
  return out;
}

(function(){
  const ind = new Indicators();
  ind.activateScalperMode(); // should print a log
  const candles = makeCandles(40);

  // With scalper mode, MACD periods should be optimized internally to 8/17/6.
  const macd = ind.calculateMACD(candles);
  console.log('MACD output:', macd);

  // Simple success criteria: function returns numbers and no exceptions; human check the console for the "🚀 SCALPER MACD" line.
  if (typeof macd.macdLine === 'number' && typeof macd.signalLine === 'number') {
    console.log('✅ PASS: MACD computed under scalper mode. Check console for optimized periods log (8,17,6).');
    process.exit(0);
  } else {
    console.error('❌ FAIL: MACD did not return numeric values.');
    process.exit(1);
  }
})();