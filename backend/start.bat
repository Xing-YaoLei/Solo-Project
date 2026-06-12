@echo off
echo === 启动后端服务 ===

cd /d "%~dp0"

if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo 安装依赖...
pip install -r requirements.txt

if not exist ".env" (
    echo 复制环境变量配置...
    copy .env.example .env
    echo 请编辑 .env 文件配置数据库连接信息
)

echo 请确保 PostgreSQL 和 Redis 服务已启动
echo 启动 FastAPI 服务...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
