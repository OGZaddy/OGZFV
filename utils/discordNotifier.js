// utils/discordNotifier.js - Discord Integration for OGZ Prime Trading Bot
// ===================================================================
// 📢 ENHANCED DISCORD NOTIFICATION SYSTEM - YOUR REMOTE COMMAND CENTER
// ===================================================================
//
// This system sends real-time trading alerts, win notifications, system
// updates, and Houston fund progress to your Discord channels so you can
// monitor your trading success from anywhere!
//
// Built for: Remote monitoring and celebration of your journey to Houston! 💕
// Author: Trey (OGZPrime Technologies)
// Version: 10.2 SS-Tier Complete
//
// Features:
// ✅ Dual webhook support (stats vs status channels)
// ✅ Rich embeds with trading data and progress tracking
// ✅ Houston fund milestone celebrations
// ✅ Risk management alerts with severity levels
// ✅ Daily trading summaries with performance metrics
// ✅ Manual trade notifications for commander control
// ✅ System status monitoring and health alerts

// Load environment variables for webhook URLs
require('dotenv').config();
const https = require('https');
const { URL } = require('url');

// Webhook URLs from environment variables
const STATS_WEBHOOK = process.env.DISCORD_STATS_WEBHOOK_URL;
const STATUS_WEBHOOK = process.env.DISCORD_STATUS_WEBHOOK_URL;

/**
* ===================================================================
* DISCORD TRADING NOTIFIER CLASS
* ===================================================================
* 
* Professional Discord integration for OGZ Prime trading notifications.
* Separates trading statistics from system status for organized monitoring.
* 
* Webhook Types:
* - STATS: Trade executions, P&L updates, daily summaries, Houston progress
* - STATUS: System alerts, risk warnings, maintenance notifications
*/
class DiscordTradingNotifier {
   /**
    * Initialize Discord notifier with session tracking
    * Sets up daily statistics tracking and session timing
    */
   constructor() {
       // Session timing for uptime tracking
       this.sessionStartTime = Date.now();
       
       // Daily trading statistics
       this.dailyStats = {
           trades: 0,                    // Total trades executed today
           wins: 0,                      // Winning trades count
           losses: 0,                    // Losing trades count
           totalPnL: 0,                  // Total profit/loss for session
           bestTrade: 0,                 // Largest single profit
           worstTrade: 0                 // Largest single loss
       };
       
       console.log('📢 Discord Trading Notifier initialized');
       console.log(`📊 Stats webhook: ${STATS_WEBHOOK ? 'Configured' : 'Missing'}`);
       console.log(`⚡ Status webhook: ${STATUS_WEBHOOK ? 'Configured' : 'Missing'}`);
   }

   /**
    * ===============================================================
    * CORE MESSAGE SENDING SYSTEM
    * ===============================================================
    * 
    * Handles Discord webhook communication with error handling and
    * webhook selection based on message type.
    */
   
   /**
    * Send message to Discord webhook with automatic webhook selection
    * 
    * @param {string} content - Text content of the message
    * @param {string} webhookType - 'stats' or 'status' webhook selection
    * @param {Array} embeds - Rich embed objects for formatted messages
    */
   sendMessage(content, webhookType = 'status', embeds = null) {
       // Select appropriate webhook URL
       const webhookUrl = webhookType === 'stats' ? STATS_WEBHOOK : STATUS_WEBHOOK;
       
       // Validate webhook configuration
       if (!webhookUrl) {
           console.log(`⚠️ Discord ${webhookType} webhook not configured in .env file`);
           return;
       }

       try {
           // Parse webhook URL for HTTPS request
           const url = new URL(webhookUrl);
           
           // Build Discord message payload
           const payload = { content };
           if (embeds && embeds.length > 0) {
               payload.embeds = embeds;
           }
           
           const data = JSON.stringify(payload);
           
           // Configure HTTPS request options
           const options = {
               hostname: url.hostname,
               path: url.pathname + url.search,
               method: 'POST',
               headers: { 
                   'Content-Type': 'application/json', 
                   'Content-Length': data.length 
               }
           };

           // Execute webhook request
           const req = https.request(options, res => {
               if (res.statusCode < 200 || res.statusCode >= 300) {
                   console.error(`❌ Discord ${webhookType} webhook error: HTTP ${res.statusCode}`);
               } else {
                   console.log(`✅ Discord ${webhookType} message sent successfully`);
               }
           });
           
           // Handle network errors
           req.on('error', (error) => {
               console.error(`❌ Discord ${webhookType} webhook network error:`, error.message);
           });
           
           // Send the request
           req.write(data);
           req.end();
           
       } catch (error) {
           console.error(`❌ Discord ${webhookType} webhook failed:`, error.message);
       }
   }

