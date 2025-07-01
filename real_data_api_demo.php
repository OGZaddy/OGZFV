<?php
/**
 * API endpoint to serve REAL OGZPrime bot data to alpha demo
 * File: /demo/api/live-bot-data.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, must-revalidate');

// Path to your live bot's performance data
$live_stats_file = './live_performance.json';

try {
    // Read the real bot performance data
    if (file_exists($live_stats_file)) {
        $live_data = json_decode(file_get_contents($live_stats_file), true);
        
        // Format for alpha demo display
        $demo_data = [
            'status' => 'live',
            'message' => 'This is the ACTUAL OGZPrime AI trading live with real market data',
            'bot_info' => [
                'is_live' => $live_data['isLive'],
                'last_update' => $live_data['lastUpdate'],
                'human_time' => $live_data['humanTime'],
                'trading_mode' => 'REAL AI + PAPER MONEY',
                'market_data' => 'LIVE Bitcoin & Ethereum feeds',
                'bot_version' => $live_data['aiVersion'] ?? 'OGZPrime_v10.2'
            ],
            'performance' => [
                'current_balance' => round($live_data['currentBalance'], 2),
                'total_value' => round($live_data['totalValue'], 2),
                'total_profit' => round($live_data['totalProfit'], 2),
                'profit_percent' => round($live_data['profitPercent'], 2),
                'today_profit' => round($live_data['todayProfit'], 2),
                'today_trades' => $live_data['todayTrades'],
                'total_trades' => $live_data['totalTrades'],
                'win_rate' => round($live_data['winRate'], 1),
                'winning_trades' => $live_data['winningTrades']
            ],
            'current_positions' => $live_data['positions'] ?? [],
            'recent_activity' => $live_data['recentActivity'] ?? [],
            'uptime' => [
                'seconds' => $live_data['botUptime'],
                'human' => formatUptime($live_data['botUptime'])
            ],
            'timestamp' => time()
        ];
        
        echo json_encode($demo_data);
    } else {
        // Fallback if bot isn't running yet
        echo json_encode([
            'status' => 'starting',
            'message' => 'Live bot is starting up... Please wait',
            'performance' => [
                'current_balance' => 10000.00,
                'total_profit' => 0,
                'profit_percent' => 0,
                'today_trades' => 0,
                'total_trades' => 0,
                'win_rate' => 0
            ],
            'recent_activity' => [],
            'timestamp' => time()
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to load live bot data',
        'error' => $e->getMessage()
    ]);
}

function formatUptime($milliseconds) {
    $seconds = floor($milliseconds / 1000);
    $minutes = floor($seconds / 60);
    $hours = floor($minutes / 60);
    $days = floor($hours / 24);
    
    if ($days > 0) {
        return "{$days} days, " . ($hours % 24) . " hours";
    } elseif ($hours > 0) {
        return "{$hours} hours, " . ($minutes % 60) . " minutes";
    } elseif ($minutes > 0) {
        return "{$minutes} minutes";
    } else {
        return "{$seconds} seconds";
    }
}
?>

<!-- 
Updated Demo JavaScript - Replace in your demo index.html
Add this script section to replace the simulation:
-->

<script>
// Updated demo JavaScript that feeds from REAL bot data
class RealBotDemo {
    constructor() {
        this.apiUrl = './api/live-bot-data.php';
        this.updateInterval = 10000; // Update every 10 seconds
        this.lastUpdate = null;
        this.isAuthenticated = false;
        
        console.log('🤖 Connecting to LIVE OGZPrime bot...');
    }

    async initialize() {
        // Check authentication first
        if (!this.checkAuth()) return;
        
        // Show welcome message explaining this is REAL
        this.showRealBotWelcome();
        
        // Start fetching real data
        await this.fetchRealBotData();
        
        // Set up automatic updates
        setInterval(() => {
            this.fetchRealBotData();
        }, this.updateInterval);
        
        console.log('✅ Connected to live OGZPrime bot!');
    }

    checkAuth() {
        const auth = localStorage.getItem('ogz_alpha_auth');
        if (auth !== 'verified') {
            const username = prompt('Alpha Tester Username:');
            const password = prompt('Alpha Tester Password:');
            
            if (username === 'alpha_tester' && password === 'ogzprime2025') {
                localStorage.setItem('ogz_alpha_auth', 'verified');
                this.isAuthenticated = true;
                return true;
            } else {
                alert('Invalid credentials. Please contact support for access.');
                window.location.href = '/';
                return false;
            }
        }
        this.isAuthenticated = true;
        return true;
    }

    showRealBotWelcome() {
        const welcomeMsg = `🚀 WELCOME TO LIVE OGZPrime ALPHA!

🤖 WHAT YOU'RE SEEING:
• This is my ACTUAL trading bot running 24/7
• REAL Bitcoin & Ethereum market data
• REAL AI making REAL trading decisions
• Paper money (no real money at risk)

📊 PERFORMANCE DATA:
• Every trade you see actually happened
• All profits/losses are from real market movements
• AI decisions are logged with full reasoning
• This is exactly how it performs with real money

⏰ LIVE UPDATES:
Data updates every 10 seconds from the live bot.
You're watching the actual system in action!

Ready to see what my AI can do? 🔥`;

        alert(welcomeMsg);
    }

    async fetchRealBotData() {
        try {
            const response = await fetch(this.apiUrl + '?t=' + Date.now());
            if (!response.ok) throw new Error('Failed to fetch bot data');
            
            const data = await response.json();
            this.updateUI(data);
            this.lastUpdate = Date.now();
            
        } catch (error) {
            console.error('❌ Error fetching real bot data:', error);
            this.showConnectionError();
        }
    }

    updateUI(data) {
        // Update header with real bot status
        this.updateBotStatus(data.bot_info);
        
        // Update performance metrics
        this.updatePerformanceMetrics(data.performance);
        
        // Update current positions
        this.updateCurrentPositions(data.current_positions);
        
        // Update recent activity with REAL trades
        this.updateRecentActivity(data.recent_activity);
        
        // Update connection indicator
        this.updateConnectionStatus(data.status);
    }

    updateBotStatus(botInfo) {
        // Update the header to show this is REAL
        const header = document.querySelector('.header h1');
        if (header) {
            header.innerHTML = `OGZPrime AI Trading Bot<br><small style="color: #4CAF50; font-size: 0.6em;">🔴 LIVE: Real AI • Real Market Data • Paper Money</small>`;
        }
        
        // Update alpha badge
        const badge = document.querySelector('.alpha-badge');
        if (badge) {
            badge.innerHTML = `LIVE BOT • Last Update: ${new Date(botInfo.last_update).toLocaleTimeString()}`;
            badge.style.background = '#4CAF50';
        }
    }

    updatePerformanceMetrics(performance) {
        // Connection Status
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.innerHTML = '🔴 LIVE TRADING';
            connectionStatus.className = 'status-value status-online pulse';
        }

        // Account Balance
        const balance = document.getElementById('account-balance');
        if (balance) {
            balance.innerHTML = `$${performance.current_balance.toLocaleString()}`;
        }

        // Today's Profit
        const dailyProfit = document.getElementById('daily-profit');
        if (dailyProfit) {
            const sign = performance.today_profit >= 0 ? '+' : '';
            dailyProfit.innerHTML = `${sign}$${Math.abs(performance.today_profit).toFixed(2)} (${sign}${performance.profit_percent.toFixed(2)}%)`;
            dailyProfit.className = `status-value ${performance.today_profit >= 0 ? 'status-profit' : 'status-loss'}`;
        }

        // Trade Count
        const tradeCount = document.getElementById('trade-count');
        if (tradeCount) {
            tradeCount.innerHTML = performance.total_trades;
        }
    }

    updateCurrentPositions(positions) {
        const currentTradeDiv = document.getElementById('current-trade');
        if (!currentTradeDiv) return;

        const positionKeys = Object.keys(positions);
        
        if (positionKeys.length === 0) {
            currentTradeDiv.innerHTML = `
                <div class="trade-header">
                    <div class="trade-crypto">💤 No Active Positions</div>
                    <div class="trade-time">AI is analyzing market...</div>
                </div>
                <div class="trade-details">
                    <div class="trade-prices">Waiting for next trading opportunity</div>
                    <div class="trade-profit">Ready to trade</div>
                </div>
            `;
        } else {
            // Show the first position (or most recent)
            const symbol = positionKeys[0];
            const position = positions[symbol];
            const profit = position.currentValue - position.totalCost;
            const profitPercent = (profit / position.totalCost) * 100;
            
            currentTradeDiv.innerHTML = `
                <div class="trade-header">
                    <div class="trade-crypto">🟢 HOLDING ${symbol}</div>
                    <div class="trade-time">Opened ${new Date(position.openTime).toLocaleTimeString()}</div>
                </div>
                <div class="trade-details">
                    <div class="trade-prices">
                        Entry: $${position.avgPrice.toFixed(2)} | Current: $${(position.currentValue / position.quantity).toFixed(2)}
                    </div>
                    <div class="trade-profit ${profit >= 0 ? 'status-profit' : 'status-loss'}">
                        ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${profit >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)
                    </div>
                </div>
            `;
        }
    }

    updateRecentActivity(recentActivity) {
        const activityList = document.getElementById('activity-list');
        if (!activityList || !recentActivity) return;

        activityList.innerHTML = '';
        
        recentActivity.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'log-item';
            
            const profitClass = activity.profit > 0 ? 'status-profit' : 
                               activity.profit < 0 ? 'status-loss' : '';
            
            const profitText = activity.profit ? 
                `${activity.profit >= 0 ? '+' : ''}$${activity.profit.toFixed(2)}` : 
                'Pending';
            
            item.innerHTML = `
                <div class="log-time">${activity.time}</div>
                <div class="log-text">AI ${activity.action.toLowerCase()}ed ${activity.symbol} at $${activity.price.toFixed(2)} - ${activity.reasoning}</div>
                <div class="log-profit ${profitClass}">${profitText}</div>
            `;
            
            activityList.appendChild(item);
        });
    }

    updateConnectionStatus(status) {
        const statusElements = document.querySelectorAll('[data-status]');
        statusElements.forEach(el => {
            if (status === 'live') {
                el.style.borderLeft = '5px solid #4CAF50';
            } else if (status === 'starting') {
                el.style.borderLeft = '5px solid #ff9800';
            } else {
                el.style.borderLeft = '5px solid #f44336';
            }
        });
    }

    showConnectionError() {
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.innerHTML = '⚠️ CONNECTION ERROR';
            connectionStatus.className = 'status-value status-loss';
        }
    }

    // Updated button handlers
    refreshData() {
        this.fetchRealBotData();
        alert('🔄 Data refreshed!\n\nYou are viewing LIVE data from the actual OGZPrime bot.\nAll trades and decisions are real!');
    }

    showStats() {
        // This will show real stats from the actual bot
        alert(`📊 LIVE BOT PERFORMANCE STATS\n\n` +
              `🤖 Status: Real AI running 24/7\n` +
              `📈 Market Data: Live Bitcoin & Ethereum feeds\n` +
              `💰 Trading Mode: Paper money (real decisions)\n` +
              `⏰ Last Update: ${new Date(this.lastUpdate).toLocaleTimeString()}\n\n` +
              `This is the actual performance of the OGZPrime AI!\n` +
              `Every trade you see really happened.`);
    }

    stopDemo() {
        if (confirm('This will stop showing live bot data.\n\nThe actual bot will continue running 24/7.\n\nAre you sure?')) {
            alert('✅ Demo display stopped.\n\nThe actual OGZPrime bot continues trading 24/7.\n\nThank you for testing! Please provide feedback about what you saw.');
            window.location.href = '/';
        }
    }
}

// Initialize the real bot demo
const realBotDemo = new RealBotDemo();

// Replace the old window.onload
window.onload = function() {
    realBotDemo.initialize();
};

// Update the existing button functions
function refreshData() {
    realBotDemo.refreshData();
}

function showStats() {
    realBotDemo.showStats();
}

function stopDemo() {
    realBotDemo.stopDemo();
}
</script>