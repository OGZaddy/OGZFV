# 🚀 TOOLS TO HELP CLAUDE HELP YOU BETTER

## 1. **UPLOAD YOUR KNOWLEDGE TO ARCHON**

### Upload all your MD files and code:
```bash
chmod +x /root/OGZFV-valhalla/tools/upload-to-archon.sh
./tools/upload-to-archon.sh
```

### Upload specific GitHub branches:
```bash
# Clone your repo branches
git clone -b main https://github.com/CGP-ME/OGZFV.git /tmp/ogzfv-main
git clone -b quantum https://github.com/CGP-ME/OGZFV.git /tmp/ogzfv-quantum

# Upload to Archon
curl -X POST http://149.28.242.111:8181/api/knowledge/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/CGP-ME/OGZFV/tree/main"}'
```

## 2. **CONNECT CLAUDE CODE TO YOUR ARCHON**

Add this to your Claude Code settings.json:
```json
{
  "mcpServers": {
    "archon-knowledge": {
      "command": "curl",
      "args": ["-N", "http://149.28.242.111:8051/sse"],
      "transport": "sse"
    }
  }
}
```

Now Claude will have access to:
- All your trading patterns
- Every fix you've made
- All error solutions
- Your entire codebase knowledge

## 3. **QUERY YOUR KNOWLEDGE BASE FROM ANYWHERE**

### Search for solutions:
```bash
curl -X POST http://149.28.242.111:8181/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "websocket connection issues"}'
```

### Add new knowledge:
```bash
curl -X POST http://149.28.242.111:8181/api/knowledge/add \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix for bot not trading",
    "content": "Solution: Check IPv4 vs IPv6 in WebSocket server",
    "category": "fixes",
    "tags": ["websocket", "trading", "connection"]
  }'
```

## 4. **TOOLS THAT HELP CLAUDE UNDERSTAND YOUR SYSTEM**

### A. System Status Dashboard
```bash
# Create a status checker
cat > /root/OGZFV-valhalla/tools/system-status.sh << 'EOF'
#!/bin/bash
echo "=== TRADING SYSTEM STATUS ==="
echo "📊 PM2 Processes:"
pm2 list
echo -e "\n🐳 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo -e "\n🔌 Port Status:"
netstat -tlnp | grep -E "3010|3737|8181|8051"
echo -e "\n💾 Archon Knowledge Stats:"
curl -s http://149.28.242.111:8181/api/knowledge/stats
EOF
chmod +x /root/OGZFV-valhalla/tools/system-status.sh
```

### B. Error Pattern Analyzer
```bash
# Analyzes logs for patterns
cat > /root/OGZFV-valhalla/tools/analyze-errors.sh << 'EOF'
#!/bin/bash
echo "=== ANALYZING ERROR PATTERNS ==="
echo "🔍 Recent Errors:"
pm2 logs --nostream --lines 100 | grep -i error | tail -20
echo -e "\n📊 Error Frequency:"
pm2 logs --nostream --lines 1000 | grep -i error | cut -d' ' -f1-3 | sort | uniq -c | sort -rn | head -10
EOF
chmod +x /root/OGZFV-valhalla/tools/analyze-errors.sh
```

## 5. **WHAT HELPS CLAUDE GIVE YOU THE BEST ASSISTANCE**

### ✅ **DO THIS:**
1. **Upload your knowledge first** - Run the upload script so Claude knows your history
2. **Connect MCP** - So Claude can query your knowledge base in real-time
3. **Be specific** - "Bot not trading" → "Quantum bot connected but no trades executing"
4. **Share context** - Include PM2 logs, error messages, what you tried

### ✅ **CLAUDE WORKS BEST WHEN:**
- Your Archon has all your documentation
- You share specific error messages
- You mention what was working before
- You provide file paths and line numbers

### ✅ **INSTANT HELPERS:**
```bash
# Quick diagnostics
alias check-bots='pm2 list'
alias check-archon='docker ps | grep Archon'
alias bot-logs='pm2 logs --lines 50'
alias archon-ui='echo "Open: http://149.28.242.111:3737"'

# Add to your .bashrc
echo "alias check-bots='pm2 list'" >> ~/.bashrc
echo "alias check-archon='docker ps | grep Archon'" >> ~/.bashrc
echo "alias bot-logs='pm2 logs --lines 50'" >> ~/.bashrc
echo "alias archon-ui='echo \"Open: http://149.28.242.111:3737\"'" >> ~/.bashrc
source ~/.bashrc
```

## 6. **UPLOAD YOUR MOVER TRAINING DATA**

If you have files you trained Mover on:
```bash
# Create upload script for Mover data
for file in /path/to/mover/training/*.md; do
  curl -X POST http://149.28.242.111:8181/api/knowledge/upload \
    -F "file=@$file" \
    -F "category=mover-training"
done
```

## 7. **ACCESS YOUR DASHBOARDS**

- **Archon UI**: http://149.28.242.111:3737
- **Trading Dashboard**: http://149.28.242.111:8080
- **API Docs**: http://149.28.242.111:8181/docs

## 🎯 **THE POWER OF THIS SETUP:**

With Archon connected:
1. Claude remembers EVERYTHING about your project
2. No more repeating context
3. Solutions from past issues instantly available
4. Your knowledge compounds over time
5. Multiple AIs can share the same brain

Your Archon is your permanent memory that never forgets!