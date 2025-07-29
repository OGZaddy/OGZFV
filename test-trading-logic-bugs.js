/**
 * 🧠 ADVANCED TRADING LOGIC BUG DETECTOR
 * Tests for ghost patterns, edge decay, exponential dropoff, and disconnect handling
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ADVANCED TRADING LOGIC BUG DETECTION\n');
console.log('Testing for:');
console.log('  - Ghost patterns (patterns that no longer work)');
console.log('  - Edge decay (strategy effectiveness degradation)');
console.log('  - Exponential dropoff in performance');
console.log('  - Disconnect recovery issues\n');

const bugs = [];
const warnings = [];

// Test 1: Check Pattern Memory for Ghost Patterns
async function testGhostPatterns() {
    console.log('👻 TEST 1: Ghost Pattern Detection...');
    
    // Load pattern memory files
    const memoryDir = path.join(__dirname, 'memory');
    const patternFiles = fs.readdirSync(memoryDir).filter(f => f.startsWith('memory_'));
    
    let totalPatterns = 0;
    let oldPatterns = 0;
    let suspiciousPatterns = [];
    
    for (const file of patternFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(memoryDir, file), 'utf8'));
            
            if (data.patterns) {
                totalPatterns += data.patterns.length;
                
                // Check for patterns that haven't been profitable recently
                data.patterns.forEach(pattern => {
                    const lastSeen = new Date(pattern.lastSeen || pattern.timestamp);
                    const daysSince = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
                    
                    if (daysSince > 7) {
                        oldPatterns++;
                    }
                    
                    // Check for patterns with declining success rate
                    if (pattern.successRate && pattern.historicalSuccessRate) {
                        const decline = pattern.historicalSuccessRate - pattern.successRate;
                        if (decline > 0.2) { // 20% decline
                            suspiciousPatterns.push({
                                name: pattern.name || 'Unknown',
                                decline: (decline * 100).toFixed(1),
                                current: (pattern.successRate * 100).toFixed(1),
                                historical: (pattern.historicalSuccessRate * 100).toFixed(1)
                            });
                        }
                    }
                });
            }
        } catch (e) {
            // Skip invalid files
        }
    }
    
    console.log(`   Total patterns in memory: ${totalPatterns}`);
    console.log(`   Patterns not seen in 7+ days: ${oldPatterns}`);
    
    if (oldPatterns > totalPatterns * 0.5) {
        bugs.push(`Ghost patterns detected: ${oldPatterns}/${totalPatterns} patterns are stale`);
    }
    
    if (suspiciousPatterns.length > 0) {
        warnings.push(`${suspiciousPatterns.length} patterns showing performance decay`);
        console.log('   Patterns with declining success:');
        suspiciousPatterns.slice(0, 3).forEach(p => {
            console.log(`     - ${p.name}: ${p.historical}% → ${p.current}% (-${p.decline}%)`);
        });
    }
}

// Test 2: Check for Edge Decay in Trading Performance
async function testEdgeDecay() {
    console.log('\n📉 TEST 2: Edge Decay Analysis...');
    
    // Check log files for performance over time
    const logsDir = path.join(__dirname, 'logs', 'trades');
    
    if (!fs.existsSync(logsDir)) {
        warnings.push('No trade logs found - cannot analyze edge decay');
        return;
    }
    
    const tradeFiles = fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .slice(-30); // Last 30 days
    
    const dailyPerformance = [];
    
    for (const file of tradeFiles) {
        try {
            const trades = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
            const winRate = trades.filter(t => t.profit > 0).length / trades.length;
            const avgProfit = trades.reduce((sum, t) => sum + t.profit, 0) / trades.length;
            
            dailyPerformance.push({
                date: file.replace('.json', ''),
                winRate,
                avgProfit,
                tradeCount: trades.length
            });
        } catch (e) {
            // Skip invalid files
        }
    }
    
    if (dailyPerformance.length > 7) {
        // Calculate trend
        const firstWeek = dailyPerformance.slice(0, 7);
        const lastWeek = dailyPerformance.slice(-7);
        
        const firstWeekWinRate = firstWeek.reduce((sum, d) => sum + d.winRate, 0) / firstWeek.length;
        const lastWeekWinRate = lastWeek.reduce((sum, d) => sum + d.winRate, 0) / lastWeek.length;
        
        const winRateDecline = firstWeekWinRate - lastWeekWinRate;
        
        console.log(`   First week win rate: ${(firstWeekWinRate * 100).toFixed(1)}%`);
        console.log(`   Last week win rate: ${(lastWeekWinRate * 100).toFixed(1)}%`);
        
        if (winRateDecline > 0.1) { // 10% decline
            bugs.push(`Edge decay detected: Win rate declined ${(winRateDecline * 100).toFixed(1)}%`);
        }
        
        // Check for exponential dropoff
        let consecutiveDeclines = 0;
        for (let i = 1; i < dailyPerformance.length; i++) {
            if (dailyPerformance[i].winRate < dailyPerformance[i-1].winRate) {
                consecutiveDeclines++;
            } else {
                consecutiveDeclines = 0;
            }
            
            if (consecutiveDeclines >= 5) {
                bugs.push('Exponential performance dropoff detected: 5+ consecutive declining days');
                break;
            }
        }
    }
}

// Test 3: Check Disconnect Recovery
async function testDisconnectRecovery() {
    console.log('\n🔌 TEST 3: Disconnect Recovery Testing...');
    
    // Check ConnectionResilience implementation
    const resilencePath = path.join(__dirname, 'core', 'ConnectionResilience.js');
    
    if (fs.existsSync(resilencePath)) {
        const content = fs.readFileSync(resilencePath, 'utf8');
        
        // Check for proper recovery mechanisms
        const hasReconnect = content.includes('reconnect') || content.includes('Reconnect');
        const hasBackoff = content.includes('backoff') || content.includes('exponential');
        const hasMaxAttempts = content.includes('maxReconnectAttempts');
        const hasDataTracking = content.includes('lastData') || content.includes('updateDataTimestamp');
        
        console.log(`   ✓ Reconnection logic: ${hasReconnect ? 'YES' : 'NO'}`);
        console.log(`   ✓ Exponential backoff: ${hasBackoff ? 'YES' : 'NO'}`);
        console.log(`   ✓ Max attempts limit: ${hasMaxAttempts ? 'YES' : 'NO'}`);
        console.log(`   ✓ Data timestamp tracking: ${hasDataTracking ? 'YES' : 'NO'}`);
        
        if (!hasReconnect) bugs.push('No reconnection logic found in ConnectionResilience');
        if (!hasBackoff) warnings.push('No exponential backoff for reconnections');
        if (!hasMaxAttempts) warnings.push('No maximum reconnection attempts limit');
    } else {
        bugs.push('ConnectionResilience.js not found - critical for handling disconnects');
    }
    
    // Check error logs for disconnect issues
    const errorLogsDir = path.join(__dirname, 'logs', 'errors');
    
    if (fs.existsSync(errorLogsDir)) {
        const recentErrors = fs.readdirSync(errorLogsDir)
            .filter(f => f.endsWith('.log'))
            .slice(-7); // Last 7 days
        
        let disconnectErrors = 0;
        let unrecoveredDisconnects = 0;
        
        for (const file of recentErrors) {
            const content = fs.readFileSync(path.join(errorLogsDir, file), 'utf8');
            const lines = content.split('\n');
            
            lines.forEach(line => {
                if (line.includes('disconnect') || line.includes('connection lost')) {
                    disconnectErrors++;
                    
                    // Check if there's a recovery within next 10 lines
                    const lineIndex = lines.indexOf(line);
                    const nextLines = lines.slice(lineIndex, lineIndex + 10).join(' ');
                    
                    if (!nextLines.includes('reconnect') && !nextLines.includes('recovered')) {
                        unrecoveredDisconnects++;
                    }
                }
            });
        }
        
        if (disconnectErrors > 0) {
            console.log(`   Found ${disconnectErrors} disconnect events`);
            console.log(`   Unrecovered: ${unrecoveredDisconnects}`);
            
            if (unrecoveredDisconnects > 0) {
                bugs.push(`${unrecoveredDisconnects} disconnects without recovery detected`);
            }
        }
    }
}

// Test 4: Pattern Recognition Decay
async function testPatternRecognitionDecay() {
    console.log('\n🎯 TEST 4: Pattern Recognition Effectiveness...');
    
    const patternRecPath = path.join(__dirname, 'core', 'EnhancedPatternRecognition.js');
    
    if (fs.existsSync(patternRecPath)) {
        const content = fs.readFileSync(patternRecPath, 'utf8');
        
        // Check for adaptive learning
        const hasAdaptive = content.includes('adaptive') || content.includes('updatePatterns');
        const hasDecayHandling = content.includes('decay') || content.includes('aging');
        const hasValidation = content.includes('validatePattern') || content.includes('confidence');
        
        console.log(`   ✓ Adaptive learning: ${hasAdaptive ? 'YES' : 'NO'}`);
        console.log(`   ✓ Pattern decay handling: ${hasDecayHandling ? 'YES' : 'NO'}`);
        console.log(`   ✓ Pattern validation: ${hasValidation ? 'YES' : 'NO'}`);
        
        if (!hasAdaptive) warnings.push('Pattern recognition lacks adaptive learning');
        if (!hasDecayHandling) bugs.push('No pattern decay handling - may trade on outdated patterns');
    }
    
    // Check pattern files for age
    const patternsDir = path.join(__dirname, 'logs', 'patterns');
    
    if (fs.existsSync(patternsDir)) {
        const patternFiles = fs.readdirSync(patternsDir);
        const now = Date.now();
        
        let ancientPatterns = 0;
        patternFiles.forEach(file => {
            const stats = fs.statSync(path.join(patternsDir, file));
            const age = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Days
            
            if (age > 30) {
                ancientPatterns++;
            }
        });
        
        if (ancientPatterns > 0) {
            warnings.push(`${ancientPatterns} pattern files older than 30 days - may contain stale data`);
        }
    }
}

// Test 5: Backtesting Integrity
async function testBacktestingIntegrity() {
    console.log('\n⏮️  TEST 5: Backtesting System Check...');
    
    // Look for backtesting implementation
    const possiblePaths = [
        path.join(__dirname, 'analytics', 'MonteCarloSimulator.js'),
        path.join(__dirname, 'core', 'PerformanceValidator.js'),
        path.join(__dirname, 'analytics', 'StrategyOptimizer.js')
    ];
    
    let hasBacktesting = false;
    let backtesingIssues = [];
    
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            hasBacktesting = true;
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for common backtesting pitfalls
            if (!content.includes('slippage')) {
                backtesingIssues.push('No slippage simulation found');
            }
            if (!content.includes('spread') && !content.includes('fee')) {
                backtesingIssues.push('No trading fees/spread simulation');
            }
            if (!content.includes('lookAhead') && !content.includes('future')) {
                warnings.push('No look-ahead bias prevention detected');
            }
        }
    }
    
    if (!hasBacktesting) {
        bugs.push('No backtesting system found - cannot validate strategies');
    } else {
        console.log('   ✓ Backtesting system found');
        if (backtesingIssues.length > 0) {
            backtesingIssues.forEach(issue => warnings.push(`Backtesting: ${issue}`));
        }
    }
}

// Generate comprehensive report
async function generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🧠 ADVANCED TRADING LOGIC BUG REPORT');
    console.log('='.repeat(60));
    
    if (bugs.length === 0) {
        console.log('\n✅ NO CRITICAL BUGS FOUND!');
    } else {
        console.log(`\n❌ FOUND ${bugs.length} CRITICAL BUGS:`);
        bugs.forEach((bug, i) => {
            console.log(`   ${i + 1}. ${bug}`);
        });
    }
    
    if (warnings.length > 0) {
        console.log(`\n⚠️  ${warnings.length} WARNINGS:`);
        warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`);
        });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Implement pattern expiration to prevent ghost trading');
    console.log('2. Add performance decay detection and strategy rotation');
    console.log('3. Enhance disconnect recovery with state persistence');
    console.log('4. Regular pattern validation against recent market data');
    console.log('5. Implement A/B testing for strategy effectiveness');
    
    console.log('\n🛡️  PROTECTION MECHANISMS TO ADD:');
    console.log('- Pattern confidence decay over time');
    console.log('- Automatic strategy switching on performance drop');
    console.log('- Disconnect state recovery from disk');
    console.log('- Real-time edge validation');
    
    console.log('\n' + '='.repeat(60));
}

// Run all tests
async function runAllTests() {
    await testGhostPatterns();
    await testEdgeDecay();
    await testDisconnectRecovery();
    await testPatternRecognitionDecay();
    await testBacktestingIntegrity();
    await generateReport();
}

// Execute
console.log('Starting advanced bug detection...\n');
runAllTests().then(() => {
    console.log('\n✅ Advanced bug detection complete!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Bug detector crashed:', err);
    process.exit(1);
});
