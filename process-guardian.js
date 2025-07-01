/**
 * OGZ PRIME PROCESS GUARDIAN
 * Critical Safety System - Prevents Multiple Bot Instances
 * 
 * SAFETY FEATURES:
 * 1. Single Instance Lock (PID file)
 * 2. Port Conflict Detection
 * 3. Graceful Shutdown Handler
 * 4. Process Cleanup on Exit
 * 5. Emergency Kill Switch
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ProcessGuardian {
    constructor(botName = 'OGZPrime', ports = [3001, 3002, 3010, 3011, 3012, 3013]) {
        this.botName = botName;
        this.ports = ports;
        this.pidFile = path.join(__dirname, `.${botName.toLowerCase()}.pid`);
        this.lockFile = path.join(__dirname, `.${botName.toLowerCase()}.lock`);
        this.isShuttingDown = false;
        
        // Bind methods to preserve context
        this.cleanup = this.cleanup.bind(this);
        this.emergencyShutdown = this.emergencyShutdown.bind(this);
    }

    /**
     * CRITICAL: Check if another instance is already running
     */
    async checkSingleInstance() {
        console.log('🛡️ [ProcessGuardian] Checking for existing instances...');
        
        // Check PID file
        if (fs.existsSync(this.pidFile)) {
            const existingPid = fs.readFileSync(this.pidFile, 'utf8').trim();
            
            if (await this.isProcessRunning(existingPid)) {
                console.error(`❌ [ProcessGuardian] CRITICAL: Another ${this.botName} instance is already running (PID: ${existingPid})`);
                console.error(`❌ [ProcessGuardian] SAFETY VIOLATION: Multiple instances could cause trading conflicts!`);
                console.error(`❌ [ProcessGuardian] Please stop the existing instance first or use: node process-guardian.js --kill-all`);
                process.exit(1);
            } else {
                console.log(`🧹 [ProcessGuardian] Cleaning up stale PID file (process ${existingPid} not running)`);
                fs.unlinkSync(this.pidFile);
            }
        }

        // Check for processes using our ports
        await this.checkPortConflicts();
        
        // Create lock
        await this.createLock();
    }

    /**
     * Check if ports are already in use by other processes
     */
    async checkPortConflicts() {
        console.log('🔍 [ProcessGuardian] Checking port conflicts...');
        
        for (const port of this.ports) {
            const isInUse = await this.isPortInUse(port);
            if (isInUse) {
                console.error(`❌ [ProcessGuardian] CRITICAL: Port ${port} is already in use!`);
                console.error(`❌ [ProcessGuardian] This could indicate another bot instance is running.`);
                
                // Try to identify the process
                const processInfo = await this.getProcessUsingPort(port);
                if (processInfo) {
                    console.error(`❌ [ProcessGuardian] Process using port ${port}: ${processInfo}`);
                }
                
                console.error(`❌ [ProcessGuardian] Use: node process-guardian.js --kill-port ${port} to force kill`);
                process.exit(1);
            }
        }
        
        console.log('✅ [ProcessGuardian] All ports are available');
    }

    /**
     * Create process lock and PID file
     */
    async createLock() {
        const currentPid = process.pid;
        
        // Write PID file
        fs.writeFileSync(this.pidFile, currentPid.toString());
        
        // Write lock file with metadata
        const lockData = {
            pid: currentPid,
            botName: this.botName,
            startTime: new Date().toISOString(),
            ports: this.ports,
            nodeVersion: process.version,
            platform: process.platform
        };
        
        fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
        
        console.log(`🔒 [ProcessGuardian] Process lock created (PID: ${currentPid})`);
        console.log(`🔒 [ProcessGuardian] Lock file: ${this.lockFile}`);
        
        // Setup cleanup handlers
        this.setupCleanupHandlers();
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupCleanupHandlers() {
        // Handle normal exit
        process.on('exit', this.cleanup);
        
        // Handle Ctrl+C
        process.on('SIGINT', this.emergencyShutdown);
        
        // Handle kill command
        process.on('SIGTERM', this.emergencyShutdown);
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 [ProcessGuardian] UNCAUGHT EXCEPTION:', error);
            this.emergencyShutdown();
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 [ProcessGuardian] UNHANDLED REJECTION:', reason);
            this.emergencyShutdown();
        });
        
        console.log('🛡️ [ProcessGuardian] Cleanup handlers registered');
    }

    /**
     * Emergency shutdown with cleanup
     */
    emergencyShutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('\n🚨 [ProcessGuardian] EMERGENCY SHUTDOWN INITIATED');
        console.log('🧹 [ProcessGuardian] Cleaning up process locks...');
        
        this.cleanup();
        
        console.log('✅ [ProcessGuardian] Emergency cleanup completed');
        process.exit(0);
    }

    /**
     * Clean up lock files and resources
     */
    cleanup() {
        if (this.isShuttingDown) return;
        
        try {
            // Remove PID file
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
                console.log('🧹 [ProcessGuardian] PID file removed');
            }
            
            // Remove lock file
            if (fs.existsSync(this.lockFile)) {
                fs.unlinkSync(this.lockFile);
                console.log('🧹 [ProcessGuardian] Lock file removed');
            }
            
        } catch (error) {
            console.error('⚠️ [ProcessGuardian] Cleanup error:', error.message);
        }
    }

    /**
     * Kill all instances of the bot
     */
    async killAllInstances() {
        console.log('💀 [ProcessGuardian] KILLING ALL BOT INSTANCES...');
        
        try {
            // Kill by process name (Windows)
            if (process.platform === 'win32') {
                await this.execPromise('taskkill /F /IM node.exe');
            } else {
                // Kill by process name (Unix/Linux/Mac)
                await this.execPromise('pkill -f "node.*run-trading-bot"');
            }
            
            // Clean up lock files
            this.cleanup();
            
            console.log('✅ [ProcessGuardian] All instances killed');
            
        } catch (error) {
            console.error('⚠️ [ProcessGuardian] Error killing instances:', error.message);
        }
    }

    /**
     * Kill process using specific port
     */
    async killProcessOnPort(port) {
        console.log(`💀 [ProcessGuardian] Killing process on port ${port}...`);
        
        try {
            if (process.platform === 'win32') {
                // Windows: Find and kill process using port
                const result = await this.execPromise(`netstat -ano | findstr :${port}`);
                const lines = result.split('\n');
                
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5) {
                        const pid = parts[4];
                        if (pid && pid !== '0') {
                            await this.execPromise(`taskkill /F /PID ${pid}`);
                            console.log(`✅ [ProcessGuardian] Killed process ${pid} on port ${port}`);
                        }
                    }
                }
            } else {
                // Unix/Linux/Mac: Kill process using port
                await this.execPromise(`lsof -ti:${port} | xargs kill -9`);
                console.log(`✅ [ProcessGuardian] Killed process on port ${port}`);
            }
            
        } catch (error) {
            console.error(`⚠️ [ProcessGuardian] Error killing process on port ${port}:`, error.message);
        }
    }

    /**
     * Utility functions
     */
    async isProcessRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (error) {
            return false;
        }
    }

    async isPortInUse(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const server = net.createServer();
            
            server.listen(port, () => {
                server.close(() => resolve(false));
            });
            
            server.on('error', () => resolve(true));
        });
    }

    async getProcessUsingPort(port) {
        try {
            if (process.platform === 'win32') {
                const result = await this.execPromise(`netstat -ano | findstr :${port}`);
                return result.trim();
            } else {
                const result = await this.execPromise(`lsof -i:${port}`);
                return result.trim();
            }
        } catch (error) {
            return null;
        }
    }

    execPromise(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });
    }

    /**
     * Get status of all bot instances
     */
    async getStatus() {
        console.log('📊 [ProcessGuardian] Bot Instance Status:');
        console.log('=====================================');
        
        // Check lock file
        if (fs.existsSync(this.lockFile)) {
            const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
            console.log('🔒 Active Instance Found:');
            console.log(`   PID: ${lockData.pid}`);
            console.log(`   Bot: ${lockData.botName}`);
            console.log(`   Started: ${lockData.startTime}`);
            console.log(`   Ports: ${lockData.ports.join(', ')}`);
            
            // Check if process is still running
            const isRunning = await this.isProcessRunning(lockData.pid);
            console.log(`   Status: ${isRunning ? '✅ RUNNING' : '❌ DEAD (stale lock)'}`);
            
            if (!isRunning) {
                console.log('🧹 Cleaning up stale lock...');
                this.cleanup();
            }
        } else {
            console.log('✅ No active instances found');
        }
        
        // Check for rogue processes
        console.log('\n🔍 Checking for rogue Node.js processes...');
        try {
            if (process.platform === 'win32') {
                const result = await this.execPromise('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
                const lines = result.split('\n').slice(1); // Skip header
                
                if (lines.length > 1) {
                    console.log(`⚠️ Found ${lines.length - 1} Node.js processes:`);
                    lines.forEach((line, index) => {
                        if (line.trim()) {
                            const parts = line.split(',');
                            if (parts.length >= 2) {
                                const pid = parts[1].replace(/"/g, '');
                                console.log(`   PID: ${pid}`);
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.log('⚠️ Could not check for rogue processes');
        }
    }
}

// CLI Interface
if (require.main === module) {
    const guardian = new ProcessGuardian();
    const args = process.argv.slice(2);
    
    if (args.includes('--kill-all')) {
        guardian.killAllInstances();
    } else if (args.includes('--kill-port')) {
        const portIndex = args.indexOf('--kill-port') + 1;
        const port = args[portIndex];
        if (port) {
            guardian.killProcessOnPort(parseInt(port));
        } else {
            console.error('❌ Please specify a port: --kill-port 3001');
        }
    } else if (args.includes('--status')) {
        guardian.getStatus();
    } else {
        console.log('🛡️ OGZ Prime Process Guardian');
        console.log('Usage:');
        console.log('  node process-guardian.js --status      # Check status');
        console.log('  node process-guardian.js --kill-all    # Kill all instances');
        console.log('  node process-guardian.js --kill-port 3001  # Kill process on port');
    }
}

module.exports = ProcessGuardian;