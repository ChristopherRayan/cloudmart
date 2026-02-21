@echo off
echo ===================================================
echo CLOUDMART LAUNCHER V2
echo ===================================================

:: 1. Define Source and Target
set "SOURCE_DIR=%~dp0"
set "TARGET_DIR=C:\CLOUDMART_RUN"

echo [1/4] Creating safe directory: %TARGET_DIR%
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: 2. Copy Files
echo [2/4] Copying files...
xcopy "%SOURCE_DIR%*" "%TARGET_DIR%\" /E /H /C /I /Y /Q > nul

:: 3. Switch and Cleanup
echo [3/4] Cleaning old containers...
cd /d "%TARGET_DIR%"
docker-compose down --remove-orphans

:: 4. Launch (Interactive)
echo [4/4] Building and Starting...
echo ***************************************************
echo PLEASE WAIT. This step involves downloading and
echo compiling software. It can take 10+ MINUTES.
echo DO NOT CLOSE THIS WINDOW until you see "DONE".
echo ***************************************************
docker-compose up -d --build

echo.
echo ===================================================
echo DONE! Status Report:
docker ps
echo.
echo IF you see "cloudmart_run-app" and "cloudmart_run-frontend":
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost/api
echo.
echo IF NOT, please tell me what error you saw above.
echo ===================================================
pause
