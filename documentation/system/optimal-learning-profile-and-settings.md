/**
 * SS10.2MVP FINAL CONFIGURATION
 * 
 * Optimal settings for initial deployment
 */

const optimalConfig = {
  // Core settings
  initialBalance: 10000,
  assetName: 'BTC-USD',
  profileName: 'default',
  
  // Risk parameters (conservative starting point)
  baseRiskPercent: 1.0,         // 1% risk per trade initially
  maxDrawdownPercent: 10,       // Lower than default for safety
  dailyLossLimitPercent: 3.0,   // Conservative daily limit
  
  // Pattern recognition
  patternSimilarityThreshold: 0.85,  // Higher threshold for confidence
  minPatternMatches: 5,              // Require more pattern confirmation
  
  // Feature toggles
  enableMultiTimeframe: false,       // Start with single timeframe for simplicity
  enableFibonacciLevels: false,      // Can enable after core functionality validated
  enableSupportResistance: false,    // Can enable after core functionality validated
  enablePatternRejectionTracking: true, // Keep this for learning
  
  // Timeframes
  timeframes: ['1m'],           // Simplified to just primary timeframe
  primaryTimeframe: '1m',       // Focus on 1-minute for initial testing
  
  // Exit strategy
  maxPositionSize: 0.15,        // Conservative position sizing
};

// This configuration provides a balanced starting point
// that prioritizes capital preservation while allowing
// the system to learn and generate profits.

// After initial validation period (100+ trades),
// you can gradually enable additional features
// and increase risk parameters based on performance.