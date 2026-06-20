@echo off
title CloudCLI

set "PROJECT_DIR=F:\工程\claudecodeui"
cd /d "%PROJECT_DIR%"

if not exist "%PROJECT_DIR%\node_modules\" (
    msg %username% "CloudCLI: node_modules not found!"
    exit /b 1
)

start "" http://localhost:5173
npm run dev