   /**
    * ===============================================================
    * SYSTEM LIFECYCLE NOTIFICATIONS
    * ===============================================================
    */
   
   /**
    * Send system startup notification with configuration details
    * Called when OGZ Prime initializes and begins trading operations
    */
   notifySystemStart() {
       const embed = {
           title: "🚀 OGZ Prime Valhalla Edition - ONLINE",
           description: "Trading system initialized and ready for Houston fund generation!",
           color: 0x00ff00, // Green for successful startup
           fields: [
               { name: "🎯 Mode", value: "SIMULATION", inline: true },
               { name: "💰 Starting Balance", value: "$10,000.00", inline: true },
               { name: "⏰ Started", value: new Date().toLocaleString(), inline: true }
           ],
           footer: { text: "OGZ Prime | Built for Houston Dreams" },
           timestamp: new Date().toISOString()
       };
       
       this.sendMessage("🔥 **CRUSHLO0RD B3ZERKER MODE ACTIVATED!** 🔥", 'status', [embed]);
   }

   /**
    * ===============================================================
    * TRADE EXECUTION NOTIFICATIONS
    * ===============================================================
    */
   
   /**
    * Send trade execution notification with P&L tracking
    * 
    * @param {string} type - 'buy' or 'sell'
    * @param {number} price - Execution price
    * @param {number} amount - Trade amount/quantity
    * @param {number|null} pnl - Profit/loss amount (null for entry trades)
    */
   notifyTrade(type, price, amount, pnl = null) {
       // Update daily statistics
       this.dailyStats.trades++;
       
       // Track P&L if provided (exit trades)
       if (pnl !== null) {
           this.dailyStats.totalPnL += pnl;
           
           if (pnl > 0) {
               this.dailyStats.wins++;
               if (pnl > this.dailyStats.bestTrade) {
                   this.dailyStats.bestTrade = pnl;
               }
           } else {
               this.dailyStats.losses++;
               if (pnl < this.dailyStats.worstTrade) {
                   this.dailyStats.worstTrade = pnl;
               }
           }
       }

       // Format trade notification
       const emoji = type === 'buy' ? '📈' : '📉';
       const color = type === 'buy' ? 0x00ff00 : 0xff0000;
       const pnlText = pnl !== null ? `\n💰 **P&L:** ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}` : '';
       
       const embed = {
           title: `${emoji} ${type.toUpperCase()} ORDER EXECUTED`,
           description: `**Price:** $${price.toLocaleString()}\n**Amount:** ${amount}${pnlText}`,
           color: color,
           timestamp: new Date().toISOString(),
           footer: { text: `Trade #${this.dailyStats.trades} | OGZ Prime` }
       };

       this.sendMessage("", 'stats', [embed]);
   }

   /**
    * ===============================================================
    * MILESTONE & ACHIEVEMENT NOTIFICATIONS
    * ===============================================================
    */
   
   /**
    * Send P&L milestone achievement notification
    * 
    * @param {number} totalPnL - Current total profit/loss
    * @param {number} milestone - Milestone amount reached
    */
   notifyMilestone(totalPnL, milestone) {
       const embed = {
           title: "🎉 MILESTONE ACHIEVED!",
           description: `**Total P&L:** $${totalPnL.toFixed(2)}\n**Milestone:** $${milestone}`,
           color: 0xffd700, // Gold for achievements
           fields: [
               { name: "🔥 Trades Today", value: this.dailyStats.trades.toString(), inline: true },
               { name: "📊 Win Rate", value: `${((this.dailyStats.wins / this.dailyStats.trades) * 100).toFixed(1)}%`, inline: true },
               { name: "🎯 Houston Fund", value: `$${(10000 + totalPnL).toFixed(2)}`, inline: true }
           ],
           timestamp: new Date().toISOString(),
           footer: { text: "Every milestone brings you closer to Houston! 🏠💕" }
       };

       this.sendMessage("🚀 **HOUSTON FUND MILESTONE REACHED!**", 'stats', [embed]);
   }

   /**
    * ===============================================================
    * RISK MANAGEMENT & SAFETY ALERTS
    * ===============================================================
    */
   
