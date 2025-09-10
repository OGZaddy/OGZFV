// FIX MODULE CONNECTIONS
const fs = require('fs');
const botFile = './run-trading-bot-v13-simplified.js';
let botCode = fs.readFileSync(botFile, 'utf8');

console.log('Connecting defensive modules to trading cycle...');

// Find performTradingCycle and add defensive checks
const cyclePattern = /async performTradingCycle\(\)[\s\S]*?{/;
const cycleMatch = botCode.match(cyclePattern);

if (cycleMatch && !botCode.includes('this.riskManager.assessTradeRisk')) {
  const insertPoint = cycleMatch.index + cycleMatch[0].length;
  
  const defensiveCode = `
    try {
      // Get market data
      const marketData = await this.getMarketData();
      if (!marketData) return;
      
      // Calculate indicators
      const analysis = await this.analyzeMarket(marketData);
      
      // Calculate REAL confidence
      const confidence = this.calculateRealConfidence ? 
        this.calculateRealConfidence(analysis) : 
        this.calculateTradingConfidence(analysis);
      
      // SAFETY CHECK FIRST
      if (this.safetyNet) {
        const safetyCheck = await this.safetyNet.checkMarketConditions({
          price: marketData.price,
          volume: marketData.volume,
          volatility: analysis.volatility || 0.02
        });
        
        if (!safetyCheck.approved) {
          console.log(\`🚫 SafetyNet blocked: \${safetyCheck.reason}\`);
          return;
        }
      }
      
      // RISK CHECK SECOND
      if (this.riskManager && confidence >= this.config.minTradeConfidence) {
        const riskCheck = this.riskManager.assessTradeRisk({
          confidence,
          marketConditions: analysis
        });
        
        if (!riskCheck.approved) {
          console.log(\`🚫 RiskManager blocked: \${riskCheck.reason}\`);
          return;
        }
        
        // If both checks pass, execute trade
        await this.executeTrade({
          ...analysis,
          confidence,
          approved: true
        });
      }
    } catch (error) {
      console.error('Trading cycle error:', error);
    }
  `;
  
  // Replace the method content
  const methodEnd = botCode.indexOf('}', insertPoint);
  botCode = botCode.substring(0, insertPoint) + defensiveCode + '}' + botCode.substring(methodEnd + 1);
  
  fs.writeFileSync(botFile, botCode);
  console.log('✅ Connected defensive modules to trading cycle!');
} else if (botCode.includes('this.riskManager.assessTradeRisk')) {
  console.log('✅ Defensive modules already connected!');
} else {
  console.log('❌ Could not find performTradingCycle method');
}
