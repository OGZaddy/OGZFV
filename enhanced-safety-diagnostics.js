/**
 * Enhanced Safety Diagnostics - Debug Version
 * Adds comprehensive logging to identify why locks aren't being released
 */

const fs = require('fs');
const path = require('path');

class EnhancedSingletonLock {
    constructor(appName = 'OGZPrime') {
        this.appName = appName;
        this.lockFile = path.join(__dirname, `.${appName.toLowerCase()}.lock`);
        this.pid = process.pid;
        this.isLocked = false;
        this.startTime = Date.now();
        this.cleanupAttempts = 0;
        
        // Enhanced logging
        this.logFile = path.join(__dirname, 'logs', 'system', `lock-debug-${Date.now()}.log`);
        this.ensureLogDirectory();
        this.log('INIT', `Enhanced lock system initialized for PID ${this.pid}`);
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] [PID:${this.pid}] ${message}\n`;
        
        console.log(`🔍 [ENHANCED_SAFETY] ${logEntry.trim()}`);
        
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (e) {
            console.error('Failed to write to log file:', e);
        }
    }

    acquireLock() {
        this.log('ACQUIRE', 'Starting lock acquisition process');
        
        // Check if lock file exists
        if (fs.existsSync(this.lockFile)) {
            try {
                const existingPid = parseInt(fs.readFileSync(this.lockFile, 'utf8'));
                this.log('CHECK', `Found existing lock file with PID: ${existingPid}`);
                
                // Check if that process is still running
                try {
                    process.kill(existingPid, 0);
                    this.log('ERROR', `Process ${existingPid} is still running - ABORTING`);
                    
                    console.error(`
🚨🚨🚨 CRITICAL SAFETY ERROR 🚨🚨🚨
Another instance is running (PID: ${existingPid})
Lock file: ${this.lockFile}
Current PID: ${this.pid}

⚠️  ABORTING TO PREVENT MULTIPLE INSTANCES ⚠️
                    `);
                    process.exit(1);
                    
                } catch (e) {
                    this.log('CLEANUP', `Process ${existingPid} is dead, cleaning stale lock`);
                    fs.unlinkSync(this.lockFile);
                }
            } catch (e) {
                this.log('ERROR', `Error reading lock file: ${e.message}`);
                try {
                    fs.unlinkSync(this.lockFile);
                    this.log('CLEANUP', 'Removed corrupted lock file');
                } catch (removeError) {
                    this.log('ERROR', `Could not remove corrupted lock: ${removeError.message}`);
                }
            }
        }
        
        // Create new lock
        try {
            const lockData = JSON.stringify({
                pid: this.pid,
                startTime: this.startTime,
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform
            }, null, 2);
            
            fs.writeFileSync(this.lockFile, lockData);
            this.isLocked = true;
            this.log('SUCCESS', `Lock acquired successfully`);
        } catch (e) {
            this.log('ERROR', `Failed to create lock file: ${e.message}`);
            process.exit(1);
        }
        
        // Setup enhanced cleanup handlers
        this.setupEnhancedCleanupHandlers();
        return true;
    }

    setupEnhancedCleanupHandlers() {
        this.log('SETUP', 'Setting up enhanced cleanup handlers');
        
        // Normal exit
        process.on('exit', (code) => {
            this.log('EXIT', `Process exiting with code: ${code}`);
            this.releaseLock();
        });
        
        // Ctrl+C
        process.on('SIGINT', () => {
            this.log('SIGNAL', 'Received SIGINT (Ctrl+C)');
            this.releaseLock();
            process.exit(0);
        });
        
        // Termination signal
        process.on('SIGTERM', () => {
            this.log('SIGNAL', 'Received SIGTERM');
            this.releaseLock();
            process.exit(0);
        });
        
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.log('EXCEPTION', `UNCAUGHT EXCEPTION: ${error.message}`);
            this.log('STACK', error.stack);
            this.releaseLock();
            process.exit(1);
        });
        
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.log('REJECTION', `UNHANDLED REJECTION: ${reason}`);
            this.releaseLock();
            process.exit(1);
        });
        
        // Windows-specific
        if (process.platform === 'win32') {
            process.on('SIGBREAK', () => {
                this.log('SIGNAL', 'Received SIGBREAK');
                this.releaseLock();
                process.exit(0);
            });
        }
        
        this.log('SETUP', 'All cleanup handlers registered successfully');
    }

    releaseLock() {
        this.cleanupAttempts++;
        this.log('RELEASE', `Lock release attempt #${this.cleanupAttempts}`);
        
        if (!this.isLocked) {
            this.log('RELEASE', 'Lock was not acquired, nothing to release');
            return;
        }
        
        try {
            if (fs.existsSync(this.lockFile)) {
                const lockContent = fs.readFileSync(this.lockFile, 'utf8');
                let lockData;
                
                try {
                    lockData = JSON.parse(lockContent);
                } catch (e) {
                    // Old format, just PID
                    lockData = { pid: parseInt(lockContent) };
                }
                
                if (lockData.pid === this.pid) {
                    fs.unlinkSync(this.lockFile);
                    this.isLocked = false;
                    this.log('SUCCESS', 'Lock released successfully');
                } else {
                    this.log('WARNING', `Lock PID mismatch: ${lockData.pid} vs ${this.pid}`);
                }
            } else {
                this.log('WARNING', 'Lock file does not exist during release');
            }
        } catch (e) {
            this.log('ERROR', `Error releasing lock: ${e.message}`);
        }
        
        const uptime = Date.now() - this.startTime;
        this.log('STATS', `Process uptime: ${uptime}ms, Cleanup attempts: ${this.cleanupAttempts}`);
    }

    // Force release with detailed logging
    static forceRemoveLockWithLogging(appName = 'OGZPrime') {
        const lockFile = path.join(__dirname, `.${appName.toLowerCase()}.lock`);
        const timestamp = new Date().toISOString();
        
        console.log(`[${timestamp}] [FORCE] Attempting to force remove lock file: ${lockFile}`);
        
        try {
            if (fs.existsSync(lockFile)) {
                const lockContent = fs.readFileSync(lockFile, 'utf8');
                console.log(`[${timestamp}] [FORCE] Lock content: ${lockContent}`);
                
                fs.unlinkSync(lockFile);
                console.log(`[${timestamp}] [FORCE] Lock file removed successfully`);
                return true;
            } else {
                console.log(`[${timestamp}] [FORCE] Lock file does not exist`);
                return false;
            }
        } catch (e) {
            console.error(`[${timestamp}] [FORCE] Failed to remove lock: ${e.message}`);
            return false;
        }
    }
}

module.exports = { EnhancedSingletonLock };