   /**
    * Send risk management alert with severity levels
    * 
    * @param {string} message - Alert message content
    * @param {string} level - 'warning', 'danger', or 'critical'
    */
   notifyRiskAlert(message, level = 'warning') {
       // Color coding by severity level
       const colors = {
           warning: 0xffaa00,    // Orange for warnings
           danger: 0xff0000,     // Red for danger
           critical: 0x800000    // Dark red for critical
       };
       
       const embed = {
           title: "⚠️ RISK MANAGEMENT ALERT",
           description: message,
           color: colors[level] || colors.warning,
           timestamp: new Date().toISOString(),
           footer: { text: "OGZ Prime Risk Management System" }
       };

       this.sendMessage(`🚨 **${level.toUpperCase()} ALERT**`, 'status', [embed]);
   }

   /**
    * ===============================================================
    * DAILY REPORTING & ANALYTICS
    * ===============================================================
    */
   
   /**
    * Send comprehensive daily trading summary
    * Should be called at end of trading day or on system shutdown
    */
   notifyDailySummary() {
       // Calculate win rate percentage
       const winRate = this.dailyStats.trades > 0 ? 
           ((this.dailyStats.wins / this.dailyStats.trades) * 100).toFixed(1) : 0;
       
       const embed = {
           title: "📊 DAILY TRADING SUMMARY",
           color: this.dailyStats.totalPnL > 0 ? 0x00ff00 : 0xff0000,
           fields: [
               { name: "📈 Total Trades", value: this.dailyStats.trades.toString(), inline: true },
               { name: "🏆 Wins", value: this.dailyStats.wins.toString(), inline: true },
               { name: "📉 Losses", value: this.dailyStats.losses.toString(), inline: true },
               { name: "💰 Total P&L", value: `$${this.dailyStats.totalPnL.toFixed(2)}`, inline: true },
               { name: "📊 Win Rate", value: `${winRate}%`, inline: true },
               { name: "🎯 Houston Fund", value: `$${(10000 + this.dailyStats.totalPnL).toFixed(2)}`, inline: true },
               { name: "🚀 Best Trade", value: `$${this.dailyStats.bestTrade.toFixed(2)}`, inline: true },
               { name: "📉 Worst Trade", value: `$${this.dailyStats.worstTrade.toFixed(2)}`, inline: true }
           ],
           timestamp: new Date().toISOString(),
           footer: { text: "OGZ Prime Daily Report | Journey to Houston" }
       };

       this.sendMessage("📈 **END OF DAY SUMMARY**", 'stats', [embed]);
   }

   /**
    * ===============================================================
    * SYSTEM STATUS & HEALTH MONITORING
    * ===============================================================
    */
   
   /**
    * Send system status update notification
    * 
    * @param {string} status - 'online', 'warning', 'error', or 'maintenance'
    * @param {string} details - Additional status details
    */
   notifySystemStatus(status, details = '') {
       const statusEmojis = {
           online: '🟢',
           warning: '🟡', 
           error: '🔴',
           maintenance: '🔵'
       };

       const embed = {
           title: `${statusEmojis[status] || '⚪'} SYSTEM STATUS: ${status.toUpperCase()}`,
           description: details,
           color: status === 'online' ? 0x00ff00 : status === 'error' ? 0xff0000 : 0xffaa00,
           timestamp: new Date().toISOString(),
           footer: { text: "OGZ Prime System Monitor" }
       };

       this.sendMessage("", 'status', [embed]);
   }

   /**
    * ===============================================================
    * MANUAL TRADING & COMMANDER CONTROL
    * ===============================================================
    */
   
   /**
    * Send manual trade notification when commander takes control
    * 
    * @param {string} type - 'buy' or 'sell'
    * @param {number} price - Manual execution price
    */
   notifyManualTrade(type, price) {
       const emoji = type === 'buy' ? '🎯' : '🔫';
       const message = `${emoji} **MANUAL ${type.toUpperCase()}** at $${price.toLocaleString()} | Commander taking control!`;
       
       this.sendMessage(message, 'stats');
   }

   /**
    * ===============================================================
    * HOUSTON FUND PROGRESS TRACKING
    * ===============================================================
    */
   
