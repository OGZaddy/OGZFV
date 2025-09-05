// Target: UnifiedTradingCore.js
// In hardmode, enforce LIVE mode only.

function assertLiveMode(mode) {
  const hard = process.env.OGZ_PROD_HARDMODE === '1';
  if (hard && mode !== 'LIVE') throw new Error('Hardmode: Production requires mode=LIVE.');
}
module.exports = { assertLiveMode };
