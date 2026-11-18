@echo off
chcp 65001 >nul
cd /d "%~dp0"
py -3.12 scripts/configure.py
if errorlevel 1 goto error
docker compose up --build -d
if errorlevel 1 goto error
echo Mo http://localhost:8080 va Swagger http://localhost:8080/api/docs
echo Mat khau demo la DEMO_PASSWORD trong .env
pause
goto :eof
:error
echo Kiem tra Python 3.12 va Docker Desktop da chay.
pause
