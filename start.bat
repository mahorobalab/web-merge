@echo off
chcp 65001 >nul
rem ========================================================
rem WebMerge - Quick Start Launcher (Windows)
rem ========================================================
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 goto run_python

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 goto run_py

echo.
echo [ERROR] Python is not installed or not found in PATH.
echo [エラー] Python がインストールされていないか、PATH に通っていません。
echo.
echo Please download and install Python from:
echo https://www.python.org/downloads/
echo.
echo (Make sure to check "Add Python to PATH" during installation)
echo (インストール時に「Add Python to PATH」にチェックを入れてください)
echo.
pause
goto end

:run_python
python serve.py %*
goto end

:run_py
py serve.py %*
goto end

:end
endlocal
