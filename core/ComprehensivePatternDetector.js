/**
 * COMPREHENSIVE PATTERN DETECTOR
 * Complete candlestick pattern detection with tier system
 */

class ComprehensivePatternDetector {
  constructor() {
    // TIER 1 - Basic Patterns (High reliability, easy to spot)
    this.tier1Patterns = {
      // Single Candle Patterns
      DRAGONFLY_DOJI: {
        name: 'Dragonfly Doji',
        type: 'reversal',
        direction: 'bullish',
        bars: 1,
        reliability: 0.65,
        detect: (candles) => this.detectDragonflyDoji(candles)
      },
      GRAVESTONE_DOJI: {
        name: 'Gravestone Doji',
        type: 'reversal',
        direction: 'bearish',
        bars: 1,
        reliability: 0.65,
        detect: (candles) => this.detectGravestoneDoji(candles)
      },
      LONG_BLACK: {
        name: 'Long Black Candle',
        type: 'continuation',
        direction: 'bearish',
        bars: 1,
        reliability: 0.60,
        detect: (candles) => this.detectLongBlack(candles)
      },
      SPINNING_TOP: {
        name: 'Spinning Top',
        type: 'indecision',
        direction: 'neutral',
        bars: 1,
        reliability: 0.50,
        detect: (candles) => this.detectSpinningTop(candles)
      },
      LONG_LEGGED_DOJI: {
        name: 'Long Legged Doji',
        type: 'indecision',
        direction: 'neutral',
        bars: 1,
        reliability: 0.55,
        detect: (candles) => this.detectLongLeggedDoji(candles)
      },
      BELT_HOLD_BULLISH: {
        name: 'Bullish Belt Hold',
        type: 'reversal',
        direction: 'bullish',
        bars: 1,
        reliability: 0.60,
        detect: (candles) => this.detectBullishBeltHold(candles)
      },
      BELT_HOLD_BEARISH: {
        name: 'Bearish Belt Hold',
        type: 'reversal',
        direction: 'bearish',
        bars: 1,
        reliability: 0.60,
        detect: (candles) => this.detectBearishBeltHold(candles)
      },
      HANGING_MAN: {
        name: 'Hanging Man',
        type: 'reversal',
        direction: 'bearish',
        bars: 1,
        reliability: 0.65,
        detect: (candles) => this.detectHangingMan(candles)
      },
      HAMMER: {
        name: 'Hammer',
        type: 'reversal',
        direction: 'bullish',
        bars: 1,
        reliability: 0.65,
        detect: (candles) => this.detectHammer(candles)
      },
      BULLISH_ENGULFING: {
        name: 'Bullish Engulfing',
        type: 'reversal',
        direction: 'bullish',
        bars: 2,
        reliability: 0.70,
        detect: (candles) => this.detectBullishEngulfing(candles)
      },
      BEARISH_ENGULFING: {
        name: 'Bearish Engulfing',
        type: 'reversal',
        direction: 'bearish',
        bars: 2,
        reliability: 0.70,
        detect: (candles) => this.detectBearishEngulfing(candles)
      }
    };

    // TIER 2 - Intermediate Patterns
    this.tier2Patterns = {
      // Bullish Reversal Patterns
      BULLISH_HARAMI: {
        name: 'Bullish Harami',
        type: 'reversal',
        direction: 'bullish',
        bars: 2,
        reliability: 0.68,
        detect: (candles) => this.detectBullishHarami(candles)
      },
      BULLISH_HARAMI_CROSS: {
        name: 'Bullish Harami Cross',
        type: 'reversal',
        direction: 'bullish',
        bars: 2,
        reliability: 0.70,
        detect: (candles) => this.detectBullishHaramiCross(candles)
      },
      BULLISH_INVERTED_HAMMER: {
        name: 'Bullish Inverted Hammer',
        type: 'reversal',
        direction: 'bullish',
        bars: 1,
        reliability: 0.65,
        detect: (candles) => this.detectBullishInvertedHammer(candles)
      },
      BULLISH_DOJI_STAR: {
        name: 'Bullish Doji Star',
        type: 'reversal',
        direction: 'bullish',
        bars: 2,
        reliability: 0.68,
        detect: (candles) => this.detectBullishDojiStar(candles)
      },
      BULLISH_MEETING_LINE: {
        name: 'Bullish Meeting Line',
        type: 'reversal',
        direction: 'bullish',
        bars: 2,
        reliability: 0.65,
        detect: (candles) => this.detectBullishMeetingLine(candles)
      },
      BULLISH_PIERCING_LINE: {
        name: 'Bullish Piercing Line',
        type: 'reversal',
        direction: 'bullish',
        bars: 2,
        reliability: 0.72,
        detect: (candles) => this.detectBullishPiercingLine(candles)
      },
      BULLISH_THRUSTING_LINE: {
        name: 'Bullish Thrusting Line',
        type: 'continuation',
        direction: 'bullish',
        bars: 2,
        reliability: 0.60,
        detect: (candles) => this.detectBullishThrustingLine(candles)
      },
      BULLISH_SEPARATING_LINE: {
        name: 'Bullish Separating Line',
        type: 'continuation',
        direction: 'bullish',
        bars: 2,
        reliability: 0.63,
        detect: (candles) => this.detectBullishSeparatingLine(candles)
      },
      BULLISH_NECK_LINE: {
        name: 'Bullish Neck Line',
        type: 'continuation',
        direction: 'bullish',
        bars: 2,
        reliability: 0.60,
        detect: (candles) => this.detectBullishNeckLine(candles)
      },
      
      // Bearish Reversal Patterns
      BEARISH_HARAMI: {
        name: 'Bearish Harami',
        type: 'reversal',
        direction: 'bearish',
        bars: 2,
        reliability: 0.68,
        detect: (candles) => this.detectBearishHarami(candles)
      },
      BEARISH_HARAMI_CROSS: {
        name: 'Bearish Harami Cross',
        type: 'reversal',
        direction: 'bearish',
        bars: 2,
        reliability: 0.70,
        detect: (candles) => this.detectBearishHaramiCross(candles)
      },
      BEARISH_INVERTED_HAMMER: {
        name: 'Bearish Inverted Hammer',
        type: 'reversal',
        direction: 'bearish',
        bars: 1,
        reliability: 0.65,
        detect: (candles) => this.detectBearishInvertedHammer(candles)
      },
      BEARISH_DOJI_STAR: {
        name: 'Bearish Doji Star',
        type: 'reversal',
        direction: 'bearish',
        bars: 2,
        reliability: 0.68,
        detect: (candles) => this.detectBearishDojiStar(candles)
      },
      BEARISH_MEETING_LINE: {
        name: 'Bearish Meeting Line',
        type: 'reversal',
        direction: 'bearish',
        bars: 2,
        reliability: 0.65,
        detect: (candles) => this.detectBearishMeetingLine(candles)
      },
      DARK_CLOUD_COVER: {
        name: 'Dark Cloud Cover',
        type: 'reversal',
        direction: 'bearish',
        bars: 2,
        reliability: 0.72,
        detect: (candles) => this.detectDarkCloudCover(candles)
      },
      BEARISH_THRUSTING_LINE: {
        name: 'Bearish Thrusting Line',
        type: 'continuation',
        direction: 'bearish',
        bars: 2,
        reliability: 0.60,
        detect: (candles) => this.detectBearishThrustingLine(candles)
      },
      BEARISH_SEPARATING_LINE: {
        name: 'Bearish Separating Line',
        type: 'continuation',
        direction: 'bearish',
        bars: 2,
        reliability: 0.63,
        detect: (candles) => this.detectBearishSeparatingLine(candles)
      },
      BEARISH_NECK_LINE: {
        name: 'Bearish Neck Line',
        type: 'continuation',
        direction: 'bearish',
        bars: 2,
        reliability: 0.60,
        detect: (candles) => this.detectBearishNeckLine(candles)
      }
    };

    // TIER 3 - Advanced Patterns (Complex, high reliability)
    this.tier3Patterns = {
      // Bullish Patterns
      THREE_INSIDE_UP: {
        name: 'Three Inside Up',
        type: 'reversal',
        direction: 'bullish',
        bars: 3,
        reliability: 0.75,
        detect: (candles) => this.detectThreeInsideUp(candles)
      },
      THREE_OUTSIDE_UP: {
        name: 'Three Outside Up',
        type: 'reversal',
        direction: 'bullish',
        bars: 3,
        reliability: 0.75,
        detect: (candles) => this.detectThreeOutsideUp(candles)
      },
      THREE_WHITE_SOLDIERS: {
        name: 'Three White Soldiers',
        type: 'reversal',
        direction: 'bullish',
        bars: 3,
        reliability: 0.82,
        detect: (candles) => this.detectThreeWhiteSoldiers(candles)
      },
      MORNING_STAR: {
        name: 'Morning Star',
        type: 'reversal',
        direction: 'bullish',
        bars: 3,
        reliability: 0.78,
        detect: (candles) => this.detectMorningStar(candles)
      },
      BULLISH_ABANDONED_BABY: {
        name: 'Bullish Abandoned Baby',
        type: 'reversal',
        direction: 'bullish',
        bars: 3,
        reliability: 0.85,
        detect: (candles) => this.detectBullishAbandonedBaby(candles)
      },
      BULLISH_SQUEEZE: {
        name: 'Bullish Squeeze',
        type: 'continuation',
        direction: 'bullish',
        bars: 3,
        reliability: 0.70,
        detect: (candles) => this.detectBullishSqueeze(candles)
      },
      BULLISH_SIDE_BY_SIDE_WHITE: {
        name: 'Bullish Side by Side White Lines',
        type: 'continuation',
        direction: 'bullish',
        bars: 3,
        reliability: 0.68,
        detect: (candles) => this.detectBullishSideBySideWhite(candles)
      },
      UPSIDE_TASUKI_GAP: {
        name: 'Upside Tasuki Gap',
        type: 'continuation',
        direction: 'bullish',
        bars: 3,
        reliability: 0.72,
        detect: (candles) => this.detectUpsideTasukiGap(candles)
      },
      UPSIDE_GAP_FILLED: {
        name: 'Upside Gap Filled',
        type: 'continuation',
        direction: 'bullish',
        bars: 3,
        reliability: 0.65,
        detect: (candles) => this.detectUpsideGapFilled(candles)
      },
      
      // Bearish Patterns
      THREE_INSIDE_DOWN: {
        name: 'Three Inside Down',
        type: 'reversal',
        direction: 'bearish',
        bars: 3,
        reliability: 0.75,
        detect: (candles) => this.detectThreeInsideDown(candles)
      },
      THREE_BLACK_CROWS: {
        name: 'Three Black Crows',
        type: 'reversal',
        direction: 'bearish',
        bars: 3,
        reliability: 0.82,
        detect: (candles) => this.detectThreeBlackCrows(candles)
      },
      EVENING_STAR: {
        name: 'Evening Star',
        type: 'reversal',
        direction: 'bearish',
        bars: 3,
        reliability: 0.78,
        detect: (candles) => this.detectEveningStar(candles)
      },
      BEARISH_ABANDONED_BABY: {
        name: 'Bearish Abandoned Baby',
        type: 'reversal',
        direction: 'bearish',
        bars: 3,
        reliability: 0.85,
        detect: (candles) => this.detectBearishAbandonedBaby(candles)
      },
      BEARISH_SQUEEZE: {
        name: 'Bearish Squeeze',
        type: 'continuation',
        direction: 'bearish',
        bars: 3,
        reliability: 0.70,
        detect: (candles) => this.detectBearishSqueeze(candles)
      },
      BEARISH_SIDE_BY_SIDE_BLACK: {
        name: 'Bearish Side by Side Black Lines',
        type: 'continuation',
        direction: 'bearish',
        bars: 3,
        reliability: 0.68,
        detect: (candles) => this.detectBearishSideBySideBlack(candles)
      },
      BEARISH_SIDE_BY_SIDE_WHITE: {
        name: 'Bearish Side by Side White Lines',
        type: 'continuation',
        direction: 'bearish',
        bars: 3,
        reliability: 0.65,
        detect: (candles) => this.detectBearishSideBySideWhite(candles)
      },
      DOWNSIDE_TASUKI_GAP: {
        name: 'Downside Tasuki Gap',
        type: 'continuation',
        direction: 'bearish',
        bars: 3,
        reliability: 0.72,
        detect: (candles) => this.detectDownsideTasukiGap(candles)
      },
      DOWNSIDE_GAP_FILLED: {
        name: 'Downside Gap Filled',
        type: 'continuation',
        direction: 'bearish',
        bars: 3,
        reliability: 0.65,
        detect: (candles) => this.detectDownsideGapFilled(candles)
      }
    };

    // Combine all patterns
    this.allPatterns = {
      ...this.tier1Patterns,
      ...this.tier2Patterns,
      ...this.tier3Patterns
    };

    // Pattern statistics
    this.stats = {
      tier1Count: Object.keys(this.tier1Patterns).length,
      tier2Count: Object.keys(this.tier2Patterns).length,
      tier3Count: Object.keys(this.tier3Patterns).length,
      totalPatterns: Object.keys(this.allPatterns).length
    };

    console.log(`📊 Comprehensive Pattern Detector Initialized`);
    console.log(`   Tier 1: ${this.stats.tier1Count} patterns (Basic)`);
    console.log(`   Tier 2: ${this.stats.tier2Count} patterns (Intermediate)`);
    console.log(`   Tier 3: ${this.stats.tier3Count} patterns (Advanced)`);
    console.log(`   Total: ${this.stats.totalPatterns} patterns`);
  }

