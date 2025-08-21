#!/bin/bash

# Quick Start Script for OGZ Prime with Docker, Supabase, and Archon

echo "🚀 OGZ Prime Quick Start - Docker + Supabase + Archon"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Starting Docker..."
    sudo systemctl start docker
    sleep 5
fi

# Check if docker-compose exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found!"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️ .env file not found, using defaults"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Build custom images
echo "🔨 Building custom Docker images..."
docker-compose build --no-cache

# Start infrastructure services first
echo "🎯 Starting infrastructure services..."
docker-compose up -d supabase-db redis grafana prometheus

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
sleep 20

# Run database migrations
echo "📊 Running database migrations..."
docker exec -i supabase-db psql -U postgres < supabase/migrations/001_initial_schema.sql

# Start trading bots and services
echo "🤖 Starting trading bots..."
docker-compose up -d quantum-bot elite-bot

# Start dashboard
echo "📈 Starting dashboard..."
docker-compose up -d dashboard

# Start Archon if available
if docker pull archon/knowledge-manager:latest 2>/dev/null; then
    echo "🧠 Starting Archon Knowledge Manager..."
    docker-compose up -d archon
else
    echo "⚠️ Archon image not available, skipping..."
fi

# Show running containers
echo ""
echo "✅ All services started!"
echo "=================================================="
docker-compose ps

echo ""
echo "📊 Access Points:"
echo "  Dashboard: http://149.248.242.111:8080"
echo "  Grafana: http://149.248.242.111:3000 (admin / ${GRAFANA_PASSWORD})"
echo "  Quantum Bot WS: ws://149.248.242.111:3010"
echo "  Elite Bot WS: ws://149.248.242.111:3011"
echo ""
echo "📝 Useful Commands:"
echo "  View logs: docker-compose logs -f [service-name]"
echo "  Stop all: docker-compose down"
echo "  Restart service: docker-compose restart [service-name]"
echo "  Database console: docker exec -it supabase-db psql -U postgres"
echo ""
echo "🔥 Your trading empire is now running!"