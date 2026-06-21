@echo off
title CloudCLI
cd /d "%~dp0"

if not exist "%~dp0node_modules\" (
    echo [ERROR] node_modules not found, run npm install first
    pause
    exit /b 1
)

chcp 65001 >nul
powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start.ps1"
