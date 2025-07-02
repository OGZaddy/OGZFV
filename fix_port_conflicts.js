#!/usr/bin/env node

/**
 * OGZ Prime Port Conflict Resolution Script
 * 
 * This script:
 * 1. Identifies all processes using WebSocket ports
 * 2. Kills conflicting processes
 * 3. Verifies port availability
 * 4. Tests the main bot startup
 */

const { execSync, spawn } = require('child_process');
const net = require('net');

class PortConflictResolver {
    constructor() {
        this.mainBotPorts = [3001, 3002, 3003];
        this.sslServerPorts = [3010, 3011, 3012, 3013];
        this.devServicePorts = [3021, 3022, 3023];
        this.transparencyPorts = [3008, 3009];
        this.mobilePorts = [5000, 5001];
        
        this.allPorts = [
            ...this.mainBotPorts,
            ...this.sslServerPorts,
            ...this.devServicePorts,
            ...this.transparencyPorts,
            ...this.mobilePorts
        ];
    }

    async run() {
        console.log('🔧 OGZ Prime Port Conflict Resolution');
        console.log('=====================================\n');

        // Step 1: Check current port usage
        await this.checkPortUsage();

        // Step 2: Kill conflicting processes
        await this.killConflictingProcesses();

        // Step 3: Verify ports are free
        await this.verifyPortsAvailable();

        // Step 4: Test basic import
        await this.testBasicImport();

        console.log('\n✅ Port conflict resolution complete!');
        console.log('\n🚀 You can now start the main bot:');
        console.log('   node OGZPrimeV10.2.js');
    }

    async checkPortUsage() {
        console.log('📊 Step 1: Checking current port usage...');
        console.log('------------------------------------------');

        for (const port of this.allPorts) {
            const isInUse = await this.isPortInUse(port);
            const category = this.getPortCategory(port);
            
            if (isInUse) {
                console.log(`❌ Port ${port} (${category}): IN USE`);
                try {
                    const pid = this.getProcessUsingPort(port);
                    if (pid) {
                        console.log(`   └─ Process ID: ${pid}`);
                    }
                } catch (err) {
                    console.log(`   └─ Could not identify process`);
                }
            } else {
                console.log(`✅ Port ${port} (${category}): Available`);
            }
        }
    }

    async killConflictingProcesses() {
        console.log('\n🔪 Step 2: Killing conflicting processes...');
        console.log('---------------------------------------------');

        // Focus on main bot ports that MUST be free
        const criticalPorts = this.mainBotPorts;

        for (const port of criticalPorts) {
            const isInUse = await this.isPortInUse(port);
            if (isInUse) {
                console.log(`🎯 Killing process on critical port ${port}...`);
                try {
                    await this.killProcessOnPort(port);
                    console.log(`✅ Port ${port} freed`);
                } catch (err) {
                    console.error(`❌ Failed to free port ${port}: ${err.message}`);
                }
            }
        }

        // Wait a moment for processes to fully terminate
        await this.sleep(2000);
    }

    async verifyPortsAvailable() {
        console.log('\n🔍 Step 3: Verifying port availability...');
        console.log('------------------------------------------');

        let allClear = true;

        for (const port of this.mainBotPorts) {
            const isInUse = await this.isPortInUse(port);
            if (isInUse) {
                console.log(`❌ CRITICAL: Port ${port} still in use!`);
                allClear = false;
            } else {
                console.log(`✅ Port ${port}: Ready for main bot`);
            }
        }

        if (allClear) {
            console.log('\n🎉 All critical ports are available!');
        } else {
            console.log('\n⚠️ Some ports are still blocked. Manual intervention may be required.');
        }

        return allClear;
    }

    async testBasicImport() {
        console.log('\n🧪 Step 4: Testing basic import...');
        console.log('-----------------------------------');

        try {
            // Test if the main file can be imported without errors
            const testScript = `
                try {
                    console.log('Testing OGZPrime import...');
                    const OGZPrime = require('./OGZPrimeV10.2');
                    console.log('✅ Import successful');
                    
                    console.log('Testing instance creation...');
                    const bot = new OGZPrime({
                        mode: 'test',
                        profileName: 'test-profile'
                    });
                    console.log('✅ Instance created successfully');
                    
                    // Clean shutdown
                    if (bot.shutdown) {
                        bot.shutdown();
                    }
                    
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Test failed:', error.message);
                    process.exit(1);
                }
            `;

            execSync(`node -e "${testScript}"`, { 
                stdio: 'inherit',
                timeout: 10000 
            });

            console.log('✅ Basic import test passed!');
        } catch (error) {
            console.error('❌ Basic import test failed:', error.message);
            console.log('\n🔍 This indicates there may still be code issues to resolve.');
        }
    }

    // Utility methods
    async isPortInUse(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, () => {
                server.once('close', () => {
                    resolve(false);
                });
                server.close();
            });
            
            server.on('error', () => {
                resolve(true);
            });
        });
    }

    getProcessUsingPort(port) {
        try {
            if (process.platform === 'win32') {
                const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
                const lines = result.split('\n').filter(line => line.includes(`${port}`));
                if (lines.length > 0) {
                    const parts = lines[0].trim().split(/\s+/);
                    return parts[parts.length - 1];
                }
            } else {
                const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
                return result.trim();
            }
        } catch (err) {
            return null;
        }
    }

    async killProcessOnPort(port) {
        try {
            if (process.platform === 'win32') {
                const pid = this.getProcessUsingPort(port);
                if (pid) {
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                }
            } else {
                execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
            }
        } catch (err) {
            throw new Error(`Failed to kill process on port ${port}: ${err.message}`);
        }
    }

    getPortCategory(port) {
        if (this.mainBotPorts.includes(port)) return 'Main Bot';
        if (this.sslServerPorts.includes(port)) return 'SSL Server';
        if (this.devServicePorts.includes(port)) return 'Dev Services';
        if (this.transparencyPorts.includes(port)) return 'Transparency';
        if (this.mobilePorts.includes(port)) return 'Mobile API';
        return 'Other';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the resolver
if (require.main === module) {
    const resolver = new PortConflictResolver();
    resolver.run().catch(console.error);
}

module.exports = PortConflictResolver;