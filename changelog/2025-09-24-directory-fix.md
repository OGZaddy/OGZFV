# Directory Path Fix - September 24, 2025

## CRITICAL BUG FIX: Bot Running from Wrong Directory
**Time:** 02:50 UTC
**Issue:** PM2 was running bot from `/root/OGZFV-valhalla/` but edits were made to `/home/trey/OGZFV-valhalla/`
**Root Cause:** Two copies of project exist, PM2 configured to use root copy without required modules

### Problem Analysis
**Discovery:** `ps aux` showed bot process: `node /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js`
**File sizes:**
- `/home/trey/OGZFV-valhalla/run-trading-bot-v13-simplified.js`: 144,423 bytes (with our fixes)
- `/root/OGZFV-valhalla/run-trading-bot-v13-simplified.js`: 116,647 bytes (old version)

**Error flood:** `Error: Cannot find module './core/TierFeatureFlags'` - root copy missing core modules

### Root Causes
1. **Wrong directory**: PM2 ecosystem configured to use `/root/OGZFV-valhalla/`
2. **Missing modules**: Root copy lacked core/ directory with required modules
3. **Outdated code**: Root copy didn't have WebSocket identification fixes

### Fix Applied
**Solution:** Delete and restart bot from correct directory

**Command executed:**
```bash
pm2 delete trading-bot-FIXED
pm2 start run-trading-bot-v13-simplified.js --name trading-bot-FIXED
```

**Working directory:** `/home/trey/OGZFV-valhalla/` (contains all modules and fixes)

### Previous Fixes Now Active
With correct directory, all previous fixes are now applied:
1. ✅ **Bot WebSocket identification**: `source: 'bot'` instead of `'trading_bot'`
2. ✅ **SSL server compatibility**: Accepts both `'bot'` and `'trading_bot'`
3. ✅ **Full debug logging**: Shows complete WebSocket message structure
4. ✅ **All core modules**: TierFeatureFlags, EnhancedPatternRecognition, etc.

### Expected Results
- Bot should connect to SSL server successfully
- Should show: `🤖 TRADING BOT IDENTIFIED!` in SSL logs
- Should display: `📨 Received WS message type: price` and `🔍 Full message: {...}`
- Should receive BTC price data and stop showing `❌ Missing data`

### Files Modified
- **No file changes** - Used existing fixed files from correct directory
- `changelog/2025-09-24-directory-fix.md` (this file)

## Operations
```bash
# Verify bot is running from correct location
ps aux | grep trading-bot
# Should show: /home/trey/OGZFV-valhalla/run-trading-bot-v13-simplified.js

# Monitor logs for successful connection
pm2 logs trading-bot-FIXED --lines 10
```

## Impact
- **Severity:** Critical - Previous 3 hours of debugging was on wrong copy
- **Resolution:** All previous fixes now active from correct directory
- **Risk:** None - Using working directory with all modules