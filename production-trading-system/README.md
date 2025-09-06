# Production Trading System - 4 Microservices Architecture

## Overview
A professional, production-ready crypto trading system split into 4 independent microservices for scalability and reliability.

## Architecture

### 1. **Market Data Service** (`services/market-data`)
- Connects to exchange WebSockets
- Maintains order books
- Streams real-time prices
- Stores historical data
- **Port:** 3001

### 2. **Strategy Engine** (`services/strategy`)
- Runs trading strategies
- Generates signals
- Backtesting capability
- Performance tracking
- **Port:** 3002

### 3. **Execution Service** (`services/execution`)
- Places orders on exchanges
- Manages positions
- Handles stop losses & take profits
- Risk management
- **Port:** 3003

### 4. **Dashboard Service** (`services/dashboard`)
- Web UI for monitoring
- Real-time P&L tracking
- Trade history
- Performance metrics
- **Port:** 3004

## Quick Start

### Prerequisites
```bash
npm install -g pm2
npm install
```

### Environment Setup
Create `.env` file:
```env
# Exchange API Keys
BINANCE_API_KEY=your_key
BINANCE_SECRET=your_secret
COINBASE_API_KEY=your_key
COINBASE_SECRET=your_secret

# Service Configuration
MARKET_DATA_PORT=3001
STRATEGY_PORT=3002
EXECUTION_PORT=3003
DASHBOARD_PORT=3004

# Trading Configuration
INITIAL_BALANCE=10000
MAX_POSITION_SIZE=0.02
STOP_LOSS=0.02
TAKE_PROFIT=0.03

# Database
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://localhost/trading
```

### Start All Services
```bash
# Development
npm run dev

# Production with PM2
npm run start:prod

# Individual services
npm run start:market-data
npm run start:strategy
npm run start:execution
npm run start:dashboard
```

## Service Communication

Services communicate via:
1. **REST APIs** - For commands and queries
2. **WebSockets** - For real-time data
3. **Redis Pub/Sub** - For event streaming
4. **PostgreSQL** - For persistent storage

## API Endpoints

### Market Data Service
```
GET  /api/price/:symbol        - Get current price
GET  /api/orderbook/:symbol    - Get order book
WS   /ws/stream                - Real-time price stream
```

### Strategy Engine
```
POST /api/strategy/backtest    - Run backtest
GET  /api/strategy/signals     - Get current signals
POST /api/strategy/activate    - Activate strategy
```

### Execution Service
```
POST /api/order/place          - Place order
GET  /api/positions            - Get open positions
POST /api/position/close/:id   - Close position
```

### Dashboard Service
```
GET  /                         - Web dashboard
WS   /ws/updates               - Real-time updates
GET  /api/performance          - Performance metrics
```

## Trading Strategies

### 1. Mean Reversion
- RSI oversold/overbought
- Bollinger Band bounces
- Volume confirmation

### 2. Momentum Breakout
- Trend following
- Volume breakouts
- EMA crossovers

### 3. Support/Resistance
- Key level bounces
- Range trading
- Breakout trades

## Risk Management

- **Position Sizing:** Max 2% per trade
- **Stop Loss:** Always set at entry
- **Trailing Stops:** Activate at 1.5% profit
- **Max Exposure:** 6% total portfolio
- **Max Drawdown:** 10% circuit breaker

## Performance Metrics

- Win Rate
- Profit Factor
- Sharpe Ratio
- Maximum Drawdown
- Risk/Reward Ratio
- Average Hold Time

## Backtesting

Run backtests with historical data:
```javascript
const backtest = await backtestEngine.run({
  strategy: 'meanReversion',
  startDate: '2023-01-01',
  endDate: '2024-01-01',
  initialBalance: 10000,
  fees: 0.001
});
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### AWS ECS
```bash
aws ecs create-service --cluster trading --service-definition services.json
```

## Monitoring

- **Grafana Dashboard:** http://localhost:3000
- **Prometheus Metrics:** http://localhost:9090
- **Logs:** PM2 logs or CloudWatch

## Security

- API keys stored in environment variables
- Rate limiting on all endpoints
- SSL/TLS for all connections
- IP whitelist for production
- 2FA for exchange accounts

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

## Production Checklist

- [ ] Exchange API keys configured
- [ ] Database connections verified
- [ ] SSL certificates installed
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] Error handling tested
- [ ] Rate limits configured
- [ ] Security audit completed

## Support

For issues or questions:
- Check logs: `pm2 logs`
- Debug mode: `npm run debug`
- Health check: `curl http://localhost:3001/health`

## License

Private - Do not distribute