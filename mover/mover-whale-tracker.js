// ==========================================
// FILE: mover-whale-tracker.js
// The Whale Tracking Engine - follows Congressional trades, hedge funds, Cathie Wood
// ==========================================
const EventEmitter = require('events');
const axios = require('axios');

class MoverWhaleTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      updateInterval: config.updateInterval || 300000, // 5 minutes
      whales: config.whales || this.getDefaultWhales(),
      apis: config.apis || this.getDefaultAPIs(),
      ...config
    };
    
    this.trackedWhales = new Map();
    this.whaleHistory = new Map();
    this.activeAlerts = new Set();
    
    // Integration with other mover components
    this.moverCore = config.moverCore;
    this.moverMemory = config.moverMemory;
    this.autoPools = null; // Will be set by mover-auto-pools.js
  }

  getDefaultWhales() {
    return {
      // Politicians tracked by Dub and others
      congress: {
        pelosi: { 
          id: 'P000197', 
          name: 'Nancy Pelosi',
          historicalReturn: 119.57,
          strategy: 'tech_focused',
          weight: 0.3
        },
        crenshaw: { 
          id: 'C001120', 
          name: 'Dan Crenshaw',
          historicalReturn: 41.0,
          strategy: 'diversified',
          weight: 0.2
        },
        tuberville: { 
          id: 'T000278', 
          name: 'Tommy Tuberville',
          historicalReturn: 38.2,
          strategy: 'defense_energy',
          weight: 0.15
        },
        hern: { 
          id: 'H001082', 
          name: 'Kevin Hern',
          historicalReturn: 35.5,
          strategy: 'small_cap',
          weight: 0.15
        },
        gottheimer: { 
          id: 'G000583', 
          name: 'Josh Gottheimer',
          historicalReturn: 42.1,
          strategy: 'finance_tech',
          weight: 0.2
        }
      },
      
      // Fund Managers
      funds: {
        cathie_wood: {
          funds: ['ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF'],
          strategy: 'disruptive_innovation',
          updateFrequency: 'daily',
          weight: 0.4
        },
        michael_burry: {
          cik: '0001649339', // Scion Asset Management
          strategy: 'contrarian_value',
          updateFrequency: 'quarterly',
          weight: 0.25
        },
        bill_ackman: {
          cik: '0001202104', // Pershing Square
          strategy: 'activist_concentrated',
          updateFrequency: 'quarterly',
          weight: 0.25
        },
        warren_buffett: {
          cik: '0001067983', // Berkshire Hathaway
          strategy: 'value_longterm',
          minPositionSize: 1000000000, // Only $1B+ moves
          weight: 0.1
        }
      },
      
      // Crypto Whales
      crypto: {
        michael_saylor: {
          company: 'MicroStrategy',
          ticker: 'MSTR',
          asset: 'BTC',
          strategy: 'btc_maximalist',
          weight: 0.3
        },
        tesla: {
          ticker: 'TSLA',
          trackingField: 'btc_holdings',
          weight: 0.2
        },
        ark_bitcoin: {
          fund: 'ARKB',
          strategy: 'btc_etf',
          weight: 0.25
        },
        grayscale: {
          products: ['GBTC', 'ETHE', 'ETCG'],
          strategy: 'crypto_trusts',
          weight: 0.25
        }
      }
    };
  }

  getDefaultAPIs() {
    return {
      congress: {
        quiver: 'https://api.quiverquant.com/beta/congress/trades',
        capitoltrades: 'https://www.capitoltrades.com/api',
        housestockwatcher: 'https://housestockwatcher.com/api'
      },
      sec: {
        edgar: 'https://www.sec.gov/cgi-bin/browse-edgar',
        form13f: 'https://www.sec.gov/Archives/edgar/data'
      },
      ark: {
        trades: 'https://ark-funds.com/auto/trades/ARK_Trades.csv',
        holdings: 'https://ark-funds.com/holdings'
      },
      options: {
        unusualwhales: 'https://unusualwhales.com/api',
        flowAlgo: 'https://www.flowalgo.com/api'
      }
    };
  }

  async initialize() {
    console.log('[WhaleTracker] Initializing whale tracking system...');
    
    // Load historical whale performance
    await this.loadWhaleHistory();
    
    // Start monitoring loops
    this.startCongressMonitoring();
    this.startFundMonitoring();
    this.startCryptoMonitoring();
    this.startARKDailyMonitoring();
    
    console.log('[WhaleTracker] System initialized. Tracking', 
      Object.values(this.config.whales).flat().length, 'whales');
  }

  async startCongressMonitoring() {
    const checkCongress = async () => {
      try {
        for (const [key, whale] of Object.entries(this.config.whales.congress)) {
          const trades = await this.fetchCongressionalTrades(whale.id);
          
          if (trades && trades.length > 0) {
            const newTrades = this.filterNewTrades(trades, `congress_${key}`);
            
            for (const trade of newTrades) {
              await this.processWhaleTrade({
                whale: whale.name,
                whaleId: `congress_${key}`,
                ...trade,
                confidence: whale.historicalReturn,
                strategy: whale.strategy
              });
            }
          }
        }
      } catch (error) {
        console.error('[WhaleTracker] Congress monitoring error:', error);
      }
    };
    
    // Check immediately then set interval
    await checkCongress();
    setInterval(checkCongress, this.config.updateInterval);
  }

  async startARKDailyMonitoring() {
    const checkARK = async () => {
      try {
        const arkTrades = await this.fetchARKTrades();
        
        for (const trade of arkTrades) {
          if (trade.direction === 'Buy' && trade.weight > 0.5) {
            await this.processWhaleTrade({
              whale: 'Cathie Wood',
              whaleId: 'ark_invest',
              symbol: trade.ticker,
              action: 'BUY',
              shares: trade.shares,
              fund: trade.fund,
              weight: trade.weight,
              confidence: 85, // ARK has good track record
              strategy: 'disruptive_innovation',
              urgency: 'high' // Daily updates = fresh signals
            });
          }
        }
      } catch (error) {
        console.error('[WhaleTracker] ARK monitoring error:', error);
      }
    };
    
    // ARK updates daily at 7 PM ET, check every hour
    await checkARK();
    setInterval(checkARK, 3600000); // 1 hour
  }

  async processWhaleTrade(trade) {
    console.log(`[WhaleTracker] New whale trade detected:`, trade);
    
    // Store in memory for pattern analysis
    if (this.moverMemory) {
      await this.moverMemory.recordWhaleActivity(trade);
    }
    
    // Check if multiple whales are in same position
    const convergence = await this.checkWhaleConvergence(trade.symbol);
    if (convergence.count > 1) {
      trade.convergenceScore = convergence.score;
      trade.convergenceWhales = convergence.whales;
    }
    
    // Emit for auto-pools to handle
    this.emit('whale-trade', trade);
    
    // Emit for alerts
    this.emit('alert-required', {
      type: 'whale-trade',
      priority: trade.urgency || 'normal',
      data: trade
    });
    
    // Update whale history
    this.updateWhaleHistory(trade.whaleId, trade);
  }

  async checkWhaleConvergence(symbol) {
    const activePositions = await this.getActiveWhalePositions(symbol);
    const score = activePositions.reduce((sum, pos) => {
      return sum + (pos.confidence || 50);
    }, 0) / activePositions.length;
    
    return {
      count: activePositions.length,
      score: score,
      whales: activePositions.map(p => p.whale)
    };
  }

  async fetchCongressionalTrades(congressId) {
    // Implementation would hit actual APIs
    // For now, returning mock structure
    console.log(`[WhaleTracker] Fetching trades for ${congressId}`);
    
    // Would implement actual API calls to:
    // - QuiverQuant
    // - CapitolTrades
    // - House Stock Watcher
    
    return [];
  }

  async fetchARKTrades() {
    // Would fetch from ARK's daily CSV
    console.log('[WhaleTracker] Fetching ARK Invest daily trades');
    return [];
  }

  filterNewTrades(trades, whaleId) {
    const lastCheck = this.whaleHistory.get(whaleId)?.lastCheck || 0;
    return trades.filter(trade => trade.timestamp > lastCheck);
  }

  updateWhaleHistory(whaleId, trade) {
    const history = this.whaleHistory.get(whaleId) || { trades: [], stats: {} };
    history.trades.push(trade);
    history.lastCheck = Date.now();
    this.whaleHistory.set(whaleId, history);
  }

  async loadWhaleHistory() {
    // Load from mover memory if available
    if (this.moverMemory) {
      const history = await this.moverMemory.getWhaleHistory();
      if (history) {
        this.whaleHistory = new Map(Object.entries(history));
      }
    }
  }

  getWhaleStats(whaleId) {
    const history = this.whaleHistory.get(whaleId);
    if (!history) return null;
    
    const trades = history.trades || [];
    const winners = trades.filter(t => t.result === 'profit').length;
    const winRate = trades.length > 0 ? (winners / trades.length) * 100 : 0;
    
    return {
      totalTrades: trades.length,
      winRate: winRate,
      avgReturn: trades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / trades.length,
      lastTrade: trades[trades.length - 1]
    };
  }

  async getActiveWhalePositions(symbol = null) {
    const positions = [];
    
    for (const [whaleId, history] of this.whaleHistory.entries()) {
      const recentTrades = history.trades.filter(t => 
        Date.now() - t.timestamp < 30 * 24 * 60 * 60 * 1000 // 30 days
      );
      
      for (const trade of recentTrades) {
        if (!symbol || trade.symbol === symbol) {
          positions.push({
            whale: trade.whale,
            whaleId: whaleId,
            ...trade
          });
        }
      }
    }
    
    return positions;
  }
}

module.exports = MoverWhaleTracker;