  /**
   * Scan for all patterns
   */
  scanAllPatterns(candles, options = {}) {
    const { minTier = 1, maxTier = 3, minReliability = 0 } = options;
    const detected = [];

    // Scan tier 1
    if (minTier <= 1 && maxTier >= 1) {
      for (const [key, pattern] of Object.entries(this.tier1Patterns)) {
        if (pattern.reliability >= minReliability && candles.length >= pattern.bars) {
          const result = pattern.detect(candles);
          if (result && result.detected) {
            detected.push({
              ...result,
              pattern: pattern.name,
              tier: 1,
              type: pattern.type,
              direction: pattern.direction,
              reliability: pattern.reliability,
              key: key
            });
          }
        }
      }
    }

    // Scan tier 2
    if (minTier <= 2 && maxTier >= 2) {
      for (const [key, pattern] of Object.entries(this.tier2Patterns)) {
        if (pattern.reliability >= minReliability && candles.length >= pattern.bars) {
          const result = pattern.detect(candles);
          if (result && result.detected) {
            detected.push({
              ...result,
              pattern: pattern.name,
              tier: 2,
              type: pattern.type,
              direction: pattern.direction,
              reliability: pattern.reliability,
              key: key
            });
          }
        }
      }
    }

    // Scan tier 3
    if (minTier <= 3 && maxTier >= 3) {
      for (const [key, pattern] of Object.entries(this.tier3Patterns)) {
        if (pattern.reliability >= minReliability && candles.length >= pattern.bars) {
          const result = pattern.detect(candles);
          if (result && result.detected) {
            detected.push({
              ...result,
              pattern: pattern.name,
              tier: 3,
              type: pattern.type,
              direction: pattern.direction,
              reliability: pattern.reliability,
              key: key
            });
          }
        }
      }
    }

    // Sort by reliability and tier
    detected.sort((a, b) => {
      if (b.reliability !== a.reliability) return b.reliability - a.reliability;
      return b.tier - a.tier;
    });

    return detected;
  }

