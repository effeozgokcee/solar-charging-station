@echo off
title Solar Charging Station
color 0A

echo ========================================
echo   Solar Charging Station Starter
echo ========================================
echo.

REM Backend'i arka planda baslat
echo [1/2] Backend baslatiliyor...
cd /d "C:\Users\ÖZGÖKÇE\Desktop\solar-charging-station\backend"
start /min cmd /c "title Backend Server && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo       Backend: http://192.168.1.104:8000  [OK]
echo.

REM Expo'yu baslat
echo [2/2] Expo baslatiliyor...
echo       Telefonu ayni WiFi'ye bagla
echo       QR kod asagida cikacak...
echo ========================================
echo.
cd /d "C:\Users\ÖZGÖKÇE\Desktop\solar-charging-station\mobile"
npx expo start

pause
