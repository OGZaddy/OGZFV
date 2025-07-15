# OGZ Prime API Systems Overview

## Architecture Overview
OGZ Prime features a comprehensive API ecosystem that enables real-time trading operations, data management, user authentication, payment processing, and system monitoring through RESTful endpoints and WebSocket connections.

## Core API Components

### 1. Trading API (api/api.js)
**Purpose**: Core trading operations and system control
**Authentication**: JWT tokens with role-based access
**Base URL**: `/api/trading/`

#### Key Endpoints:
```javascript
// Trading Operations
POST /api/trading/position/open
POST /api/trading/position/close
GET  /api/trading/positions/active
GET  /api/trading/positions/history

// System Control
POST /api/trading/system/start
POST /api/trading/system/stop
GET  /api/trading/system/status
POST /api/trading/system/configure

// Performance Metrics
GET  /api/trading/performance/summary
GET  /api/trading/performance/detailed
GET  /api/trading/performance/metrics
```

**Request/Response Examples**:
```javascript
// Open Position Request
POST /api/trading/position/open
{
    "asset": "BTC-USD",
    "direction": "long",
    "size": 0.05,
    "riskPercent": 2.0,
    "stopLoss": 45000,
    "takeProfit": 52000
}

// Response
{
    "success": true,
    "positionId": "pos_123456789",
    "entryPrice": 48500.00,
    "timestamp": "2025-01-13T09:30:00Z",
    "estimatedRisk": "$1,000"
}
```

### 2. Live Trading Data API (api/live-trading-data.js)
**Purpose**: Real-time market data and trading updates
**Type**: WebSocket + REST hybrid
**Update Frequency**: Real-time (< 100ms latency)

#### WebSocket Events:
```javascript
// Market Data Events
'market_tick'     // Real-time price updates
'trade_executed'  // Trade execution notifications
'risk_alert'      // Risk management alerts
'pattern_detected' // Pattern recognition signals
'system_status'   // System health updates

// Client Subscriptions
{
    "action": "subscribe",
    "channels": ["BTC-USD", "ETH-USD"],
    "types": ["trades", "quotes", "patterns"]
}
```

### 3. Authentication API (api/auth.js)
**Purpose**: User authentication and session management
**Security**: JWT with refresh tokens, 2FA support

#### Authentication Flow:
```javascript
// Login Request
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "securePassword",
    "twoFactorCode": "123456"
}

// Response
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
        "id": "user_123",
        "email": "user@example.com",
        "plan": "professional",
        "permissions": ["trading", "api_access"]
    }
}
```

### 4. Database API (api/database.js)
**Purpose**: Data persistence and retrieval
**Database**: MongoDB with Redis caching
**Features**: Automatic backup, data compression, indexing

#### Data Models:
```javascript
// User Model
{
    "_id": "ObjectId",
    "email": "string",
    "plan": "starter|professional|enterprise",
    "preferences": {
        "riskTolerance": "number",
        "tradingHours": "object",
        "notifications": "object"
    },
    "statistics": {
        "totalTrades": "number",
        "winRate": "number",
        "totalProfit": "number"
    }
}

// Trade Model
{
    "_id": "ObjectId",
    "userId": "ObjectId",
    "asset": "string",
    "direction": "long|short",
    "entryPrice": "number",
    "exitPrice": "number",
    "size": "number",
    "profit": "number",
    "timestamp": "date",
    "strategy": "string",
    "patternId": "string"
}
```

### 5. Website Reporting API (api/website-reporting.js)
**Purpose**: Public metrics and transparency reports
**Access**: Public (rate-limited)
**Features**: Real-time performance dashboards

#### Public Endpoints:
```javascript
GET /api/public/performance/live
GET /api/public/statistics/summary
GET /api/public/testimonials/verified
GET /api/public/system/uptime
```

### 6. Transparency API (api/transparency_api.js)
**Purpose**: Verified trading results and third-party auditing
**Features**: Blockchain verification, audit trails

## Integration Points

### External API Integrations

#### Polygon.io Market Data
```javascript
// Configuration
const polygonConfig = {
    apiKey: process.env.POLYGON_API_KEY,
    baseUrl: "https://api.polygon.io",
    websocket: "wss://socket.polygon.io",
    rateLimits: {
        requestsPerMinute: 1000,
        concurrent: 50
    }
};

// Real-time Data Subscription
websocket.on('connect', () => {
    websocket.send({
        action: 'auth',
        params: polygonConfig.apiKey
    });
    
    websocket.send({
        action: 'subscribe',
        params: 'T.BTC-USD,T.ETH-USD'
    });
});
```

#### Stripe Payment Processing
```javascript
// Payment Intent Creation
const paymentIntent = await stripe.paymentIntents.create({
    amount: 29900, // $299.00
    currency: 'usd',
    customer: customerId,
    metadata: {
        plan: 'professional',
        userId: user.id
    }
});
```

### Internal System Integration

