/**
 * Test 3: Volatility spike invalidation in EnhancedTimeframeManager
 * Feeds candles, builds cache via getCandles(), then spikes volatility to trigger invalidation.
 * Adjust require path if needed.
 */

const path = require('path');
const TimeframeManager = require(path.resolve(__dirname, '../../EnhancedTimeframeManager.js'));

function makeCandle(ts, price){
  return { timestamp: ts, open: price*0.999, high: price*1.002, low: price*0.998, close: price, volume: 1000 };
}

function feedCandles(tfm, n=30, start=40000, drift=0.0005){
  let t = Date.now() - n*60000;
  let p = start;
  for (let i=0; i<n; i++){
    p = p * (1+drift) * (1 + (Math.random()-0.5)*0.001);
    const c = makeCandle(t, p);
    tfm.processCandle(c, '1m');
    t += 60000;
  }
}

(function(){
  const tfm = new TimeframeManager('1m', { cacheTTL: 5000, volatilityCacheInvalidation: true, maxVolatilityThreshold: 0.02 });

  // Seed candles and build cache
  feedCandles(tfm, 30);
  const before = tfm.candleCache.size;
  const got = tfm.getCandles('1m', 20); // populates cache
  const after = tfm.candleCache.size;

  console.log('Cache size before/after getCandles():', before, after);

  // Now create a synthetic volatility spike > threshold
  let t = Date.now();
  let p = got[got.length-1]?.close || 41000;
  for (let i=0; i<10; i++){
    // 3% jump each minute to exceed 2% threshold
    p = p * 1.03;
    tfm.processCandle(makeCandle(t += 60000, p), '1m');
  }

  // Manually run the invalidation check (the class also runs it on an interval)
  tfm.checkVolatilityAndInvalidateCache();

  console.log('Invalidations:', tfm.metrics.cacheInvalidations, 'Cache size now:', tfm.candleCache.size);
  if (tfm.metrics.cacheInvalidations >= 1) {
    console.log('✅ PASS: Volatility spike triggered cache invalidation.');
    process.exit(0);
  } else {
    console.error('❌ FAIL: No cache invalidation detected. Check your thresholds/config.');
    process.exit(1);
  }
})();