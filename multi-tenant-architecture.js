// ==========================================
// MULTI-TENANT ARCHITECTURE
// One server, many customers
// ==========================================

class MultiTenantTradingPlatform {
  constructor() {
    this.customers = new Map(); // customerId -> customer instance
    this.activeBots = new Map(); // customerId -> bot instance
  }

  // Customer signs up on website
  async registerCustomer(email, tier, paymentInfo) {
    const customerId = generateId();
    
    const customer = {
      id: customerId,
      email,
      tier, // starter, pro, valhalla, odin
      apiKeys: {}, // their exchange API keys
      limits: this.getTierLimits(tier),
      balance: 0,
      trades: [],
      createdAt: Date.now()
    };
    
    // Store in database
    await db.customers.insert(customer);
    this.customers.set(customerId, customer);
    
    return { customerId, loginToken: generateToken() };
  }

  // Customer starts their bot
  async startBot(customerId, config) {
    const customer = this.customers.get(customerId);
    
    // Check tier limits
    if (!this.canStartBot(customer)) {
      throw new Error('Tier limit reached');
    }
    
    // Create isolated bot instance
    const bot = new TradingBot({
      ...config,
      customerId,
      tier: customer.tier,
      traiAccess: customer.tier !== 'starter', // TRAI only for paid tiers
      maxTrades: customer.limits.maxDailyTrades,
      maxBalance: customer.limits.maxBalance
    });
    
    // Bot runs in same process but isolated context
    bot.on('trade', (trade) => {
      this.recordTrade(customerId, trade);
    });
    
    this.activeBots.set(customerId, bot);
    await bot.start();
  }

  getTierLimits(tier) {
    const limits = {
      starter: {
        maxDailyTrades: 10,
        maxBalance: 1000,
        traiRequests: 0,
        updateInterval: 60000 // 1 min
      },
      pro: {
        maxDailyTrades: 100,
        maxBalance: 10000,
        traiRequests: 100,
        updateInterval: 30000 // 30 sec
      },
      valhalla: {
        maxDailyTrades: 1000,
        maxBalance: 100000,
        traiRequests: 1000,
        updateInterval: 5000 // 5 sec
      },
      odin: {
        maxDailyTrades: -1, // unlimited
        maxBalance: -1,
        traiRequests: -1,
        updateInterval: 1000 // 1 sec
      }
    };
    return limits[tier];
  }
}

// ==========================================
// ACTUAL IMPLEMENTATION
// ==========================================

// 1. Single SSL server handles ALL customers
// 2. Each customer connects via WebSocket with auth token
// 3. Server routes messages to correct bot instance
// 4. Database stores all customer data
// 5. PM2 manages the single Node.js process

// NO DOCKER CONTAINERS PER CUSTOMER
// NO SEPARATE PORTS PER CUSTOMER
// NO ISOLATED PROCESSES PER CUSTOMER

// Just like Netflix doesn't spin up a server for each user!