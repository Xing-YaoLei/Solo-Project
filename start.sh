#!/bin/bash

# 高校教务排课系统启动脚本

echo "=========================================="
echo "  高校教务选课排课排程台系统 - 启动脚本"
echo "=========================================="

# 检查 .NET SDK
if ! command -v dotnet &> /dev/null; then
    echo "❌ 错误: 未检测到 .NET SDK，请先安装 .NET 8.0+"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$SCRIPT_DIR/src/EduSchedule.API"
FRONTEND_DIR="$SCRIPT_DIR/src/EduSchedule.React"

# 启动选项
echo "请选择启动模式："
echo "1. 启动后端 API 服务"
echo "2. 启动前端 React 应用"
echo "3. 同时启动前后端（推荐）"
echo "4. 仅安装依赖"
echo "5. 执行数据库迁移"
read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 正在启动后端 API 服务..."
        cd "$API_DIR"
        dotnet run
        ;;
    2)
        echo ""
        echo "📦 正在安装前端依赖..."
        cd "$FRONTEND_DIR"
        npm install
        echo ""
        echo "🚀 正在启动前端应用..."
        npm run dev
        ;;
    3)
        echo ""
        echo "📦 正在安装前端依赖..."
        cd "$FRONTEND_DIR"
        npm install
        
        echo ""
        echo "🚀 正在启动前后端服务..."
        echo ""
        echo "后端 API: http://localhost:5000"
        echo "前端应用: http://localhost:3000"
        echo "Hangfire: http://localhost:5000/hangfire"
        echo ""
        echo "按 Ctrl+C 停止所有服务"
        
        # 启动后端
        cd "$API_DIR"
        dotnet run &
        API_PID=$!
        
        # 等待后端启动
        sleep 5
        
        # 启动前端
        cd "$FRONTEND_DIR"
        npm run dev &
        FRONTEND_PID=$!
        
        # 等待用户中断
        trap "echo ''; echo '🛑 正在停止服务...'; kill $API_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
        wait
        ;;
    4)
        echo ""
        echo "📦 正在安装所有依赖..."
        echo ""
        
        echo "恢复 NuGet 包..."
        cd "$API_DIR"
        dotnet restore
        
        echo ""
        echo "安装 npm 包..."
        cd "$FRONTEND_DIR"
        npm install
        
        echo ""
        echo "✅ 依赖安装完成"
        ;;
    5)
        echo ""
        echo "🗄️  正在执行数据库迁移..."
        cd "$API_DIR"
        
        # 检查是否安装了 dotnet-ef
        if ! dotnet ef --version &> /dev/null; then
            echo "正在安装 dotnet-ef 工具..."
            dotnet tool install --global dotnet-ef
        fi
        
        dotnet ef database update
        
        echo ""
        echo "✅ 数据库迁移完成"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac
