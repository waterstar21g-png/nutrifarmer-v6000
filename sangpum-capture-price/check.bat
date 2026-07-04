@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === 설치 상태 확인 ===
echo.
echo [폴더] %CD%
echo.
where node >nul 2>&1 && (echo [OK] Node.js & node -v) || echo [X] Node.js 없음
where npm >nul 2>&1 && (echo [OK] npm & npm -v) || echo [X] npm 없음
if exist node_modules\ (echo [OK] node_modules) else echo [X] setup.bat 실행 필요
if exist .env.local (echo [OK] .env.local) else echo [X] .env.local 없음 - setup.bat 실행
findstr /C:"NAVER_CLIENT_ID=" .env.local 2>nul | findstr /V "=$" >nul && echo [OK] NAVER_CLIENT_ID 입력됨 || echo [!] NAVER_CLIENT_ID 미입력
findstr /C:"NAVER_CLIENT_SECRET=" .env.local 2>nul | findstr /V "=$" >nul && echo [OK] NAVER_CLIENT_SECRET 입력됨 || echo [!] NAVER_CLIENT_SECRET 미입력
echo.
pause
