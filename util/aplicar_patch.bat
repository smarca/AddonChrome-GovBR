@echo off
rem ==============================================================================
rem util/aplicar_patch.bat — Atalho interativo para aplicação de patches
rem Uso: aplicar_patch.bat arquivo.patch
rem ==============================================================================
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0aplicar_patch.ps1" "%~1"
echo.
pause


