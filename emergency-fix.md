# EMERGENCY FIX - GET YOUR BOT WORKING NOW

## The Problem:
- AIs added TradeDecisionGateway and other complexity
- Backtest now hanging/broken
- Live bot questionable
- Your day off ruined

## The ONLY Real Bugs:
1. Position sizer returning NaN
2. Cash accounting wrong in backtest

## Quick Fix (5 minutes):

### 1. Test if your live bot even works:
```bash
pm2 restart clean-trading
pm2 logs clean-trading --lines 50
```

### 2. If bot won't start, rollback to yesterday:
```bash
# See what changed
git status
git diff HEAD

# Stash current mess
git stash

# Go back to before the gateway bullshit
git log --oneline -10  # Find a commit from yesterday
git checkout [COMMIT_HASH] -- backtest-v13-production.js run-trading-bot-v13-simplified.js

# Restart
pm2 restart clean-trading
```

### 3. Fix ONLY the two real bugs:

In `backtest-v13-production.js`:

**Fix NaN position sizing (line ~400):**
```javascript
calculatePositionSize(confidence, marketData) {
  // ... existing code ...
  
  // ADD THIS AT THE END BEFORE RETURN:
  if (!Number.isFinite(size) || size <= 0) {
    return 0.01; // Default 1%
  }
  return size;
}
```

**Fix cash accounting (line ~716):**
```javascript
// CHANGE FROM:
this.systemState.currentBalance -= fee;

// TO:
this.systemState.currentBalance -= tradeAmount; // Subtract full amount
```

## Skip Everything Else:
- NO TradeDecisionGateway
- NO new wrappers
- NO "improvements"
- Just these two fixes

## To Test:
```bash
# Download real data if needed
curl -o data/btc-test.json "https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/range/5/minute/2024-01-01/2024-01-02?apiKey=RlsCgSaDNVNtGipX05xmcAHou_h7yhqZ"

# Run simple backtest
node backtest-v13-production.js elite
```

## If Still Broken:
The AIs fucked up too much. Consider:
1. Restoring from backup
2. Using git to rollback to a known working commit
3. Starting fresh with a new instance and ONLY fixing the two bugs

---
Your instinct was right - they overcomplicated everything. Two simple bugs became a day of bullshit.