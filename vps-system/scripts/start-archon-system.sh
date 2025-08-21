#!/bin/bash

# ARCHON COMPLETE SYSTEM STARTUP
# This starts everything: Docker, Supabase, Trading Bots, Archon, Clone AI

echo "🚀 STARTING ARCHON INTEGRATED SYSTEM"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ $service is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $service not responding${NC}"
        return 1
    fi
}

# Step 1: Ensure Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo "Starting Docker..."
    sudo systemctl start docker
    sleep 5
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Step 2: Start main infrastructure (Supabase, Redis, etc.)
echo -e "${YELLOW}Starting infrastructure services...${NC}"
cd /root/OGZFV-valhalla
docker-compose up -d supabase-db redis grafana prometheus
sleep 15

# Step 3: Check database is ready
echo -e "${YELLOW}Waiting for database...${NC}"
until docker exec supabase-db pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✓ Database is ready${NC}"

# Step 4: Start Archon services
echo -e "${YELLOW}Starting Archon services...${NC}"
cd /root/OGZFV-valhalla/archon
docker-compose up -d --build
sleep 10

# Step 5: Start trading bots
echo -e "${YELLOW}Starting trading bots...${NC}"
cd /root/OGZFV-valhalla
docker-compose up -d quantum-bot elite-bot dashboard
sleep 5

# Step 6: Start Clone AI Bridge
echo -e "${YELLOW}Starting Clone AI Bridge...${NC}"
cd /root/OGZFV-valhalla/archon
npm install --prefix clone-ai-bridge
nohup node clone-ai-bridge/index.js > /var/log/clone-ai-bridge.log 2>&1 &
echo $! > /var/run/clone-ai-bridge.pid
sleep 3

# Step 7: Health checks
echo ""
echo -e "${YELLOW}Running health checks...${NC}"
echo "===================================="

check_service "Archon UI" "http://149.248.242.111:3737"
check_service "Archon API" "http://149.248.242.111:8181/health"
check_service "MCP Server" "http://149.248.242.111:8051"
check_service "Trading Dashboard" "http://149.248.242.111:8080"
check_service "Grafana" "http://149.248.242.111:3000"
check_service "Clone AI Bridge" "http://149.248.242.111:8054/health"

# Step 8: Show running containers
echo ""
echo -e "${YELLOW}Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Step 9: Display access URLs
echo ""
echo "===================================="
echo -e "${GREEN}🎉 SYSTEM READY!${NC}"
echo "===================================="
echo ""
echo "Access from your laptop/phone/anywhere:"
echo ""
echo "📊 Archon UI:         http://149.248.242.111:3737"
echo "🎯 Trading Dashboard: http://149.248.242.111:8080"
echo "📈 Grafana:          http://149.248.242.111:3000"
echo "🔌 MCP Server:       http://149.248.242.111:8051"
echo ""
echo "WebSocket Endpoints:"
echo "⚡ Quantum Bot:      ws://149.248.242.111:3010"
echo "⚡ Elite Bot:        ws://149.248.242.111:3011"
echo ""
echo -e "${YELLOW}Monitor logs:${NC}"
echo "  docker-compose logs -f archon-server"
echo "  docker-compose logs -f quantum-bot"
echo "  tail -f /var/log/clone-ai-bridge.log"
echo ""
echo -e "${GREEN}You can now access everything from your laptop at the store!${NC}"
echo "===================================="