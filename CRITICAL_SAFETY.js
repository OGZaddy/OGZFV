/**
 * CRITICAL_SAFETY.js - OGZ Prime Production Safety System
 * 
 * MUST BE LOADED FIRST - Add this to the TOP of your main bot file
 * 
 * SAFETY FEATURES:
 * - Singleton lock with PID file validation
 * - Port conflict detection and prevention
 * - Graceful shutdown handling
 * - Process cleanup on all exit scenarios
 * - Cross-platform compatibility
 */

const fs = require('fs');
const path = require('path');
const net = require('net');

class SingletonLock {
    constructor(appName = 'OGZPrime') {
        this.appName = appName;
        this.lockFile = path.join(__dirname, `.${appName.toLowerCase()}.lock`);
        this.pid = process.pid;
        this.isLocked = false;
    }

    /**
     * Acquire singleton lock - CRITICAL SAFETY CHECK
     */
    acquireLock() {
        console.log('🛡️ [CRITICAL_SAFETY] Checking for existing instances...');
        
        // Check if lock file exists
        if (fs.existsSync(this.lockFile)) {
            try {
                const existingPid = parseInt(fs.readFileSync(this.lockFile, 'utf8'));
                
                // Check if that process is still running
                try {
                    process.kill(existingPid, 0); // 0 means just check, don't kill
                    
                    // Process is still running - ABORT IMMEDIATELY
                    console.error(`
🚨🚨🚨 CRITICAL SAFETY ERROR 🚨🚨🚨
Another instance of ${this.appName} is already running (PID: ${existingPid})

⚠️  ABORTING TO PREVENT MULTIPLE TRADING INSTANCES ⚠️

This could cause:
- Conflicting trades
- Port conflicts
- Data corruption
- FINANCIAL LOSSES

To force start (ONLY if you're sure the other instance is dead):
1. Kill the existing process: taskkill /F /PID ${existingPid}
2. Remove lock file: del "${this.lockFile}"
3. Start again

Current processes: Use 'tasklist /FI "IMAGENAME eq node.exe"' to check
                    `);
                    process.exit(1);
                    
                } catch (e) {
                    // Process is dead, clean up the stale lock
                    console.log('🧹 [CRITICAL_SAFETY] Cleaning up stale lock file');
                    fs.unlinkSync(this.lockFile);
                }
            } catch (e) {
                console.error('❌ [CRITICAL_SAFETY] Error reading lock file:', e);
                // Try to remove corrupted lock file
                try {
                    fs.unlinkSync(this.lockFile);
                } catch (removeError) {
                    console.error('❌ [CRITICAL_SAFETY] Could not remove corrupted lock file');
                }
            }
        }
        
        // Create new lock
        try {
            fs.writeFileSync(this.lockFile, this.pid.toString());
            this.isLocked = true;
            console.log(`🔒 [CRITICAL_SAFETY] Singleton lock acquired (PID: ${this.pid})`);
        } catch (e) {
            console.error('❌ [CRITICAL_SAFETY] Failed to create lock file:', e);
            process.exit(1);
        }
        
        // Setup cleanup handlers
        this.setupCleanupHandlers();
        
        return true;
    }

    /**
     * Setup all possible cleanup scenarios
     */
    setupCleanupHandlers() {
        // Normal exit
        process.on('exit', () => this.releaseLock());
        
        // Ctrl+C
        process.on('SIGINT', () => {
            console.log('\n🛑 [CRITICAL_SAFETY] Received SIGINT (Ctrl+C)');
            this.releaseLock();
            process.exit(0);
        });
        
        // Termination signal
        process.on('SIGTERM', () => {
            console.log('\n🛑 [CRITICAL_SAFETY] Received SIGTERM');
            this.releaseLock();
            process.exit(0);
        });
        
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 [CRITICAL_SAFETY] UNCAUGHT EXCEPTION:', error);
            this.releaseLock();
            process.exit(1);
        });
        
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 [CRITICAL_SAFETY] UNHANDLED REJECTION:', reason);
            this.releaseLock();
            process.exit(1);
        });
        
        // Windows-specific signals
        if (process.platform === 'win32') {
            process.on('SIGBREAK', () => {
                console.log('\n🛑 [CRITICAL_SAFETY] Received SIGBREAK');
                this.releaseLock();
                process.exit(0);
            });
        }
    }

    /**
     * Release the singleton lock
     */
    releaseLock() {
        if (!this.isLocked) return;
        
        try {
            if (fs.existsSync(this.lockFile)) {
                const lockPid = parseInt(fs.readFileSync(this.lockFile, 'utf8'));
                if (lockPid === this.pid) {
                    fs.unlinkSync(this.lockFile);
                    console.log('🔓 [CRITICAL_SAFETY] Singleton lock released');
                    this.isLocked = false;
                } else {
                    console.warn(`⚠️ [CRITICAL_SAFETY] Lock file PID mismatch: ${lockPid} vs ${this.pid}`);
                }
            }
        } catch (e) {
            console.error('❌ [CRITICAL_SAFETY] Error releasing lock:', e);
        }
    }

    /**
     * Force remove lock file (emergency use only)
     */
    static forceRemoveLock(appName = 'OGZPrime') {
        const lockFile = path.join(__dirname, `.${appName.toLowerCase()}.lock`);
        try {
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
                console.log('🧹 [CRITICAL_SAFETY] Force removed lock file');
                return true;
            }
        } catch (e) {
            console.error('❌ [CRITICAL_SAFETY] Failed to force remove lock:', e);
            return false;
        }
        return false;
    }
}

