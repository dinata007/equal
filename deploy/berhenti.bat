@echo off
rem Hentikan ruangSenja (aplikasi + Caddy). Klik dua kali; izin Administrator diminta otomatis.
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" & exit /b)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pasang.ps1" -Berhenti
pause
