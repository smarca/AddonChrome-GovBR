@echo off
rem ==============================================================================
rem util/fazer_backup.bat — Atalho interativo para backup com pausa no final
rem Uso: duplo clique no Explorer ou execução direta no terminal CMD
rem ==============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fazer_backup.ps1"
pause


