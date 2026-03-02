@echo off
title ALM OPS - Jira-ALM Sync Backend
color 0C

echo.
echo  =====================================================
echo    ALM OPS -- Jira-ALM Sync Backend
echo  =====================================================
echo.

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Please install Python 3.8+
    echo  Download from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Go to backend folder
cd /d "%~dp0backend"

:: Install dependencies if needed
echo  [INFO] Checking dependencies...
pip install -r requirements.txt --quiet

echo.
echo  [INFO] Starting backend server on http://localhost:5000
echo  [INFO] Keep this window open while using the app.
echo  [INFO] Press Ctrl+C to stop.
echo.

:: Start Flask
python app.py

pause
