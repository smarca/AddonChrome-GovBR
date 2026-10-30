@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0aplicar_patch.ps1" "%~1"
echo.
pause

