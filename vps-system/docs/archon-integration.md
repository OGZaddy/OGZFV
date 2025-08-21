# Archon Integration with CGP-ME/OGZFV

## Steps to Complete:

### 1. Run Archon Database Setup in Supabase
Go to your Supabase SQL Editor at:
https://supabase.com/dashboard/project/dbpuhvxbiedjqxeqdonw/sql

Copy and run the contents of: `/root/OGZFV-valhalla/archon-setup.sql`

### 2. Start Archon Services
```bash
cd /root/OGZFV-valhalla/archon-main
docker-compose up --build -d
```

### 3. Access Archon UI
Open: http://149.248.242.111:3737

### 4. Configure Settings in Archon UI
1. Go to Settings page
2. Add your API keys:
   - OpenAI API Key (for embeddings)
   - Or Gemini API Key: AIzaSyB-AroJUWBoWsHQYqUc4TL-z3PlCwj-x8U

### 5. Crawl Your GitHub Repository
In Archon UI → Knowledge Base → Crawl Website:
- Enter: https://github.com/CGP-ME/OGZFV
- Or crawl specific docs/wiki pages

### 6. Upload Trading Bot Documentation
Knowledge Base → Upload Documents:
- Upload any documentation files
- Trading strategies
- Bug reports
- Pattern analysis

### 7. Create Knowledge Entries for Known Issues
Add these critical lessons learned:

**Title:** WebSocket Message Loss - 257,000 Messages
**Problem:** Messages being silently eaten by AdvancedWebSocketBroadcaster
**Solution:** Remove all middleware, use direct broadcasting only
**Never Do Again:** ✓

**Title:** Bot Not Trading Despite Running
**Problem:** Bot appears active but not executing trades
**Solution:** Check PM2 logs first, verify data flow with wscat
**Always Do:** ✓

### 8. Integrate with Your Trading Bot
Add to your bot code to log to Archon:

```javascript
// In ExecutionLayer.js or main bot file
const archonClient = require('./lib/archon-client');

// Log trades
await archonClient.logTrade({
  botType: 'quantum',
  action: 'BUY',
  price: 42000,
  pattern: 'Neural Convergence',
  confidence: 85
});

// Log errors for learning
await archonClient.logError({
  category: 'websocket',
  error: 'Connection dropped',
  solution: 'Implemented reconnect logic'
});
```

### 9. Connect AI Coding Assistant
For Claude Code, Cursor, or Windsurf:

MCP Connection String:
```json
{
  "mcpServers": {
    "archon": {
      "command": "curl",
      "args": ["-N", "http://149.248.242.111:8051/sse"],
      "transport": "sse"
    }
  }
}
```

### 10. Set Up Automated Learning
Create webhook in your bot to auto-log to Archon:
- Trade executions → Archon patterns table
- Errors → Archon knowledge base
- Performance metrics → Archon analytics

## GitHub Integration Features

### Auto-Sync with Repository
```bash
# Set up GitHub webhook to trigger Archon crawl on push
curl -X POST http://149.248.242.111:8181/api/knowledge/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/CGP-ME/OGZFV",
    "auto_sync": true,
    "branch": "quantum"
  }'
```

### Link Issues to Knowledge Base
- GitHub Issues → Archon Problems
- Pull Requests → Archon Solutions
- Commits → Archon Changes Log

## Trading Bot Specific Setup

### 1. Create Project in Archon
```
Project: OGZ Prime Trading System
Features:
- Quantum Neural Trading
- Elite Pattern Recognition
- WebSocket Real-time Data
- Multi-broker Support
```

### 2. Import Existing Knowledge
Upload these files to Archon:
- `/root/OGZFV-valhalla/MODULES_TO_IMPLEMENT.md`
- `/root/OGZFV-valhalla/THRESHOLD_BACKUP.md`
- All files in `/logs/errors/`

### 3. Set Up Monitoring
Configure Archon to monitor:
- `/root/OGZFV-valhalla/logs/`
- PM2 logs
- Trading performance metrics

## Benefits of This Integration

1. **Never Lose Knowledge**: Every bug, fix, and pattern is stored
2. **AI-Powered Search**: "Show me all WebSocket errors and their fixes"
3. **Pattern Recognition**: "What patterns work best for BTC trading?"
4. **Automatic Documentation**: Code changes are tracked and searchable
5. **Team Collaboration**: Share knowledge across all developers
6. **Performance Tracking**: See what actually works in production

## Quick Test
Once set up, test with:
```bash
# Query your knowledge base
curl http://149.248.242.111:8181/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "websocket connection issues"}'
```

This integration turns your trading bot into a self-learning system that remembers every lesson!