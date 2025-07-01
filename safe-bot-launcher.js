/**
 * OGZ PRIME SAFE BOT LAUNCHER
 * Production-Safe Bot Startup with Process Guardian Integration
 * 
 * SAFETY FEATURES:
 * - Single instance enforcement
 * - Port conflict detection
 * - Graceful shutdown handling
 * - Emergency cleanup
 * - Process monitoring
 */

const ProcessGuardian = require('./process-guardian');
const path = require('path');
const { spawn } = require('child_process');

class SafeBotLauncher {
    constructor() {
        this.guardian = new ProcessGuardian('OGZPrime', [3001, 3002, 3010, 3011, 3012, 3013]);
        this.botProcess = null;
        this.isShuttingDown = false;
        
        // Bind methods
        this.shutdown = this.shutdown.bind(this);
        this.emergencyShutdown = this.emergencyShutdown.bind(this);
    }

    /**
     * Launch the bot with full safety checks
     */
    async launch() {
        console.log('🚀 [SafeBotLauncher] Starting OGZ Prime Bot...');
        console.log('🛡️ [SafeBotLauncher] Running safety checks...');
        
        try {
            // CRITICAL: Check for existing instances
            await this.guardian.checkSingleInstance();
            
            console.log('✅ [SafeBotLauncher] Safety checks passed');
            console.log('🚀 [SafeBotLauncher] Launching bot process...');
            
            // Launch the bot
            await this.startBotProcess();
            
            // Setup monitoring
            this.setupProcessMonitoring();
            
            console.log('✅ [SafeBotLauncher] Bot launched successfully');
            console.log('🛡️ [SafeBotLauncher] Process monitoring active');
            
        } catch (error) {
            console.error('❌ [SafeBotLauncher] Launch failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Start the actual bot process
     */
    async startBotProcess() {
        return new Promise((resolve, reject) => {
            // Launch the bot as a child process
            this.botProcess = spawn('node', ['run-trading-bot-v10.2.js'], {
                stdio: 'inherit',
                cwd: __dirname
            });

            // Handle bot process events
            this.botProcess.on('spawn', () => {
                console.log(`✅ [SafeBotLauncher] Bot process started (PID: ${this.botProcess.pid})`);
                resolve();
            });

            this.botProcess.on('error', (error) => {
                console.error('❌ [SafeBotLauncher] Bot process error:', error);
                reject(error);
            });

            this.botProcess.on('exit', (code, signal) => {
                if (!this.isShuttingDown) {
                    console.error(`💥 [SafeBotLauncher] Bot process exited unexpectedly (code: ${code}, signal: ${signal})`);
                    console.log('🔄 [SafeBotLauncher] Attempting restart in 5 seconds...');
                    
                    setTimeout(() => {
                        if (!this.isShuttingDown) {
                            this.restartBot();
                        }
                    }, 5000);
                } else {
                    console.log('✅ [SafeBotLauncher] Bot process shut down gracefully');
                }
            });
        });
    }

    /**
     * Setup process monitoring and health checks
     */
    setupProcessMonitoring() {
        // Setup shutdown handlers
        process.on('SIGINT', this.emergencyShutdown);
        process.on('SIGTERM', this.emergencyShutdown);
        process.on('exit', this.shutdown);
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 [SafeBotLauncher] UNCAUGHT EXCEPTION:', error);
            this.emergencyShutdown();
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 [SafeBotLauncher] UNHANDLED REJECTION:', reason);
            this.emergencyShutdown();
        });
        
        // Periodic health check
        setInterval(() => {
            this.healthCheck();
        }, 30000); // Check every 30 seconds
        
        console.log('🔍 [SafeBotLauncher] Health monitoring started');
    }

    /**
     * Perform health check on bot process
     */
    healthCheck() {
        if (this.botProcess && !this.botProcess.killed) {
            // Bot is running
            return;
        }
        
        if (!this.isShuttingDown) {
            console.warn('⚠️ [SafeBotLauncher] Health check failed - bot process not running');
            console.log('🔄 [SafeBotLauncher] Attempting restart...');
            this.restartBot();
        }
    }

    /**
     * Restart the bot process
     */
    async restartBot() {
        console.log('🔄 [SafeBotLauncher] Restarting bot...');
        
        try {
            // Clean up old process
            if (this.botProcess && !this.botProcess.killed) {
                this.botProcess.kill('SIGTERM');
                await this.waitForProcessExit(this.botProcess, 5000);
            }
            
            // Start new process
            await this.startBotProcess();
            console.log('✅ [SafeBotLauncher] Bot restarted successfully');
            
        } catch (error) {
            console.error('❌ [SafeBotLauncher] Restart failed:', error.message);
            console.log('🔄 [SafeBotLauncher] Will retry in 10 seconds...');
            
            setTimeout(() => {
                if (!this.isShuttingDown) {
                    this.restartBot();
                }
            }, 10000);
        }
    }

    /**
     * Wait for process to exit
     */
    waitForProcessExit(process, timeout = 5000) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                if (!process.killed) {
                    console.warn('⚠️ [SafeBotLauncher] Force killing unresponsive process');
                    process.kill('SIGKILL');
                }
                resolve();
            }, timeout);
            
            process.on('exit', () => {
                clearTimeout(timer);
                resolve();
            });
        });
    }

    /**
     * Emergency shutdown
     */
    emergencyShutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('\n🚨 [SafeBotLauncher] EMERGENCY SHUTDOWN INITIATED');
        
        this.shutdown();
        
        console.log('✅ [SafeBotLauncher] Emergency shutdown completed');
        process.exit(0);
    }

    /**
     * Graceful shutdown
     */
    shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('🛑 [SafeBotLauncher] Shutting down...');
        
        // Stop bot process
        if (this.botProcess && !this.botProcess.killed) {
            console.log('🛑 [SafeBotLauncher] Stopping bot process...');
            this.botProcess.kill('SIGTERM');
        }
        
        // Cleanup guardian
        this.guardian.cleanup();
        
        console.log('✅ [SafeBotLauncher] Shutdown completed');
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log('🛡️ OGZ Prime Safe Bot Launcher');
        console.log('Usage:');
        console.log('  node safe-bot-launcher.js           # Launch bot safely');
        console.log('  node safe-bot-launcher.js --status  # Check status');
        console.log('  node safe-bot-launcher.js --kill    # Kill all instances');
        process.exit(0);
    }
    
    if (args.includes('--status')) {
        const guardian = new ProcessGuardian();
        guardian.getStatus();
        process.exit(0);
    }
    
    if (args.includes('--kill')) {
        const guardian = new ProcessGuardian();
        guardian.killAllInstances();
        process.exit(0);
    }
    
    // Default: Launch bot
    const launcher = new SafeBotLauncher();
    launcher.launch().catch((error) => {
        console.error('💥 [SafeBotLauncher] Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SafeBotLauncher;