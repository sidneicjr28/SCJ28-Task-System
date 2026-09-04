@echo off
setlocal enabledelayedexpansion

:: Navigate to script directory
cd /d "%~dp0"

echo ==================================================
echo  Starting SCJ28 Academic ^& Startup Task Manager...
echo ==================================================

:: Ensure tasks.db file exists (prevents Docker from creating a directory)
if not exist "tasks.db" (
    type nul > "tasks.db"
)

:: Check if Docker is installed and daemon is running
set USE_DOCKER=0
docker info >nul 2>nul
if %errorlevel% equ 0 (
    set USE_DOCKER=1
)

:: Find first available port starting from 2800
set PORT=2800

:find_port
netstat -ano | findstr LISTENING | findstr /C:":%PORT% " >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Port %PORT% is in use. Checking next port...
    set /a PORT+=1
    goto find_port
)

set URL=http://localhost:%PORT%

if %USE_DOCKER% equ 1 (
    echo [INFO] Docker detected! Running via Docker container...
    
    :: Check if Docker image exists
    docker image inspect scj28-task-manager:latest >nul 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] Building Docker image 'scj28-task-manager:latest'...
        docker build -t scj28-task-manager:latest .
    )
    
    set CONTAINER_NAME=scj28-app-%PORT%
    
    :: Check if container already exists
    docker container inspect !CONTAINER_NAME! >nul 2>nul
    if %errorlevel% equ 0 (
        docker ps --format "{{.Names}}" | findstr /C:"!CONTAINER_NAME!" >nul 2>nul
        if %errorlevel% equ 0 (
            echo [INFO] Container !CONTAINER_NAME! is already running on %URL%
        ) else (
            echo [INFO] Starting existing container !CONTAINER_NAME!...
            docker start !CONTAINER_NAME! >nul
        )
    ) else (
        echo [INFO] Creating and launching container !CONTAINER_NAME! on port %PORT%...
        docker run -d --name !CONTAINER_NAME! -p %PORT%:2800 -v "%CD%/tasks.db:/app/tasks.db" scj28-task-manager:latest >nul
    )
    
    echo [INFO] Container active! Opening %URL% in browser...
    start "" "%URL%"
    exit /b 0
)

:: Fallback to Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Neither Docker nor Node.js was found on your system.
    echo Please install Docker (https://www.docker.com/) or Node.js (https://nodejs.org/) to run SCJ28.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [INFO] Express Server starting on %URL%
start "" "%URL%"
set PORT=%PORT%
node server.js
