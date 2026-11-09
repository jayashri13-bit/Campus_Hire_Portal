@echo off
title Campus Hire Starter
echo ===================================================================
echo [Campus Hire] Launching Full-Stack Services (Backend + Frontend)
echo ===================================================================
start "Campus Hire Backend (FastAPI :8000)" cmd /k "cd /d %~dp0 && run_backend.bat"
start "Campus Hire Frontend (Vite :5173)" cmd /k "cd /d %~dp0Campus_Hire_Frontend && npm run dev"
echo Frontend and Backend launched successfully.
pause