/**
 * Check if a port is already in use
 */
function checkPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`
⚠️  [CRITICAL_SAFETY] PORT ${port} ALREADY IN USE!
Another instance may be running on this port.
Check with: netstat -ano | findstr :${port}
                `);
                resolve(true);
            } else {
                resolve(false);
            }
        });
        
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        
        server.listen(port);
    });
}

/**
 * Check multiple ports for conflicts
 */
async function checkPortsInUse(ports) {
    console.log('🔍 [CRITICAL_SAFETY] Checking ports for conflicts...');
    
    const conflicts = [];
    for (const port of ports) {
        const inUse = await checkPortInUse(port);
        if (inUse) {
            conflicts.push(port);
        } else {
            console.log(`✅ [CRITICAL_SAFETY] Port ${port} is available`);
        }
    }
    
    if (conflicts.length > 0) {
        console.error(`
🚨 [CRITICAL_SAFETY] PORT CONFLICTS DETECTED!
Ports in use: ${conflicts.join(', ')}

This indicates another bot instance is running.
Check running processes: tasklist /FI "IMAGENAME eq node.exe"
        `);
        return false;
    }
    
    console.log('✅ [CRITICAL_SAFETY] All ports are available');
    return true;
}

/**
 * Emergency kill all Node.js processes (use with extreme caution)
 */
function emergencyKillAllNodeProcesses() {
    console.log('🚨 [CRITICAL_SAFETY] EMERGENCY: Killing all Node.js processes...');
    
    try {
        if (process.platform === 'win32') {
            require('child_process').execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
        } else {
            require('child_process').execSync('pkill -f node', { stdio: 'inherit' });
        }
        console.log('✅ [CRITICAL_SAFETY] Emergency kill completed');
    } catch (e) {
        console.error('❌ [CRITICAL_SAFETY] Emergency kill failed:', e.message);
    }
}

/**
 * Get status of running Node.js processes
 */
function getNodeProcessStatus() {
    try {
        if (process.platform === 'win32') {
            const result = require('child_process').execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
            console.log('📊 [CRITICAL_SAFETY] Node.js processes:');
            console.log(result);
        } else {
            const result = require('child_process').execSync('ps aux | grep node | grep -v grep', { encoding: 'utf8' });
            console.log('📊 [CRITICAL_SAFETY] Node.js processes:');
            console.log(result);
        }
    } catch (e) {
        console.log('✅ [CRITICAL_SAFETY] No Node.js processes found');
    }
}

// CLI interface for emergency operations
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--status')) {
        getNodeProcessStatus();
        process.exit(0);
    }
    
    if (args.includes('--force-unlock')) {
        SingletonLock.forceRemoveLock();
        process.exit(0);
    }
    
    if (args.includes('--emergency-kill')) {
        console.log('⚠️  This will kill ALL Node.js processes!');
        console.log('Press Ctrl+C within 5 seconds to abort...');
        setTimeout(() => {
            emergencyKillAllNodeProcesses();
            process.exit(0);
        }, 5000);
        return;
    }
    
    console.log(`
🛡️ OGZ Prime Critical Safety System

Usage:
  node CRITICAL_SAFETY.js --status          # Show running Node.js processes
  node CRITICAL_SAFETY.js --force-unlock    # Force remove lock file
  node CRITICAL_SAFETY.js --emergency-kill  # Kill all Node.js processes (DANGER!)

Integration:
  Add this to the TOP of your main bot file:
  
  const { SingletonLock, checkPortsInUse } = require('./CRITICAL_SAFETY');
  
  // CRITICAL: Acquire singleton lock FIRST
  const lock = new SingletonLock('OGZPrime');
  lock.acquireLock();
  
  // Check ports before starting
  checkPortsInUse([3001, 3002, 3010, 3011, 3012, 3013]).then(portsOk => {
      if (!portsOk) {
          console.error('Port conflicts detected - aborting');
          process.exit(1);
      }
      // Start your bot here...
  });
    `);
}

module.exports = { 
    SingletonLock, 
    checkPortInUse, 
    checkPortsInUse, 
    emergencyKillAllNodeProcesses,
    getNodeProcessStatus
};