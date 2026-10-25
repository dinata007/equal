@echo off
rem Update ruangSenja ke versi baru: hentikan -> ekstrak zip -> pasang ulang (pasang.ps1 -Update).
rem   - seret file senja-deploy-*.zip ke file ini, atau
rem   - klik dua kali: dipakai senja-deploy-*.zip terbaru di folder ini, folder di atasnya, Downloads, atau Desktop.
rem Izin Administrator diminta otomatis.
rem Semua perintah dibungkus ( ) agar cmd membacanya sekaligus: file ini ikut tertimpa saat zip diekstrak.
(
  net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0' -ArgumentList '\"%~1\"'" & exit /b)
  if "%~1"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pasang.ps1" -Update
  ) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pasang.ps1" -Update -Zip "%~1"
  )
  pause
  exit /b
)
