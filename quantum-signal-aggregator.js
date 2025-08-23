/**
 * QUANTUM SIGNAL AGGREGATOR
 * Combines signals from ALL sources into unified trading decisions
 * 
 * This takes signals from:
 * - Technical indicators (RSI, MACD, Bollinger)
 * - Pattern recognition
 * - Quantum modules
 * - Divine modules (TimeGAN, GANN, etc)
 * - Neural mesh
 * - The Mover's intuition
 * 
 * And creates ONE PERFECT SIGNAL
 */

const EventEmitter = require('events');

class QuantumSignalAggregator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      minSignals: config.minSignals || 2, // Minimum signals needed
      consensusThreshold: config.consensusThreshold || 0.6, // 60% agreement
      timeWindow: config.timeWindow || 5000, // 5 seconds to collect signals
      conflictResolution: config.conflictResolution || 'weighted', // 'weighted', 'majority', 'highest'
      ...config
    };
    
    // Signal buffer for time-window aggregation
    this.signalBuffer = [];
    this.aggregationTimer = null;
    
    // Signal sources tracking
    this.signalSources = new Map();
    
    // Historical performance by source
    this.sourcePerformance = new Map();
    
    // Aggregation statistics
    this.stats = {
      totalSignals: 0,
      aggregatedSignals: 0,
      conflictResolutions: 0,
      perfectConsensus: 0,
      signals: {
        BUY: 0,
        SELL: 0,
        LONG: 0,
        SHORT: 0,
        HOLD: 0
      }
    };
    
    console.log('📡 QUANTUM SIGNAL AGGREGATOR INITIALIZED');
  }
  
  /**
   * REGISTER SIGNAL SOURCE
   */
  registerSource(sourceId, config = {}) {
    this.signalSources.set(sourceId, {
      id: sourceId,
      type: config.type || 'indicator',
      weight: config.weight || 1.0,
      reliability: config.reliability || 0.5,
      signals: 0,
      successful: 0
    });
    
    this.sourcePerformance.set(sourceId, {
      totalSignals: 0,
      profitableSignals: 0,
      avgConfidence: 0,
      winRate: 0.5
    });
    
    console.log(`✅ Signal source registered: ${sourceId}`);
  }
  
  /**
   * ADD SIGNAL TO BUFFER
   */
  addSignal(signal) {
    // Validate signal structure
    if (!signal.source || !signal.action) {
      console.error('Invalid signal structure:', signal);
      return;
    }
    
    // Add metadata
    signal.timestamp = signal.timestamp || Date.now();
    signal.confidence = signal.confidence || 0.5;
    signal.id = `${signal.source}_${signal.timestamp}`;
    
    // Add to buffer
    this.signalBuffer.push(signal);
    this.stats.totalSignals++;
    
    // Update source tracking
    const source = this.signalSources.get(signal.source);
    if (source) {
      source.signals++;
    }
    
    console.log(`📨 Signal received from ${signal.source}: ${signal.action} (${(signal.confidence * 100).toFixed(1)}%)`);
    
    // Start or reset aggregation timer
    this.scheduleAggregation();
    
    // Check for immediate consensus
    this.checkImmediateConsensus();
  }
  
  /**
   * SCHEDULE AGGREGATION
   */
  scheduleAggregation() {
    // Clear existing timer
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer);
    }
    
    // Set new timer
    this.aggregationTimer = setTimeout(() => {
      this.aggregateSignals();
    }, this.config.timeWindow);
  }
  
  /**
   * CHECK FOR IMMEDIATE CONSENSUS
   */
  checkImmediateConsensus() {
    // If we have strong consensus, aggregate immediately
    if (this.signalBuffer.length >= this.config.minSignals) {
      const consensus = this.calculateConsensus(this.signalBuffer);
      
      if (consensus.agreement >= 0.9) { // 90% agreement
        console.log('⚡ IMMEDIATE CONSENSUS DETECTED!');
        clearTimeout(this.aggregationTimer);
        this.aggregateSignals();
      }
    }
  }
  
  /**
   * AGGREGATE SIGNALS - The Magic Happens Here
   */
  aggregateSignals() {
    if (this.signalBuffer.length === 0) {
      return null;
    }
    
    console.log(`🔄 Aggregating ${this.signalBuffer.length} signals...`);
    
    // Remove old signals outside time window
    const cutoff = Date.now() - this.config.timeWindow;
    this.signalBuffer = this.signalBuffer.filter(s => s.timestamp > cutoff);
    
    // Need minimum signals
    if (this.signalBuffer.length < this.config.minSignals) {
      console.log(`⚠️ Not enough signals (${this.signalBuffer.length}/${this.config.minSignals})`);
      this.signalBuffer = []; // Clear buffer
      return null;
    }
    
    // Calculate consensus
    const consensus = this.calculateConsensus(this.signalBuffer);
    
    // Resolve conflicts if needed
    let finalSignal = consensus.signal;
    
    if (consensus.hasConflict) {
      finalSignal = this.resolveConflict(this.signalBuffer, consensus);
      this.stats.conflictResolutions++;
    }
    
    // Add aggregation metadata
    finalSignal.aggregated = true;
    finalSignal.sourceCount = this.signalBuffer.length;
    finalSignal.consensus = consensus.agreement;
    finalSignal.sources = [...new Set(this.signalBuffer.map(s => s.source))];
    
    // Update statistics
    this.stats.aggregatedSignals++;
    this.stats.signals[finalSignal.action]++;
    
    if (consensus.agreement === 1.0) {
      this.stats.perfectConsensus++;
    }
    
    // Clear buffer
    this.signalBuffer = [];
    
    // Emit aggregated signal
    console.log(`✨ AGGREGATED SIGNAL: ${finalSignal.action} with ${(finalSignal.confidence * 100).toFixed(1)}% confidence`);
    console.log(`   Sources: ${finalSignal.sources.join(', ')}`);
    console.log(`   Consensus: ${(consensus.agreement * 100).toFixed(1)}%`);
    
    this.emit('signal', finalSignal);
    
    return finalSignal;
  }
  
  /**
   * CALCULATE CONSENSUS
   */
  calculateConsensus(signals) {
    const actionVotes = new Map();
    const actionConfidence = new Map();
    let totalWeight = 0;
    
    // Count weighted votes
    signals.forEach(signal => {
      const source = this.signalSources.get(signal.source);
      const weight = source ? source.weight * source.reliability : 1.0;
      
      const currentVotes = actionVotes.get(signal.action) || 0;
      actionVotes.set(signal.action, currentVotes + weight);
      
      const currentConfidence = actionConfidence.get(signal.action) || [];
      currentConfidence.push(signal.confidence);
      actionConfidence.set(signal.action, currentConfidence);
      
      totalWeight += weight;
    });
    
    // Find dominant action
    let bestAction = 'HOLD';
    let bestVotes = 0;
    let hasConflict = false;
    
    for (const [action, votes] of actionVotes) {
      if (votes > bestVotes) {
        bestVotes = votes;
        bestAction = action;
      }
    }
    
    // Calculate agreement level
    const agreement = bestVotes / totalWeight;
    
    // Check for conflicts (multiple strong signals)
    const strongActions = [];
    for (const [action, votes] of actionVotes) {
      if (votes / totalWeight > 0.3) { // 30% threshold
        strongActions.push(action);
      }
    }
    
    hasConflict = strongActions.length > 1;
    
    // Calculate average confidence for winning action
    const winningConfidences = actionConfidence.get(bestAction) || [0.5];
    const avgConfidence = winningConfidences.reduce((a, b) => a + b, 0) / winningConfidences.length;
    
    // Build consensus signal
    const consensusSignal = {
      action: bestAction,
      confidence: avgConfidence * agreement, // Weighted by agreement
      reason: `Consensus from ${signals.length} signals`,
      timestamp: Date.now()
    };
    
    return {
      signal: consensusSignal,
      agreement: agreement,
      hasConflict: hasConflict,
      actionDistribution: Object.fromEntries(actionVotes)
    };
  }
  
  /**
   * RESOLVE CONFLICTS - Advanced Decision Making
   */
  resolveConflict(signals, consensus) {
    console.log('⚔️ Resolving signal conflict...');
    
    switch (this.config.conflictResolution) {
      case 'weighted':
        return this.weightedResolution(signals);
        
      case 'majority':
        return consensus.signal; // Already majority
        
      case 'highest':
        return this.highestConfidenceResolution(signals);
        
      case 'performance':
        return this.performanceBasedResolution(signals);
        
      default:
        return consensus.signal;
    }
  }
  
  /**
   * WEIGHTED RESOLUTION
   */
  weightedResolution(signals) {
    // Weight by source performance and confidence
    let bestSignal = null;
    let bestScore = 0;
    
    signals.forEach(signal => {
      const source = this.signalSources.get(signal.source);
      const perf = this.sourcePerformance.get(signal.source);
      
      if (source && perf) {
        const score = signal.confidence * 
                     source.weight * 
                     source.reliability * 
                     (perf.winRate || 0.5);
        
        if (score > bestScore) {
          bestScore = score;
          bestSignal = signal;
        }
      }
    });
    
    return bestSignal || signals[0];
  }
  
  /**
   * HIGHEST CONFIDENCE RESOLUTION
   */
  highestConfidenceResolution(signals) {
    return signals.reduce((best, signal) => 
      signal.confidence > best.confidence ? signal : best
    );
  }
  
  /**
   * PERFORMANCE BASED RESOLUTION
   */
  performanceBasedResolution(signals) {
    // Choose signal from best performing source
    let bestSignal = null;
    let bestWinRate = 0;
    
    signals.forEach(signal => {
      const perf = this.sourcePerformance.get(signal.source);
      if (perf && perf.winRate > bestWinRate) {
        bestWinRate = perf.winRate;
        bestSignal = signal;
      }
    });
    
    return bestSignal || signals[0];
  }
  
  /**
   * UPDATE SOURCE PERFORMANCE
   */
  updateSourcePerformance(sourceId, result) {
    const perf = this.sourcePerformance.get(sourceId);
    const source = this.signalSources.get(sourceId);
    
    if (!perf || !source) return;
    
    perf.totalSignals++;
    
    if (result.profitable) {
      perf.profitableSignals++;
      source.successful++;
    }
    
    // Update win rate
    perf.winRate = perf.profitableSignals / perf.totalSignals;
    
    // Update source reliability based on performance
    source.reliability = 0.3 + (perf.winRate * 0.7); // 30% base + 70% performance
    
    // Adjust weight if consistently good/bad
    if (perf.totalSignals > 20) {
      if (perf.winRate > 0.7) {
        source.weight = Math.min(source.weight * 1.1, 3.0); // Increase up to 3x
      } else if (perf.winRate < 0.3) {
        source.weight = Math.max(source.weight * 0.9, 0.1); // Decrease to min 0.1
      }
    }
    
    console.log(`📈 Updated ${sourceId} performance: WR ${(perf.winRate * 100).toFixed(1)}%, Weight: ${source.weight.toFixed(2)}`);
  }
  
  /**
   * RESET AGGREGATOR
   */
  reset() {
    this.signalBuffer = [];
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer);
    }
    console.log('🔄 Signal aggregator reset');
  }
  
  /**
   * GET AGGREGATOR STATUS
   */
  getStatus() {
    const sources = [];
    
    for (const [id, source] of this.signalSources) {
      const perf = this.sourcePerformance.get(id);
      sources.push({
        id: id,
        type: source.type,
        weight: source.weight,
        reliability: source.reliability,
        signals: source.signals,
        winRate: perf ? perf.winRate : 0.5
      });
    }
    
    return {
      config: this.config,
      bufferSize: this.signalBuffer.length,
      sources: sources,
      stats: this.stats,
      consensusRate: this.stats.aggregatedSignals > 0
        ? (this.stats.perfectConsensus / this.stats.aggregatedSignals * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

module.exports = QuantumSignalAggregator;

/**
 * USAGE EXAMPLE:
 * 
 * const aggregator = new QuantumSignalAggregator({
 *   minSignals: 3,
 *   consensusThreshold: 0.7,
 *   timeWindow: 5000
 * });
 * 
 * // Register signal sources
 * aggregator.registerSource('rsi-indicator', { 
 *   type: 'indicator', 
 *   weight: 1.0 
 * });
 * 
 * aggregator.registerSource('quantum-gan', { 
 *   type: 'quantum', 
 *   weight: 2.0 
 * });
 * 
 * aggregator.registerSource('the-mover', { 
 *   type: 'ai', 
 *   weight: 1.5 
 * });
 * 
 * // Listen for aggregated signals
 * aggregator.on('signal', (signal) => {
 *   console.log('Execute trade:', signal);
 * });
 * 
 * // Add signals from different sources
 * aggregator.addSignal({
 *   source: 'rsi-indicator',
 *   action: 'BUY',
 *   confidence: 0.7,
 *   reason: 'RSI oversold'
 * });
 * 
 * aggregator.addSignal({
 *   source: 'quantum-gan',
 *   action: 'BUY',
 *   confidence: 0.85,
 *   reason: 'Quantum superposition indicates upward momentum'
 * });
 * 
 * // Update performance after trades
 * aggregator.updateSourcePerformance('quantum-gan', { profitable: true });
 */