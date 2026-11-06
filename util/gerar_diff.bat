@echo off
rem ==============================================================================
rem util/gerar_diff.bat — Atalho interativo para geração de diff unificado
rem Uso: gerar_diff.bat [arquivo1] [arquivo2]
rem ==============================================================================
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0gerar_diff.ps1" %*
echo.
pause


