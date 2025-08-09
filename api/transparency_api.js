/**
 * ============================================================================
 * OGZ Prime Transparency API - Complete Bot Intelligence Exposure
 * ============================================================================
 * 
 * This API captures and serves every aspect of the bot's decision-making process:
 * - Real-time analysis data and confidence levels
 * - Pattern recognition and memory system insights
 * - Risk management calculations and adjustments
 * - Performance analytics and edge decay detection
 * - Neural network-style decision mapping
 * 
 * Built for: Full transparency and trust in AI trading decisions
 * Author: OGZ Prime Technologies
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

class TransparencyAPI {
  constructor(ogzPrimeInstance = null) {
    this.app = express();
    this.ogzPrime = ogzPrimeInstance;
    this.port = 3008; // Dedicated transparency API port
    
    // Real-time data storage
    this.realtimeData = {
      currentAnalysis: null,
      lastDecision: null,
      patternMemory: {},
      riskStatus: {},
      performanceMetrics: {},
      decisionHistory: [],
      confidenceBreakdown: {},
      neuralMapping: {},
      marketContext: {}
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.startDataCapture();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📊 Transparency API: ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // ========================================================================
    // REAL-TIME ANALYSIS ENDPOINTS
    // ========================================================================
    
    // Get current bot analysis state
    this.app.get('/api/current-analysis', (req, res) => {
      res.json({
        success: true,
        timestamp: Date.now(),
        analysis: this.realtimeData.currentAnalysis,
        confidence: this.realtimeData.confidenceBreakdown,
        decision: this.realtimeData.lastDecision
      });
    });
    
    // Get detailed decision breakdown
    this.app.get('/api/decision-breakdown', (req, res) => {
      res.json({
        success: true,
        timestamp: Date.now(),
        neuralMapping: this.realtimeData.neuralMapping,
        patternAnalysis: this.extractPatternAnalysis(),
        riskCalculations: this.extractRiskCalculations(),
        confidenceFactors: this.extractConfidenceFactors()
      });
    });
    
    // ========================================================================
    // PATTERN RECOGNITION TRANSPARENCY
    // ========================================================================
    
    // Get pattern memory insights
    this.app.get('/api/pattern-memory', (req, res) => {
      const patternStats = this.extractPatternMemoryStats();
      res.json({
        success: true,
        timestamp: Date.now(),
        totalPatterns: patternStats.totalPatterns,
        recentMatches: patternStats.recentMatches,
        topPerformingPatterns: patternStats.topPerforming,
        patternEvolution: patternStats.evolution,
        similarityScores: patternStats.similarities
      });
    });
    
    // Get specific pattern details
    this.app.get('/api/pattern/:patternId', (req, res) => {
      const patternId = req.params.patternId;
      const patternDetails = this.getPatternDetails(patternId);
      res.json({
        success: true,
        pattern: patternDetails
      });
    });
    
    // ========================================================================
    // RISK MANAGEMENT TRANSPARENCY
    // ========================================================================
    
    // Get risk management calculations
    this.app.get('/api/risk-analysis', (req, res) => {
      const riskData = this.extractRiskAnalysis();
      res.json({
        success: true,
        timestamp: Date.now(),
        currentRisk: riskData.current,
        calculations: riskData.calculations,
        adjustments: riskData.adjustments,
        limits: riskData.limits,
        recoveryMode: riskData.recoveryMode
      });
    });
    
    // ========================================================================
    // PERFORMANCE ANALYTICS TRANSPARENCY
    // ========================================================================
    
    // Get performance analysis
    this.app.get('/api/performance-analysis', (req, res) => {
      const perfData = this.extractPerformanceAnalysis();
      res.json({
        success: true,
        timestamp: Date.now(),
        edgeDecay: perfData.edgeDecay,
        qualityScores: perfData.qualityScores,
        recommendations: perfData.recommendations,
        tradeAnalysis: perfData.tradeAnalysis
      });
    });
    
    // ========================================================================
    // NEURAL DECISION MAPPING
    // ========================================================================
    
    // Get neural-style decision mapping
    this.app.get('/api/neural-mapping', (req, res) => {
      res.json({
        success: true,
        timestamp: Date.now(),
        decisionTree: this.realtimeData.neuralMapping,
        weightings: this.extractDecisionWeightings(),
        activations: this.extractNeuralActivations(),
        pathways: this.extractDecisionPathways()
      });
    });
    
    // ========================================================================
    // HISTORICAL ANALYSIS
    // ========================================================================
    
    // Get decision history
    this.app.get('/api/decision-history', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json({
        success: true,
        decisions: this.realtimeData.decisionHistory.slice(-limit),
        patterns: this.analyzeDecisionPatterns(),
        trends: this.analyzeDecisionTrends()
      });
    });
    
    // ========================================================================
    // MARKET CONTEXT TRANSPARENCY
    // ========================================================================
    
    // Get market context analysis
    this.app.get('/api/market-context', (req, res) => {
      res.json({
        success: true,
        timestamp: Date.now(),
        context: this.realtimeData.marketContext,
        indicators: this.extractIndicatorAnalysis(),
        sentiment: this.extractSentimentAnalysis(),
        volatility: this.extractVolatilityAnalysis()
      });
    });
    
    // ========================================================================
    // COMPREHENSIVE TRANSPARENCY REPORT
    // ========================================================================
    
    // Get complete transparency report
    this.app.get('/api/full-transparency', (req, res) => {
      res.json({
        success: true,
        timestamp: Date.now(),
        botStatus: this.getBotStatus(),
        currentAnalysis: this.realtimeData.currentAnalysis,
        decisionBreakdown: this.realtimeData.neuralMapping,
        patternMemory: this.extractPatternMemoryStats(),
        riskManagement: this.extractRiskAnalysis(),
        performance: this.extractPerformanceAnalysis(),
        marketContext: this.realtimeData.marketContext,
        confidence: this.realtimeData.confidenceBreakdown,
        recentDecisions: this.realtimeData.decisionHistory.slice(-10)
      });
    });
    
    // ========================================================================
    // WEBSOCKET ENDPOINT FOR REAL-TIME UPDATES
    // ========================================================================
    
    // WebSocket status
    this.app.get('/api/websocket-status', (req, res) => {
      res.json({
        success: true,
        websocketPort: 3010, // Unified WebSocket port
        endpoints: [
          'real-time-analysis',
          'decision-updates',
          'pattern-matches',
          'risk-alerts',
          'performance-updates'
        ]
      });
    });
  }
  
  // ========================================================================
  // DATA CAPTURE METHODS
  // ========================================================================
  
  startDataCapture() {
    // Capture data every second for real-time transparency
    setInterval(() => {
      this.captureCurrentState();
    }, 1000);
    
    console.log('📊 Transparency data capture started');
  }
  
  captureCurrentState() {
    if (!this.ogzPrime) return;
    
    try {
      // Capture current analysis
      if (this.ogzPrime.lastAnalysis) {
        this.realtimeData.currentAnalysis = {
          ...this.ogzPrime.lastAnalysis.result,
          timestamp: Date.now(),
          candles: this.ogzPrime.lastAnalysis.result?.candles?.slice(-10) || []
        };
        
        // Build neural mapping
        this.buildNeuralMapping(this.ogzPrime.lastAnalysis.result);
      }
      
      // Capture risk status
      if (this.ogzPrime.riskManager) {
        this.realtimeData.riskStatus = this.ogzPrime.riskManager.getRiskSummary();
      }
      
      // Capture performance metrics
      if (this.ogzPrime.performanceAnalyzer) {
        this.realtimeData.performanceMetrics = this.ogzPrime.performanceAnalyzer.getPerformanceSummary();
      }
      
      // Capture pattern memory stats
      if (this.ogzPrime.patternChecker) {
        this.realtimeData.patternMemory = this.ogzPrime.patternChecker.getMemoryStats();
      }
      
      // Capture market context
      this.captureMarketContext();
      
    } catch (error) {
      console.error('❌ Error capturing transparency data:', error.message);
    }
  }
  
  buildNeuralMapping(analysis) {
    if (!analysis) return;
    
    // Create neural-style decision mapping
    this.realtimeData.neuralMapping = {
      inputLayer: {
        price: analysis.price,
        rsi: analysis.rsi,
        macd: analysis.macd,
        signal: analysis.signal,
        trend: analysis.trend,
        volatility: analysis.volatility
      },
      hiddenLayers: {
        technicalAnalysis: {
          rsiSignal: this.interpretRSI(analysis.rsi),
          macdSignal: this.interpretMACD(analysis.macd, analysis.signal),
          trendSignal: this.interpretTrend(analysis.trend),
          weight: 0.4
        },
        patternRecognition: {
          confidence: analysis.patternEvaluation?.confidence || 0,
          direction: analysis.patternEvaluation?.direction || 'hold',
          exactMatch: analysis.patternEvaluation?.exactMatch || false,
          weight: 0.3
        },
        riskAssessment: {
          currentDrawdown: this.realtimeData.riskStatus?.risk?.currentDrawdown || 0,
          recoveryMode: this.realtimeData.riskStatus?.risk?.recoveryMode || false,
          tradingAllowed: this.realtimeData.riskStatus?.trading?.allowed || true,
          weight: 0.3
        }
      },
      outputLayer: {
        decision: analysis.decision,
        confidence: analysis.confidence,
        reason: analysis.reason,
        finalScore: this.calculateFinalScore(analysis)
      },
      activationPath: this.traceActivationPath(analysis)
    };
    
    // Store confidence breakdown
    this.realtimeData.confidenceBreakdown = this.buildConfidenceBreakdown(analysis);
  }
  
  captureMarketContext() {
    const candles = this.ogzPrime?.timeframeData?.['1m']?.candles || [];
    if (candles.length === 0) return;
    
    const latestCandle = candles[candles.length - 1];
    const previousCandle = candles.length > 1 ? candles[candles.length - 2] : latestCandle;
    
    this.realtimeData.marketContext = {
      currentPrice: latestCandle.close,
      priceChange: latestCandle.close - previousCandle.close,
      priceChangePercent: ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100,
      volume: latestCandle.volume,
      candlePattern: this.analyzeCandlePattern(latestCandle, previousCandle),
      marketPhase: this.determineMarketPhase(candles.slice(-20)),
      volatilityLevel: this.calculateVolatilityLevel(candles.slice(-20))
    };
  }
  
  // ========================================================================
  // ANALYSIS EXTRACTION METHODS
  // ========================================================================
  
  extractPatternAnalysis() {
    const analysis = this.realtimeData.currentAnalysis;
    if (!analysis || !analysis.patternEvaluation) return null;
    
    return {
      currentPattern: {
        confidence: analysis.patternEvaluation.confidence,
        direction: analysis.patternEvaluation.direction,
        exactMatch: analysis.patternEvaluation.exactMatch,
        reason: analysis.patternEvaluation.reason,
        timesSeen: analysis.patternEvaluation.timesSeen || 0
      },
      memoryStats: this.realtimeData.patternMemory,
      similarPatterns: analysis.patternEvaluation.similarPatterns || 0,
      patternStrength: this.calculatePatternStrength(analysis.patternEvaluation)
    };
  }
  
  extractRiskCalculations() {
    const riskStatus = this.realtimeData.riskStatus;
    if (!riskStatus) return null;
    
    return {
      currentRisk: riskStatus.risk,
      tradingStatus: riskStatus.trading,
      accountStatus: riskStatus.account,
      periods: riskStatus.periods,
      calculations: {
        drawdownCalculation: this.explainDrawdownCalculation(riskStatus),
        positionSizing: this.explainPositionSizing(riskStatus),
        riskAdjustments: this.explainRiskAdjustments(riskStatus)
      }
    };
  }
  
  extractConfidenceFactors() {
    const analysis = this.realtimeData.currentAnalysis;
    if (!analysis) return null;
    
    return {
      technicalFactors: {
        rsi: {
          value: analysis.rsi,
          signal: this.interpretRSI(analysis.rsi),
          weight: 0.25,
          contribution: this.calculateRSIContribution(analysis.rsi)
        },
        macd: {
          value: analysis.macd,
          signal: analysis.signal,
          crossover: analysis.macd > analysis.signal,
          weight: 0.25,
          contribution: this.calculateMACDContribution(analysis.macd, analysis.signal)
        },
        trend: {
          direction: analysis.trend,
          strength: this.calculateTrendStrength(analysis.trend),
          weight: 0.20,
          contribution: this.calculateTrendContribution(analysis.trend)
        }
      },
      patternFactors: {
        confidence: analysis.patternEvaluation?.confidence || 0,
        exactMatch: analysis.patternEvaluation?.exactMatch || false,
        historicalAccuracy: this.calculateHistoricalAccuracy(analysis.patternEvaluation),
        weight: 0.30
      },
      finalConfidence: analysis.confidence,
      confidenceCategory: this.categorizeConfidence(analysis.confidence)
    };
  }
  
  extractPatternMemoryStats() {
    const memoryStats = this.realtimeData.patternMemory;
    if (!memoryStats) return { totalPatterns: 0, recentMatches: [], topPerforming: [] };
    
    return {
      totalPatterns: memoryStats.patterns || 0,
      recentMatches: this.getRecentPatternMatches(),
      topPerforming: this.getTopPerformingPatterns(),
      evolution: this.analyzePatternEvolution(),
      similarities: this.calculatePatternSimilarities()
    };
  }
  
  extractRiskAnalysis() {
    const riskStatus = this.realtimeData.riskStatus;
    if (!riskStatus) return null;
    
    return {
      current: riskStatus.risk,
      calculations: this.explainRiskCalculations(riskStatus),
      adjustments: this.explainRiskAdjustments(riskStatus),
      limits: this.explainRiskLimits(riskStatus),
      recoveryMode: {
        active: riskStatus.risk?.recoveryMode || false,
        reason: this.explainRecoveryMode(riskStatus),
        adjustments: this.explainRecoveryAdjustments(riskStatus)
      }
    };
  }
  
  extractPerformanceAnalysis() {
    const perfMetrics = this.realtimeData.performanceMetrics;
    if (!perfMetrics) return null;
    
    return {
      edgeDecay: {
        detected: perfMetrics.edge?.decayDetected || false,
        amount: perfMetrics.edge?.decay || 0,
        explanation: this.explainEdgeDecay(perfMetrics)
      },
      qualityScores: {
        average: perfMetrics.quality?.average || 0,
        category: perfMetrics.quality?.category || 'unknown',
        trend: this.analyzeQualityTrend()
      },
      recommendations: this.getPerformanceRecommendations(),
      tradeAnalysis: this.analyzeRecentTrades()
    };
  }
  
  // ========================================================================
  // HELPER METHODS
  // ========================================================================
  
  interpretRSI(rsi) {
    if (rsi >= 70) return 'overbought';
    if (rsi <= 30) return 'oversold';
    if (rsi >= 60) return 'bullish';
    if (rsi <= 40) return 'bearish';
    return 'neutral';
  }
  
  interpretMACD(macd, signal) {
    if (macd > signal) return 'bullish';
    if (macd < signal) return 'bearish';
    return 'neutral';
  }
  
  interpretTrend(trend) {
    return trend || 'sideways';
  }
  
  calculateFinalScore(analysis) {
    let score = 0;
    
    // Technical analysis contribution (40%)
    if (analysis.rsi < 30 || analysis.rsi > 70) score += 0.15;
    if (analysis.macd > analysis.signal) score += 0.15;
    if (analysis.trend === 'uptrend') score += 0.10;
    
    // Pattern recognition contribution (30%)
    if (analysis.patternEvaluation) {
      score += (analysis.patternEvaluation.confidence || 0) * 0.30;
    }
    
    // Risk assessment contribution (30%)
    if (this.realtimeData.riskStatus?.trading?.allowed) {
      score += 0.20;
    }
    if (!this.realtimeData.riskStatus?.risk?.recoveryMode) {
      score += 0.10;
    }
    
    return Math.min(1, score);
  }
  
  traceActivationPath(analysis) {
    const path = [];
    
    // Input processing
    path.push({
      layer: 'input',
      node: 'market_data',
      activation: 1.0,
      description: 'Market data received and validated'
    });
    
    // Technical analysis
    const techActivation = this.calculateTechnicalActivation(analysis);
    path.push({
      layer: 'hidden1',
      node: 'technical_analysis',
      activation: techActivation,
      description: `Technical indicators processed (RSI: ${analysis.rsi?.toFixed(1)}, MACD: ${analysis.macd?.toFixed(4)})`
    });
    
    // Pattern recognition
    const patternActivation = analysis.patternEvaluation?.confidence || 0;
    path.push({
      layer: 'hidden2',
      node: 'pattern_recognition',
      activation: patternActivation,
      description: `Pattern matching completed (Confidence: ${(patternActivation * 100).toFixed(1)}%)`
    });
    
    // Risk assessment
    const riskActivation = this.calculateRiskActivation();
    path.push({
      layer: 'hidden3',
      node: 'risk_assessment',
      activation: riskActivation,
      description: `Risk evaluation completed (Safe to trade: ${riskActivation > 0.5})`
    });
    
    // Final decision
    path.push({
      layer: 'output',
      node: 'decision',
      activation: analysis.confidence || 0,
      description: `Final decision: ${analysis.decision} (Confidence: ${((analysis.confidence || 0) * 100).toFixed(1)}%)`
    });
    
    return path;
  }
  
  buildConfidenceBreakdown(analysis) {
    return {
      technical: {
        rsi: this.calculateRSIContribution(analysis.rsi),
        macd: this.calculateMACDContribution(analysis.macd, analysis.signal),
        trend: this.calculateTrendContribution(analysis.trend),
        total: this.calculateTechnicalActivation(analysis)
      },
      pattern: {
        confidence: analysis.patternEvaluation?.confidence || 0,
        exactMatch: analysis.patternEvaluation?.exactMatch || false,
        historicalAccuracy: this.calculateHistoricalAccuracy(analysis.patternEvaluation)
      },
      risk: {
        tradingAllowed: this.realtimeData.riskStatus?.trading?.allowed || false,
        recoveryMode: this.realtimeData.riskStatus?.risk?.recoveryMode || false,
        drawdown: this.realtimeData.riskStatus?.risk?.currentDrawdown || 0
      },
      overall: analysis.confidence || 0
    };
  }
  
  calculateTechnicalActivation(analysis) {
    let activation = 0;
    
    // RSI contribution
    if (analysis.rsi < 30) activation += 0.3; // Oversold
    else if (analysis.rsi > 70) activation += 0.3; // Overbought
    else if (analysis.rsi >= 40 && analysis.rsi <= 60) activation += 0.1; // Neutral
    
    // MACD contribution
    if (analysis.macd > analysis.signal) activation += 0.3; // Bullish
    else if (analysis.macd < analysis.signal) activation += 0.2; // Bearish
    
    // Trend contribution
    if (analysis.trend === 'uptrend') activation += 0.4;
    else if (analysis.trend === 'downtrend') activation += 0.3;
    
    return Math.min(1, activation);
  }
  
  calculateRiskActivation() {
    const riskStatus = this.realtimeData.riskStatus;
    if (!riskStatus) return 0.5;
    
    let activation = 0.5; // Base activation
    
    if (riskStatus.trading?.allowed) activation += 0.3;
    if (!riskStatus.risk?.recoveryMode) activation += 0.2;
    if ((riskStatus.risk?.currentDrawdown || 0) < 5) activation += 0.1;
    
    return Math.min(1, activation);
  }
  
  // Additional helper methods for various calculations...
  calculateRSIContribution(rsi) {
    if (rsi < 30) return 0.8; // Strong oversold signal
    if (rsi > 70) return 0.8; // Strong overbought signal
    if (rsi >= 40 && rsi <= 60) return 0.3; // Neutral
    return 0.5; // Moderate signal
  }
  
  calculateMACDContribution(macd, signal) {
    const diff = Math.abs(macd - signal);
    if (macd > signal) return Math.min(0.8, 0.5 + diff * 100); // Bullish
    return Math.min(0.6, 0.3 + diff * 100); // Bearish
  }
  
  calculateTrendContribution(trend) {
    switch (trend) {
      case 'uptrend': return 0.7;
      case 'downtrend': return 0.6;
      default: return 0.3;
    }
  }
  
  getBotStatus() {
    if (!this.ogzPrime) return { connected: false };
    
    return {
      connected: true,
      running: this.ogzPrime.isRunning,
      balance: this.ogzPrime.tradingBrain?.balance || 0,
      position: this.ogzPrime.tradingBrain?.position || null,
      lastUpdate: Date.now()
    };
  }
  
  // Placeholder methods for additional functionality
  getRecentPatternMatches() { return []; }
  getTopPerformingPatterns() { return []; }
  analyzePatternEvolution() { return {}; }
  calculatePatternSimilarities() { return {}; }
  explainDrawdownCalculation() { return {}; }
  explainPositionSizing() { return {}; }
  explainRiskAdjustments() { return {}; }
  explainRiskCalculations() { return {}; }
  explainRiskLimits() { return {}; }
  explainRecoveryMode() { return ''; }
  explainRecoveryAdjustments() { return {}; }
  explainEdgeDecay() { return ''; }
  analyzeQualityTrend() { return 'stable'; }
  getPerformanceRecommendations() { return []; }
  analyzeRecentTrades() { return {}; }
  calculatePatternStrength() { return 0.5; }
  calculateHistoricalAccuracy() { return 0.5; }
  categorizeConfidence(confidence) {
    if (confidence >= 0.8) return 'very_high';
    if (confidence >= 0.6) return 'high';
    if (confidence >= 0.4) return 'moderate';
    if (confidence >= 0.2) return 'low';
    return 'very_low';
  }
  
  analyzeCandlePattern(current, previous) {
    const bodySize = Math.abs(current.close - current.open);
    const range = current.high - current.low;
    const bodyRatio = range > 0 ? bodySize / range : 0;
    
    if (bodyRatio > 0.7) return 'strong_body';
    if (bodyRatio < 0.3) return 'doji_like';
    return 'normal';
  }
  
  determineMarketPhase(candles) {
    if (candles.length < 10) return 'unknown';
    
    const prices = candles.map(c => c.close);
    const trend = prices[prices.length - 1] > prices[0] ? 'rising' : 'falling';
    const volatility = this.calculateVolatilityLevel(candles);
    
    if (volatility > 0.03) return 'high_volatility';
    if (volatility < 0.01) return 'low_volatility';
    return `normal_${trend}`;
  }
  
  calculateVolatilityLevel(candles) {
    if (candles.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      const ret = (candles[i].close - candles[i-1].close) / candles[i-1].close;
      returns.push(ret);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  analyzeDecisionPatterns() { return {}; }
  analyzeDecisionTrends() { return {}; }
  extractIndicatorAnalysis() { return {}; }
  extractSentimentAnalysis() { return {}; }
  extractVolatilityAnalysis() { return {}; }
  extractDecisionWeightings() { return {}; }
  extractNeuralActivations() { return {}; }
  extractDecisionPathways() { return {}; }
  
  // ========================================================================
  // PUBLIC METHODS
  // ========================================================================
  
  setOGZPrimeInstance(ogzPrimeInstance) {
    this.ogzPrime = ogzPrimeInstance;
    console.log('📊 OGZ Prime instance connected to Transparency API');
  }
  
  updateAnalysis(analysisData) {
    this.realtimeData.currentAnalysis = analysisData;
    this.buildNeuralMapping(analysisData);
  }
  
  updateDecision(decision) {
    this.realtimeData.lastDecision = decision;
    this.realtimeData.decisionHistory.push({
      ...decision,
      timestamp: Date.now()
    });
    
    // Keep only last 100 decisions
    if (this.realtimeData.decisionHistory.length > 100) {
      this.realtimeData.decisionHistory.shift();
    }
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`📊 OGZ Prime Transparency API running on port ${this.port}`);
      console.log(`📊 Access full transparency at: http://localhost:${this.port}/api/full-transparency`);
    });
  }
}

module.exports = TransparencyAPI;