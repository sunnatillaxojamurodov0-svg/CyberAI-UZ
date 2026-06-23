@echo off
echo ========================================
echo   CyberAI Docker Proxy - Setup Script
echo ========================================
echo.

echo [1/5] Checking Docker...
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed!
    echo Please install Docker Desktop from https://docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✓ Docker is installed

echo.
echo [2/5] Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker daemon is not running!
    echo Please start Docker Desktop
    pause
    exit /b 1
)
echo ✓ Docker daemon is running

echo.
echo [3/5] Installing dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [4/5] Generating API key...
for /f "tokens=*" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set API_KEY=%%i
echo API_KEY=%API_KEY% > .env
echo ✓ API key generated and saved to .env

echo.
echo [5/5] Creating startup script...
(
echo @echo off
echo echo Starting CyberAI Docker Proxy...
echo cd /d "%%~dp0"
echo node server.js
echo pause
) > start.bat
echo ✓ Startup script created

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start Docker Desktop (if not running)
echo 2. Run: start.bat
echo 3. Setup Cloudflare Tunnel (see README.md)
echo.
echo Your API Key: %API_KEY%
echo.
pause
