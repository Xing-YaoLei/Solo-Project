#!/bin/bash
set -e

echo "=================================================="
echo "  合规审计制度检查排程台 - 后端启动脚本"
echo "=================================================="

cd "$(dirname "$0")/src/ComplianceAudit.API"

echo "[1/2] 还原 NuGet 包..."
dotnet restore

echo ""
echo "[2/2] 启动 ASP.NET Core API (http://localhost:5000)"
echo "  - Swagger : http://localhost:5000/swagger"
echo "  - Hangfire: http://localhost:5000/hangfire (admin/Hangfire@Admin123)"
echo ""

dotnet run --urls "http://localhost:5000"
