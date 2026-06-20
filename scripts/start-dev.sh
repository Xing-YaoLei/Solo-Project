#!/bin/bash
# 快速启动脚本 - 一键启动 API 和前端
# 使用方法: chmod +x scripts/start-dev.sh && ./scripts/start-dev.sh

set -e

cd "$(dirname "$0")/.."

echo "🚀 开始启动活动票务任务分派台..."

# 检查环境变量
if [ ! -f .env ]; then
  echo "📝 未找到 .env 文件，从 .env.example 复制..."
  cp .env.example .env
  echo "⚠️  请修改 .env 中的数据库连接信息后重新运行"
  exit 1
fi

# 检查 node_modules
if [ ! -d node_modules ]; then
  echo "📦 安装依赖..."
  npm install --no-audit --no-fund
fi

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npm run db:generate

# （可选）推送数据库 schema
# read -p "是否推送数据库 schema? (y/N) " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#   npm run db:push
# fi

echo ""
echo "✅ 准备工作完成！"
echo ""
echo "请在两个终端分别执行："
echo "  终端1: npm run dev:api    # 启动 API 服务 (端口 3001)"
echo "  终端2: npm run dev:web    # 启动前端 (端口 3000)"
echo ""
echo "访问地址："
echo "  管理台: http://localhost:3000"
echo "  API 文档: http://localhost:3001/api/docs"
