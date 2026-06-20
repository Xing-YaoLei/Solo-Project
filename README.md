# 活动票务现场核销跟进台

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + TanStack Router + TanStack Query + Tailwind CSS v4 |
| 后端 | FastAPI + SQLAlchemy (async) + Alembic |
| 数据库 | PostgreSQL 16 |
| 异步任务 | Celery + Redis |
| 部署 | Docker Compose |

---

## 快速启动

### 方式一：只启动前端（立即可用）

前端会在后端未启动时显示空状态，UI 和交互流程可完整演示。

```bash
cd frontend
npm install
npm run dev
```

- 浏览器打开 http://localhost:3000
- 若 3000 端口被占用，Vite 会自动切换到 3001、3002 …，终端会打印实际地址

### 方式二：启动完整后端（含数据库）

需要本机已安装 PostgreSQL 16 和 Redis，或使用下方 Docker Compose。

```bash
# 1. 确保 PostgreSQL 运行并创建数据库
createdb -U postgres verification_db

# 2. 启动后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. 另开终端，启动 Celery（可选，用于超时预警和每日汇总）
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info

# 4. 导入演示数据
cd backend
python seed_data.py

# 5. 启动前端（另开终端）
cd frontend
npm install
npm run dev
```

- 前端 UI: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档 (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 方式三：Docker Compose（一键启动全部服务）

```bash
docker compose up --build
```

服务启动后：
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- PostgreSQL: localhost:5432 (user: postgres, password: postgres, db: verification_db)
- Redis: localhost:6379

导入种子数据（容器启动后执行一次）：

```bash
docker compose exec backend python seed_data.py
```

---

## 功能说明

### 核销单据列表页 `/verifications`
- 按状态、负责人、来源、活动多维筛选
- 表格列出所有核销单据，点击行进入详情
- 支持新建核销单

### 核销详情页 `/verifications/$id`（三栏同屏）
- **左栏**：票种规则（价格/配额/售出率/规则详情） + 购票订单（买家/金额/来源线索）+ 异常信息（争议原因/补充材料/升级目标/处理结论）
- **中栏**：座位图（按区域/排渲染网格，4 色状态标识，点击查看详情，当前座位高亮） + 来源线索元信息
- **右栏**：状态流转时间线 + 当前状态可用操作按钮

### 状态流转

```
pending → in_progress → closed_normal          (正常关闭)
                       → disputed → supplementing → disputed       (补充后继续争议)
                                                → closed_normal    (补充后正常关闭)
                                                → closed_dispute   (补充后争议关闭)
                                  → escalated → closed_dispute     (升级后争议关闭)
                                              → closed_normal      (升级后正常关闭)
                                              → supplementing      (退回补充)
                                  → closed_dispute                 (直接争议关闭)
```

| 状态 | 含义 | 可用操作 |
|---|---|---|
| `pending` 待核销 | 新建未开始 | 开始核销 |
| `in_progress` 核销中 | 正在核销 | 正常关闭 / 标记争议 |
| `disputed` 退票争议 | 进入争议流程 | 补充材料 / 升级处理 / 争议关闭 |
| `supplementing` 补充材料 | 需补充材料 | 继续争议 / 正常关闭 / 争议关闭 |
| `escalated` 升级处理 | 已转交上级 | 争议关闭 / 正常关闭 / 退回补充 |
| `closed_normal` 正常关闭 | 终态 | 无 |
| `closed_dispute` 争议关闭 | 终态 | 无 |

每次状态流转自动记录操作人、来源→目标状态、备注。

### 汇总统计页 `/summary`
- **核销效率**：总数、核销率、平均处理时长、已核销数
- **来源分布**：线上/线下/导入/手工 条形图 + 争议数
- **负责人统计**：总数、已关闭数、平均时长
- **处理结论**：正常关闭 / 争议关闭 / 未关闭
- 支持日期范围、来源、负责人筛选

---

## API 路由

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/POST | `/api/events` | 活动列表 / 创建 |
| GET/PATCH/DELETE | `/api/events/{id}` | 活动详情 / 更新 / 删除 |
| GET/POST | `/api/ticket-types` | 票种列表（支持 `?event_id=`）/ 创建 |
| GET/PATCH/DELETE | `/api/ticket-types/{id}` | 票种详情 / 更新 / 删除 |
| GET/POST | `/api/orders` | 订单列表（支持 `?event_id=`）/ 创建 |
| GET/PATCH/DELETE | `/api/orders/{id}` | 订单详情 / 更新 / 删除 |
| GET/POST | `/api/seats` | 座位列表（支持 `?event_id=`）/ 创建 |
| GET | `/api/seats/chart/{event_id}` | 座位图（按 section → row 分组） |
| GET/POST | `/api/verifications` | 核销单据列表 / 创建 |
| GET | `/api/verifications/{id}` | 详情（含票种、订单、座位、操作历史） |
| PATCH | `/api/verifications/{id}` | 更新字段 |
| POST | `/api/verifications/{id}/transition` | 状态流转 |
| GET | `/api/verifications/{id}/actions` | 操作历史 |
| GET | `/api/summary/efficiency` | 核销效率统计 |
| GET | `/api/summary/by-source` | 按来源汇总 |
| GET | `/api/summary/by-assignee` | 按负责人汇总 |
| GET | `/api/summary/by-conclusion` | 按处理结论汇总 |

---

## 项目结构

```
MP0408/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口，CORS、启动建表
│   │   ├── config.py            # DATABASE_URL / REDIS_URL 环境变量
│   │   ├── database.py          # SQLAlchemy 异步引擎 + Session
│   │   ├── models/              # ORM：event / ticket_type / order / seat / verification
│   │   ├── schemas/             # Pydantic 请求/响应
│   │   ├── api/                 # 路由
│   │   ├── services/            # 业务逻辑（状态机、汇总统计）
│   │   └── tasks/               # Celery（超时自动升级、每日汇总）
│   ├── alembic/                 # 数据库迁移
│   ├── seed_data.py             # 演示数据
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── routes/              # TanStack Router（/verifications, /verifications/$id, /verifications/new, /summary）
│   │   ├── components/          # TicketTypePanel / OrderPanel / SeatingChart / StatusFlow / StatusBadge …
│   │   ├── api/                 # Axios 封装
│   │   ├── types/index.ts       # TypeScript 类型 + 状态映射 + 可用流转
│   │   └── lib/utils.ts         # 格式化工具
│   ├── vite.config.ts           # React + Tailwind v4 + /api 代理到 8000，默认端口 3000
│   └── Dockerfile
├── docker-compose.yml           # PostgreSQL + Redis + Backend + Celery worker + Celery beat + Frontend
└── README.md
```
