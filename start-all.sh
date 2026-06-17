
#!/bin/bash

# 一键启动脚本
echo "========================================"
echo "  长租公寓退租验房排程台 - 一键启动"
echo "========================================"
echo ""

# 启动后端
bash "$(dirname "$0")/start-backend.sh"

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 启动前端
echo ""
bash "$(dirname "$0")/start-frontend.sh"

# 处理退出
trap "echo '🛑 正在停止所有服务...'; kill $BACKEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# 等待所有进程
wait
