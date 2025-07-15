# OGZ Prime Core Architecture

## Trading System Flow

### Data Pipeline
1. **Polygon.io WebSocket** → Real-time market data ingestion
2. **PolygonWebSocket.js** → Data processing and tick management
3. **Multi-timeframe Processing** → 1m, 5m, 15m candle aggregation
4. **Technical Analysis** → RSI, MACD, Bollinger Bands, Fibonacci
5. **Pattern Recognition** → Memory-based pattern matching
6. **Trading Decision** → Buy/Sell/Hold with confidence scoring
7. **Position Management** → Entry, management, and exit execution

### Core Classes & Responsibilities

#### OGZPrimeV10 (Main Orchestrator)
- **File:** `OGZPrimeV10.2.js`
- **Role:** Master system coordinator
- **Key Features:**
  - Singleton protection to prevent multiple instances
  - WebSocket server management (ports 3001, 3002, 3003)
  - Profile and configuration management
  - Component initialization and lifecycle
  - Real-time transparency logging via `bot_status.json`

#### OptimizedTradingBrain (Decision Engine)
- **File:** `core/OptimizedTradingBrain.js`
- **Role:** Central trading logic and position management
- **Key Features:**
  - Fee-aware profit calculations (0.35% total round-trip fees)
  - Breakeven withdrawal system (50% at 0.5% profit)
  - Scalper mode with micro-profit targeting
  - Quantum position sizing integration
  - Comprehensive trade logging and performance tracking
  - Risk limits: 5% daily, 15% weekly, 30% monthly loss limits

#### Enhanced Pattern Recognition System
- **File:** `core/EnhancedPatternRecognition.js`
- **Role:** Memory-based pattern matching and learning
- **Key Features:**
  - Pattern similarity threshold: 0.7 (AGGRESSIVE)
  - Minimum confidence threshold: 0.5 (AGGRESSIVE)
  - Pattern memory persistence to disk
  - Trade result feedback for pattern improvement

### Safety Systems Architecture

#### Singleton Protection
- **File:** `CRITICAL_SAFETY.js`
- **Purpose:** Prevent multiple trading instances that could cause conflicting trades
- **Implementation:** File-based lock mechanism with automatic cleanup

#### Risk Management Layers
1. **Position Size Limits:** Max 25% of account per position
2. **Confidence Thresholds:** Enhanced 65% minimum for better win rate
3. **Loss Limits:** Daily (5%), weekly (15%), monthly (30%)
4. **Emergency Stop:** 10% account loss triggers halt
5. **Drawdown Protection:** 20% maximum drawdown limit

### WebSocket Infrastructure

#### Port Allocation
- **3001:** Data streaming (market ticks, candles)
- **3002:** GUI communication (dashboard updates)
- **3003:** Control commands (manual trades, profile changes)

#### Message Types
- `candle` - Real-time market data with indicators
- `trade` - Trade execution notifications
- `analysis` - Market analysis results
- `status` - System status and performance metrics

### Configuration System

#### Profile Management
- **Location:** `profiles/` directory
- **Format:** JSON files named `{ASSET}_{PROFILE}.json`
- **Contains:** Strategy parameters, risk settings, performance history
- **Migration:** Automatic version migration on profile load

#### Asset Support
- **Primary:** BTC-USD (default)
- **Additional:** ETH-USD, SOL-USD, ADA-USD
- **Configuration:** Asset-specific confidence and risk parameters

## Critical Dependencies

### External Services
- **Polygon.io:** Real-time market data (WebSocket)
- **Discord:** Trade notifications (optional)
- **File System:** Pattern memory, logs, profiles

### Internal Modules
- **MaxProfitManager:** Advanced profit-taking strategies
- **FibonacciDetector:** Fibonacci retracement analysis
- **SupportResistanceDetector:** Key level identification
- **RiskManager:** Advanced risk management
- **PerformanceAnalyzer:** AI-powered performance insights

## Operational States

### System States
1. **Initialization:** Component loading and configuration
2. **Connected:** Live data feed established
3. **Analyzing:** Market analysis and pattern matching
4. **Trading:** Active position management
5. **Maintenance:** Hourly optimization cycles
6. **Shutdown:** Graceful cleanup and state preservation

### Trading States
1. **No Position:** Waiting for entry signals
2. **In Position:** Managing active trade
3. **Breakeven Mode:** Partial profit secured, free profit trading
4. **Risk Halt:** Trading stopped due to loss limits
5. **Emergency Stop:** System-wide trading halt

## Performance Targets

### Houston Fund Goal
- **Target:** $25,000 account balance
- **Current Tracking:** Real-time progress monitoring
- **Strategy:** Consistent small profits with strict risk management

### Success Metrics
- **Win Rate:** Target 60%+ with enhanced confidence thresholds
- **Risk-Reward:** 1:2 minimum ratio
- **Drawdown:** Maximum 20% acceptable
- **Daily P&L:** Positive expectancy over 30-day periods

Last Updated: January 12, 2025
