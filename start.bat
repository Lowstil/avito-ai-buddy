@echo off
chcp 65001 >nul
echo ========================================================
echo   Запуск Avito AI-Buddy (Hack&Change 2026)
echo ========================================================
py run.py
if %errorlevel% neq 0 (
    python run.py
)
pause