  /**
   * Get strongest signal from detected patterns
   */
  getStrongestSignal(candles, options = {}) {
    const patterns = this.scanAllPatterns(candles, options);
    if (patterns.length === 0) return null;

    // Group by direction
    const bullish = patterns.filter(p => p.direction === 'bullish');
    const bearish = patterns.filter(p => p.direction === 'bearish');

    // Calculate weighted scores
    const bullishScore = bullish.reduce((sum, p) => sum + (p.reliability * p.tier), 0);
    const bearishScore = bearish.reduce((sum, p) => sum + (p.reliability * p.tier), 0);

    if (bullishScore > bearishScore && bullish.length > 0) {
      return {
        direction: 'bullish',
        pattern: bullish[0],
        score: bullishScore,
        confidence: bullish[0].reliability,
        patternCount: bullish.length
      };
    } else if (bearishScore > bullishScore && bearish.length > 0) {
      return {
        direction: 'bearish',
        pattern: bearish[0],
        score: bearishScore,
        confidence: bearish[0].reliability,
        patternCount: bearish.length
      };
    }

    return null;
  }

  // === PATTERN DETECTION METHODS ===

  // Helper function to check if candle is bullish/bearish
  isBullish(candle) { return candle.close > candle.open; }
  isBearish(candle) { return candle.close < candle.open; }
  
