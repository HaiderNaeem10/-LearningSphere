@echo off
title LearnSphere LMS Launcher
cd /d "%~dp0"

echo ===================================================
echo     Starting LearnSphere LMS (Desktop Application)
echo ===================================================
echo.

:: 1. Check if PHP API backend is already active on port 8000
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [1/2] Starting PHP backend on http://localhost:8000 ...
    if exist "C:\xampp\php\php.exe" (
        start /b "" "C:\xampp\php\php.exe" -S localhost:8000 -t backend >nul 2>&1
    ) else (
        start /b "" php -S localhost:8000 -t backend >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo [1/2] PHP backend is already running on http://localhost:8000
)

:: 2. Launch the Windows Desktop application
echo [2/2] Launching LearnSphere LMS Desktop App ...
if exist "frontend\release\win-unpacked\LearnSphere LMS.exe" (
    start "" "frontend\release\win-unpacked\LearnSphere LMS.exe"
) else if exist "frontend\release\LearnSphere-LMS-Windows-x64\LearnSphere LMS.exe" (
    start "" "frontend\release\LearnSphere-LMS-Windows-x64\LearnSphere LMS.exe"
) else (
    echo Error: Could not locate LearnSphere LMS.exe
    pause
    exit /b 1
)

echo.
echo LearnSphere LMS launched successfully!
echo You can keep this window or close it.
timeout /t 3 >nul
exit
