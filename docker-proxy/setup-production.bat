@echo off
echo ============================================
echo   CyberAI Docker Proxy - Production Setup
echo ============================================
echo.

echo [1/5] Checking Docker...
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    pause
    exit /b 1
)
echo.

echo [2/5] Checking Docker Compose...
docker compose version
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not installed
    pause
    exit /b 1
)
echo.

echo [3/5] Creating .env from template...
if not exist .env (
    copy .env.production .env
    echo Created .env from .env.production
    echo IMPORTANT: Edit .env and set CLOUDFLARE_TUNNEL_TOKEN
) else (
    echo .env already exists
)
echo.

echo [4/5] Building images...
docker compose build --no-cache
echo.

echo [5/5] Starting services...
docker compose up -d
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Services:
echo   - Proxy:    http://127.0.0.1:2377
echo   - Tunnel:   Check Cloudflare dashboard
echo.
echo Commands:
echo   make status    - Show service status
echo   make logs      - View logs
echo   make health    - Check health
echo   make templates - List templates
echo   make create    - Create container
echo.
echo Press any key to continue...
pause > nul
