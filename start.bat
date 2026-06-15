@echo off
chcp 65001 >nul
title 高校教务选课排课排程台系统

echo ==========================================
echo   高校教务选课排课排程台系统 - 启动脚本
echo ==========================================
echo.

REM 检查 .NET SDK
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 .NET SDK，请先安装 .NET 8.0+
    pause
    exit /b 1
)

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set API_DIR=%SCRIPT_DIR%src\EduSchedule.API
set FRONTEND_DIR=%SCRIPT_DIR%src\EduSchedule.React

REM 启动选项
echo 请选择启动模式：
echo 1. 启动后端 API 服务
echo 2. 启动前端 React 应用
echo 3. 同时启动前后端（推荐）
echo 4. 仅安装依赖
echo 5. 执行数据库迁移
set /p choice=请输入选项 (1-5): 

if "%choice%"=="1" goto start_api
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto install_deps
if "%choice%"=="5" goto migrate_db

echo ❌ 无效选项
pause
exit /b 1

:start_api
echo.
echo 🚀 正在启动后端 API 服务...
cd /d "%API_DIR%"
dotnet run
goto end

:start_frontend
echo.
echo 📦 正在安装前端依赖...
cd /d "%FRONTEND_DIR%"
call npm install
echo.
echo 🚀 正在启动前端应用...
call npm run dev
goto end

:start_both
echo.
echo 📦 正在安装前端依赖...
cd /d "%FRONTEND_DIR%"
call npm install

echo.
echo 🚀 正在启动前后端服务...
echo.
echo 后端 API: http://localhost:5000
echo 前端应用: http://localhost:3000
echo Hangfire: http://localhost:5000/hangfire
echo.
echo 按 Ctrl+C 停止所有服务

REM 启动后端
cd /d "%API_DIR%"
start "后端API" dotnet run

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 启动前端
cd /d "%FRONTEND_DIR%"
start "前端应用" cmd /c npm run dev

echo.
echo ✅ 服务已启动，请在浏览器中访问 http://localhost:3000
pause
goto end

:install_deps
echo.
echo 📦 正在安装所有依赖...
echo.

echo 恢复 NuGet 包...
cd /d "%API_DIR%"
dotnet restore

echo.
echo 安装 npm 包...
cd /d "%FRONTEND_DIR%"
call npm install

echo.
echo ✅ 依赖安装完成
pause
goto end

:migrate_db
echo.
echo 🗄️  正在执行数据库迁移...
cd /d "%API_DIR%"

REM 检查是否安装了 dotnet-ef
dotnet ef --version >nul 2>nul
if %errorlevel% neq 0 (
    echo 正在安装 dotnet-ef 工具...
    dotnet tool install --global dotnet-ef
)

dotnet ef database update

echo.
echo ✅ 数据库迁移完成
pause
goto end

:end
