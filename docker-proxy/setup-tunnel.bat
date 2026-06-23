@echo off
echo ========================================
echo   Cloudflare Tunnel Setup
echo ========================================
echo.

echo [1/4] Checking cloudflared...
cloudflared --version
if %errorlevel% neq 0 (
    echo Installing cloudflared...
    winget install cloudflare.cloudflared
)
echo ✓ cloudflared is installed

echo.
echo [2/4] Login to Cloudflare...
echo Please login in the browser window that opens...
cloudflared tunnel login
echo ✓ Logged in

echo.
echo [3/4] Creating tunnel...
echo Enter a name for your tunnel (e.g., cyberai-docker):
set /p TUNNEL_NAME=

cloudflared tunnel create %TUNNEL_NAME%
echo ✓ Tunnel created

echo.
echo [4/4] Configuring tunnel...
echo Creating config file...

(
echo tunnel: %TUNNEL_NAME%
echo credentials-file: C:\Users\sunna\.cloudflared\credentials.json
echo.
echo ingress:
echo   - hostname: docker.cyberaiuz.workers.dev
echo     service: https://127.0.0.1:2377
echo     originRequest:
echo       noTLSVerify: true
echo   - service: http_status:404
) > cloudflared-config.yml

echo ✓ Config created

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Add DNS record in Cloudflare dashboard:
echo    - Type: CNAME
echo    - Name: docker
echo    - Target: %TUNNEL_NAME%.cfargotunnel.com
echo    - Proxy status: Proxied
echo.
echo 2. Start the tunnel:
echo    cloudflared tunnel run %TUNNEL_NAME%
echo.
echo 3. Start the Docker proxy:
echo    start.bat
echo.
pause
