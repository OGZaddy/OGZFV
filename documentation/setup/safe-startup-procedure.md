# 🛡️ OGZ Prime Safe Startup Procedure

## **Pre-Flight Safety Checks**

### 1. **Check System Status**
```bash
# Check for any running instances
node CRITICAL_SAFETY.js --status

# Check process guardian status
node process-guardian.js --status

# Check for any stale locks
dir *.lock
```

### 2. **Clean Stale Locks (if needed)**
```bash
# Force remove any stale locks
node CRITICAL_SAFETY.js --force-unlock

# Clean up process guardian locks
node process-guardian.js --kill-all
```

### 3. **Verify Ports Are Available**
```bash
# Check if ports are free
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3003
```

## **Safe Launch Options**

### **Option 1: Safe Bot Launcher (Recommended)**
```bash
# Launch with full safety checks and monitoring
node safe-bot-launcher.js
```

### **Option 2: Direct Launch (Manual)**
```bash
# Direct launch with manual monitoring
node OGZPrimeV10.2.js
```

### **Option 3: Enhanced Diagnostics (Debug Mode)**
```bash
# Launch with enhanced logging for debugging
node enhanced-safety-diagnostics.js
```

## **Post-Launch Verification**

### 1. **Verify Single Instance**
```bash
# Should show exactly 1 instance
node CRITICAL_SAFETY.js --status
```

### 2. **Check WebSocket Ports**
```bash
# Should show ports in use by your bot
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3003
```

### 3. **Monitor Bot Status**
```bash
# Check bot_status.json for real-time thoughts
type bot_status.json
```

## **Emergency Procedures**

### **If Multiple Instances Detected:**
```bash
# EMERGENCY: Kill all Node.js processes
node CRITICAL_SAFETY.js --emergency-kill

# Clean up all locks
node CRITICAL_SAFETY.js --force-unlock
node process-guardian.js --kill-all
```

### **If Ports Are Blocked:**
```bash
# Kill specific port
node process-guardian.js --kill-port 3001

# Or kill all and restart
node CRITICAL_SAFETY.js --emergency-kill
```

## **Monitoring Commands**

### **Real-time Status**
```bash
# Watch bot thoughts
type bot_status.json

# Check system status
node process-guardian.js --status

# Monitor logs
dir logs\trades\
```

### **Health Checks**
```bash
# Verify singleton lock
dir .ogz-prime-bot.lock

# Check for errors
dir logs\errors\
```

## **Safe Shutdown**

### **Graceful Shutdown**
- Press `Ctrl+C` in the bot terminal
- Wait for "Singleton lock released" message

### **Emergency Shutdown**
```bash
# If graceful shutdown fails
node CRITICAL_SAFETY.js --emergency-kill
node CRITICAL_SAFETY.js --force-unlock
```

## **Troubleshooting**

### **Stale Lock Issues**
1. Check if process is actually running: `tasklist /FI "PID eq [PID_FROM_LOCK]"`
2. If not running: `node CRITICAL_SAFETY.js --force-unlock`
3. If running: Stop it gracefully first

### **Port Conflicts**
1. Identify process: `netstat -ano | findstr :[PORT]`
2. Kill specific process: `taskkill /F /PID [PID]`
3. Or use: `node process-guardian.js --kill-port [PORT]`

### **Multiple Instances**
1. Use: `node CRITICAL_SAFETY.js --status`
2. Kill all: `node CRITICAL_SAFETY.js --emergency-kill`
3. Clean locks: `node CRITICAL_SAFETY.js --force-unlock`

---

## **Current Status: READY FOR SAFE LAUNCH** ✅

The stale lock has been cleared and the system is ready for startup.