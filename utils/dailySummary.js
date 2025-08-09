function generateDailySummary(stats, balance) {
  const totalTrades = stats.trades;
  if (totalTrades === 0) return 'No trades today.';
  const winRate = ((stats.wins / totalTrades) * 100).toFixed(1);
  const avgHold = (stats.avgHoldTime / 60000).toFixed(1);
  const net = stats.totalPnL.toFixed(2);
  const pf = stats.largestLoss !== 0 ? (stats.largestWin / Math.abs(stats.largestLoss)).toFixed(2) : 'N/A';
  return `
📊 Daily Summary (${stats.date})
Trades: ${totalTrades} | Wins: ${stats.wins} | Losses: ${stats.losses} | BE: ${stats.breakeven}
Win Rate: ${winRate}% | Net PnL: $${net} | Avg Hold: ${avgHold}m
Profit Factor: ${pf} | Balance: $${balance.toFixed(2)}
`; }

module.exports = { generateDailySummary };
