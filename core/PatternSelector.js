/**
 * PATTERN SELECTOR - Choose patterns based on tier
 * Allows different tiers to access different pattern sets
 */

class PatternSelector {
  constructor(tier = 'starter') {
    this.tier = tier.toLowerCase();
    
    // Define pattern access by tier
    this.tierPatterns = {
      starter: [], // NO PATTERNS for starter tier
      pro: [
        // Only 4 basic patterns for 2nd tier
        'hammer', 'shootingStar', 'bullishEngulfing', 'bearishEngulfing'
      ],
      elite: 'ALL' // Gets everything
    };
    
    console.log(`📊 PatternSelector initialized for ${tier.toUpperCase()} tier`);
  }
  
  /**
   * Get the appropriate pattern detector based on tier
   */
  getPatternDetector() {
    if (this.tier === 'elite') {
      // Elite gets the comprehensive detector with all 94 patterns
      const ComprehensivePatternDetector = require('./ComprehensivePatternDetector');
      return new ComprehensivePatternDetector();
    } else {
      // Other tiers get filtered patterns
      const EnhancedPatternRecognition = require('./EnhancedPatternRecognition');
      const detector = new EnhancedPatternRecognition();
      
      // Filter patterns based on tier
      detector.setAllowedPatterns(this.tierPatterns[this.tier] || this.tierPatterns.starter);
      
      return detector;
    }
  }
  
  /**
   * Get pattern count for tier
   */
  getPatternCount() {
    if (this.tier === 'elite') {
      return 94; // All patterns from ComprehensivePatternDetector
    } else if (this.tier === 'pro') {
      return this.tierPatterns.pro.length;
    } else {
      return this.tierPatterns.starter.length;
    }
  }
  
  /**
   * Check if a specific pattern is available for this tier
   */
  hasPattern(patternName) {
    if (this.tier === 'elite') {
      return true; // Elite has everything
    }
    
    const patterns = this.tierPatterns[this.tier] || this.tierPatterns.starter;
    return patterns.includes(patternName);
  }
  
  /**
   * Get list of available patterns for this tier
   */
  getAvailablePatterns() {
    if (this.tier === 'elite') {
      // Return all 94 pattern names from comprehensive detector
      return [
        'dragonflyDoji', 'gravestoneDoji', 'longBlack', 'spinningTop',
        'longLeggedDoji', 'bullishBeltHold', 'bearishBeltHold', 'hangingMan',
        'hammer', 'bullishEngulfing', 'bearishEngulfing', 'bullishHarami',
        'bullishHaramiCross', 'bullishInvertedHammer', 'bullishDojiStar',
        'bullishMeetingLine', 'bullishPiercingLine', 'bullishThrustingLine',
        'bullishSeparatingLine', 'bullishNeckLine', 'bullishBreakaway',
        'bullishKicker', 'bullishCounterAttack', 'bullishMarubozu',
        'bearishHarami', 'bearishHaramiCross', 'bearishShootingStar',
        'bearishDojiStar', 'bearishDarkCloudCover', 'bearishDescendingHawk',
        'bearishNeckLine', 'bearishSeparatingLine', 'bearishBreakaway',
        'bearishKicker', 'bearishCounterAttack', 'bearishMarubozu',
        'morningstar', 'morningStar', 'bullishMorningStar', 'eveningstar',
        'eveningStar', 'bearishEveningStar', 'threeWhiteSoldiers',
        'threeBlackCrows', 'threeInsideUp', 'threeInsideDown',
        'threeOutsideUp', 'threeOutsideDown', 'bullishAbandonedBaby',
        'bearishAbandonedBaby', 'tweezerTop', 'tweezerBottom',
        'risingThreeMethods', 'fallingThreeMethods', 'risingWindow',
        'fallingWindow', 'tasukiGap', 'bullishTasukiGap', 'bearishTasukiGap',
        'gapUp', 'gapDown', 'bullishGap', 'bearishGap',
        'insideBar', 'outsideBar', 'bullishRailroad', 'bearishRailroad',
        'stickSandwich', 'bullishStickSandwich', 'bearishStickSandwich',
        'concealingBabySwallow', 'ladderBottom', 'ladderTop',
        'bullishTristar', 'bearishTristar', 'uniqueThreeRiver',
        'advanceBlock', 'deliberation', 'bullishDeliberation',
        'twoBlackGapping', 'threeLineStrike', 'bullishThreeLineStrike',
        'bearishThreeLineStrike', 'homingPigeon', 'matchingLow',
        'matchingHigh', 'upGapSideBySideWhite', 'downGapSideBySideWhite',
        'risingThreeGaps', 'fallingThreeGaps', 'matHold', 'bullishMatHold',
        'bearishMatHold', 'restAfterBattle', 'inNeck', 'onNeck',
        'thrusting'
      ];
    }
    
    return this.tierPatterns[this.tier] || this.tierPatterns.starter;
  }
}

module.exports = PatternSelector;