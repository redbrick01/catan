@echo off
cd /d "%~dp0"
node stop-catan.js >nul 2>nul
node start-catan.js --foreground