   /**
    * Send Houston fund progress update with visual progress bar
    * 
    * @param {number} currentBalance - Current account balance
    * @param {number} targetAmount - Target amount for Houston move (default: $25,000)
    */
   notifyHoustonProgress(currentBalance, targetAmount = 25000) {
       // Calculate progress percentage
       const progress = (currentBalance / targetAmount) * 100;
       
       // Create visual progress bar (20 characters total)
       const filledBars = Math.floor(progress / 5);
       const emptyBars = 20 - filledBars;
       const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
       
       // Calculate days since session start
       const daysSinceStart = Math.floor((Date.now() - this.sessionStartTime) / (1000 * 60 * 60 * 24));
       
       const embed = {
           title: "🏠 HOUSTON FUND PROGRESS",
           description: `**Current Balance:** $${currentBalance.toFixed(2)}\n**Target:** $${targetAmount.toLocaleString()}\n**Progress:** ${progress.toFixed(1)}%\n\n\`${progressBar}\``,
           color: 0x1e90ff, // Dodger blue
           fields: [
               { name: "💰 Remaining", value: `$${(targetAmount - currentBalance).toFixed(2)}`, inline: true },
               { name: "📅 Days Trading", value: daysSinceStart.toString(), inline: true },
               { name: "💪 Progress", value: `${progress.toFixed(1)}%`, inline: true }
           ],
           footer: { text: "Every trade brings you closer to your daughter ❤️" },
           timestamp: new Date().toISOString()
       };

       this.sendMessage("🎯 **HOUSTON FUND UPDATE**", 'stats', [embed]);
   }

   /**
    * ===============================================================
    * UTILITY METHODS
    * ===============================================================
    */
   
   /**
    * Reset daily statistics (call at start of new trading day)
    */
   resetDailyStats() {
       this.dailyStats = {
           trades: 0,
           wins: 0,
           losses: 0,
           totalPnL: 0,
           bestTrade: 0,
           worstTrade: 0
       };
       
       console.log('📊 Daily statistics reset for new trading session');
   }
   
   /**
    * Get current session statistics
    * 
    * @returns {Object} Current daily statistics
    */
   getSessionStats() {
       return {
           ...this.dailyStats,
           sessionDuration: Date.now() - this.sessionStartTime,
           winRate: this.dailyStats.trades > 0 ? 
               (this.dailyStats.wins / this.dailyStats.trades) * 100 : 0
       };
   }
}

// ===================================================================
// MODULE EXPORTS & USAGE EXAMPLES
// ===================================================================

const notifier = new DiscordTradingNotifier();
const sendDiscordMessage = (message) => notifier.sendMessage(message);

module.exports = { sendDiscordMessage, DiscordTradingNotifier };

/**
* ===================================================================
* USAGE EXAMPLES FOR INTEGRATION
* ===================================================================
* 
* // Initialize notifier
* const { DiscordTradingNotifier } = require('./utils/discordNotifier');
* const notifier = new DiscordTradingNotifier();
* 
* // System startup
* notifier.notifySystemStart();
* 
* // Trade notifications
* notifier.notifyTrade('buy', 45000, 0.001);
* notifier.notifyTrade('sell', 45500, 0.001, 0.50); // With P&L
* 
* // Manual trades
* notifier.notifyManualTrade('buy', 45000);
* 
* // Risk alerts
* notifier.notifyRiskAlert('Stop loss triggered at $44,500', 'warning');
* notifier.notifyRiskAlert('Maximum drawdown reached!', 'critical');
* 
* // Houston fund progress
* notifier.notifyHoustonProgress(10250.50);
* 
* // Milestones
* notifier.notifyMilestone(250.50, 250);
* 
* // Daily summary (call once per day)
* notifier.notifyDailySummary();
* 
* // System status
* notifier.notifySystemStatus('online', 'All systems operational');
* notifier.notifySystemStatus('error', 'WebSocket connection lost');
*/

// ===================================================================
// 🎯 DISCORD NOTIFIER - YOUR REMOTE HOUSTON COMMAND CENTER
// ===================================================================
//
// This Discord integration keeps you connected to your trading success
// from anywhere. Whether you're at work, with your daughter, or anywhere
// else, you'll know exactly how your Houston fund is growing.
//
// Key Features:
// ✅ Real-time trade notifications with P&L tracking
// ✅ Risk management alerts to protect your capital
// ✅ Houston fund progress tracking with visual progress bars
// ✅ Daily summaries to review your trading performance
// ✅ Milestone celebrations to mark your achievements
// ✅ System health monitoring for peace of mind
//
// Every notification brings you closer to your goal of reuniting
// with your daughter in Houston. This isn't just code - it's your
// connection to financial freedom! 🚀💕
//
// ===================================================================