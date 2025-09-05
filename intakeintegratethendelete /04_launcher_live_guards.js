// Target: main launcher (run-trading-bot-*.js)
// Ensure Polygon-only, aggressive off, requires WS + Polygon key.

function preflightOrDie(polygonWS) {
  if (!process.env.POLYGON_API_KEY) throw new Error('POLYGON_API_KEY missing.');
  if (!polygonWS || !polygonWS.isConnected?.()) throw new Error('Polygon WS not connected.');
}
// Integrator: set aggressiveMode=false; forceFirstTrade=false; randomTradeChance=0 before start().
