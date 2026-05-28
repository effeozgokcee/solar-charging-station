@echo off
setlocal EnableDelayedExpansion
title Solar Charging Station - Auto Setup
color 0A
chcp 65001 >nul

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "MOBILE=%ROOT%mobile"
set "WAIT=%SystemRoot%\System32\timeout.exe"
set "CURL=%SystemRoot%\System32\curl.exe"

echo ========================================
echo   Solar Charging Station - Auto Setup
echo ========================================
echo.

REM ---- 1) Local IP tespit et ----
echo [1/7] Yerel IP tespit ediliyor...
set "LOCAL_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    if not defined LOCAL_IP (
        set "_ip=%%a"
        set "_ip=!_ip: =!"
        if not "!_ip!"=="127.0.0.1" set "LOCAL_IP=!_ip!"
    )
)
if not defined LOCAL_IP set "LOCAL_IP=127.0.0.1"
echo       IP: !LOCAL_IP!
echo.

REM ---- 2) Eski portlari temizle ----
echo [2/7] Eski portlar (8000, 8081) temizleniyor...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
echo       OK
echo.

REM ---- 3) Firewall kurali (sadece eksikse) ----
echo [3/7] Firewall portlari aciliyor (yetki gerekirse atlanir)...
netsh advfirewall firewall show rule name="Solar Expo 8081" >nul 2>&1
if errorlevel 1 (
    netsh advfirewall firewall add rule name="Solar Expo 8081" dir=in action=allow protocol=TCP localport=8081 >nul 2>&1
)
netsh advfirewall firewall show rule name="Solar Backend 8000" >nul 2>&1
if errorlevel 1 (
    netsh advfirewall firewall add rule name="Solar Backend 8000" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
)
echo       OK
echo.

REM ---- 4) Backend bagimliklari ----
echo [4/7] Python bagimliklari kontrol ediliyor...
python -c "import fastapi, uvicorn, pydantic" >nul 2>&1
if errorlevel 1 (
    echo       Eksik paketler kuruluyor...
    python -m pip install -q -r "%BACKEND%\requirements.txt"
)
echo       OK
echo.

REM ---- 5) Mobil bagimliklari ----
echo [5/7] node_modules kontrol ediliyor...
if not exist "%MOBILE%\node_modules" (
    echo       npm install calisiyor, ilk seferde 1-2 dk surer...
    pushd "%MOBILE%"
    call npm install --silent
    popd
)
echo       OK
echo.

REM ---- 6) .env guncelle ----
echo [6/7] .env yaziliyor...
> "%MOBILE%\.env" echo EXPO_PUBLIC_API_URL=http://!LOCAL_IP!:8000
echo       EXPO_PUBLIC_API_URL=http://!LOCAL_IP!:8000
echo.

REM ---- 7) Backend baslat ----
echo [7/7] Backend baslatiliyor (gizli pencerede)...
start "Backend Server" /min cmd /c "cd /d ""%BACKEND%"" && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
echo       http://!LOCAL_IP!:8000
echo.

REM Backend hazir mi bekle (ping ile 1sn beklemek, stdin sorunundan kacin)
echo Backend hazirlaniyor...
set /a tries=0
:waitbackend
set /a tries+=1
ping -n 2 127.0.0.1 >nul
"%CURL%" -s -m 2 http://127.0.0.1:8000/health >nul 2>&1
if errorlevel 1 (
    if !tries! lss 20 goto waitbackend
)
echo       Backend OK
echo.

echo ========================================
echo  Expo Go (LAN) baslatiliyor...
echo  Telefonun ayni WiFi'de oldugundan emin olun.
echo  QR kod asagida cikacak.
echo ========================================
echo.

cd /d "%MOBILE%"
call npx expo start --go --lan

pause
