@echo off
echo ECHO Developer Studio — Fix winCodeSign Cache
echo ==============================================
echo.
echo This script fixes the electron-builder cache so Windows builds
echo work WITHOUT Developer Mode. Run as Administrator if possible.
echo.

set CACHE=%LOCALAPPDATA%\electron-builder\Cache\winCodeSign
set BUNDLED7Z=node_modules\7zip-bin\win\x64\7za.exe

if not exist "%BUNDLED7Z%" (
    echo ERROR: 7za.exe not found. Run: npm install
    exit /b 1
)

echo Cleaning existing cache...
if exist "%CACHE%" rmdir /s /q "%CACHE%"
mkdir "%CACHE%"

echo Downloading winCodeSign...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z' -OutFile '%CACHE%\winCodeSign.7z' -UseBasicParsing"

echo Extracting (ignoring symlinks)...
"%BUNDLED7Z%" x -y -o"%CACHE%\2.6.0" "%CACHE%\winCodeSign.7z" >nul 2>&1

echo Creating placeholder files for missing symlinks...
if not exist "%CACHE%\2.6.0\darwin\10.12\lib" mkdir "%CACHE%\2.6.0\darwin\10.12\lib"
type nul > "%CACHE%\2.6.0\darwin\10.12\lib\libcrypto.dylib"
type nul > "%CACHE%\2.6.0\darwin\10.12\lib\libssl.dylib"

echo.
echo winCodeSign cache fixed!
echo.
echo You can now build Windows targets:
echo   npm run dist:win:nsis      ^(Installer^)
echo   npm run dist:win:portable  ^(Single .exe^)
echo   npm run dist:win:zip       ^(ZIP archive^)
echo.
pause
