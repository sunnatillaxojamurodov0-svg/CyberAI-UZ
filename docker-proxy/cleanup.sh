#!/bin/sh

# ============================================
# CyberAI Container Cleanup Script
# ============================================

set -e

PROXY_URL="${DOCKER_PROXY_URL:-http://proxy:2377}"
API_KEY="${DOCKER_API_KEY}"
INTERVAL="${CLEANUP_INTERVAL:-300}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cleanup_containers() {
  log "Starting cleanup..."
  
  # Get all cyberai containers
  CONTAINERS=$(docker ps -q --filter "label=cyberai.managed=true" 2>/dev/null || true)
  
  if [ -z "$CONTAINERS" ]; then
    log "No managed containers found"
    return
  fi
  
  COUNT=0
  for CONTAINER_ID in $CONTAINERS; do
    # Get container info
    CREATED=$(docker inspect --format '{{.Created}}' "$CONTAINER_ID" 2>/dev/null || true)
    NAME=$(docker inspect --format '{{.Name}}' "$CONTAINER_ID" 2>/dev/null || true)
    TEMPLATE=$(docker inspect --format '{{index .Config.Labels "cyberai.template"}}' "$CONTAINER_ID" 2>/dev/null || true)
    
    if [ -z "$CREATED" ]; then
      continue
    fi
    
    # Calculate age in seconds
    CREATED_TS=$(date -d "$CREATED" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$CREATED" +%s 2>/dev/null || echo "0")
    NOW_TS=$(date +%s)
    AGE=$((NOW_TS - CREATED_TS))
    
    # TTL: 4 hours (14400 seconds)
    TTL=14400
    
    if [ "$AGE" -gt "$TTL" ]; then
      log "Removing expired: $NAME (age: ${AGE}s)"
      docker stop -t 10 "$CONTAINER_ID" 2>/dev/null || true
      docker rm -f "$CONTAINER_ID" 2>/dev/null || true
      COUNT=$((COUNT + 1))
    fi
  done
  
  # Check container count limit
  RUNNING=$(docker ps -q --filter "label=cyberai.managed=true" 2>/dev/null | wc -l)
  MAX=10
  
  if [ "$RUNNING" -gt "$MAX" ]; then
    EXCESS=$((RUNNING - MAX))
    log "Over limit ($RUNNING > $MAX), removing $EXCESS containers"
    
    # Remove oldest containers
    docker ps --filter "label=cyberai.managed=true" --format "{{.ID}} {{.CreatedAt}}" | \
      sort -k2 | \
      head -n "$EXCESS" | \
      awk '{print $1}' | \
      while read -r CID; do
        docker stop -t 10 "$CID" 2>/dev/null || true
        docker rm -f "$CID" 2>/dev/null || true
        COUNT=$((COUNT + 1))
      done
  fi
  
  # Clean up dangling images
  docker image prune -f --filter "label!=cyberai.managed=true" 2>/dev/null || true
  
  log "Cleanup complete. Removed $COUNT containers"
}

# Run cleanup on start
cleanup_containers

# Run cleanup periodically
while true; do
  sleep "$INTERVAL"
  cleanup_containers
done
