@echo off
title Travel Squad Local Launcher
echo ===================================================
echo   Starting Travel Squad Local Servers...
echo ===================================================

:: 1. Start Backend Server
echo [1/2] Starting Express Backend (Port 5000)...
start "Travel Squad Backend" cmd /k "cd backend && npm run dev"

:: 2. Start Frontend Server
echo [2/2] Starting Vite Frontend...
start "Travel Squad Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Both servers have been launched in separate windows!
echo   - Backend: http://localhost:5000
echo   - Frontend: Check the Vite terminal (usually http://localhost:5173)
echo ===================================================
echo.
pause
