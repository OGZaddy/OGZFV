# 🧠 OGZ Prime Trading Profiles - Complete Specification Sheet

## 📊 Master Trading Profile Comparison

| Profile | Aggressiveness | Risk Level | Expected Trades/Day | Profit Target | Stop Loss | Hold Time | Fee Tolerance | Pattern Focus |
|---------|----------------|------------|-------------------|---------------|-----------|-----------|---------------|---------------|
| **scalper** | ⚡ ULTRA HIGH (95%) | 🔴 EXTREME | 150-200+ | 0.5%+ | 0.5% | 30s-5min | HIGH | Micro-patterns |
| **btc_scalper** | ⚡ MAXIMUM (98%) | 🔴 EXTREME | 200-300+ | 0.3%+ | 0.3% | 15s-2min | MAXIMUM | BTC-specific |
| **conservative** | 🐌 MINIMAL (15%) | 🟢 ULTRA LOW | 3-8 | 3%+ | 2% | 2-24hrs | LOW | Major trends |
| **aggressive** | 🔥 HIGH (80%) | 🟠 HIGH | 40-80 | 1.5%+ | 1% | 5min-2hrs | MEDIUM | Strong signals |
| **quantum** | ⚛️ ADAPTIVE (60%) | 🟡 MEDIUM | 80-120 | 2%+ | 1.5% | 10min-4hrs | MEDIUM | Quantum states |
| **balanced** | ⚖️ MODERATE (50%) | 🟡 MEDIUM | 15-30 | 2.5%+ | 2% | 30min-8hrs | MEDIUM | Multi-timeframe |
| **day_trader** | 📈 MODERATE (55%) | 🟡 MEDIUM | 10-20 | 2%+ | 1.5% | 1-8hrs | MEDIUM | Daily patterns |
| **swing** | 🌊 LOW (25%) | 🟢 LOW | 1-5 | 5%+ | 3% | 1-7 days | LOW | Swing patterns |
| **cosmic_trader** | 🌌 VARIABLE (70%) | 🟠 HIGH | 50-100 | 3%+ | 2% | 15min-6hrs | HIGH | Cosmic signals |

---

## 🎯 Detailed Profile Specifications

### ⚡ **SCALPER Profile**
```yaml
Profile: scalper
Risk_Tolerance: EXTREME (95%)
Position_Size: 1-5% per trade
Max_Trades_Day: 150-200
Target_Profit: 0.5-0.8% (FEE-AWARE)
Stop_Loss: 0.5%
Max_Hold_Time: 5 minutes
Fee_Awareness: HIGH (0.35% round-trip considered)
Pattern_Types: [micro_breakout, momentum_burst, scalp_reversal]
Confidence_Threshold: 10% (ultra-aggressive)
Timeframes: [1m, 5m]
Pattern_File: BTC-USD_scalper_patterns.json
```

### ⚡ **BTC_SCALPER Profile**
```yaml
Profile: btc_scalper
Risk_Tolerance: MAXIMUM (98%)
Position_Size: 2-8% per trade
Max_Trades_Day: 200-300
Target_Profit: 0.3-0.6% (EXTREME FEE-AWARE)
Stop_Loss: 0.3%
Max_Hold_Time: 2 minutes
Fee_Awareness: MAXIMUM (0.35% round-trip critical)
Pattern_Types: [btc_micro_move, sat_scalp, lightning_reversal]
Confidence_Threshold: 5% (maximum aggression)
Timeframes: [1m]
Pattern_File: BTC-USD_btc_scalper_patterns.json
```

### 🐌 **CONSERVATIVE Profile**
```yaml
Profile: conservative
Risk_Tolerance: ULTRA_LOW (15%)
Position_Size: 0.5-2% per trade
Max_Trades_Day: 3-8
Target_Profit: 3-5%
Stop_Loss: 2%
Max_Hold_Time: 24 hours
Fee_Awareness: LOW (fees less critical on large moves)
Pattern_Types: [major_trend, strong_breakout, high_confidence]
Confidence_Threshold: 70% (ultra-safe)
Timeframes: [15m, 1h, 4h]
Pattern_File: BTC-USD_conservative_patterns.json
```

### 🔥 **AGGRESSIVE Profile**
```yaml
Profile: aggressive
Risk_Tolerance: HIGH (80%)
Position_Size: 2-6% per trade
Max_Trades_Day: 40-80
Target_Profit: 1.5-3%
Stop_Loss: 1%
Max_Hold_Time: 2 hours
Fee_Awareness: MEDIUM
Pattern_Types: [momentum_surge, aggressive_breakout, volatility_play]
Confidence_Threshold: 20% (high aggression)
Timeframes: [1m, 5m, 15m]
Pattern_File: BTC-USD_aggressive_patterns.json
```

### ⚛️ **QUANTUM Profile**
```yaml
Profile: quantum
Risk_Tolerance: ADAPTIVE (60%)
Position_Size: 1-4% per trade (quantum-adjusted)
Max_Trades_Day: 80-120
Target_Profit: 2-4%
Stop_Loss: 1.5%
Max_Hold_Time: 4 hours
Fee_Awareness: MEDIUM
Pattern_Types: [quantum_state, superposition_break, entanglement_signal]
Confidence_Threshold: 25% (quantum-enhanced)
Timeframes: [1m, 5m, 15m, 1h]
Pattern_File: BTC-USD_quantum_patterns.json
```

