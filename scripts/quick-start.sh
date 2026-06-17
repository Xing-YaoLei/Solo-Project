#!/bin/bash

# 长租公寓退租验房看板 - 快速启动脚本

set -e

echo "================================================"
echo "  长租公寓退租验房看板 - 快速启动"
echo "================================================"
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未检测到 Docker，请先安装 Docker Desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未检测到 docker-compose"
    exit 1
fi

echo "✅ Docker 环境检测通过"
echo ""

# 复制环境变量
if [ ! -f .env ]; then
    echo "📋 复制环境变量配置..."
    cp .env.example .env
    echo "✅ .env 文件已创建"
else
    echo "ℹ️  .env 文件已存在，跳过复制"
fi
echo ""

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p backend/data data
echo "✅ 数据目录已创建"
echo ""

# 启动服务
echo "🚀 启动所有服务..."
echo "   这可能需要几分钟，请耐心等待..."
echo ""

docker-compose up -d --build

echo ""
echo "⏳ 等待服务就绪..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态检查:"
docker-compose ps

echo ""
echo "🔄 初始化数据库..."
docker-compose exec -T backend python -m app.database.init_db || echo "⚠️  数据库初始化警告（可能已初始化）"

echo ""
echo "📊 导入示例数据..."
docker-compose exec -T backend python -m app.scripts.import_sample_data || echo "⚠️  示例数据导入警告（可能已导入）"

echo ""
echo "🔄 同步数据到DuckDB..."
sleep 5

echo ""
echo "================================================"
echo "  🎉 系统启动完成！"
echo "================================================"
echo ""
echo "📱 访问地址:"
echo "   - 前端看板:      http://localhost:3000"
echo "   - 后端API文档:   http://localhost:8000/docs"
echo "   - 健康检查:      http://localhost:8000/health"
echo ""
echo "👤 测试账号:"
echo "   - 管理员: admin@example.com / admin123"
echo "   - 维修员: worker1@example.com / worker123"
echo "             worker2@example.com / worker123"
echo "             worker3@example.com / worker123"
echo "             worker4@example.com / worker123"
echo "             worker5@example.com / worker123"
echo ""
echo "🛠️  常用命令:"
echo "   查看日志:    docker-compose logs -f [backend|frontend|postgres]"
echo "   停止服务:    docker-compose down"
echo "   重启服务:    docker-compose restart"
echo "   重新构建:    docker-compose up -d --build"
echo ""
echo "📚 更多信息请查看 README.md"
echo "================================================"
