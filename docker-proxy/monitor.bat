@echo off
echo ============================================
echo   CyberAI Docker Proxy - Monitor
echo ============================================
echo.

:loop
cls
echo [%time%] CyberAI Docker Proxy Status
echo ============================================
echo.

echo [Docker Containers]
docker ps --filter "label=cyberai.managed=true" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [Resource Usage]
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" cyberai-proxy cyberai-tunnel 2>nul
echo.

echo [Health Check]
curl -s http://127.0.0.1:2377/api/health 2>nul || echo Server not responding
echo.

echo [Network]
docker network inspect cyberai-internal --format "{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{end}}" 2>nul
echo.

echo Press Ctrl+C to exit. Refreshing in 5 seconds...
timeout /t 5 /nobreak > nul
goto loop
