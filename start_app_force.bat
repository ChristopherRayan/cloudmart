@echo off
set "TARGET_DIR=C:\CLOUDMART_RUN"

echo ===================================================
echo CLOUDMART FORCE START LAUNCHER
echo ===================================================
echo.
echo [1/5] KILLING old Docker processes...
docker-compose down --remove-orphans > nul 2>&1

echo [2/5] WIPING old run directory...
if exist "%TARGET_DIR%" rmdir /s /q "%TARGET_DIR%"

echo [3/5] CREATING fresh directory...
mkdir "%TARGET_DIR%"

echo [4/5] COPYING project files...
xcopy "%~dp0*" "%TARGET_DIR%\" /E /H /C /I /Y /Q > nul

echo [5/5] BUILDING and STARTING (No Cache)...
cd /d "%TARGET_DIR%"
echo ***************************************************
echo This will take 5-10 minutes.
echo Please WATCH this window.
echo Do NOT close it.
echo ***************************************************
docker-compose up -d --build --force-recreate

echo.
echo ===================================================
echo STATUS:
docker ps
echo.
echo Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost/api
echo.
echo If "cloudmart_run-app" is MISSING above, the build failed.
echo ===================================================
pause
