# OGZ Prime Docker Deployment

## Quick Start

```bash
# 1. Initial setup
make setup

# 2. Build all containers
make build

# 3. Start everything
make up

# 4. Check status
make status
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     NGINX (80/443)                       │
│                   SSL Termination & Proxy                │
└─────────┬───────────────────────┬─────────────┬─────────┘
          │                       │             │
          ▼                       ▼             ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   SSL Server     │   │    Dashboard     │   │     Ollama       │
│   Port: 3010     │   │   Port: 3333     │   │   Port: 11434    │
│   WebSocket Hub  │   │   Web Interface  │   │   AI Models      │
└────────┬─────────┘   └──────────────────┘   └────────▲─────────┘
         │                                              │
         ▼                                              │
┌──────────────────┐                          ┌──────────────────┐
│  Trading Bot     │                          │      TRAI        │
│  Multi-tenant    │                          │  AI Assistant    │
└──────────────────┘                          └──────────────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────┐                          ┌──────────────────┐
│     Redis        │                          │   PostgreSQL     │
│  Cache/Sessions  │                          │   Persistent DB  │
└──────────────────┘                          └──────────────────┘
```

## Services

### Core Services
- **ssl-server**: Main WebSocket hub (port 3010)
- **trading-bot**: Multi-tenant trading engine
- **trai**: AI assistant with Qwen model
- **dashboard**: Web interface (port 3333)

### Infrastructure
- **nginx**: Reverse proxy & SSL termination
- **ollama**: Local LLM inference
- **redis**: Cache and session storage
- **postgres**: Persistent database

## Commands

### Basic Operations
```bash
make up         # Start all services
make down       # Stop all services
make restart    # Restart all services
make status     # Show container status
make logs       # View all logs
```

### Development
```bash
make dev-build  # Rebuild core services
make dev-logs   # Watch core service logs
make shell SERVICE=ssl-server  # Open shell in container
```

### Production
```bash
make prod-up    # Start with production config
make prod-backup # Backup volumes
make health     # Check service health
```

## Environment Variables

Edit `.env.docker`:
```env
DB_PASSWORD=YourSecurePassword
POLYGON_API_KEY=YourPolygonKey
OLLAMA_URL=http://ollama:11434
NODE_ENV=production
```

## Networking

All services communicate on internal `ogz-network`:
- Services use container names as hostnames
- External access only through NGINX
- WebSocket connections proxied through `/ws`

## Volumes

Persistent data stored in Docker volumes:
- `ollama-data`: AI models
- `redis-data`: Cache data
- `postgres-data`: Database

## SSL/TLS

Certificates mounted from host:
```
/etc/letsencrypt:/etc/letsencrypt:ro
```

## Monitoring

### Health Checks
```bash
make health  # Check all services
```

### Logs
```bash
make logs SERVICE=ssl-server  # Specific service
make logs  # All services
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs <service-name>
```

### Reset everything
```bash
make clean  # WARNING: Deletes all data
make setup
make build
make up
```

### Access shell
```bash
make shell SERVICE=ssl-server
```

## Scaling

To scale trading bots:
```bash
docker-compose up -d --scale trading-bot=3
```

## Backup & Restore

### Backup
```bash
make prod-backup
```

### Restore
```bash
docker run --rm -v postgres-data:/data -v ./backups:/backup alpine \
  tar xzf /backup/postgres-YYYYMMDD-HHMMSS.tar.gz -C /data
```

## Security Notes

1. Change default passwords in `.env.docker`
2. Use secrets management in production
3. Enable firewall rules for exposed ports
4. Regular security updates: `docker-compose pull`

## Migration from PM2

1. Stop PM2 services:
```bash
pm2 stop all
pm2 save
```

2. Start Docker services:
```bash
make up
```

3. Verify migration:
```bash
make health
make logs
```