@echo off
rem ==============================================================================
rem util/backup.bat — Atalho CLI rápido para invocação do backup com rotação GFS
rem Uso: backup.bat [comentario] [/Fix] [/Patch] [/Ver] [/Feature]
rem ==============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fazer_backup.ps1" %*



