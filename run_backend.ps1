Set-Location -Path "$PSScriptRoot\backend"
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "[Campus Hire] Starting Python FastAPI Backend on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Cyan
if (Test-Path "venv\Scripts\python.exe") {
    & "venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000 --host 127.0.0.1
} else {
    python -m uvicorn main:app --reload --port 8000 --host 127.0.0.1
}

