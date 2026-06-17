
#!/bin/bash

# 启动后端服务
echo "🚀 正在启动后端服务..."
cd "$(dirname "$0")/src/Backend/MoveOutInspection.Api"

# 检查是否已安装依赖
if [ ! -d "bin" ]; then
    echo "📦 正在还原 NuGet 包..."
    dotnet restore
fi

# 启动后端
dotnet run --urls "http://localhost:5000" &
BACKEND_PID=$!

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   🌐 Swagger: http://localhost:5000/swagger"
echo "   🕐 Hangfire: http://localhost:5000/hangfire"
