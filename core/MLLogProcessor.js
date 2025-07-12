// ===================================================================
// ML-POWERED LOG STREAM PROCESSOR - TAME THE LOG BEAST!
// ===================================================================
// Compress, analyze, and intelligently store massive log streams

const EventEmitter = require('events');
const zlib = require('zlib');
const fs = require('fs').promises;
const path = require('path');

class MLLogProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      maxBufferSize: 1000,              // Process in batches
      compressionLevel: 9,             // Max compression
      retentionDays: 7,                // Keep raw logs for 7 days
      mlProcessingInterval: 5000,      // Process every 5 seconds
      importanceThreshold: 0.7,        // Only keep important logs
      ...options
    };
    
    // Buffers for different log types
    this.logBuffers = {
      trades: [],
      patterns: [],
      decisions: [],
      cosmic: [],
      errors: [],
      performance: []
    };
    
    // ML models for log importance
    this.importanceModels = new Map();
    
    // Compressed storage
    this.compressedStorage = new Map();
    
    // Statistics
    this.stats = {
      totalLogsProcessed: 0,
      totalLogsCompressed: 0,
      compressionRatio: 0,
      diskSpaceSaved: 0,
      importantLogsKept: 0,
      redundantLogsRemoved: 0
    };
    
    // Start processing
    this.startProcessing();
    
    console.log('🤖 ML Log Processor initialized - No more log avalanches!');
  }
  
  /**
   * Intercept log before it hits disk
   */
  async processLog(logEntry) {
    // Classify log type
    const logType = this.classifyLog(logEntry);
    
    // Quick importance check
    const importance = await this.calculateImportance(logEntry, logType);
    
    // Add metadata
    logEntry._ml = {
      type: logType,
      importance: importance,
      timestamp: Date.now(),
      processed: false
    };
    
    // Only buffer important logs
    if (importance >= this.config.importanceThreshold || logEntry.level === 'error') {
      this.logBuffers[logType].push(logEntry);
      
      // Process immediately if buffer is full
      if (this.logBuffers[logType].length >= this.config.maxBufferSize) {
        await this.processBuffer(logType);
      }
    } else {
      this.stats.redundantLogsRemoved++;
    }
    
    this.stats.totalLogsProcessed++;
  }
  
  /**
   * Classify log into categories
   */
  classifyLog(logEntry) {
    const message = (logEntry.message || '').toLowerCase();
    
    if (message.includes('trade') || message.includes('position') || message.includes('profit')) {
      return 'trades';
    } else if (message.includes('pattern') || message.includes('recognition')) {
      return 'patterns';
    } else if (message.includes('decision') || message.includes('analysis')) {
      return 'decisions';
    } else if (message.includes('cosmic') || message.includes('quantum') || message.includes('moon')) {
      return 'cosmic';
    } else if (logEntry.level === 'error' || message.includes('error')) {
      return 'errors';
    } else if (message.includes('performance') || message.includes('metric')) {
      return 'performance';
    }
    
    return 'decisions'; // default
  }
  
  /**
   * ML-based importance calculation
   */
  async calculateImportance(logEntry, logType) {
    // Base importance on log level
    let importance = 0.5;
    
    switch (logEntry.level) {
      case 'error':
        importance = 1.0; // Always keep errors
        break;
      case 'warn':
        importance = 0.8;
        break;
      case 'info':
        importance = 0.5;
        break;
      case 'debug':
        importance = 0.3;
        break;
    }
    
    // Boost importance for specific patterns
    const importantPatterns = [
      /profit|loss/i,              // Financial outcomes
      /trade.*executed/i,          // Actual trades
      /pattern.*detected/i,        // New patterns
      /error|exception/i,          // Problems
      /milestone|achievement/i,    // Important events
      /quantum.*collapse/i,        // Quantum decisions
      /aggressive.*override/i,     // Forced trades
      /position.*closed/i          // Exit points
    ];
    
    for (const pattern of importantPatterns) {
      if (pattern.test(logEntry.message)) {
        importance += 0.2;
      }
    }
    
    // Reduce importance for repetitive logs
    if (this.isRepetitive(logEntry, logType)) {
      importance *= 0.5;
    }
    
    // ML adjustment based on historical value
    const mlAdjustment = await this.getMLImportanceAdjustment(logEntry, logType);
    importance *= mlAdjustment;
    
    return Math.min(importance, 1.0);
  }
  
  /**
   * Check if log is repetitive
   */
  isRepetitive(logEntry, logType) {
    const recentLogs = this.logBuffers[logType].slice(-10);
    const similarCount = recentLogs.filter(log => 
      log.message === logEntry.message
    ).length;
    
    return similarCount > 3;
  }
  
  /**
   * ML importance adjustment based on patterns
   */
  async getMLImportanceAdjustment(logEntry, logType) {
    // Simple ML: Logs that preceded profitable trades are more important
    
    // Check if this log pattern has led to profits before
    const pattern = this.extractPattern(logEntry);
    const model = this.importanceModels.get(logType) || { patterns: new Map() };
    
    const patternHistory = model.patterns.get(pattern) || {
      occurrences: 0,
      profitableOutcomes: 0,
      adjustment: 1.0
    };
    
    // Calculate adjustment based on historical success
    if (patternHistory.occurrences > 5) {
      const successRate = patternHistory.profitableOutcomes / patternHistory.occurrences;
      patternHistory.adjustment = 0.5 + (successRate * 0.5); // 0.5 to 1.0 range
    }
    
    return patternHistory.adjustment;
  }
  
  /**
   * Extract pattern from log for ML
   */
  extractPattern(logEntry) {
    // Remove numbers and timestamps to find patterns
    return logEntry.message
      .replace(/\d+/g, 'N')
      .replace(/\$[0-9,.]+/g, '$N')
      .replace(/[0-9.]+%/g, 'N%')
      .substring(0, 100); // Limit length
  }
  
  /**
   * Process buffer of logs
   */
  async processBuffer(logType) {
    const logs = this.logBuffers[logType];
    if (logs.length === 0) return;
    
    console.log(`📦 Processing ${logs.length} ${logType} logs...`);
    
    // Extract and compress
    const processed = await this.compressAndStore(logs, logType);
    
    // Clear buffer
    this.logBuffers[logType] = [];
    
    // Update stats
    this.stats.totalLogsCompressed += logs.length;
    this.stats.importantLogsKept += processed.kept;
    
    // Emit event for monitoring
    this.emit('bufferProcessed', {
      type: logType,
      count: logs.length,
      kept: processed.kept,
      compressionRatio: processed.compressionRatio
    });
  }
  
  /**
   * Compress and intelligently store logs
   */
  async compressAndStore(logs, logType) {
    // Group by time window (5 minutes)
    const timeWindows = new Map();
    
    for (const log of logs) {
      const window = Math.floor(log._ml.timestamp / (5 * 60 * 1000));
      if (!timeWindows.has(window)) {
        timeWindows.set(window, []);
      }
      timeWindows.get(window).push(log);
    }
    
    let totalKept = 0;
    let totalSize = 0;
    let compressedSize = 0;
    
    // Process each time window
    for (const [window, windowLogs] of timeWindows) {
      // Smart summarization
      const summary = this.summarizeLogs(windowLogs, logType);
      
      // Keep individual important logs + summary
      const toStore = {
        window: window,
        timestamp: window * 5 * 60 * 1000,
        type: logType,
        summary: summary,
        importantLogs: windowLogs.filter(log => log._ml.importance >= 0.8),
        statistics: {
          total: windowLogs.length,
          kept: summary.importantEvents.length,
          patterns: summary.patterns
        }
      };
      
      // Compress
      const json = JSON.stringify(toStore);
      totalSize += json.length;
      
      const compressed = await this.compress(json);
      compressedSize += compressed.length;
      
      // Store
      await this.store(logType, window, compressed);
      
      totalKept += toStore.importantLogs.length;
    }
    
    const compressionRatio = totalSize > 0 ? (totalSize - compressedSize) / totalSize : 0;
    this.stats.compressionRatio = compressionRatio;
    this.stats.diskSpaceSaved += (totalSize - compressedSize);
    
    return {
      kept: totalKept,
      compressionRatio: compressionRatio
    };
  }
  
  /**
   * Summarize logs intelligently
   */
  summarizeLogs(logs, logType) {
    const summary = {
      logType: logType,
      count: logs.length,
      timeRange: {
        start: Math.min(...logs.map(l => l._ml.timestamp)),
        end: Math.max(...logs.map(l => l._ml.timestamp))
      },
      importantEvents: [],
      patterns: new Map(),
      metrics: {}
    };
    
    // Extract important events
    for (const log of logs) {
      if (log._ml.importance >= 0.8) {
        summary.importantEvents.push({
          time: log._ml.timestamp,
          message: log.message,
          data: log.data
        });
      }
      
      // Count patterns
      const pattern = this.extractPattern(log);
      summary.patterns.set(pattern, (summary.patterns.get(pattern) || 0) + 1);
    }
    
    // Type-specific metrics
    switch (logType) {
      case 'trades':
        summary.metrics = this.extractTradeMetrics(logs);
        break;
      case 'patterns':
        summary.metrics = this.extractPatternMetrics(logs);
        break;
      case 'cosmic':
        summary.metrics = this.extractCosmicMetrics(logs);
        break;
    }
    
    return summary;
  }
  
  /**
   * Extract trade-specific metrics
   */
  extractTradeMetrics(logs) {
    const metrics = {
      totalTrades: 0,
      profitableTrades: 0,
      totalProfit: 0,
      largestWin: 0,
      largestLoss: 0
    };
    
    for (const log of logs) {
      if (log.data?.trade) {
        metrics.totalTrades++;
        if (log.data.trade.profit > 0) {
          metrics.profitableTrades++;
          metrics.totalProfit += log.data.trade.profit;
          metrics.largestWin = Math.max(metrics.largestWin, log.data.trade.profit);
        } else {
          metrics.largestLoss = Math.min(metrics.largestLoss, log.data.trade.profit);
        }
      }
    }
    
    return metrics;
  }
  
  /**
   * Extract pattern-specific metrics
   */
  extractPatternMetrics(logs) {
    const metrics = {
      patternsDetected: 0,
      highConfidencePatterns: 0,
      avgConfidence: 0
    };
    
    let totalConfidence = 0;
    for (const log of logs) {
      if (log.data?.confidence) {
        metrics.patternsDetected++;
        totalConfidence += log.data.confidence;
        if (log.data.confidence > 0.8) {
          metrics.highConfidencePatterns++;
        }
      }
    }
    
    metrics.avgConfidence = metrics.patternsDetected > 0 ? totalConfidence / metrics.patternsDetected : 0;
    return metrics;
  }
  
  /**
   * Extract cosmic-specific metrics
   */
  extractCosmicMetrics(logs) {
    const metrics = {
      cosmicEvents: 0,
      quantumCollapses: 0,
      moonPhases: new Map()
    };
    
    for (const log of logs) {
      if (log.message.includes('cosmic')) metrics.cosmicEvents++;
      if (log.message.includes('quantum collapse')) metrics.quantumCollapses++;
      
      const moonMatch = log.message.match(/moon phase: (\w+)/i);
      if (moonMatch) {
        const phase = moonMatch[1];
        metrics.moonPhases.set(phase, (metrics.moonPhases.get(phase) || 0) + 1);
      }
    }
    
    return metrics;
  }
  
  /**
   * Compress data using zlib
   */
  async compress(data) {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, { level: this.config.compressionLevel }, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }
  
  /**
   * Store compressed data
   */
  async store(logType, window, compressed) {
    const date = new Date(window * 5 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dir = path.join(process.cwd(), 'logs', 'compressed', logType, dateStr);
    await fs.mkdir(dir, { recursive: true });
    
    const filename = `${window}.gz`;
    const filepath = path.join(dir, filename);
    
    await fs.writeFile(filepath, compressed);
  }
  
  /**
   * Start automatic processing
   */
  startProcessing() {
    // Process buffers periodically
    this.processingInterval = setInterval(async () => {
      for (const logType of Object.keys(this.logBuffers)) {
        if (this.logBuffers[logType].length > 0) {
          await this.processBuffer(logType);
        }
      }
      
      // Clean old logs
      await this.cleanOldLogs();
      
      // Update ML models
      await this.updateMLModels();
      
    }, this.config.mlProcessingInterval);
    
    console.log('🚀 ML Log Processor started - Logs under control!');
  }
  
  /**
   * Clean logs older than retention period
   */
  async cleanOldLogs() {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean compressed logs
    const compressedDir = path.join(process.cwd(), 'logs', 'compressed');
    
    try {
      const logTypes = await fs.readdir(compressedDir);
      
      for (const logType of logTypes) {
        const typeDir = path.join(compressedDir, logType);
        const dates = await fs.readdir(typeDir);
        
        for (const date of dates) {
          const dateTime = new Date(date).getTime();
          if (dateTime < cutoffTime) {
            const dateDir = path.join(typeDir, date);
            await fs.rmdir(dateDir, { recursive: true });
            console.log(`🗑️ Cleaned old logs: ${logType}/${date}`);
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
  }
  
  /**
   * Update ML models based on outcomes
   */
  async updateMLModels() {
    // This is where we'd update pattern importance based on trading outcomes
    // For now, placeholder for future ML enhancement
  }
  
  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.stats,
      buffersStatus: Object.entries(this.logBuffers).map(([type, buffer]) => ({
        type,
        count: buffer.length,
        oldestLog: buffer[0]?._ml?.timestamp ? 
          new Date(buffer[0]._ml.timestamp).toISOString() : null
      })),
      diskSpaceSavedMB: (this.stats.diskSpaceSaved / (1024 * 1024)).toFixed(2),
      compressionPercent: (this.stats.compressionRatio * 100).toFixed(1)
    };
  }
  
  /**
   * Query compressed logs
   */
  async queryLogs(options = {}) {
    const {
      logType = 'trades',
      startTime = Date.now() - 24 * 60 * 60 * 1000,
      endTime = Date.now(),
      importance = 0.7
    } = options;
    
    const results = [];
    
    // Calculate time windows to search
    const startWindow = Math.floor(startTime / (5 * 60 * 1000));
    const endWindow = Math.floor(endTime / (5 * 60 * 1000));
    
    for (let window = startWindow; window <= endWindow; window++) {
      const date = new Date(window * 5 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const filepath = path.join(
        process.cwd(), 'logs', 'compressed', logType, dateStr, `${window}.gz`
      );
      
      try {
        const compressed = await fs.readFile(filepath);
        const decompressed = await this.decompress(compressed);
        const data = JSON.parse(decompressed);
        
        // Filter by importance
        const filtered = data.importantLogs.filter(log => 
          log._ml && log._ml.importance >= importance
        );
        
        results.push(...filtered);
      } catch (error) {
        // File might not exist
      }
    }
    
    return results;
  }
  
  /**
   * Decompress data
   */
  async decompress(compressed) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressed, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString());
      });
    });
  }
  
  /**
   * Stop processing
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('🛑 ML Log Processor stopped');
  }
}

module.exports = MLLogProcessor;