# 🚨🚨🚨 STOP! READ THIS BEFORE DOING ANYTHING! 🚨🚨🚨

## YOU ARE ABOUT TO BREAK EVERYTHING IF YOU DON'T FOLLOW THESE RULES

# 🔴 MASTER RULE #1 - THIS IS ABSOLUTE 🔴
## **ALL WORK MUST BE IN `/home/trey/OGZFV-valhalla/`**

### ❌ NEVER USE `/root/OGZFV-valhalla/` ❌
### ❌ DO NOT CREATE FILES IN `/root/` ❌
### ✅ ALWAYS USE `/home/trey/OGZFV-valhalla/` ✅

---

# MISSION CRITICAL PRIORITIES

## PRIORITY #1: CHANGELOG IS SACRED
**"If it's a freaking bracket, I want it recorded"**
- EVERY change must be logged in CHANGELOG-MASTER.md
- Current change number: #450+
- Even a single character change gets documented
- Format: Change #XXX: file, line, what changed, why

## PRIORITY #2: DON'T BREAK WHAT'S WORKING
- The bot is RUNNING and TRADING
- We DON'T need optimizations
- We DON'T need enhancements
- Focus on STABILITY and SHIPPING

## PRIORITY #3: ASK BEFORE CHANGING
- VERIFY changes with user first
- NO tangent-driven modifications
- If something bothers you, ASK FIRST
- Don't "yolo willy nilly" change things

---

# CURRENT ACTIVE FILES

## THE ONLY BOT VERSION:
`/home/trey/OGZFV-valhalla/run-trading-bot-v14FINAL.js`

## CRITICAL INFRASTRUCTURE:
- WebSocket: Unified at port 3010
- Dashboard: unified-dashboard.html
- SSL Server: ogzprime_ssl_server_advanced.js
- Process Manager: PM2 (use for all commands)

## DO NOT CREATE NEW VERSIONS
- Fix the existing v14FINAL
- All old versions are in deprecated/ folder
- Creating new versions will cause chaos

---

# STOP IGNORING THESE RULES!

Previous agents have ignored these guidelines and caused:
- Duplicate bot versions
- Files in wrong directories
- Lost changes
- Broken systems

**THIS IS YOUR FINAL WARNING**

If you ignore these rules, you will break a system that took months to fix.

---

# QUICK START COMMANDS

```bash
# GO TO THE RIGHT DIRECTORY FIRST!
cd /home/trey/OGZFV-valhalla/

# Check bot status
pm2 list

# View bot logs
pm2 logs valhalla

# The ONLY bot file to edit
nano run-trading-bot-v14FINAL.js
```

---

**LAST UPDATED**: 2025-09-30
**REASON**: Agents keep ignoring guidelines and working in wrong directories