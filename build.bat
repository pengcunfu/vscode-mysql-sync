@echo off
REM VSCode Extension Build Script
REM Compile and package MySQL Sync extension to .vsix file

echo   MySQL Sync Extension Build Script
echo.

REM Check if vsce is installed
where vsce >nul 2>nul
if %errorlevel% neq 0 (
    echo [1/3] Installing vsce packaging tool...
    call npm install -g @vscode/vsce
    if %errorlevel% neq 0 (
        echo ERROR: vsce installation failed!
        pause
        exit /b 1
    )
    echo       vsce installed successfully
) else (
    echo [1/3] vsce tool is already installed
)

echo.
echo [2/3] Cleaning old build files...
if exist out rmdir /s /q out
echo       Clean completed

echo.
echo [3/3] Compiling and packaging extension...
call npm run compile
if %errorlevel% neq 0 (
    echo ERROR: Compilation failed!
    pause
    exit /b 1
 )

call vsce package
if %errorlevel% neq 0 (
    echo ERROR: Packaging failed!
    pause
    exit /b 1
)

echo.
echo   Package built successfully!
echo.

REM Display generated .vsix file
for %%f in (*.vsix) do (
    echo   Generated file: %%f
    echo   File size: %%~zf bytes
)

echo.
echo Installation:
echo   1. Open VSCode and press Ctrl+Shift+P
echo   2. Type "Extensions: Install from VSIX..."
echo   3. Select the .vsix file above
echo.
