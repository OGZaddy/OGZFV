// Target: ExecutionLayer.js
// Remove ALL paper trading and sandbox modes from production

// ADD this function at the top of the class:
validateProductionConfig(config) {
  if (process.env.NODE_ENV === 'production') {
    if (!config.apiKey) {
      throw new Error('PRODUCTION ERROR: No API key provided');
    }
    if (config.sandboxMode) {
      throw new Error('PRODUCTION ERROR: Sandbox mode not allowed');
    }
  }
}

// REPLACE the executeTrade method's beginning with:
async executeTrade(decision) {
  console.log('\n📊 EXECUTING TRADE DECISION:', decision);
  
  // Production guard
  this.validateProductionConfig(this.config);
  
  // NO PAPER TRADING IN PRODUCTION
  if (!this.config.apiKey) {
    throw new Error('Cannot execute trade without API credentials');
  }
  
  // Continue with real trade execution...
  // (keep the rest of your execution logic)
}

// DELETE the paperTrade() method entirely or wrap it:
paperTrade(decision) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Paper trading not allowed in production');
  }
  // Original paper trade code only for dev/test
}