  // Helper to get body size
  bodySize(candle) { return Math.abs(candle.close - candle.open); }
  
  // Helper to get upper/lower wicks
  upperWick(candle) { return candle.high - Math.max(candle.open, candle.close); }
  lowerWick(candle) { return Math.min(candle.open, candle.close) - candle.low; }
  
  // Helper to check if doji
  isDoji(candle) { return this.bodySize(candle) < (candle.high - candle.low) * 0.1; }

  // === TIER 1 PATTERNS ===

  detectDragonflyDoji(candles) {
    const c = candles[candles.length - 1];
    if (!c) return { detected: false };
    
    const body = this.bodySize(c);
    const lower = this.lowerWick(c);
    const upper = this.upperWick(c);
    const range = c.high - c.low;
    
    if (body < range * 0.1 && lower > range * 0.6 && upper < range * 0.1) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectGravestoneDoji(candles) {
    const c = candles[candles.length - 1];
    if (!c) return { detected: false };
    
    const body = this.bodySize(c);
    const lower = this.lowerWick(c);
    const upper = this.upperWick(c);
    const range = c.high - c.low;
    
    if (body < range * 0.1 && upper > range * 0.6 && lower < range * 0.1) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectLongBlack(candles) {
    const c = candles[candles.length - 1];
    if (!c) return { detected: false };
    
    const body = this.bodySize(c);
    const avgBody = this.getAverageBodySize(candles.slice(-10));
    
    if (this.isBearish(c) && body > avgBody * 2) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  detectSpinningTop(candles) {
    const c = candles[candles.length - 1];
    if (!c) return { detected: false };
    
    const body = this.bodySize(c);
    const upper = this.upperWick(c);
    const lower = this.lowerWick(c);
    const range = c.high - c.low;
    
    if (body < range * 0.3 && upper > body && lower > body) {
      return { detected: true, confidence: 0.5 };
    }
    return { detected: false };
  }

  detectHammer(candles) {
    const c = candles[candles.length - 1];
    if (!c || candles.length < 5) return { detected: false };
    
    // Check if in downtrend
    const trend = this.getTrend(candles.slice(-5));
    if (trend !== 'down') return { detected: false };
    
    const body = this.bodySize(c);
    const lower = this.lowerWick(c);
    const upper = this.upperWick(c);
    
    if (lower > body * 2 && upper < body * 0.5) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectBullishEngulfing(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        curr.open <= prev.close && curr.close > prev.open &&
        this.bodySize(curr) > this.bodySize(prev)) {
      return { detected: true, confidence: 0.75 };
    }
    return { detected: false };
  }

  detectBearishEngulfing(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        curr.open >= prev.close && curr.close < prev.open &&
        this.bodySize(curr) > this.bodySize(prev)) {
      return { detected: true, confidence: 0.75 };
    }
    return { detected: false };
  }

  // === TIER 2 PATTERNS ===

  detectBullishHarami(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        curr.open > prev.close && curr.close < prev.open &&
        this.bodySize(curr) < this.bodySize(prev) * 0.5) {
      return { detected: true, confidence: 0.68 };
    }
    return { detected: false };
  }

  detectBullishPiercingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    const prevMid = (prev.open + prev.close) / 2;
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        curr.open < prev.low && curr.close > prevMid && curr.close < prev.open) {
      return { detected: true, confidence: 0.72 };
    }
    return { detected: false };
  }

  detectDarkCloudCover(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    const prevMid = (prev.open + prev.close) / 2;
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        curr.open > prev.high && curr.close < prevMid && curr.close > prev.open) {
      return { detected: true, confidence: 0.72 };
    }
    return { detected: false };
  }

  // === TIER 3 PATTERNS ===

  detectThreeWhiteSoldiers(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && this.isBullish(c2) && this.isBullish(c3) &&
        c2.open > c1.open && c2.close > c1.close &&
        c3.open > c2.open && c3.close > c2.close &&
        this.upperWick(c2) < this.bodySize(c2) * 0.3 &&
        this.upperWick(c3) < this.bodySize(c3) * 0.3) {
      return { detected: true, confidence: 0.82 };
    }
    return { detected: false };
  }

  detectThreeBlackCrows(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.isBearish(c2) && this.isBearish(c3) &&
        c2.open < c1.open && c2.close < c1.close &&
        c3.open < c2.open && c3.close < c2.close &&
        this.lowerWick(c2) < this.bodySize(c2) * 0.3 &&
        this.lowerWick(c3) < this.bodySize(c3) * 0.3) {
      return { detected: true, confidence: 0.82 };
    }
    return { detected: false };
  }

  detectMorningStar(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.bodySize(c2) < this.bodySize(c1) * 0.3 &&
        this.isBullish(c3) && c3.close > (c1.open + c1.close) / 2) {
      return { detected: true, confidence: 0.78 };
    }
    return { detected: false };
  }

  detectEveningStar(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && this.bodySize(c2) < this.bodySize(c1) * 0.3 &&
        this.isBearish(c3) && c3.close < (c1.open + c1.close) / 2) {
      return { detected: true, confidence: 0.78 };
    }
    return { detected: false };
  }

  // === UTILITY METHODS ===

  getAverageBodySize(candles) {
    if (!candles || candles.length === 0) return 0;
    const total = candles.reduce((sum, c) => sum + this.bodySize(c), 0);
    return total / candles.length;
  }

  getTrend(candles) {
    if (candles.length < 2) return 'neutral';
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const change = (last - first) / first;
    
    if (change > 0.02) return 'up';
    if (change < -0.02) return 'down';
    return 'neutral';
  }

  // === REMAINING TIER 1 PATTERNS ===
  
  detectLongLeggedDoji(candles) {
    const c = candles[candles.length - 1];
    if (!c) return { detected: false };
    
    const body = this.bodySize(c);
    const upper = this.upperWick(c);
    const lower = this.lowerWick(c);
    const range = c.high - c.low;
    
    if (body < range * 0.1 && upper > range * 0.35 && lower > range * 0.35) {
      return { detected: true, confidence: 0.55 };
    }
    return { detected: false };
  }

  detectBullishBeltHold(candles) {
    const c = candles[candles.length - 1];
    if (!c || candles.length < 5) return { detected: false };
    
    const trend = this.getTrend(candles.slice(-5));
    if (trend !== 'down') return { detected: false };
    
    const body = this.bodySize(c);
    const lower = this.lowerWick(c);
    const avgBody = this.getAverageBodySize(candles.slice(-10));
    
    if (this.isBullish(c) && body > avgBody * 1.5 && 
        lower < body * 0.1 && c.open === c.low) {
      return { detected: true, confidence: 0.6 };
    }
    return { detected: false };
  }

  detectBearishBeltHold(candles) {
    const c = candles[candles.length - 1];
    if (!c || candles.length < 5) return { detected: false };
    
    const trend = this.getTrend(candles.slice(-5));
    if (trend !== 'up') return { detected: false };
    
    const body = this.bodySize(c);
    const upper = this.upperWick(c);
    const avgBody = this.getAverageBodySize(candles.slice(-10));
    
    if (this.isBearish(c) && body > avgBody * 1.5 && 
        upper < body * 0.1 && c.open === c.high) {
      return { detected: true, confidence: 0.6 };
    }
    return { detected: false };
  }

  detectHangingMan(candles) {
    const c = candles[candles.length - 1];
    if (!c || candles.length < 5) return { detected: false };
    
    const trend = this.getTrend(candles.slice(-5));
    if (trend !== 'up') return { detected: false };
    
    const body = this.bodySize(c);
    const lower = this.lowerWick(c);
    const upper = this.upperWick(c);
    
    if (lower > body * 2 && upper < body * 0.5) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  // === REMAINING TIER 2 PATTERNS ===

  detectBullishHaramiCross(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isDoji(curr) &&
        curr.high < prev.open && curr.low > prev.close) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectBullishInvertedHammer(candles) {
    const c = candles[candles.length - 1];
    if (!c || candles.length < 5) return { detected: false };
    
    const trend = this.getTrend(candles.slice(-5));
    if (trend !== 'down') return { detected: false };
    
    const body = this.bodySize(c);
    const upper = this.upperWick(c);
    const lower = this.lowerWick(c);
    
    if (this.isBullish(c) && upper > body * 2 && lower < body * 0.5) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  detectBullishDojiStar(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isDoji(curr) &&
        curr.close < prev.close && curr.open < prev.close) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  detectBullishMeetingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        Math.abs(prev.close - curr.close) < (prev.close * 0.001)) {
      return { detected: true, confidence: 0.62 };
    }
    return { detected: false };
  }

  detectBullishThrustingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    const prevMid = (prev.open + prev.close) / 2;
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        curr.open < prev.close && curr.close > prev.close && curr.close < prevMid) {
      return { detected: true, confidence: 0.58 };
    }
    return { detected: false };
  }

  detectBullishSeparatingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        Math.abs(prev.open - curr.open) < (prev.open * 0.001) &&
        curr.close > prev.close) {
      return { detected: true, confidence: 0.6 };
    }
    return { detected: false };
  }

  detectBullishNeckLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBearish(prev) && this.isBullish(curr) &&
        curr.open < prev.low && curr.close <= prev.close + (prev.close * 0.002)) {
      return { detected: true, confidence: 0.55 };
    }
    return { detected: false };
  }

  detectBearishHarami(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        curr.open < prev.close && curr.close > prev.open &&
        this.bodySize(curr) < this.bodySize(prev) * 0.5) {
      return { detected: true, confidence: 0.68 };
    }
    return { detected: false };
  }

  detectBearishHaramiCross(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isDoji(curr) &&
        curr.high < prev.close && curr.low > prev.open) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectBearishInvertedHammer(candles) {
    const c = candles[candles.length - 1];
    if (!c || candles.length < 5) return { detected: false };
    
    const trend = this.getTrend(candles.slice(-5));
    if (trend !== 'up') return { detected: false };
    
    const body = this.bodySize(c);
    const upper = this.upperWick(c);
    const lower = this.lowerWick(c);
    
    if (this.isBearish(c) && upper > body * 2 && lower < body * 0.5) {
      return { detected: true, confidence: 0.63 };
    }
    return { detected: false };
  }

  detectBearishDojiStar(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isDoji(curr) &&
        curr.close > prev.close && curr.open > prev.close) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  detectBearishMeetingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        Math.abs(prev.close - curr.close) < (prev.close * 0.001)) {
      return { detected: true, confidence: 0.62 };
    }
    return { detected: false };
  }

  detectBearishThrustingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    const prevMid = (prev.open + prev.close) / 2;
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        curr.open > prev.close && curr.close < prev.close && curr.close > prevMid) {
      return { detected: true, confidence: 0.58 };
    }
    return { detected: false };
  }

  detectBearishSeparatingLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        Math.abs(prev.open - curr.open) < (prev.open * 0.001) &&
        curr.close < prev.close) {
      return { detected: true, confidence: 0.6 };
    }
    return { detected: false };
  }

  detectBearishNeckLine(candles) {
    if (candles.length < 2) return { detected: false };
    
    const [prev, curr] = candles.slice(-2);
    
    if (this.isBullish(prev) && this.isBearish(curr) &&
        curr.open > prev.high && curr.close >= prev.close - (prev.close * 0.002)) {
      return { detected: true, confidence: 0.55 };
    }
    return { detected: false };
  }

  // === REMAINING TIER 3 PATTERNS ===

  detectThreeInsideUp(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.isBullish(c2) &&
        c2.open > c1.close && c2.close < c1.open &&
        this.isBullish(c3) && c3.close > c1.open) {
      return { detected: true, confidence: 0.75 };
    }
    return { detected: false };
  }

  detectThreeOutsideUp(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.isBullish(c2) &&
        c2.open <= c1.close && c2.close > c1.open &&
        this.isBullish(c3) && c3.close > c2.close) {
      return { detected: true, confidence: 0.78 };
    }
    return { detected: false };
  }

  detectBullishAbandonedBaby(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.isDoji(c2) && this.isBullish(c3) &&
        c2.high < c1.low && c3.low > c2.high) {
      return { detected: true, confidence: 0.85 };
    }
    return { detected: false };
  }

  detectBullishSqueeze(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    const avgBody = this.getAverageBodySize(candles.slice(-10));
    
    if (this.bodySize(c2) < avgBody * 0.5 &&
        this.bodySize(c1) < avgBody * 0.7 &&
        this.isBullish(c3) && this.bodySize(c3) > avgBody * 1.5) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectBullishSideBySideWhite(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && this.isBullish(c2) && this.isBullish(c3) &&
        c2.open > c1.close && 
        Math.abs(c2.open - c3.open) < (c2.open * 0.002)) {
      return { detected: true, confidence: 0.68 };
    }
    return { detected: false };
  }

  detectUpsideTasukiGap(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && this.isBullish(c2) && this.isBearish(c3) &&
        c2.open > c1.close && c3.open > c2.close &&
        c3.close > c1.close && c3.close < c2.open) {
      return { detected: true, confidence: 0.72 };
    }
    return { detected: false };
  }

  detectUpsideGapFilled(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && c2.low > c1.high &&
        c3.low <= c1.high && c3.close > c2.close) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  detectThreeInsideDown(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && this.isBearish(c2) &&
        c2.open < c1.close && c2.close > c1.open &&
        this.isBearish(c3) && c3.close < c1.open) {
      return { detected: true, confidence: 0.75 };
    }
    return { detected: false };
  }

  detectBearishAbandonedBaby(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBullish(c1) && this.isDoji(c2) && this.isBearish(c3) &&
        c2.low > c1.high && c3.high < c2.low) {
      return { detected: true, confidence: 0.85 };
    }
    return { detected: false };
  }

  detectBearishSqueeze(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    const avgBody = this.getAverageBodySize(candles.slice(-10));
    
    if (this.bodySize(c2) < avgBody * 0.5 &&
        this.bodySize(c1) < avgBody * 0.7 &&
        this.isBearish(c3) && this.bodySize(c3) > avgBody * 1.5) {
      return { detected: true, confidence: 0.7 };
    }
    return { detected: false };
  }

  detectBearishSideBySideBlack(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.isBearish(c2) && this.isBearish(c3) &&
        c2.open < c1.close && 
        Math.abs(c2.open - c3.open) < (c2.open * 0.002)) {
      return { detected: true, confidence: 0.68 };
    }
    return { detected: false };
  }

  detectBearishSideBySideWhite(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (candles.length >= 5 && this.getTrend(candles.slice(-5)) === 'down' &&
        this.isBullish(c2) && this.isBullish(c3) &&
        Math.abs(c2.open - c3.open) < (c2.open * 0.002) &&
        c3.close < c1.close) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }

  detectDownsideTasukiGap(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && this.isBearish(c2) && this.isBullish(c3) &&
        c2.open < c1.close && c3.open < c2.close &&
        c3.close < c1.close && c3.close > c2.open) {
      return { detected: true, confidence: 0.72 };
    }
    return { detected: false };
  }

  detectDownsideGapFilled(candles) {
    if (candles.length < 3) return { detected: false };
    
    const [c1, c2, c3] = candles.slice(-3);
    
    if (this.isBearish(c1) && c2.high < c1.low &&
        c3.high >= c1.low && c3.close < c2.close) {
      return { detected: true, confidence: 0.65 };
    }
    return { detected: false };
  }
}

module.exports = ComprehensivePatternDetector;