### ⚖️ **BALANCED Profile**
```yaml
Profile: balanced
Risk_Tolerance: MODERATE (50%)
Position_Size: 1-3% per trade
Max_Trades_Day: 15-30
Target_Profit: 2.5-4%
Stop_Loss: 2%
Max_Hold_Time: 8 hours
Fee_Awareness: MEDIUM
Pattern_Types: [balanced_breakout, multi_timeframe, confluence_signal]
Confidence_Threshold: 35% (balanced approach)
Timeframes: [5m, 15m, 1h]
Pattern_File: BTC-USD_balanced_patterns.json
```

### 📈 **DAY_TRADER Profile**
```yaml
Profile: day_trader
Risk_Tolerance: MODERATE (55%)
Position_Size: 1.5-3.5% per trade
Max_Trades_Day: 10-20
Target_Profit: 2-3.5%
Stop_Loss: 1.5%
Max_Hold_Time: 8 hours (closes all by EOD)
Fee_Awareness: MEDIUM
Pattern_Types: [daily_momentum, intraday_trend, session_breakout]
Confidence_Threshold: 30% (day trading focused)
Timeframes: [15m, 1h, 4h]
Pattern_File: BTC-USD_day_trader_patterns.json
```

### 🌊 **SWING Profile**
```yaml
Profile: swing
Risk_Tolerance: LOW (25%)
Position_Size: 0.8-2.5% per trade
Max_Trades_Day: 1-5
Target_Profit: 5-15%
Stop_Loss: 3%
Max_Hold_Time: 7 days
Fee_Awareness: LOW (fees negligible on swing trades)
Pattern_Types: [swing_reversal, trend_continuation, major_support_resistance]
Confidence_Threshold: 60% (swing precision)
Timeframes: [1h, 4h, 1d]
Pattern_File: BTC-USD_swing_patterns.json
```

### 🌌 **COSMIC_TRADER Profile**
```yaml
Profile: cosmic_trader
Risk_Tolerance: VARIABLE (70%)
Position_Size: 2-5% per trade (cosmic-adjusted)
Max_Trades_Day: 50-100
Target_Profit: 3-6%
Stop_Loss: 2%
Max_Hold_Time: 6 hours
Fee_Awareness: HIGH
Pattern_Types: [cosmic_alignment, universal_signal, dimensional_breakout]
Confidence_Threshold: 15% (cosmic enhancement)
Timeframes: [1m, 5m, 15m, 1h]
Pattern_File: BTC-USD_cosmic_trader_patterns.json
```

---

## 🔗 Pattern Integration System

### Pattern File Mapping:
- **File Location**: `./data/patterns/profiles/`
- **Naming Convention**: `BTC-USD_{profile_name}_patterns.json`
- **Auto-Generated**: ✅ All 9 profiles have dedicated pattern files
- **Profile Isolation**: ✅ Each profile learns independently
- **Pattern Decay**: ✅ 10% confidence loss after 7 days
- **Trade Result Recording**: ✅ Integrated with ProfilePatternManager

### Pattern Learning Features:
1. **Profile-Specific Storage**: Each profile saves patterns separately
2. **Pattern Decay System**: Old patterns lose relevance over time
3. **Trade Result Integration**: Win/loss rates tracked per profile
4. **Confidence Boosting**: Successful patterns gain higher weight
5. **Market Condition Tagging**: Patterns tagged with market state
6. **Multi-Timeframe Support**: Patterns work across different timeframes
7. **Automatic Export**: Patterns can be exported for analysis

---

## ⚠️ Critical Safety Integration

### Safety Thresholds by Profile:
| Profile | Volatility Limit | Emergency Stop | Max Drawdown | Circuit Breaker |
|---------|------------------|----------------|--------------|-----------------|
| scalper | 50% | 5 losses/hour | 10% | YES |
| btc_scalper | 60% | 8 losses/hour | 15% | YES |
| conservative | 15% | 2 losses/day | 5% | YES |
| aggressive | 40% | 6 losses/hour | 12% | YES |
| quantum | 35% | Quantum-adjusted | 8% | ADAPTIVE |
| balanced | 25% | 4 losses/hour | 7% | YES |
| day_trader | 30% | 3 losses/session | 8% | YES |
| swing | 20% | 1 loss/day | 6% | YES |
| cosmic_trader | 45% | Cosmic-adjusted | 10% | VARIABLE |

---

## 🎮 Usage Instructions

1. **Load Profile**: `ogzPrime.loadTradingProfile('profile_name')`
2. **Check Current**: `ogzPrime.getCurrentProfile()`
3. **Switch Profile**: `ogzPrime.switchProfile('new_profile')`
4. **View Patterns**: `profilePatternManager.getPatterns('profile_name')`
5. **Export Data**: `profilePatternManager.exportProfile('profile_name')`

---

**📝 Note**: All profiles automatically integrate with the ProfilePatternManager for isolated learning and pattern recognition. Each profile maintains its own pattern database to prevent cross-contamination of trading strategies.