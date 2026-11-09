@echo off
title Campus Hire Python FastAPI Backend
cd /d "%~dp0backend"
echo ===================================================================
echo [Campus Hire] Starting Python FastAPI Backend on http://127.0.0.1:8000
echo ===================================================================
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000 --host 127.0.0.1
) else (
    python -m uvicorn main:app --reload --port 8000 --host 127.0.0.1
)
pause

