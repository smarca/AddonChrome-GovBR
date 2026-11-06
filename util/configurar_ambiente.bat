@echo off
rem ==============================================================================
rem util/configurar_ambiente.bat — Atalho interativo para setup de novo computador
rem Uso: executar uma vez em novo PC para restaurar settings e Git global
rem ==============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0configurar_ambiente.ps1"
pause