#### Pattern Recognition System
```javascript
// Pattern Analysis Request
POST /api/internal/patterns/analyze
{
    "marketData": {
        "asset": "BTC-USD",
        "timeframe": "1m",
        "candles": [...], // Recent candle data
        "indicators": {...} // Technical indicators
    },
    "context": {
        "volatility": 0.025,
        "volume": 1250000,
        "trend": "bullish"
    }
}
```

#### Risk Management Integration
```javascript
// Risk Validation Request
POST /api/internal/risk/validate
{
    "proposedTrade": {
        "asset": "BTC-USD",
        "size": 0.1,
        "direction": "long",
        "currentPrice": 48500
    },
    "accountStatus": {
        "balance": 50000,
        "openPositions": 2,
        "dailyPnL": -500,
        "weeklyPnL": 2500
    }
}
```

## WebSocket Real-time Architecture

### Connection Management
```javascript
// WebSocket Server Setup
const WebSocketManager = {
    connections: new Map(),
    
    onConnection(socket, userId) {
        this.connections.set(userId, socket);
        this.authenticateUser(userId);
        this.subscribeToUserData(userId);
    },
    
    broadcast(event, data, userFilter = null) {
        const message = JSON.stringify({ event, data });
        
        this.connections.forEach((socket, userId) => {
            if (!userFilter || userFilter(userId)) {
                socket.send(message);
            }
        });
    }
};
```

### Real-time Event Types
```javascript
// Trading Events
{
    "event": "trade_executed",
    "data": {
        "positionId": "pos_123",
        "asset": "BTC-USD",
        "action": "opened",
        "price": 48500,
        "timestamp": "2025-01-13T09:30:00Z"
    }
}

// Risk Events
{
    "event": "risk_alert",
    "data": {
        "type": "drawdown_warning",
        "level": "medium",
        "message": "Portfolio drawdown approaching 8%",
        "recommendedAction": "reduce_position_size"
    }
}

// Pattern Events
{
    "event": "pattern_detected",
    "data": {
        "patternId": "pattern_456",
        "asset": "BTC-USD",
        "confidence": 0.89,
        "type": "bullish_breakout",
        "recommendation": "consider_long_entry"
    }
}
```

## API Security

### Authentication & Authorization
```javascript
// JWT Token Structure
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "userId": "user_123",
        "plan": "professional",
        "permissions": ["trading", "api_access", "admin"],
        "iat": 1673612400,
        "exp": 1673616000
    }
}

// Role-based Access Control
const permissions = {
    "starter": ["view_portfolio", "basic_trading"],
    "professional": ["view_portfolio", "advanced_trading", "api_access"],
    "enterprise": ["all_permissions", "admin_access", "custom_config"]
};
```

### Rate Limiting
```javascript
// Rate Limiting Configuration
const rateLimits = {
    trading: {
        requests: 100,
        window: 60000, // 1 minute
        skipSuccessfulRequests: false
    },
    data: {
        requests: 1000,
        window: 60000,
        skipSuccessfulRequests: true
    },
    public: {
        requests: 50,
        window: 60000
    }
};
```

## Error Handling

### Standard Error Response Format
```javascript
{
    "success": false,
    "error": {
        "code": "INSUFFICIENT_BALANCE",
        "message": "Insufficient account balance for requested trade size",
        "details": {
            "required": 5000,
            "available": 3500,
            "deficit": 1500
        },
        "timestamp": "2025-01-13T09:30:00Z",
        "requestId": "req_789012345"
    }
}
```

### Error Codes
```javascript
const ErrorCodes = {
    // Authentication Errors
    "INVALID_TOKEN": "Authentication token is invalid or expired",
    "INSUFFICIENT_PERMISSIONS": "User lacks required permissions",
    
    // Trading Errors
    "INSUFFICIENT_BALANCE": "Account balance too low for trade",
    "MARKET_CLOSED": "Market is currently closed for trading",
    "INVALID_ASSET": "Specified asset is not supported",
    
    // System Errors
    "SYSTEM_MAINTENANCE": "System is under maintenance",
    "API_LIMIT_EXCEEDED": "API rate limit exceeded",
    "INTERNAL_ERROR": "Internal system error occurred"
};
```

## API Documentation & Testing

### Swagger/OpenAPI Integration
```yaml
openapi: 3.0.0
info:
  title: OGZ Prime Trading API
  version: 2.0.0
  description: Advanced algorithmic trading platform API

paths:
  /api/trading/position/open:
    post:
      summary: Open new trading position
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OpenPositionRequest'
```

### Testing Framework
```javascript
// API Test Suite
describe('Trading API', () => {
    test('should open position with valid parameters', async () => {
        const response = await request(app)
            .post('/api/trading/position/open')
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                asset: 'BTC-USD',
                direction: 'long',
                size: 0.01,
                riskPercent: 1.0
            });
            
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.positionId).toBeDefined();
    });
});
```

This API system provides the backbone for all OGZ Prime operations, enabling seamless integration between trading algorithms, user interfaces, external data sources, and business logic components.
