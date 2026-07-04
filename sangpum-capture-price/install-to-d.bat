@echo off
chcp 65001 >nul
title D:\함께온라인 - 상품캡처 및 가격조회 자동 설치

set "TARGET=D:\함께온라인\sangpum-capture-price"
set "REPO=https://github.com/waterstar21g-png/nutrifarmer-v6000.git"
set "BRANCH=cursor/sangpum-capture-price-b9de"

echo ================================================
echo   D:\함께온라인 자동 설치
echo   상품캡처 및 가격조회
echo ================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [1단계 실패] Node.js 미설치
  echo   https://nodejs.org LTS 설치 후 다시 실행하세요.
  pause
  exit /b 1
)
echo [1단계 OK] Node.js 설치됨
node -v
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [2단계 실패] Git 미설치
  echo   https://git-scm.com/download/win 설치 후 다시 실행하세요.
  pause
  exit /b 1
)
echo [2단계 OK] Git 설치됨
echo.

echo [3단계] 폴더 생성: %TARGET%
if not exist "D:\함께온라인" mkdir "D:\함께온라인"

set "TEMP=%TEMP%\sangpum-temp-repo"
if exist "%TEMP%" rmdir /s /q "%TEMP%"

echo [4단계] GitHub에서 프로젝트 다운로드...
git clone -b %BRANCH% %REPO% "%TEMP%"
if errorlevel 1 (
  echo 다운로드 실패. 인터넷 연결을 확인하세요.
  pause
  exit /b 1
)

echo [5단계] 파일 복사...
if exist "%TARGET%" rmdir /s /q "%TARGET%"
xcopy "%TEMP%\sangpum-capture-price" "%TARGET%\" /E /I /Y >nul
rmdir /s /q "%TEMP%"

cd /d "%TARGET%"
echo [6단계] npm install...
call npm install
if errorlevel 1 (
  echo npm install 실패
  pause
  exit /b 1
)

if not exist ".env.local" copy /Y ".env.example" ".env.local" >nul

echo.
echo ================================================
echo   설치 완료!
echo   위치: %TARGET%
echo ================================================
echo.
echo [7단계] .env.local 에 네이버 API 키 입력...
echo   NAVER_CLIENT_ID=
echo   NAVER_CLIENT_SECRET=
echo.
notepad ".env.local"
echo.
echo 메모장에서 저장 후 아무 키나 누르세요...
pause >nul

echo [8단계] 서버 시작...
start http://localhost:3000
call npm run dev
