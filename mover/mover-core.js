// ==========================================
// THE MOVER - COMPLETE DEPLOYMENT PACKAGE
// ==========================================
// Deploy these files to /mover directory

// ==========================================
// FILE: mover-core.js
// The AI brain - processes trades, makes decisions, generates responses
// ==========================================
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class MoverCore extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      personality: config.personality || 'professional_trader',
      verbosity: config.verbosity || 'balanced',
      responseDelay: config.responseDelay || 100,
      ...config
    };
    
    this.state = {
      isActive: true,
      currentMarketRegime: 'neutral',
      lastTradeAnalysis: null,
      sessionStats: {
        tradesNarrated: 0,
        profitLoss: 0,
        winRate: 0,
        startTime: Date.now()
      }
    };

    this.responseTemplates = {
      trade_executed: [
        "Execute confirmed: {action} {amount} {asset} at ${price}. {reasoning}",
        "Position taken: Going {direction} on {asset}. Target: ${target}, Stop: ${stop}.",
        "Trade deployed: {action} signal triggered. Confidence: {confidence}%. Let's ride."
      ],
      market_analysis: [
        "Market regime detected: {regime}. Adjusting strategies accordingly.",
        "Pattern recognition: {pattern} forming on {timeframe}. Probability: {probability}%.",
        "Volatility spike detected. Tightening risk parameters."
      ],
      profit_alert: [
        "Target hit! +${profit} secured. {percentage}% gain on this position.",
        "Winner! Banking ${profit}. That's {streak} in a row. System performing optimally.",
        "Profit secured: ${profit}. Houston fund progress: {progress}%."
      ],
      loss_management: [
        "Stop triggered. -${loss} managed. Risk control working as designed.",
        "Position closed at loss: -${loss}. Part of the strategy. Next setup loading...",
        "Loss contained at -${loss}. Win rate still {winRate}%. Trust the process."
      ]
    };

    this.doctrineRules = [];
    this.contextMemory = [];
    
    console.log(`[MoverCore] Initialized with personality: ${this.config.personality}`);
  }

  async processTradeEvent(tradeData) {
    try {
      this.state.sessionStats.tradesNarrated++;
      
      // Analyze trade context
      const analysis = this.analyzeTradeContext(tradeData);
      
      // Generate appropriate response
      const response = await this.generateResponse(tradeData, analysis);
      
      // Update state
      this.updateState(tradeData, analysis);
      
      // Emit narration event
      this.emit('narration', {
        type: 'trade',
        data: tradeData,
        analysis,
        response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('[MoverCore] Trade processing error:', error);
      return this.generateErrorResponse(error);
    }
  }

  analyzeTradeContext(tradeData) {
    const analysis = {
      tradeType: tradeData.action || 'UNKNOWN',
      asset: tradeData.asset || 'BTC-USD',
      amount: tradeData.amount || 0,
      price: tradeData.price || 0,
      confidence: tradeData.confidence || 0,
      reasoning: this.extractReasoning(tradeData),
      marketContext: this.state.currentMarketRegime,
      riskLevel: this.calculateRiskLevel(tradeData),
      projectedOutcome: this.projectOutcome(tradeData)
    };

    // Apply doctrine rules
    this.doctrineRules.forEach(rule => {
      if (rule.condition(analysis)) {
        analysis.doctrineFlags = analysis.doctrineFlags || [];
        analysis.doctrineFlags.push(rule.name);
      }
    });

    return analysis;
  }

  extractReasoning(tradeData) {
    if (tradeData.reasoning) return tradeData.reasoning;
    
    const signals = tradeData.signals || [];
    const patterns = tradeData.patterns || [];
    
    let reasoning = "";
    if (patterns.length > 0) {
      reasoning += `Pattern detected: ${patterns[0].name} (${patterns[0].confidence}%). `;
    }
    if (signals.length > 0) {
      reasoning += `Signals: ${signals.map(s => s.name).join(', ')}.`;
    }
    
    return reasoning || "Technical conditions met.";
  }

  calculateRiskLevel(tradeData) {
    const positionSize = tradeData.amount * tradeData.price;
    const accountBalance = this.config.accountBalance || 10000;
    const riskPercent = (positionSize / accountBalance) * 100;
    
    if (riskPercent > 5) return 'HIGH';
    if (riskPercent > 2) return 'MODERATE';
    return 'LOW';
  }

  projectOutcome(tradeData) {
    const winProbability = tradeData.confidence / 100;
    const riskReward = tradeData.riskReward || 2;
    const expectedValue = (winProbability * riskReward) - (1 - winProbability);
    
    return {
      expectedValue,
      winProbability,
      recommendation: expectedValue > 0.2 ? 'FAVORABLE' : 'CAUTIOUS'
    };
  }

  async generateResponse(tradeData, analysis) {
    const templateKey = this.getTemplateKey(tradeData, analysis);
    const templates = this.responseTemplates[templateKey] || this.responseTemplates.trade_executed;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Fill in template variables
    let response = template;
    const variables = {
      action: tradeData.action,
      amount: tradeData.amount,
      asset: tradeData.asset,
      price: tradeData.price.toFixed(2),
      direction: tradeData.action === 'BUY' ? 'long' : 'short',
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      regime: this.state.currentMarketRegime,
      pattern: tradeData.patterns?.[0]?.name || 'No pattern',
      winRate: (this.state.sessionStats.winRate * 100).toFixed(1),
      progress: this.calculateHoustonProgress()
    };
    
    Object.keys(variables).forEach(key => {
      response = response.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
    });
    
    // Add personality flair
    response = this.addPersonalityFlair(response);
    
    // Simulate processing delay for realism
    await new Promise(resolve => setTimeout(resolve, this.config.responseDelay));
    
    return response;
  }

  getTemplateKey(tradeData, analysis) {
    if (tradeData.profitLoss && tradeData.profitLoss > 0) return 'profit_alert';
    if (tradeData.profitLoss && tradeData.profitLoss < 0) return 'loss_management';
    if (tradeData.type === 'analysis') return 'market_analysis';
    return 'trade_executed';
  }

  addPersonalityFlair(response) {
    if (this.config.personality === 'aggressive_trader') {
      response += " 🚀 LFG!";
    } else if (this.config.personality === 'zen_master') {
      response += " 🧘 Patience and discipline.";
    } else if (this.config.personality === 'houston_focused') {
      response += " 🎯 Every trade brings Houston closer.";
    }
    return response;
  }

  calculateHoustonProgress() {
    const target = this.config.houstonTarget || 25000;
    const current = this.config.accountBalance || 10000;
    return ((current / target) * 100).toFixed(1);
  }

  updateState(tradeData, analysis) {
    this.state.lastTradeAnalysis = analysis;
    
    if (tradeData.profitLoss) {
      this.state.sessionStats.profitLoss += tradeData.profitLoss;
      
      if (tradeData.profitLoss > 0) {
        this.state.sessionStats.wins = (this.state.sessionStats.wins || 0) + 1;
      } else {
        this.state.sessionStats.losses = (this.state.sessionStats.losses || 0) + 1;
      }
      
      const totalTrades = (this.state.sessionStats.wins || 0) + (this.state.sessionStats.losses || 0);
      this.state.sessionStats.winRate = totalTrades > 0 ? 
        (this.state.sessionStats.wins || 0) / totalTrades : 0;
    }
    
    // Update market regime if provided
    if (tradeData.marketRegime) {
      this.state.currentMarketRegime = tradeData.marketRegime;
    }
    
    // Add to context memory
    this.contextMemory.push({
      timestamp: Date.now(),
      trade: tradeData,
      analysis,
      response: this.state.lastResponse
    });
    
    // Keep only last 100 events in memory
    if (this.contextMemory.length > 100) {
      this.contextMemory = this.contextMemory.slice(-100);
    }
  }

  generateErrorResponse(error) {
    return `System notice: ${error.message}. Monitoring continues...`;
  }

  async loadDoctrine(doctrinePath) {
    try {
      const doctrineContent = await fs.readFile(doctrinePath, 'utf8');
      const doctrine = JSON.parse(doctrineContent);
      
      this.doctrineRules = doctrine.rules || [];
      this.config = { ...this.config, ...doctrine.config };
      
      console.log(`[MoverCore] Loaded ${this.doctrineRules.length} doctrine rules`);
      this.emit('doctrine_loaded', { rules: this.doctrineRules.length });
    } catch (error) {
      console.error('[MoverCore] Failed to load doctrine:', error);
    }
  }

  getSessionReport() {
    const runtime = Date.now() - this.state.sessionStats.startTime;
    const hours = (runtime / (1000 * 60 * 60)).toFixed(1);
    
    return {
      runtime: `${hours} hours`,
      tradesNarrated: this.state.sessionStats.tradesNarrated,
      profitLoss: this.state.sessionStats.profitLoss.toFixed(2),
      winRate: (this.state.sessionStats.winRate * 100).toFixed(1) + '%',
      currentRegime: this.state.currentMarketRegime,
      houstonProgress: this.calculateHoustonProgress() + '%'
    };
  }
}

module.exports = MoverCore;