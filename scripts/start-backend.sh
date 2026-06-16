#!/bin/bash

echo "========================================"
echo "  养老护理床位排班排程台 - 启动后端"
echo "========================================"
echo ""

cd "$(dirname "$0")/../src/ElderCareScheduling.API"

echo "[1/3] 检查 .NET SDK..."
if ! command -v dotnet &> /dev/null; then
    echo "❌ 错误：未找到 .NET SDK，请先安装 .NET 8.0 SDK"
    echo "   下载地址：https://dotnet.microsoft.com/download"
    exit 1
fi
echo "✅ .NET SDK 版本：$(dotnet --version)"

echo ""
echo "[2/3] 还原依赖包..."
dotnet restore

echo ""
echo "[3/3] 启动后端服务..."
echo ""
echo "📋 API 文档地址：http://localhost:5000/swagger"
echo "📋 Hangfire 面板：http://localhost:5000/hangfire  (账号: admin / 密码: Admin@123)"
echo ""

dotnet run --launch-profile http
