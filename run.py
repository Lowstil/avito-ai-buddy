#!/usr/bin/env python3
"""
Avito AI-Buddy: Unified One-Click Launcher
Starts both Backend and Frontend in a single command, opens the browser, and handles graceful shutdown.
"""

import subprocess
import sys
import time
import os
import webbrowser
import signal

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, "backend")
    frontend_dir = os.path.join(root, "frontend")

    print("\n" + "="*60)
    print("🚀 ЗАПУСК СИСТЕМЫ AVITO AI-BUDDY (Hack&Change 2026)")
    print("="*60)
    print("• Backend API & MCP Server: http://localhost:8000")
    print("• Frontend Web Application: http://localhost:4173")
    print("• Документация OpenAPI:     http://localhost:8000/docs")
    print("• Метрики Prometheus:       http://localhost:8000/metrics")
    print("="*60 + "\n")

    # 1. Start Backend
    print("⏳ Запуск FastAPI бэкенда на порту 8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=backend_dir
    )

    # 2. Wait 1 second for backend
    time.sleep(1.2)

    # 3. Start Frontend Preview
    print("⏳ Запуск React фронтенда на порту 4173...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "preview", "--", "--port", "4173", "--host", "127.0.0.1"],
        cwd=frontend_dir
    )

    time.sleep(1.5)
    url = "http://localhost:4173"
    print(f"\n✨ Avito AI-Buddy успешно запущен! Открываем {url} в браузере...")
    webbrowser.open(url)

    print("\nНажмите Ctrl+C для остановки обоих серверов.\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nОстановка серверов...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("✅ Серверы остановлены.")

if __name__ == "__main__":
    main()
