@echo off
chcp 65001 > nul
echo ========================================================
echo         SignLight - Khởi động toàn bộ hệ thống
echo ========================================================

REM 1. Kiểm tra Docker & Postgres
echo [1/4] Đang kiểm tra container PostgreSQL (signlight_db)...
docker ps --filter "name=signlight_db" --filter "status=running" -q > nul
if errorlevel 1 (
    echo Khởi động signlight_db...
    docker start signlight_db
) else (
    echo [OK] signlight_db đang chạy trên port 5432.
)

REM 2. Khởi động AI Service (Port 7860)
echo [2/4] Đang khởi động AI Recognition Service (Port 7860)...
start "SignLight - AI Service (7860)" cmd /k "cd /d %~dp0src\ai && python -m uvicorn app.main:app --host 0.0.0.0 --port 7860"

REM 3. Khởi động Spring Boot Backend (Port 8080)
echo [3/4] Đang khởi động Backend Spring Boot (Port 8080)...
start "SignLight - Backend (8080)" cmd /k "cd /d %~dp0src\backend && mvn spring-boot:run"

REM 4. Khởi động Frontend Next.js (Port 3000)
echo [4/4] Đang khởi động Frontend Next.js (Port 3000)...
start "SignLight - Frontend (3000)" cmd /k "cd /d %~dp0src\frontend && npm run dev"

echo.
echo ========================================================
echo Hệ thống đang được khởi động:
echo - Frontend:  http://localhost:3000
echo - Backend:   http://localhost:8080
echo - Swagger:   http://localhost:8080/swagger-ui/index.html
echo - AI Service: http://localhost:7860/health
echo ========================================================
pause
