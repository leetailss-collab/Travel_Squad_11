@echo off
title Travel Squad Local Launcher
echo ===================================================
echo   Starting Travel Squad Local Servers in Background...
echo ===================================================

:: Define local Node.js path
set LOCAL_NODE_PATH=%~dp0.node\node-v20.20.2-win-x64
set PATH=%LOCAL_NODE_PATH%;%PATH%

:: 1. Start Backend Server (Background)
echo [1/2] Starting Express Backend (Port 5000)...
start /b cmd /c "cd backend && npm run dev"

:: 2. Start Frontend Server (Background)
echo [2/2] Starting Vite Frontend...
start /b cmd /c "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Both servers are running in this SINGLE window!
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:3000
echo   (To close both servers, just close this window)
echo ===================================================
echo.
pause



