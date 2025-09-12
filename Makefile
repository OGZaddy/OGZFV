# OGZ Prime Docker Management

.PHONY: help build up down restart logs clean setup

help:
	@echo "OGZ Prime Docker Commands:"
	@echo "  make setup    - Initial setup (pull images, create volumes)"
	@echo "  make build    - Build all Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make restart  - Restart all services"
	@echo "  make logs     - View logs (use SERVICE=name for specific service)"
	@echo "  make clean    - Remove containers, networks, and volumes"
	@echo "  make status   - Show running containers"
	@echo "  make shell    - Open shell in service (use SERVICE=name)"

setup:
	@echo "Setting up OGZ Prime Docker environment..."
	docker network create ogz-network 2>/dev/null || true
	docker volume create ollama-data
	docker volume create redis-data
	docker volume create postgres-data
	cp .env.docker .env 2>/dev/null || true
	@echo "Setup complete!"

build:
	@echo "Building all Docker images..."
	docker-compose build --parallel

up:
	@echo "Starting OGZ Prime services..."
	docker-compose up -d
	@echo "Services started! Check status with: make status"

down:
	@echo "Stopping OGZ Prime services..."
	docker-compose down

restart:
	@echo "Restarting OGZ Prime services..."
	docker-compose restart

logs:
ifdef SERVICE
	docker-compose logs -f $(SERVICE)
else
	docker-compose logs -f
endif

status:
	@echo "OGZ Prime Service Status:"
	@docker-compose ps

clean:
	@echo "WARNING: This will remove all containers, volumes, and data!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker-compose down -v
	docker network rm ogz-network 2>/dev/null || true
	@echo "Cleanup complete!"

shell:
ifdef SERVICE
	docker-compose exec $(SERVICE) /bin/sh
else
	@echo "Please specify SERVICE=name (e.g., make shell SERVICE=ssl-server)"
endif

# Development commands
dev-build:
	docker-compose build --no-cache ssl-server trai trading-bot dashboard

dev-logs:
	docker-compose logs -f ssl-server trai trading-bot

# Production commands
prod-up:
	docker-compose --env-file .env.docker up -d

prod-backup:
	@echo "Backing up volumes..."
	docker run --rm -v postgres-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/postgres-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	docker run --rm -v redis-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/redis-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "Backup complete!"

# Health checks
health:
	@echo "Checking service health..."
	@curl -s http://localhost:3010/health > /dev/null && echo "✅ SSL Server: Healthy" || echo "❌ SSL Server: Unhealthy"
	@curl -s http://localhost:3333/health > /dev/null && echo "✅ Dashboard: Healthy" || echo "❌ Dashboard: Unhealthy"
	@curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama: Healthy" || echo "❌ Ollama: Unhealthy"
	@docker-compose exec -T redis redis-cli ping > /dev/null && echo "✅ Redis: Healthy" || echo "❌ Redis: Unhealthy"
	@docker-compose exec -T postgres pg_isready > /dev/null && echo "✅ PostgreSQL: Healthy" || echo "❌ PostgreSQL: Unhealthy"