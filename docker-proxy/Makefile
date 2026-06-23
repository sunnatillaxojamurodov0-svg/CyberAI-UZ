.PHONY: help build up down restart logs status clean shell

# ============================================
# CyberAI Docker Proxy - Makefile
# ============================================

COMPOSE := docker compose
SERVICE := proxy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all services
	$(COMPOSE) build --no-cache

up: ## Start all services
	$(COMPOSE) up -d --remove-orphans

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

logs: ## View logs (tail)
	$(COMPOSE) logs -f --tail=100

logs-proxy: ## View proxy logs
	$(COMPOSE) logs -f --tail=100 proxy

logs-tunnel: ## View tunnel logs
	$(COMPOSE) logs -f --tail=100 tunnel

status: ## Show service status
	$(COMPOSE) ps

health: ## Check health
	@curl -s http://127.0.0.1:2377/api/health | jq .

stats: ## Show container stats
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

clean: ## Remove all containers and volumes
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f

shell: ## Open shell in proxy container
	$(COMPOSE) exec $(SERVICE) sh

update: ## Update and rebuild
	$(COMPOSE) pull
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# Development
dev: ## Start in development mode
	$(COMPOSE) -f docker-compose.yml -f docker-compose.override.yml up -d

# Production
prod: ## Start in production mode
	$(COMPOSE) --env-file .env.production up -d --remove-orphans

# Templates
templates: ## List available templates
	@curl -s -H "Authorization: Bearer $$(grep DOCKER_API_KEY .env | cut -d= -f2)" http://127.0.0.1:2377/api/templates | jq .

# Create container
create: ## Create container (usage: make create TEMPLATE=ubuntu-web USER=sunnatilla)
	@curl -s -X POST http://127.0.0.1:2377/api/containers \
		-H "Authorization: Bearer $$(grep DOCKER_API_KEY .env | cut -d= -f2)" \
		-H "Content-Type: application/json" \
		-d '{"template_id":"$(TEMPLATE)","user_id":"$(USER)"}' | jq .

# List containers
list: ## List active containers
	@curl -s -H "Authorization: Bearer $$(grep DOCKER_API_KEY .env | cut -d= -f2)" http://127.0.0.1:2377/api/containers | jq .

# Stop container
stop: ## Stop container (usage: make stop ID=container_id)
	@curl -s -X DELETE -H "Authorization: Bearer $$(grep DOCKER_API_KEY .env | cut -d= -f2)" http://127.0.0.1:2377/api/containers/$(ID) | jq .

# Container stats
cstats: ## Get container stats (usage: make cstats ID=container_id)
	@curl -s -H "Authorization: Bearer $$(grep DOCKER_API_KEY .env | cut -d= -f2)" http://127.0.0.1:2377/api/containers/$(ID)/stats | jq .

# Network
network: ## Show network info
	@docker network inspect cyberai-internal | jq '.[0].IPAM.Config'

# Logs
system-logs: ## Show Docker system logs
	@docker events --filter "label=cyberai.managed=true" --format '{{.Time}} {{.Action}} {{.Actor.Attributes.name}}'
