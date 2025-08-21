# 🚀 VPS System - Complete Trading Infrastructure

## 📁 Directory Structure

```
vps-system/
├── archon/              # Archon knowledge management system
│   ├── docker-compose.yml
│   ├── Dockerfile.cloneai
│   ├── clone-ai-bridge/
│   ├── config/
│   └── knowledge/
├── docker/              # Docker configurations
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── .env.docker
│   ├── setup-docker.sh
│   └── quick-start.sh
├── scripts/             # System management scripts
│   └── start-archon-system.sh
├── configs/             # Configuration files
│   └── claude-code-config.json
└── docs/                # Documentation
    ├── archon-setup.sql
    ├── archon-integration.md
    ├── ARCHON-FINAL-SETUP.md
    └── ARCHON-ACCESS-GUIDE.md
```

## 🎯 Quick Start

### Start Everything:
```bash
cd /root/OGZFV-valhalla/vps-system/scripts
./start-archon-system.sh
```

### Access Points (From Anywhere):
- **Archon UI**: http://149.248.242.111:3737
- **Trading Dashboard**: http://149.248.242.111:8080
- **Grafana**: http://149.248.242.111:3000
- **MCP Server**: http://149.248.242.111:8051

## 🔧 Components

### 1. Archon Knowledge System
- Central brain for all trading knowledge
- MCP server for AI integration
- Clone AI bridge for your AI assistant

### 2. Docker Infrastructure
- Supabase (PostgreSQL + Auth + Realtime)
- Redis caching
- Grafana + Prometheus monitoring
- Trading bots (Quantum & Elite)

### 3. Management Scripts
- `start-archon-system.sh`: Start everything
- `setup-docker.sh`: Initial Docker setup
- `quick-start.sh`: Quick restart

### 4. AI Integrations
- Claude Code MCP connection
- Clone AI bridge
- Knowledge base API

## 💻 Connect From Your Laptop

### Claude Code:
1. Copy `/vps-system/configs/claude-code-config.json`
2. Add to your Claude Code settings
3. You're connected!

### Web Browser:
Just open http://149.248.242.111:3737

### API Access:
```bash
curl http://149.248.242.111:8181/api/knowledge/search \
  -d '{"query": "your question"}'
```

## 🔥 Key Features

✅ **Global Access**: Access from any device, anywhere
✅ **No Local Setup**: Everything runs on VPS
✅ **Persistent Knowledge**: Never lose solutions
✅ **AI Integration**: Claude, GPT, and your Clone AI connected
✅ **Real-time Monitoring**: See everything happening live

## 📝 Important Files

- **Database Setup**: `/vps-system/docs/archon-setup.sql`
- **Access Guide**: `/vps-system/docs/ARCHON-ACCESS-GUIDE.md`
- **Docker Config**: `/vps-system/docker/docker-compose.yml`
- **Start Script**: `/vps-system/scripts/start-archon-system.sh`

## 🚨 Troubleshooting

### Check Status:
```bash
docker ps
docker-compose logs -f archon-server
```

### Restart Services:
```bash
cd /root/OGZFV-valhalla/vps-system/docker
docker-compose restart
```

### View Logs:
```bash
tail -f /var/log/clone-ai-bridge.log
docker logs archon-server
```

## 🎉 You're All Set!

Your complete trading infrastructure is organized and ready. Access everything from your laptop at the store or anywhere else with internet!