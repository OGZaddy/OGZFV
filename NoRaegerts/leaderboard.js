// NoRaegerts Leaderboard System
// Track and celebrate the most spectacular failures

class NoRaegertsLeaderboard {
  constructor() {
    this.entries = [];
    this.weeklyWinners = [];
    this.allTimeRecords = {
      fastestTo10k: { username: null, time: Infinity },
      highestDegeneracy: { username: null, level: 0 },
      biggestSingleLoss: { username: null, amount: 0 },
      mostTrades: { username: null, count: 0 },
      quickest999: { username: null, time: Infinity }
    };
    
    // 🎁 COMMUNITY REWARDS - Help people with groceries!
    this.communityPoints = new Map(); // Track points per user
    this.rewardTiers = {
      starter: { points: 100, reward: '$10 Grocery Card' },
      bronze: { points: 500, reward: '$25 Grocery Card' },
      silver: { points: 1000, reward: '$50 Amazon Card' },
      gold: { points: 2500, reward: '$100 Grocery Card' },
      platinum: { points: 5000, reward: '$250 Gift Card (Your Choice)' },
      diamond: { points: 10000, reward: '$500 Grocery Money' }
    };
  }

  /**
   * Submit a NoRaegerts run to the leaderboard
   */
  submitRun(username, runData) {
    const entry = {
      username,
      timestamp: Date.now(),
      timeToZero: runData.timeToZero,
      maxDegeneracy: runData.maxDegeneracy,
      biggestLoss: runData.biggestLoss,
      totalTrades: runData.totalTrades,
      timeTo999: runData.timeTo999,
      voiceLinesTriggered: runData.voiceLinesTriggered,
      finalMessage: runData.finalMessage || "No ragrets",
      score: this.calculateScore(runData)
    };

    this.entries.push(entry);
    this.updateRecords(entry);
    
    return {
      rank: this.getRank(entry),
      beaten: this.getBeatenRecords(entry),
      entry
    };
  }

  /**
   * Calculate competitive score
   */
  calculateScore(runData) {
    let score = 0;
    
    // Speed bonus (faster = better)
    if (runData.timeToZero < 60) score += 1000; // Under 1 minute
    if (runData.timeToZero < 30) score += 2000; // Under 30 seconds
    
    // Degeneracy bonus
    score += runData.maxDegeneracy * 10;
    
    // Style points for biggest single loss
    score += Math.min(runData.biggestLoss / 100, 500);
    
    // Chaos bonus for many trades
    score += runData.totalTrades * 5;
    
    // 99.9% achievement
    if (runData.maxDegeneracy >= 99.9) score += 500;
    
    return Math.round(score);
  }

  /**
   * Get current week's leaderboard
   */
  getWeeklyLeaderboard() {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyEntries = this.entries.filter(e => e.timestamp > weekAgo);
    
    return {
      speedrun: weeklyEntries.sort((a, b) => a.timeToZero - b.timeToZero).slice(0, 10),
      degeneracy: weeklyEntries.sort((a, b) => b.maxDegeneracy - a.maxDegeneracy).slice(0, 10),
      biggestLoss: weeklyEntries.sort((a, b) => b.biggestLoss - a.biggestLoss).slice(0, 10),
      overall: weeklyEntries.sort((a, b) => b.score - a.score).slice(0, 10)
    };
  }

  /**
   * Award weekly prizes
   */
  awardWeeklyPrizes() {
    const leaderboard = this.getWeeklyLeaderboard();
    const prizes = [];
    
    // Overall winner - Free month
    if (leaderboard.overall[0]) {
      prizes.push({
        username: leaderboard.overall[0].username,
        prize: 'FREE_MONTH',
        category: 'Overall Degen Champion'
      });
    }
    
    // Speedrun winner - Badge
    if (leaderboard.speedrun[0]) {
      prizes.push({
        username: leaderboard.speedrun[0].username,
        prize: 'SPEED_DEMON_BADGE',
        category: 'Fastest Blowup'
      });
    }
    
    // Max degeneracy - Special voice pack
    if (leaderboard.degeneracy[0]) {
      prizes.push({
        username: leaderboard.degeneracy[0].username,
        prize: 'LEGENDARY_VOICE_PACK',
        category: 'Maximum Degeneracy'
      });
    }
    
    // Biggest single loss - Hall of fame
    if (leaderboard.biggestLoss[0]) {
      prizes.push({
        username: leaderboard.biggestLoss[0].username,
        prize: 'HALL_OF_FAME',
        category: 'YOLO of the Week'
      });
    }
    
    // Last place (most disciplined) - Ironically prestigious
    const lastPlace = leaderboard.overall[leaderboard.overall.length - 1];
    if (lastPlace && lastPlace.timeToZero > 300) { // Lasted over 5 minutes
      prizes.push({
        username: lastPlace.username,
        prize: 'DISCIPLINE_AWARD',
        category: 'Actually Has Self Control'
      });
    }
    
    return prizes;
  }

