# OGZFV Test Harness

Production validation test suite to ensure system integrity across all components.

## Tests Included

### 1. Production Match Test (`prod-match-test.js`)
- **Purpose**: Validates that BACKTEST and PAPER modes produce identical trading decisions
- **Expected**: Same action, confidence delta ≤ 5%
- **Validates**: UnifiedTradingCore consistency

### 2. Scalper Cache Test (`scalper-cache-test.js`)
- **Purpose**: Ensures OptimizedIndicators activates scalper mode with optimized MACD periods (8,17,6)
- **Expected**: Console shows "🚀 SCALPER MACD: Using optimized periods (8, 17, 6)" 
- **Validates**: Indicator optimization system

### 3. Volatility Spike Test (`volatility-spike-test.js`)
- **Purpose**: Confirms EnhancedTimeframeManager invalidates cache during high volatility
- **Expected**: Cache invalidations ≥ 1 when volatility exceeds threshold
- **Validates**: Risk management cache invalidation

## Running Tests

### Run All Tests
```bash
node tests/harness/run-all-tests.js
```

### Run Individual Tests
```bash
node tests/harness/prod-match-test.js
node tests/harness/scalper-cache-test.js
node tests/harness/volatility-spike-test.js
```

### Add to package.json
```json
{
  "scripts": {
    "test:harness": "node tests/harness/run-all-tests.js",
    "test:production": "node tests/harness/prod-match-test.js",
    "test:scalper": "node tests/harness/scalper-cache-test.js",
    "test:volatility": "node tests/harness/volatility-spike-test.js"
  }
}
```

## Success Criteria

- All tests must pass before production deployment
- Tests validate core trading logic integrity
- Ensures system reliability under various market conditions
- Confirms optimization systems are functioning correctly

## Path Dependencies

Tests expect modules at these locations:
- `../../core/UnifiedTradingCore.js`
- `../../OptimizedIndicators.js` 
- `../../EnhancedTimeframeManager.js`

Adjust require paths in test files if your structure differs.