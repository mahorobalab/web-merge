@echo off
rem ========================================================
rem WebMerge - Quick Start Launcher (Windows)
rem ========================================================
setlocal

cd /d "%~dp0"

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python serve.py
    goto end
)

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py serve.py
    goto end
)

echo [ERROR] Python is not installed or not found in PATH.
echo Python がインストールされていないか、PATH に通っていません。
echo https://www.python.org/
echo.
pause

:end
endlocal
