# 活动票务现场核销跟进台

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + TanStack Router + TanStack Query + Tailwind CSS |
| 后端 | FastAPI + SQLAlchemy (async) + Alembic |
| 数据库 | PostgreSQL 16 |
| 异步任务 | Celery + Redis |
| 部署 | Docker Compose |

## 快速启动

### Docker Compose（推荐）

```bash
docker compose up --build
```

- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 本地开发

**后端**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Celery Worker**

```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info
```

**前端**

```bash
cd frontend
npm install
npm run dev
```

### 初始化种子数据

```bash
cd backend
python seed_data.py
```

## 核销单据状态流转

```
pending → in_progress → closed_normal
                       → disputed → supplementing → disputed
                                                → closed_normal
                                                → closed_dispute
                       → escalated → closed_dispute
                                   → closed_normal
                                   → supplementing
                       → closed_dispute
```

- **pending** 待核销
- **in_progress** 核销中
- **disputed** 退票争议
- **supplementing** 补充材料
- **escalated** 升级处理
- **closed_normal** 正常关闭
- **closed_dispute** 争议关闭

## API 路由

| 路径 | 说明 |
|---|---|
| `GET /api/events` | 活动列表 |
| `POST /api/events` | 创建活动 |
| `GET /api/ticket-types` | 票种列表 |
| `GET /api/orders` | 订单列表 |
| `GET /api/seats/chart/{event_id}` | 座位图 |
| `GET /api/verifications` | 核销单据列表 |
| `POST /api/verifications` | 创建核销单据 |
| `GET /api/verifications/{id}` | 核销单据详情（含票种、订单、座位、操作历史） |
| `POST /api/verifications/{id}/transition` | 状态流转 |
| `GET /api/summary/efficiency` | 核销效率统计 |
| `GET /api/summary/by-source` | 按来源汇总 |
| `GET /api/summary/by-assignee` | 按负责人汇总 |
| `GET /api/summary/by-conclusion` | 按处理结论汇总 |
