# Solo Management System - Backend

案件管理系统后端服务，基于 FastAPI 构建。

## 技术栈

- **框架**: FastAPI 0.110+
- **ASGI 服务器**: Uvicorn
- **ORM**: SQLAlchemy 2.0+ (Async)
- **数据库**: PostgreSQL (主库) + DuckDB (OLAP)
- **认证**: JWT (python-jose)
- **密码哈希**: passlib (bcrypt)
- **数据处理**: Pandas, Polars
- **任务队列**: Celery + Redis
- **缓存**: Redis
- **导出**: openpyxl (Excel), reportlab (PDF)

## 项目结构

```
backend/
├── app/
│   ├── config/          # 配置管理
│   ├── db/              # 数据库连接与初始化
│   ├── integrations/    # 外部系统集成
│   ├── middleware/      # 中间件（认证、权限、限流）
│   ├── models/          # SQLAlchemy ORM 模型
│   ├── routers/         # API 路由
│   ├── schemas/         # Pydantic 数据模型
│   ├── services/        # 业务逻辑层
│   └── utils/           # 工具函数
├── duckdb/              # DuckDB 分析视图
├── migrations/          # 数据库迁移脚本
├── main.py              # 应用入口
├── requirements.txt     # Python 依赖
├── start.sh             # 启动脚本
├── .env.example         # 环境变量示例
└── .env                 # 实际环境变量（需创建）
```

## 快速开始

### 1. 环境准备

- Python 3.10+
- PostgreSQL 13+
- Redis 6+ (可选，用于限流和缓存)

### 2. 创建虚拟环境

```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息。

### 5. 数据库初始化

```bash
# 执行迁移脚本
psql -U postgres -d solo_management -f migrations/001_init_schema.sql
psql -U postgres -d solo_management -f migrations/002_seed_data.sql
psql -U postgres -d solo_management -f migrations/003_duckdb_views.sql
```

### 6. 启动服务

```bash
# 使用启动脚本
./start.sh

# 或手动启动
export PYTHONPATH=$(pwd)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 7. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 接口

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 报表接口

- `GET /api/reports/dashboard` - 获取仪表板数据
- `GET /api/reports/cases/trend` - 案件趋势分析
- `GET /api/reports/finance/summary` - 财务汇总
- `GET /api/reports/approvals/anomaly` - 审批异常分析

### 分享接口

- `POST /api/share/links` - 创建分享链接
- `GET /api/share/links` - 获取分享链接列表
- `GET /api/share/access/:token` - 通过分享链接访问数据

### 导出接口

- `POST /api/export/excel` - 导出 Excel
- `POST /api/export/pdf` - 导出 PDF
- `GET /api/export/tasks/:id` - 查询导出任务状态
- `GET /api/export/download/:id` - 下载导出文件

### 数据同步接口

- `POST /api/data-sync/email` - 同步邮件数据
- `POST /api/data-sync/calendar` - 同步日历数据
- `POST /api/data-sync/case-system` - 同步案件系统数据

## 默认测试账号

运行 seed 数据后，可以使用以下账号登录：

| 邮箱 | 密码 | 角色 |
|------|------|------|
| partner@example.com | password123 | partner (合伙人) |
| lawyer@example.com | password123 | lawyer (律师) |
| assistant@example.com | password123 | assistant (助理) |
| client@example.com | password123 | client (客户) |

## 开发指南

### 数据库模型

新增模型时，在 `app/models/` 下创建文件，并在 `app/models/__init__.py` 中导出。

### API 路由

新增路由时，在 `app/routers/` 下创建文件，并在 `main.py` 中注册：

```python
from app.routers import your_router
app.include_router(your_router.router, prefix="/api/your-path", tags=["标签"])
```

### 中间件

中间件按以下顺序执行：
1. RateLimitMiddleware - 限流
2. AuthMiddleware - 认证
3. PermissionMiddleware - 权限

### DuckDB 分析数据库

DuckDB 用于 OLAP 分析查询，数据从 PostgreSQL 同步。视图定义在 `duckdb/analytics/` 目录下。

## 常见问题

### 1. 数据库连接失败

检查 PostgreSQL 是否启动，以及 `.env` 中的 `DATABASE_URL` 配置是否正确。

### 2. DuckDB 文件损坏

删除 `data/olap.duckdb` 文件，重新运行初始化脚本。

### 3. JWT Token 无效

检查 `JWT_SECRET_KEY` 配置，确保前后端使用相同的密钥。

### 4. 依赖安装失败

升级 pip 后重试：
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
