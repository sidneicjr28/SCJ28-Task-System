@echo off
setlocal enabledelayedexpansion

:: Navigate to script directory
cd /d "%~dp0"

echo ==================================================
echo  Starting SCJ28 Academic ^& Startup Task Manager...
echo ==================================================

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js (v18+) to run SCJ28.
    pause
    exit /b 1
)

:: Install dependencies if node_modules directory is missing
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
)

set PORT=2800
set URL=http://localhost:%PORT%

echo [INFO] Server starting at %URL%

:: Open default web browser after short pause
start "" "%URL%"

:: Start Node Express Server
node server.js
