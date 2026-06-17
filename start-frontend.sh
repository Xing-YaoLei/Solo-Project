
#!/bin/bash

# 启动前端服务
echo "🚀 正在启动前端服务..."
cd "$(dirname "$0")/src/Frontend"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装 npm 依赖..."
    npm install
fi

# 启动前端
npm run dev
