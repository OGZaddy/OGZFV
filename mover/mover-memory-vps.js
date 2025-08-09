// ==========================================
// FILE: mover-memory-vps.js
// VPS-optimized memory system with strict limits
// ==========================================
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MoverMemoryVPS extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      memoryDir: config.memoryDir || './memory',
      maxMemorySize: config.maxMemorySize || 50000,           // Large capacity for VPS
      maxShortTermEvents: config.maxShortTermEvents || 10000, // Full capacity
      persistInterval: config.persistInterval || 300000,     // 5 minutes
      compressionThreshold: config.compressionThreshold || 5000, // Reasonable compression
      maxLongTermCategories: config.maxLongTermCategories || 50, // Multiple categories
      enableDiskSwap: true,         // Use disk for overflow
      enableAdvancedPatternRecognition: true, // Full pattern recognition
      enableFullMemoryCapabilities: true,     // All memory features
      ...config
    };
    
    this.shortTermMemory = [];
    this.longTermMemory = {};
    this.doctrineLibrary = {};
    this.contextWindow = [];
    this.memoryUsage = 0;
    
    this.initializeMemorySystem();
  }

  async initializeMemorySystem() {
    try {
      await fs.mkdir(this.config.memoryDir, { recursive: true });
      await this.loadPersistedMemory();
      
      // More frequent cleanup for VPS
      this.persistenceInterval = setInterval(() => {
        this.performVPSCleanup().catch(console.error);
      }, this.config.persistInterval);
      
      // Memory monitoring for VPS
      this.memoryMonitor = setInterval(() => {
        this.monitorMemoryUsage();
      }, 30000); // Check every 30 seconds
      
      console.log('[MoverMemoryVPS] VPS-optimized memory system initialized');
    } catch (error) {
      console.error('[MoverMemoryVPS] Initialization error:', error);
    }
  }

  recordEvent(eventType, eventData) {
    // Check memory limits before adding
    if (this.shortTermMemory.length >= this.config.maxShortTermEvents) {
      this.compressOldestEvents();
    }

    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Shorter IDs
      type: eventType,
      data: this.sanitizeEventData(eventData), // Remove unnecessary data
      timestamp: Date.now()
    };
    
    this.shortTermMemory.push(event);
    this.updateContextWindow(event);
    
    return event.id;
  }

  sanitizeEventData(data) {
    // Remove large objects and keep only essential data for VPS
    const sanitized = {};
    const allowedKeys = ['action', 'asset', 'price', 'profit', 'pattern', 'confidence'];
    
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }
    
    return sanitized;
  }

  compressOldestEvents() {
    if (this.shortTermMemory.length > this.config.compressionThreshold) {
      const toCompress = this.shortTermMemory.splice(0, 25); // Remove oldest 25 events
      const compressed = this.createCompressedSummary(toCompress);
      
      // Store only essential compressed data
      this.updateLongTermMemory('compressed', Date.now(), compressed);
    }
  }

  createCompressedSummary(events) {
    const summary = {
      count: events.length,
      timespan: {
        start: events[0]?.timestamp,
        end: events[events.length - 1]?.timestamp
      },
      types: {},
      significant: []
    };
    
    events.forEach(event => {
      summary.types[event.type] = (summary.types[event.type] || 0) + 1;
      
      // Only keep truly significant events
      if (this.isHighlySignificant(event)) {
        summary.significant.push({
          type: event.type,
          key: event.data.action || event.data.profit || 'recorded'
        });
      }
    });
    
    return summary;
  }

  isHighlySignificant(event) {
    // More strict significance for VPS
    if (event.type === 'trade' && Math.abs(event.data.profit || 0) > 200) {
      return true;
    }
    if (event.type === 'error' || event.type === 'alert') {
      return true;
    }
    return false;
  }

  async ingestDoctrine(doctrinePath, doctrineId) {
    try {
      const content = await fs.readFile(doctrinePath, 'utf8');
      
      // Limit doctrine size for VPS
      if (content.length > this.config.maxDoctrineSize * 1024 * 1024) {
        throw new Error(`Doctrine too large for VPS (max ${this.config.maxDoctrineSize}MB)`);
      }
      
      let doctrine;
      if (doctrinePath.endsWith('.json')) {
        doctrine = JSON.parse(content);
      } else {
        doctrine = { content: content.substring(0, 10000) }; // Truncate for VPS
      }
      
      this.doctrineLibrary[doctrineId] = {
        id: doctrineId,
        content: doctrine,
        loadedAt: Date.now()
      };
      
      // Extract only essential insights for VPS
      const insights = this.extractEssentialInsights(doctrine);
      this.updateLongTermMemory('doctrine', doctrineId, insights);
      
      this.emit('doctrine_ingested', { doctrineId, insightCount: insights.length });
      return insights;
    } catch (error) {
      console.error(`[MoverMemoryVPS] Failed to ingest doctrine:`, error);
      throw error;
    }
  }

  extractEssentialInsights(doctrine) {
    const insights = [];
    
    // Only extract the most important rules for VPS
    if (doctrine.rules && Array.isArray(doctrine.rules)) {
      doctrine.rules.slice(0, 10).forEach(rule => { // Limit to 10 rules
        insights.push({
          type: 'rule',
          content: typeof rule === 'string' ? rule.substring(0, 200) : rule // Truncate
        });
      });
    }
    
    return insights;
  }

  recall(query, options = {}) {
    const limit = Math.min(options.limit || 5, 10); // Max 10 results for VPS
    const results = {
      shortTerm: [],
      longTerm: []
    };
    
    // Search short-term memory (limited)
    results.shortTerm = this.shortTermMemory
      .filter(event => this.simpleMatch(event, query))
      .slice(-limit);
    
    // Search compressed long-term memory
    Object.entries(this.longTermMemory).forEach(([category, items]) => {
      Object.entries(items).forEach(([key, item]) => {
        if (this.simpleMatch(item.value, query) && results.longTerm.length < limit) {
          results.longTerm.push({
            category,
            key,
            value: item.value
          });
        }
      });
    });
    
    return results;
  }

  simpleMatch(item, query) {
    // Simple string matching for VPS to save CPU
    const itemStr = JSON.stringify(item).toLowerCase();
    return itemStr.includes(query.toLowerCase());
  }

  updateLongTermMemory(category, key, value) {
    // Limit long-term memory categories for VPS
    if (Object.keys(this.longTermMemory).length >= this.config.maxLongTermCategories) {
      if (!this.longTermMemory[category]) {
        return; // Skip if we've hit the limit
      }
    }
    
    if (!this.longTermMemory[category]) {
      this.longTermMemory[category] = {};
    }
    
    this.longTermMemory[category][key] = {
      value,
      updatedAt: Date.now()
    };
  }

  updateContextWindow(event) {
    this.contextWindow.push({
      type: event.type,
      summary: event.type, // Simplified for VPS
      timestamp: event.timestamp
    });
    
    // Keep context window very small for VPS
    if (this.contextWindow.length > 10) {
      this.contextWindow = this.contextWindow.slice(-10);
    }
  }

  async performVPSCleanup() {
    // Aggressive cleanup for VPS
    if (this.shortTermMemory.length > this.config.maxShortTermEvents) {
      this.compressOldestEvents();
    }
    
    // Clean old doctrine if memory is full
    if (Object.keys(this.doctrineLibrary).length > 3) {
      const oldest = Object.entries(this.doctrineLibrary)
        .sort((a, b) => a[1].loadedAt - b[1].loadedAt)[0];
      delete this.doctrineLibrary[oldest[0]];
    }
    
    await this.persistMemory();
  }

  monitorMemoryUsage() {
    const used = process.memoryUsage();
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    
    if (usedMB > 100) { // Alert if using more than 100MB
      console.warn(`[MoverMemoryVPS] High memory usage: ${usedMB}MB`);
      this.performEmergencyCleanup();
    }
  }

  performEmergencyCleanup() {
    // Emergency cleanup when memory is critical
    this.shortTermMemory = this.shortTermMemory.slice(-25); // Keep only last 25 events
    this.contextWindow = this.contextWindow.slice(-5);      // Keep only last 5 context items
    
    // Clear non-essential long-term memory
    Object.keys(this.longTermMemory).forEach(category => {
      if (category !== 'doctrine' && category !== 'compressed') {
        delete this.longTermMemory[category];
      }
    });
    
    console.log('[MoverMemoryVPS] Emergency cleanup performed');
  }

  async persistMemory() {
    try {
      const memoryState = {
        shortTermMemory: this.shortTermMemory.slice(-50), // Only last 50 for VPS
        longTermMemory: this.longTermMemory,
        contextWindow: this.contextWindow,
        timestamp: Date.now()
      };
      
      const filePath = path.join(
        this.config.memoryDir, 
        `memory_${new Date().toISOString().split('T')[0]}.json`
      );
      
      await fs.writeFile(filePath, JSON.stringify(memoryState, null, 0)); // No formatting to save space
    } catch (error) {
      console.error('[MoverMemoryVPS] Failed to persist memory:', error);
    }
  }

  async loadPersistedMemory() {
    try {
      const files = await fs.readdir(this.config.memoryDir);
      const memoryFiles = files.filter(f => f.startsWith('memory_')).sort();
      
      if (memoryFiles.length > 0) {
        const latestFile = memoryFiles[memoryFiles.length - 1];
        const filePath = path.join(this.config.memoryDir, latestFile);
        const content = await fs.readFile(filePath, 'utf8');
        const memoryState = JSON.parse(content);
        
        this.shortTermMemory = (memoryState.shortTermMemory || []).slice(-50);
        this.longTermMemory = memoryState.longTermMemory || {};
        this.contextWindow = (memoryState.contextWindow || []).slice(-10);
        
        console.log(`[MoverMemoryVPS] Loaded memory from ${latestFile}`);
      }
    } catch (error) {
      console.error('[MoverMemoryVPS] Failed to load persisted memory:', error);
    }
  }

  getMemoryStats() {
    const used = process.memoryUsage();
    return {
      shortTermCount: this.shortTermMemory.length,
      longTermCategories: Object.keys(this.longTermMemory),
      doctrineCount: Object.keys(this.doctrineLibrary).length,
      contextWindowSize: this.contextWindow.length,
      heapUsedMB: Math.round(used.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(used.heapTotal / 1024 / 1024)
    };
  }

  cleanup() {
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
    return this.persistMemory();
  }
}

module.exports = MoverMemoryVPS;
