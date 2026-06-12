#!/bin/bash

# 检查并自动设置执行权限
if [ ! -x "$0" ]; then
    echo "检测到脚本没有执行权限，正在自动设置..."
    chmod +x "$0" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "请手动执行: chmod +x start.sh"
        exit 1
    fi
    echo "执行权限已设置，正在重新启动..."
    exec "$0" "$@"
fi

echo "=== 启动前端服务 ==="

cd "$(dirname "$0")" || exit 1

echo "检查 Node.js 版本..."
node -v

echo "安装依赖..."
npm install

echo "启动开发服务器..."
echo "访问地址: http://localhost:5173"
npm run dev
