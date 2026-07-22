@echo off
title EnergyGuard AI Launcher
echo ===================================================
echo   ENERGYGUARD AI - LAUNCHER
echo ===================================================
echo.
echo Starting FastAPI Python Backend (Port 8000)...
echo Startup seeder will automatically initialize energyguard.db...
start "EnergyGuard Backend" cmd /k "cd backend && python run.py"

echo.
echo Starting React Vite Frontend (Port 5173)...
start "EnergyGuard Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   SUCCESS: Launch instructions sent.
echo   - Backend API: http://localhost:8000/docs
echo   - Frontend UI: http://localhost:5173
echo ===================================================
echo.
pause
