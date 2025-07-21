// ==========================================
// FILE: mover-auto-pools.js
// Auto-investment pools that mirror whale trades
// ==========================================
const EventEmitter = require('events');

class MoverAutoPools extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      pools: config.pools || this.getDefaultPools(),
      executionMode: config.executionMode || 'auto', // 'auto' or 'manual_confirm'
      riskLimits: config.riskLimits || this.getDefaultRiskLimits(),
      ...config
    };
    
    this.poolBalances = new Map();
    this.activePositions = new Map();
    this.executionQueue = [];
    
    // Integration points
    this.moverCore = config.moverCore;
    this.whaleTracker = config.whaleTracker;
    this.tradingEngine = config.tradingEngine;
  }

  getDefaultPools() {
    return {
      congress_pool: {
        name: 'Congressional Trades Pool',
        allocation: 10000,
        whaleFilter: whale => whale.startsWith('congress_'),
        strategy: 'proportional_mirror',
        maxPositionSize: 0.1, // 10% max per position
        rebalanceFrequency: 'weekly'
      },
      
      legends_pool: {
        name: 'Wall Street Legends Pool',
        allocation: 20000,
        whaleFilter: whale => ['buffett', 'burry', 'ackman'].some(l => whale.includes(l)),
        strategy: 'smart_mirror',
        minTradeSize: 1000,
        followOnlyLarge: true, // Only follow $1M+ trades
        rebalanceFrequency: 'monthly'
      },
      
      innovation_pool: {
        name: 'Disruptive Innovation Pool',
        allocation: 15000,
        whaleFilter: whale => whale.includes('ark') || whale.includes('cathie'),
        strategy: 'aggressive_mirror',
        maxPositionSize: 0.15,
        allowOptions: true,
        rebalanceFrequency: 'weekly'
      },
      
      convergence_pool: {
        name: 'Multi-Whale Convergence Pool',
        allocation: 25000,
        whaleFilter: null, // Special pool
        strategy: 'convergence_only',
        minWhaleCount: 2, // Only trade when 2+ whales agree
        convergenceMultiplier: 1.5, // Increase position size
        rebalanceFrequency: 'daily'
      },
      
      crypto_pool: {
        name: 'Crypto Whale Pool',
        allocation: 5000,
        whaleFilter: whale => whale.includes('crypto_') || whale.includes('btc'),
        strategy: 'crypto_mirror',
        assets: ['BTC', 'ETH', 'SOL'],
        useFutures: true,
        rebalanceFrequency: 'daily'
      }
    };
  }

  getDefaultRiskLimits() {
    return {
      maxPositionSize: 0.15, // 15% max per position across all pools
      maxDailyLoss: 0.05, // 5% daily loss limit
      stopLoss: 0.05, // 5% stop loss per position
      takeProfit: 0.25, // 25% take profit
      maxOpenPositions: 20,
      minPoolBalance: 1000 // Minimum $1000 to keep pool active
    };
  }

  async initialize() {
    console.log('[AutoPools] Initializing auto-investment pools...');
    
    // Initialize pool balances
    for (const [poolId, pool] of Object.entries(this.config.pools)) {
      this.poolBalances.set(poolId, pool.allocation);
      console.log(`[AutoPools] ${pool.name}: $${pool.allocation}`);
    }
    
    // Subscribe to whale tracker events
    if (this.whaleTracker) {
      this.whaleTracker.on('whale-trade', this.handleWhaleTrade.bind(this));
    }
    
    // Start execution loop
    this.startExecutionLoop();
    
    console.log('[AutoPools] System initialized with', 
      this.poolBalances.size, 'pools totaling $',
      Array.from(this.poolBalances.values()).reduce((a, b) => a + b, 0)
    );
  }

  async handleWhaleTrade(trade) {
    console.log('[AutoPools] Processing whale trade:', trade);
    
    // Determine which pools should mirror this trade
    const eligiblePools = this.getEligiblePools(trade);
    
    for (const poolId of eligiblePools) {
      const pool = this.config.pools[poolId];
      
      // Special handling for convergence pool
      if (pool.strategy === 'convergence_only') {
        if (!trade.convergenceScore || trade.convergenceWhales.length < pool.minWhaleCount) {
          continue;
        }
      }
      
      // Calculate position size for this pool
      const positionSize = await this.calculatePositionSize(poolId, pool, trade);
      
      if (positionSize > 0) {
        // Add to execution queue
        this.executionQueue.push({
          poolId,
          trade,
          positionSize,
          timestamp: Date.now(),
          status: 'pending'
        });
      }
    }
  }

  getEligiblePools(trade) {
    const eligible = [];
    
    for (const [poolId, pool] of Object.entries(this.config.pools)) {
      // Check if pool has sufficient balance
      if (this.poolBalances.get(poolId) < this.config.riskLimits.minPoolBalance) {
        continue;
      }
      
      // Apply whale filter
      if (pool.whaleFilter && !pool.whaleFilter(trade.whaleId)) {
        continue;
      }
      
      // Check strategy-specific criteria
      if (pool.followOnlyLarge && trade.value < 1000000) {
        continue;
      }
      
      eligible.push(poolId);
    }
    
    return eligible;
  }

  async calculatePositionSize(poolId, pool, trade) {
    const poolBalance = this.poolBalances.get(poolId);
    let baseSize = poolBalance * (pool.maxPositionSize || this.config.riskLimits.maxPositionSize);
    
    // Adjust based on whale confidence/historical performance
    if (trade.confidence) {
      baseSize *= (trade.confidence / 100);
    }
    
    // Convergence multiplier
    if (trade.convergenceScore && pool.convergenceMultiplier) {
      baseSize *= pool.convergenceMultiplier;
    }
    
    // Risk management checks
    const currentPositions = this.getPoolPositions(poolId);
    const totalExposure = currentPositions.reduce((sum, pos) => sum + pos.value, 0);
    
    if (totalExposure + baseSize > poolBalance * 0.8) {
      baseSize = Math.max(0, poolBalance * 0.8 - totalExposure);
    }
    
    return Math.floor(baseSize);
  }

  async startExecutionLoop() {
    const executeNext = async () => {
      if (this.executionQueue.length > 0) {
        const order = this.executionQueue.shift();
        
        if (this.config.executionMode === 'auto') {
          await this.executePoolTrade(order);
        } else {
          // Manual confirmation mode
          this.emit('confirmation-required', order);
        }
      }
      
      setTimeout(executeNext, 1000); // Check every second
    };
    
    executeNext();
  }

  async executePoolTrade(order) {
    console.log(`[AutoPools] Executing trade for ${order.poolId}:`, order);
    
    try {
      // Execute through trading engine if available
      if (this.tradingEngine) {
        const result = await this.tradingEngine.executeTrade({
          action: order.trade.action,
          symbol: order.trade.symbol,
          amount: order.positionSize,
          orderType: 'market',
          metadata: {
            pool: order.poolId,
            whale: order.trade.whale,
            originalTrade: order.trade
          }
        });
        
        if (result.success) {
          // Update pool balance
          const currentBalance = this.poolBalances.get(order.poolId);
          this.poolBalances.set(order.poolId, currentBalance - order.positionSize);
          
          // Track position
          this.trackPosition({
            poolId: order.poolId,
            ...result,
            whale: order.trade.whale
          });
          
          // Emit success event
          this.emit('trade-executed', {
            pool: order.poolId,
            trade: result,
            whale: order.trade.whale
          });
        }
      }
    } catch (error) {
      console.error('[AutoPools] Trade execution error:', error);
      this.emit('trade-error', { order, error });
    }
  }

  trackPosition(position) {
    const poolPositions = this.activePositions.get(position.poolId) || [];
    poolPositions.push({
      ...position,
      openTime: Date.now(),
      stopLoss: position.price * (1 - this.config.riskLimits.stopLoss),
      takeProfit: position.price * (1 + this.config.riskLimits.takeProfit)
    });
    this.activePositions.set(position.poolId, poolPositions);
  }

  getPoolPositions(poolId) {
    return this.activePositions.get(poolId) || [];
  }

  getPoolStats(poolId = null) {
    if (poolId) {
      const positions = this.getPoolPositions(poolId);
      const balance = this.poolBalances.get(poolId);
      const pool = this.config.pools[poolId];
      
      return {
        name: pool.name,
        balance: balance,
        initialAllocation: pool.allocation,
        performance: ((balance - pool.allocation) / pool.allocation) * 100,
        activePositions: positions.length,
        totalValue: balance + positions.reduce((sum, p) => sum + p.value, 0)
      };
    }
    
    // Return all pool stats
    const stats = {};
    for (const poolId of Object.keys(this.config.pools)) {
      stats[poolId] = this.getPoolStats(poolId);
    }
    return stats;
  }
}

module.exports = MoverAutoPools;