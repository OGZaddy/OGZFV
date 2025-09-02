// Target: run-trading-bot-v13-quantum.js
// Force all aggressive/random flags to false

// ADD this before any initialization:
enforceProductionSettings() {
  this.config.aggressiveMode = false;
  this.config.forceFirstTrade = false;
  this.config.randomTradeChance = 0;
  this.config.minConfidenceThreshold = 0.3; // Reasonable minimum
  
  console.log('🔒 PRODUCTION SETTINGS ENFORCED:');
  console.log('   Aggressive Mode: DISABLED');
  console.log('   Force First Trade: DISABLED');
  console.log('   Random Trade Chance: 0%');
}

// CALL it in constructor or before start():
this.enforceProductionSettings();

// ADD Polygon validation before starting:
validatePolygonConnection() {
  if (!process.env.POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY missing - cannot start');
  }
  if (!this.polygonWS || !this.polygonWS.isConnected()) {
    throw new Error('Polygon WebSocket not connected - cannot start');
  }
  console.log('✅ Polygon connection validated');
}

// CALL before main loop:
this.validatePolygonConnection();