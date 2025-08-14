# THRESHOLD BACKUP - ORIGINAL VALUES BEFORE AGGRESSIVE MODE

**Date:** 2025-08-14  
**Purpose:** Backup of all original confidence thresholds before setting to 0.01  
**Restore Process:** Add these back ONE AT A TIME, not all at once

## 1. profiles/BTC-USD_default.json
```json
Original values:
- "patternSimilarityThreshold": 0.35  (changed from 0.01)
- "minConfidenceThreshold": 0.45      (changed from 0.01)
```

## 2. core/OptimizedTradingBrain.js
```javascript
Original values:
Line ~79: minConfidenceThreshold: 0.45   // ADJUSTED: 45% minimum confidence for live trading
(changed from 0.01)
```

## 3. core/AggressiveTradingMode.js  
```javascript
Original values:
Line ~36: minConfidenceThreshold: 0.25   // VERY LOW - take more trades
(changed from 0.01)
```

## 4. core/TradingProfileManager.js
```javascript
Original values:
Line ~42:  minConfidence: 0.4,    // scalper profile
Line ~72:  minConfidence: 0.5,    // day_trader profile  
Line ~95:  minConfidence: 0.6,    // swing_trader profile
Line ~118: minConfidence: 0.7,    // long_term profile
Line ~141: minConfidence: 0.55,   // adaptive profile
Line ~164: minConfidence: 0.5,    // balanced profile
(all changed from 0.01)
```

## 5. core/MarketRegimeDetector.js
```javascript
Original values:
Line ~125: confidenceThreshold: 0.5,    // Lower threshold for trend trades
Line ~137: confidenceThreshold: 0.7,    // Higher threshold for shorts  
Line ~149: confidenceThreshold: 0.6,    // SIDEWAYS regime
Line ~161: confidenceThreshold: 0.8,    // Very selective (HIGH_VOLATILITY)
Line ~173: confidenceThreshold: 0.7,    // LOW_VOLATILITY
Line ~185: confidenceThreshold: 0.6,    // CONSOLIDATION  
Line ~197: confidenceThreshold: 0.8,    // BREAKOUT
(all changed from 0.01)
```

## 6. core/UltimateQuantumTradingSystem.js
```javascript
Original values:
Line ~317: if (quantumDecision.quantumVolume > 64 && quantumDecision.confidence > 0.9)
Line ~402: return { size: maxCapital * 0.01, confidence: 0.3, mode: 'CONSERVATIVE' };
Line ~407: return { size: maxCapital * 0.005, confidence: 0.1, mode: 'FAILSAFE' };  
Line ~430: return { action: 'HOLD', confidence: 0.5, mode: 'ENSEMBLE_DISAGREEMENT' };
Line ~480: if (quantumDecision.confidence > 0.75 && quantumDecision.realityBendingFactor > 0.5)
Line ~711: if (signal.confidence > 0.8 && signal.quantumAdvantage > 0.6)

Current aggressive values:
- quantumVolume > 8 && confidence > 0.01
- confidence: 0.01 (was 0.3, 0.1, 0.5)  
- confidence > 0.01 (was 0.75, 0.8)
- realityBendingFactor > 0.01 (was 0.5)
- quantumAdvantage > 0.01 (was 0.6)
```

## RESTORATION STRATEGY
**IMPORTANT:** When restoring thresholds:
1. Change ONE threshold at a time
2. Test trading behavior after each change
3. Monitor for 10-15 minutes before next change
4. Start with the most critical files first:
   - OptimizedTradingBrain.js (main trading logic)
   - BTC-USD_default.json (profile settings)
   - UltimateQuantumTradingSystem.js (quantum logic)
   - Then move to regime detectors and profile managers

## FILES MODIFIED
- /root/OGZFV-valhalla/profiles/BTC-USD_default.json
- /root/OGZFV-valhalla/core/OptimizedTradingBrain.js  
- /root/OGZFV-valhalla/core/AggressiveTradingMode.js
- /root/OGZFV-valhalla/core/TradingProfileManager.js
- /root/OGZFV-valhalla/core/MarketRegimeDetector.js
- /root/OGZFV-valhalla/core/UltimateQuantumTradingSystem.js

## CURRENT STATUS
All thresholds set to 0.01 (1%) for maximum trading aggression.
Bot should execute trades on virtually any signal above 1% confidence.