// core/TradeDecisionGateway.js
// Single source of truth for trade approval

class TradeDecisionGateway {
  constructor(options = {}) {
    this.mode = options.mode || process.env.TRADE_GATE_MODE || 'normal'; // normal|relaxed|off
    this.safetyNet = options.safetyNet || null;
    this.riskManager = options.riskManager || null;
  }

  setMode(mode) {
    this.mode = mode;
  }

  approveTrade(tradeRequest, marketData) {
    // off: always approve
    if (this.mode === 'off') {
      return { approved: true, code: 'OFF', reason: 'Gateway off', where: [] };
    }

    const reasons = [];

    // SafetyNet
    if (this.safetyNet && this.safetyNet.validateTrade) {
      const sn = this.safetyNet.validateTrade(tradeRequest, marketData);
      if (!sn.approved) {
        if (this.mode === 'relaxed') {
          reasons.push(`SafetyNet OVERRIDDEN: ${sn.reason}`);
        } else {
          return { approved: false, code: 'SAFETY', reason: sn.reason, where: ['safetyNet'] };
        }
      }
    }

    // RiskManager
    if (this.riskManager && this.riskManager.assessTradeRisk) {
      const rm = this.riskManager.assessTradeRisk({
        direction: tradeRequest.direction,
        entryPrice: tradeRequest.price,
        confidence: tradeRequest.confidence,
        marketData,
        patterns: tradeRequest.patterns || []
      });
      if (!rm.approved) {
        if (this.mode === 'relaxed') {
          reasons.push(`Risk OVERRIDDEN: ${rm.reason}`);
        } else {
          return { approved: false, code: 'RISK', reason: rm.reason, where: ['riskManager'] };
        }
      }
    }

    return { approved: true, code: 'OK', reason: reasons.join('; '), where: [] };
  }
}

module.exports = TradeDecisionGateway;

