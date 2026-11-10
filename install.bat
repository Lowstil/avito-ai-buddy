@echo off
chcp 65001 >nul
echo ========================================================
echo   Установка зависимостей Avito AI-Buddy
echo ========================================================

echo ⏳ Установка Python-зависимостей через лаунчер py...
py -m pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo ⚠️ Попытка через python -m pip...
    python -m pip install -r backend/requirements.txt
)

echo.
echo ⏳ Сборка фронтенда React...
cd frontend
call npm install --legacy-peer-deps
call npm run build
cd ..

echo.
echo ========================================================
echo   ✅ Установка успешно завершена!
echo   Теперь просто запустите start.bat для открытия проекта!
echo ========================================================
pause
