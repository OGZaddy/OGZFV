# CRITICAL RULES FOR CLAUDE CODE AND AI ASSISTANTS

## 🚨 NEVER BREAK THESE RULES

### 1. PORT 3010 - THE ONLY PORT
- **ALWAYS USE PORT 3010** - This is the unified WebSocket port
- NO separate HTTP ports (not 3008, not 8080)
- NO separate API ports  
- Everything flows through WebSocket on 3010
- **WRONG**: `const port = 3008;`
- **RIGHT**: `const port = process.env.UNIFIED_PORT || 3010;`

### 2. MODULE AUTO-LOADER - USE IT
- **NEVER hardcode require() paths**
- **WRONG**: `const TimeGAN = require('./ogz_timegan_js');`
- **RIGHT**: `const TimeGAN = this.moduleLoader.load('ogz_timegan_js');`
- The module auto-loader handles all path resolution
- New modules must register with the auto-loader

### 3. TENSOR SHAPES - KEEP CONSISTENT
- Market features dimension: **60**
- All networks must use same input/output shapes
- Generator output must match discriminator input
- **ALWAYS** validate tensor dimensions before operations

### 4. FOUR BOTS - DIFFERENT TIERS
1. **quantum-beast** - Quantum tier (separate architecture)
2. **bot-starter** - Tier 1 (basic features)
3. **bot-pro** - Tier 2 (advanced features)
4. **bot-elite** - Tier 3 (all features)

### 5. BRANCH: quantum
- We are working in the **quantum** branch
- Main branch exists but we're on quantum
- Check branch before making changes

### 6. WEBSOCKET ARCHITECTURE
- Unified WebSocket Manager handles ALL communication
- No separate HTTP endpoints
- Dashboard connects via WebSocket on 3010
- Market data comes through WebSocket on 3010

### 7. NEVER BREAK WORKING CODE
- The bot has been running for 25+ hours successfully
- Test changes before applying
- Keep backups of working files
- Don't change what's not broken

### 8. MARKET DATA STRUCTURE
```javascript
marketData = {
  price: number,
  volume: number,  // THIS MUST EXIST
  rsi: number,
  macd: {
    value: number,
    signal: number,
    histogram: number
  },
  bb: {
    upper: number,
    middle: number,
    lower: number
  }
}
```

### 9. PM2 COMMANDS
- Start: `pm2 start quantum-beast`
- Restart: `pm2 restart quantum-beast`
- Logs: `pm2 logs quantum-beast`
- Status: `pm2 list`

### 10. ARCHON INTEGRATION
- Log all changes to Archon
- Check Archon before making changes
- Update Archon with solutions
- Archon URL: http://149.28.242.111:8181

## 🔴 COMMON MISTAKES TO AVOID

1. **Creating new HTTP servers** - Everything uses WebSocket on 3010
2. **Hardcoding file paths** - Use module auto-loader
3. **Changing tensor dimensions** - Keep at 60 features
4. **Breaking PM2 processes** - They've been running for 25+ hours
5. **Forgetting volume in market data** - Volume is required
6. **Using wrong IP** - It's 149.28.242.111 not 149.248.242.111

## ✅ ALWAYS DO

1. Check existing code before creating new files
2. Use the module auto-loader for all requires
3. Keep tensor dimensions consistent (60 features)
4. Test with PM2 before deploying
5. Log to Archon for learning
6. Use port 3010 for everything
7. Preserve working code patterns

## 📝 REMEMBER

- The system has been running successfully for 25+ hours
- Don't fix what isn't broken
- Every change should improve, not break
- When in doubt, check Archon knowledge base
- The user knows what works - listen to them

---

**THESE RULES PREVENT API CREDIT WASTE AND PROJECT BREAKING**