  /**
   * Get user stats and achievements
   */
  getUserStats(username) {
    const userRuns = this.entries.filter(e => e.username === username);
    if (userRuns.length === 0) return null;
    
    return {
      totalRuns: userRuns.length,
      bestTime: Math.min(...userRuns.map(r => r.timeToZero)),
      highestDegeneracy: Math.max(...userRuns.map(r => r.maxDegeneracy)),
      biggestLoss: Math.max(...userRuns.map(r => r.biggestLoss)),
      averageScore: userRuns.reduce((sum, r) => sum + r.score, 0) / userRuns.length,
      achievements: this.getUserAchievements(username, userRuns)
    };
  }

  /**
   * Calculate user achievements
   */
  getUserAchievements(username, runs) {
    const achievements = [];
    
    // Speed achievements
    if (runs.some(r => r.timeToZero < 30)) {
      achievements.push('⚡ Speed Demon - Under 30 seconds');
    }
    if (runs.some(r => r.timeToZero < 60)) {
      achievements.push('🏃 Speedrunner - Under 1 minute');
    }
    
    // Degeneracy achievements
    if (runs.some(r => r.maxDegeneracy >= 99.9)) {
      achievements.push('💀 Final Descent - Reached 99.9%');
    }
    if (runs.some(r => r.maxDegeneracy >= 75)) {
      achievements.push('🔥 Certified Degen - Over 75%');
    }
    
    // Trading achievements
    if (runs.some(r => r.totalTrades > 50)) {
      achievements.push('🎰 Spam Trader - 50+ trades');
    }
    if (runs.some(r => r.biggestLoss > 5000)) {
      achievements.push('💸 Big Spender - $5k+ single loss');
    }
    
    // Participation achievements
    if (runs.length >= 10) {
      achievements.push('🏆 Regular - 10+ runs');
    }
    if (runs.length >= 50) {
      achievements.push('👑 Veteran - 50+ runs');
    }
    
    // Special achievements
    const weeklyWins = this.weeklyWinners.filter(w => w.username === username);
    if (weeklyWins.length > 0) {
      achievements.push(`🥇 ${weeklyWins.length}x Weekly Champion`);
    }
    
    return achievements;
  }

  /**
   * Update all-time records
   */
  updateRecords(entry) {
    if (entry.timeToZero < this.allTimeRecords.fastestTo10k.time) {
      this.allTimeRecords.fastestTo10k = {
        username: entry.username,
        time: entry.timeToZero
      };
    }
    
    if (entry.maxDegeneracy > this.allTimeRecords.highestDegeneracy.level) {
      this.allTimeRecords.highestDegeneracy = {
        username: entry.username,
        level: entry.maxDegeneracy
      };
    }
    
    if (entry.biggestLoss > this.allTimeRecords.biggestSingleLoss.amount) {
      this.allTimeRecords.biggestSingleLoss = {
        username: entry.username,
        amount: entry.biggestLoss
      };
    }
  }

  /**
   * Get rank for an entry
   */
  getRank(entry) {
    const sorted = this.entries.sort((a, b) => b.score - a.score);
    return sorted.findIndex(e => e === entry) + 1;
  }

  /**
   * Check which records were beaten
   */
  getBeatenRecords(entry) {
    const beaten = [];
    
    if (entry.timeToZero < 30) {
      beaten.push('Sub-30 second speedrun!');
    }
    if (entry.maxDegeneracy >= 99.9) {
      beaten.push('Maximum degeneracy achieved!');
    }
    if (entry.biggestLoss > 7500) {
      beaten.push('Massive YOLO executed!');
    }
    
    return beaten;
  }

  /**
   * Generate shareable result
   */
  generateShareableResult(username, runData) {
    // Find the actual entry to get rank and score
    const entry = this.entries.find(e => e.username === username);
    const rank = entry ? this.getRank(entry) : 'N/A';
    const total = this.entries.length;
    const score = entry ? entry.score : this.calculateScore(runData);
    
    return `
🎮 NoRaegerts Run Complete! 🎮
Player: ${username}
⏱️ Time: ${runData.timeToZero}s
💀 Degeneracy: ${runData.maxDegeneracy}%
💸 Biggest Loss: $${runData.biggestLoss}
📊 Score: ${score}
🏆 Rank: #${rank} of ${total}

"${runData.finalMessage}"
#NoRaegerts #TradingBot #YOLO
    `;
  }
}

module.exports = NoRaegertsLeaderboard;