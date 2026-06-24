# CyberAI Docker Proxy - Production Setup

Professional container management system for CyberAI platform.

## Features

- **24/7 Operation** - Auto-restart, health checks, graceful shutdown
- **Resource Limits** - CPU, memory, and container count limits
- **TTL Management** - Automatic container cleanup after 4 hours
- **Cloudflare Tunnel** - Secure internet exposure
- **Monitoring** - Real-time stats and health checks
- **Production Ready** - Docker Compose, logging, security

## Quick Start

### 1. Production Setup

```bash
# Windows
setup-production.bat

# Linux/Mac
make prod
```

### 2. Development Setup

```bash
# Windows
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Linux/Mac
make dev
```

## Configuration

### Environment Variables

| Variable                  | Default                           | Description                   |
| ------------------------- | --------------------------------- | ----------------------------- |
| `DOCKER_API_KEY`          | -                                 | API authentication key        |
| `MAX_CONTAINERS`          | 10                                | Maximum concurrent containers |
| `CONTAINER_TTL_MS`        | 14400000                          | Container TTL (4 hours)       |
| `ALLOWED_ORIGINS`         | https://app.cyberaiuz.workers.dev | CORS origins                  |
| `CLOUDFLARE_TUNNEL_TOKEN` | -                                 | Cloudflare tunnel token       |

### Get Cloudflare Tunnel Token

1. Go to https://dash.cloudflare.com
2. Navigate to Zero Trust → Networks → Tunnels
3. Create a tunnel named `cyberai-docker-proxy`
4. Copy the token

## API Endpoints

### Containers

```bash
# Create container
curl -X POST http://127.0.0.1:2377/api/containers \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"template_id":"ubuntu-web","user_id":"sunnatilla"}'

# List containers
curl http://127.0.0.1:2377/api/containers \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get container details
curl http://127.0.0.1:2377/api/containers/CONTAINER_ID \
  -H "Authorization: Bearer YOUR_API_KEY"

# Delete container
curl -X DELETE http://127.0.0.1:2377/api/containers/CONTAINER_ID \
  -H "Authorization: Bearer YOUR_API_KEY"

# Restart container
curl -X POST http://127.0.0.1:2377/api/containers/CONTAINER_ID/restart \
  -H "Authorization: Bearer YOUR_API_KEY"

# Execute command
curl -X POST http://127.0.0.1:2377/api/containers/CONTAINER_ID/exec \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la"}'

# Get stats
curl http://127.0.0.1:2377/api/containers/CONTAINER_ID/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Templates

```bash
# List templates
curl http://127.0.0.1:2377/api/templates \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Health

```bash
# Health check
curl http://127.0.0.1:2377/api/health
```

## Templates

| ID               | Image                  | Ports          | Memory | CPU      |
| ---------------- | ---------------------- | -------------- | ------ | -------- |
| ubuntu-web       | ubuntu:22.04           | 80, 22, 3306   | 512MB  | 1 core   |
| centos-mail      | centos:stream9         | 25, 143, 22    | 512MB  | 1 core   |
| debian-db        | debian:12              | 5432, 6379, 22 | 512MB  | 1 core   |
| alpine-container | alpine:3.18            | 22             | 256MB  | 0.5 core |
| kali-pentest     | kalilinux/kali-rolling | 22             | 1GB    | 2 cores  |

## Management Commands

### Using Make

```bash
make help           # Show all commands
make up             # Start services
make down           # Stop services
make restart        # Restart services
make logs           # View logs
make status         # Show status
make health         # Check health
make templates      # List templates
make create TEMPLATE=ubuntu-web USER=sunnatilla
make list           # List containers
make stop ID=xxx    # Stop container
make cstats ID=xxx  # Container stats
make clean          # Remove all
make update         # Update and rebuild
```

### Using Docker Compose

```bash
docker compose ps                    # Status
docker compose logs -f               # Logs
docker compose restart               # Restart
docker compose down                  # Stop
docker compose up -d                 # Start
docker compose build --no-cache      # Rebuild
```

## Monitoring

### Real-time Monitor (Windows)

```bash
monitor.bat
```

### Docker Stats

```bash
docker stats --no-stream
```

### System Logs

```bash
docker events --filter "label=cyberai.managed=true"
```

## Security

- API key authentication required
- CORS restricted to allowed origins
- Rate limiting (200 requests/15 min)
- Container resource limits
- Network isolation
- Health checks
- Graceful shutdown

## Troubleshooting

### Server not responding

```bash
docker compose logs proxy
docker compose restart proxy
```

### Tunnel not working

```bash
docker compose logs tunnel
docker compose restart tunnel
```

### Out of memory

```bash
# Check memory usage
docker stats

# Increase limits in docker-compose.yml
# deploy.resources.limits.memory
```

### Container limit reached

```bash
# Check active containers
make list

# Wait for TTL expiration or manually remove
make stop ID=container_id
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CyberAI Platform                          │
│                  app.cyberaiuz.workers.dev                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Tunnel                           │
│              (cloudflare/cloudflared)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Docker Proxy Server                         │
│              (cyberai-proxy:2377)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Express.js + Dockerode                                  ││
│  │  - API Key Auth                                          ││
│  │  - Rate Limiting                                         ││
│  │  - Container Lifecycle                                   ││
│  │  - Health Checks                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Docker Engine                               │
│              (cyberai-targets network)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Ubuntu   │ │ CentOS   │ │ Debian   │ │ Kali     │       │
│  │ Web      │ │ Mail     │ │ DB       │ │ Pentest  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## License

CyberAI Platform - 2024
