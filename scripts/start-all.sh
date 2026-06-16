#!/bin/bash

echo "========================================"
echo "  养老护理床位排班排程台 - 一键启动"
echo "========================================"
echo ""

SCRIPT_DIR="$(dirname "$0")"

echo "📦 检查 SQL Server 连接..."
echo "   请确保 SQL Server 已在 localhost:1433 运行，并在 appsettings.json 中配置正确的密码"
echo ""

sleep 2

echo "🚀 启动后端服务（端口 5000）..."
osascript -e 'tell application "Terminal" to do script "cd '"'$SCRIPT_DIR'"' && bash start-backend.sh"' 2>/dev/null || \
gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && bash start-backend.sh" 2>/dev/null || \
xterm -hold -e "cd '$SCRIPT_DIR' && bash start-backend.sh" 2>/dev/null &

BACKEND_PID=$!
sleep 3

echo ""
echo "🎨 启动前端服务（端口 3000）..."
osascript -e 'tell application "Terminal" to do script "cd '"'$SCRIPT_DIR'"' && bash start-frontend.sh"' 2>/dev/null || \
gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && bash start-frontend.sh" 2>/dev/null || \
xterm -hold -e "cd '$SCRIPT_DIR' && bash start-frontend.sh" 2>/dev/null &

FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  ✅ 服务正在启动中..."
echo "========================================"
echo ""
echo "  🌐 前端页面：   http://localhost:3000"
echo "  📋 API 文档：   http://localhost:5000/swagger"
echo "  📊 Hangfire：   http://localhost:5000/hangfire  (admin / Admin@123)"
echo ""
echo "  💡 提示：等待后端启动完成（约10秒）后刷新前端页面"
echo ""
