@echo off
echo ===================================================
echo CLOUDMART LAUNCHER
echo Resolving OneDrive compatibility issues...
echo ===================================================

:: 1. Define Source and Target
set "SOURCE_DIR=%~dp0"
set "TARGET_DIR=C:\CLOUDMART_RUN"

echo [1/4] creating target directory: %TARGET_DIR%
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: 2. Copy Files (Robust Copy)
echo [2/4] Copying project files to safe location...
echo Please wait, this may take a moment...
xcopy "%SOURCE_DIR%*" "%TARGET_DIR%\" /E /H /C /I /Y /Q > nul

:: 3. Switch to Target and Cleanup
echo [3/4] Cleaning up previous Docker containers...
cd /d "%TARGET_DIR%"
docker-compose down

:: 4. Launch
echo [4/4] Building and Starting Cloudimart...
echo This will setup the Database, Backend and Frontend.
docker-compose up -d --build

echo.
echo ===================================================
echo DONE! Checking status...
docker ps
echo.
echo Access the site here:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost/api
echo.
echo If you see 'cloudmart-frontend' and 'cloudmart-app' 
echo in the list above, you are good to go!
echo ===================================================
pause
