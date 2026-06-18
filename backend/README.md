# 二手车过户材料风险监测系统 - Backend

基于 FastAPI 的后端服务，支持 Mock 模式（无需 PostGIS/Redis）和真实数据库模式。

## 快速开始

### 环境准备

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 启动 Mock 模式（推荐前端开发用）

Mock 模式下，所有数据由 `app/services/mock_service.py` 生成，无需安装 Postgres/Redis。

```bash
export MOCK_MODE=true
python run.py
```

或直接使用默认配置（`MOCK_MODE` 默认 `true`）：

```bash
python run.py
```

启动后访问：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康检查**: http://localhost:8000/
- **Liveness**: http://localhost:8000/health
- **Readiness**: http://localhost:8000/ready

### 测试登录

Mock 模式下，任意用户名/密码均可登录成功：

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'
```

### 连接真实 PostGIS（生产模式）

1. 安装依赖：
   - PostgreSQL 16+
   - PostGIS 3.4+
   - Redis 7+

2. 初始化数据库：
   ```bash
   createdb dealer_risk
   psql -d dealer_risk -c "CREATE EXTENSION postgis;"
   psql -d dealer_risk -f migrations/001_init_schema.sql
   ```

3. 配置环境变量（或创建 `.env` 文件）：
   ```bash
   export MOCK_MODE=false
   export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/dealer_risk"
   export REDIS_URL="redis://localhost:6379/0"
   export SECRET_KEY="your-production-secret-key"
   export APP_ENV="production"
   ```

4. 启动服务：
   ```bash
   python run.py
   ```

## API 路由一览

所有路由前缀均为 `/api/v1`

| 模块 | 路由 | Tags | 说明 |
|------|------|------|------|
| 认证 | `/auth/*` | 认证 | 登录/登出/刷新Token/当前用户 |
| 门店 | `/stores/*` | 门店 | 门店列表、详情、地图数据、指标 |
| 车辆 | `/vehicles/*` | 车辆 | 车辆列表、详情、风险矩阵、材料缺失分布 |
| 预警 | `/alerts/*` | 预警 | 预警列表、统计、确认、处理 |
| 规则 | `/rules/*` | 预警规则 | 规则CRUD、启用/禁用、Dry Run |
| 复盘 | `/review/*` | 复盘材料 | 完整复盘包、时间轴、三Tab、导出 |
| 分析 | `/analytics/*` | 图表分析 | Dashboard摘要、整备趋势、试驾分布、报价K线、同步延迟 |
| 同步 | `/sync/*` | 数据同步 | 同步状态、延迟信息、手动触发、同步日志 |
| ETL | `/etl/*` | ETL 管道 | 清洗统计、去重、品牌归一化、缺失填充、全量运行 |

## Mock 数据概览

- **门店**: 8家（北京/上海/广州/深圳/杭州/成都/武汉/西安，含真实经纬度）
- **车辆**: 30台（随机品牌、模型、风险等级、库龄、材料完整度）
- **预警**: 25条（6类规则，含确认/处理状态）
- **规则**: 6条（可CRUD、可开关、可Dry Run）
- **同步延迟**: 车源库 >24h（异常），金融/检测仪正常
- **复盘数据**: 时间轴 + 整备记录 + 试驾记录 + 报价记录

## 目录结构

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── routers/        # API 路由（共11个模块）
│   │   │   └── schemas/        # Pydantic Schema
│   │   └── deps.py             # 依赖注入 (MockService 单例)
│   ├── core/
│   │   └── config.py           # 配置（含 MOCK_MODE）
│   ├── db/
│   │   ├── models.py           # SQLAlchemy ORM 模型
│   │   └── session.py          # 数据库/Redis 连接
│   ├── services/
│   │   ├── mock_service.py     # Mock 数据生成（核心）
│   │   └── etl_service.py      # ETL 清洗逻辑
│   ├── etl/
│   │   └── pipeline.py         # ETL 管道
│   ├── utils/
│   │   └── helpers.py          # 工具函数
│   └── main.py                 # FastAPI 入口
├── migrations/
│   └── 001_init_schema.sql     # PostGIS 初始化脚本
├── requirements.txt
├── run.py                      # 启动脚本
├── .env.example
└── README.md
```

## 环境变量参考

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MOCK_MODE` | `true` | 是否启用 Mock 模式，默认 true |
| `DATABASE_URL` | `sqlite:///./dev.db` | 数据库连接串 |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 连接串 |
| `SECRET_KEY` | `dev-secret-change-me` | JWT 密钥 |
| `APP_ENV` | `dev` | 运行环境 (dev/production) |
| `API_PREFIX` | `/api/v1` | API 前缀 |
| `CORS_ORIGINS` | `["http://localhost:5173","http://localhost:3000"]` | CORS 允许的源 |
| `SYNC_CRON` | `0 */4 * * *` | 数据同步定时任务 Cron |
| `ALERT_SCAN_CRON` | `*/10 * * * *` | 预警扫描定时任务 Cron |
