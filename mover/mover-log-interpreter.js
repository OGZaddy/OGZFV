// ==========================================
// FILE: mover-log-interpreter.js
// Interprets logs and generates contextual narrations
// ==========================================
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MoverLogInterpreter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      logDir: config.logDir || './logs',
      patterns: config.patterns || this.getDefaultPatterns(),
      contextWindow: config.contextWindow || 50,
      ...config
    };
    
    this.moverCore = config.moverCore;
    this.moverMemory = config.moverMemory;
    
    this.logBuffer = [];
    this.interpretationCache = new Map();
  }

  getDefaultPatterns() {
    return {
      trade_execution: /(?:BUY|SELL)\s+(\d+\.?\d*)\s+(\w+[-/]\w+)\s+@\s+\$?(\d+\.?\d*)/i,
      profit_loss: /(?:P&L|Profit|Loss):\s*([+-]?\$?\d+\.?\d*)/i,
      pattern_detected: /Pattern\s+(?:detected|found):\s*(\w+)\s*\((\d+\.?\d*)%?\)/i,
      confidence_level: /Confidence:\s*(\d+\.?\d*)%?/i,
      market_regime: /Market\s+(?:regime|condition):\s*(\w+)/i,
      risk_alert: /(?:Risk|Warning|Alert):\s*(.+)/i,
      position_closed: /Position\s+closed.*?([+-]?\$?\d+\.?\d*)/i,
      system_status: /System\s+(?:status|state):\s*(\w+)/i,
      error_log: /(?:ERROR|CRITICAL):\s*(.+)/i,
      milestone: /(?:Milestone|Achievement|Target).*?reached/i
    };
  }

  async interpretLogFile(logPath) {
    try {
      const content = await fs.readFile(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const interpretations = [];
      
      for (const line of lines) {
        const interpretation = await this.interpretLogLine(line);
        if (interpretation) {
          interpretations.push(interpretation);
          
          // Process significant events immediately
          if (interpretation.significance === 'high') {
            await this.processSignificantEvent(interpretation);
          }
        }
      }
      
      // Generate summary
      const summary = this.generateLogSummary(interpretations);
      
      return {
        logPath,
        linesProcessed: lines.length,
        interpretations,
        summary
      };
    } catch (error) {
      console.error('[LogInterpreter] Failed to interpret log file:', error);
      throw error;
    }
  }

  async interpretLogLine(line) {
    // Check cache first
    const cached = this.interpretationCache.get(line);
    if (cached) {
      return cached;
    }
    
    const interpretation = {
      raw: line,
      timestamp: this.extractTimestamp(line),
      type: 'unknown',
      data: {},
      significance: 'low'
    };
    
    // Match against patterns
    for (const [patternName, regex] of Object.entries(this.config.patterns)) {
      const match = line.match(regex);
      if (match) {
        interpretation.type = patternName;
        interpretation.data = this.extractDataFromMatch(patternName, match);
        interpretation.significance = this.assessSignificance(patternName, interpretation.data);
        break;
      }
    }
    
    // Add context
    interpretation.context = this.getLogContext(line);
    
    // Generate human-readable interpretation
    interpretation.humanReadable = await this.generateHumanReadable(interpretation);
    
    // Cache result
    this.interpretationCache.set(line, interpretation);
    
    // Maintain cache size
    if (this.interpretationCache.size > 1000) {
      const firstKey = this.interpretationCache.keys().next().value;
      this.interpretationCache.delete(firstKey);
    }
    
    return interpretation;
  }

  extractTimestamp(line) {
    // Common timestamp patterns
    const patterns = [
      /\[(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}\.?\d*Z?)\]/,
      /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/,
      /\((\d{13})\)/ // Unix timestamp
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const timestamp = match[1];
        // Convert to ISO format if needed
        if (/^\d{13}$/.test(timestamp)) {
          return new Date(parseInt(timestamp)).toISOString();
        }
        return timestamp;
      }
    }
    
    return new Date().toISOString();
  }

  extractDataFromMatch(patternName, match) {
    const data = {};
    
    switch (patternName) {
      case 'trade_execution':
        data.amount = parseFloat(match[1]);
        data.asset = match[2];
        data.price = parseFloat(match[3]);
        data.action = match[0].includes('BUY') ? 'BUY' : 'SELL';
        break;
        
      case 'profit_loss':
        data.value = parseFloat(match[1].replace('$', ''));
        data.isProfit = data.value > 0;
        break;
        
      case 'pattern_detected':
        data.pattern = match[1];
        data.confidence = parseFloat(match[2]);
        break;
        
      case 'confidence_level':
        data.confidence = parseFloat(match[1]);
        break;
        
      case 'market_regime':
        data.regime = match[1].toLowerCase();
        break;
        
      case 'risk_alert':
        data.message = match[1];
        break;
        
      case 'position_closed':
        data.result = parseFloat(match[1].replace('$', ''));
        break;
        
      case 'error_log':
        data.error = match[1];
        break;
        
      default:
        data.raw = match[0];
    }
    
    return data;
  }

  assessSignificance(type, data) {
    switch (type) {
      case 'trade_execution':
        // Large trades are significant
        if (data.amount * data.price > 1000) return 'high';
        return 'medium';
        
      case 'profit_loss':
        // Large P&L is significant
        if (Math.abs(data.value) > 100) return 'high';
        return 'medium';
        
      case 'error_log':
        return 'high';
        
      case 'milestone':
        return 'high';
        
      case 'risk_alert':
        return 'medium';
        
      default:
        return 'low';
    }
  }

  getLogContext(line) {
    // Get surrounding lines from buffer
    const lineIndex = this.logBuffer.indexOf(line);
    if (lineIndex === -1) {
      return [];
    }
    
    const start = Math.max(0, lineIndex - 5);
    const end = Math.min(this.logBuffer.length, lineIndex + 5);
    
    return this.logBuffer.slice(start, end).map((contextLine, index) => ({
      line: contextLine,
      isTarget: start + index === lineIndex
    }));
  }

  async generateHumanReadable(interpretation) {
    if (!this.moverCore) {
      return this.generateBasicNarration(interpretation);
    }
    
    // Use MoverCore for sophisticated narration
    const tradeEvent = this.interpretationToTradeEvent(interpretation);
    return await this.moverCore.processTradeEvent(tradeEvent);
  }

  generateBasicNarration(interpretation) {
    const { type, data } = interpretation;
    
    switch (type) {
      case 'trade_execution':
        return `Executed ${data.action} order: ${data.amount} ${data.asset} at $${data.price}`;
        
      case 'profit_loss':
        return data.isProfit ? 
          `Profit recorded: $${data.value}` : 
          `Loss recorded: $${Math.abs(data.value)}`;
        
      case 'pattern_detected':
        return `${data.pattern} pattern detected with ${data.confidence}% confidence`;
        
      case 'market_regime':
        return `Market regime identified as ${data.regime}`;
        
      case 'risk_alert':
        return `Risk alert: ${data.message}`;
        
      case 'position_closed':
        return `Position closed with ${data.result > 0 ? 'profit' : 'loss'}: $${Math.abs(data.result)}`;
        
      case 'error_log':
        return `System error: ${data.error}`;
        
      default:
        return interpretation.raw;
    }
  }

  interpretationToTradeEvent(interpretation) {
    const { type, data, timestamp } = interpretation;
    
    return {
      type: type,
      timestamp: timestamp,
      ...data,
      source: 'log_interpretation'
    };
  }

  async processSignificantEvent(interpretation) {
    // Record in memory
    if (this.moverMemory) {
      this.moverMemory.recordEvent('significant_log_event', interpretation);
    }
    
    // Emit for real-time processing
    this.emit('significant_event', interpretation);
    
    // Generate alert narration if needed
    if (interpretation.type === 'error_log' || interpretation.type === 'risk_alert') {
      const alertNarration = `Alert: ${interpretation.humanReadable}`;
      this.emit('alert_narration', {
        content: alertNarration,
        severity: 'high',
        interpretation
      });
    }
  }

  generateLogSummary(interpretations) {
    const summary = {
      totalEvents: interpretations.length,
      eventTypes: {},
      trades: {
        total: 0,
        buys: 0,
        sells: 0,
        totalVolume: 0
      },
      profitLoss: {
        total: 0,
        profits: 0,
        losses: 0,
        winRate: 0
      },
      patterns: {},
      errors: [],
      significantEvents: []
    };
    
    interpretations.forEach(interp => {
      // Count event types
      summary.eventTypes[interp.type] = (summary.eventTypes[interp.type] || 0) + 1;
      
      // Process trades
      if (interp.type === 'trade_execution') {
        summary.trades.total++;
        if (interp.data.action === 'BUY') {
          summary.trades.buys++;
        } else {
          summary.trades.sells++;
        }
        summary.trades.totalVolume += interp.data.amount * interp.data.price;
      }
      
      // Process P&L
      if (interp.type === 'profit_loss') {
        summary.profitLoss.total += interp.data.value;
        if (interp.data.isProfit) {
          summary.profitLoss.profits++;
        } else {
          summary.profitLoss.losses++;
        }
      }
      
      // Track patterns
      if (interp.type === 'pattern_detected') {
        const pattern = interp.data.pattern;
        summary.patterns[pattern] = (summary.patterns[pattern] || 0) + 1;
      }
      
      // Collect errors
      if (interp.type === 'error_log') {
        summary.errors.push({
          timestamp: interp.timestamp,
          error: interp.data.error
        });
      }
      
      // Significant events
      if (interp.significance === 'high') {
        summary.significantEvents.push({
          timestamp: interp.timestamp,
          type: interp.type,
          description: interp.humanReadable
        });
      }
    });
    
    // Calculate win rate
    if (summary.profitLoss.profits + summary.profitLoss.losses > 0) {
      summary.profitLoss.winRate = 
        (summary.profitLoss.profits / (summary.profitLoss.profits + summary.profitLoss.losses)) * 100;
    }
    
    return summary;
  }

  async watchLogFile(logPath) {
    console.log(`[LogInterpreter] Watching log file: ${logPath}`);
    
    // Initial read
    const initialContent = await fs.readFile(logPath, 'utf8');
    this.logBuffer = initialContent.split('\n').filter(line => line.trim());
    
    // Process initial content
    for (const line of this.logBuffer) {
      await this.interpretLogLine(line);
    }
    
    // Watch for changes
    let lastSize = initialContent.length;
    
    const watcher = setInterval(async () => {
      try {
        const stats = await fs.stat(logPath);
        
        if (stats.size > lastSize) {
          // Read new content
          const content = await fs.readFile(logPath, 'utf8');
          const newContent = content.substring(lastSize);
          const newLines = newContent.split('\n').filter(line => line.trim());
          
          // Process new lines
          for (const line of newLines) {
            this.logBuffer.push(line);
            
            // Maintain buffer size
            if (this.logBuffer.length > this.config.contextWindow * 2) {
              this.logBuffer.shift();
            }
            
            const interpretation = await this.interpretLogLine(line);
            if (interpretation) {
              this.emit('new_interpretation', interpretation);
              
              if (interpretation.significance === 'high') {
                await this.processSignificantEvent(interpretation);
              }
            }
          }
          
          lastSize = stats.size;
        }
      } catch (error) {
        console.error('[LogInterpreter] Watch error:', error);
      }
    }, 1000); // Check every second
    
    return {
      stop: () => clearInterval(watcher)
    };
  }
}

module.exports = MoverLogInterpreter;