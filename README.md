# 物业园区报修工单跟进台

基于 React + TanStack Router + FastAPI + PostgreSQL + Celery 的物业园区报修工单管理系统。

## 功能特性

### 工单管理
- 工单创建、派工、处理、复核完整流程
- 现场照片上传和查看
- 派工规则自动匹配
- 处理时限和超时提醒
- 复核不通过高亮显示
- 沟通记录集中保存

### 权限体系
- **系统管理员 (admin)**: 全部功能权限
- **管理人员 (manager)**: 数据看板、工单管理、派工、复核
- **一线人员 (worker)**: 仅查看和处理自己负责的工单

### 数据统计
- 首次解决率趋势图
- 每日工单量统计
- 工单状态分布
- 复核不通过统计

## 技术栈

### 前端
- React 18 + TypeScript
- TanStack Router (文件路由)
- Tailwind CSS
- Zustand (状态管理)
- Recharts (图表库)
- Lucide React (图标)
- Axios (HTTP 请求)
- Day.js (日期处理)

### 后端
- FastAPI (高性能 Web 框架)
- SQLAlchemy (ORM)
- PostgreSQL (关系数据库)
- Celery + Redis (异步任务)
- Pydantic (数据验证)
- JWT (身份认证)
- Alembic (数据库迁移)

## 项目结构

```
.
├── backend/                 # 后端 FastAPI 项目
│   ├── app/
│   │   ├── api/             # API 路由
│   │   │   ├── auth.py      # 认证接口
│   │   │   ├── users.py     # 用户接口
│   │   │   ├── work_orders.py  # 工单接口
│   │   │   ├── admin.py     # 管理接口
│   │   │   └── deps.py      # 依赖注入
│   │   ├── core/            # 核心配置
│   │   │   ├── config.py    # 配置管理
│   │   │   ├── database.py  # 数据库连接
│   │   │   └── security.py  # 安全相关
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic 模式
│   │   ├── services/        # 业务逻辑层
│   │   ├── celery_app/      # Celery 任务
│   │   └── main.py          # 应用入口
│   └── requirements.txt
│
└── frontend/                # 前端 React 项目
    ├── src/
    │   ├── pages/           # 页面组件
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── WorkOrderList.tsx
    │   │   └── WorkOrderDetail.tsx
    │   ├── components/      # 公共组件
    │   ├── api/             # API 调用
    │   ├── hooks/           # 自定义 Hook
    │   ├── types/           # TypeScript 类型
    │   ├── utils/           # 工具函数
    │   ├── main.tsx         # 入口文件
    │   └── index.css        # 全局样式
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 创建虚拟环境并安装依赖
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. 配置环境变量（可选）
```bash
export POSTGRES_SERVER=localhost
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB=property_repair
export CELERY_BROKER_URL=redis://localhost:6379/0
```

4. 启动 FastAPI 服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. 启动 Celery Worker（另开终端）
```bash
cd backend
source venv/bin/activate
celery -A app.celery_app.celery worker --loglevel=info
```

API 文档地址: http://localhost:8000/docs

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

前端地址: http://localhost:3000

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | admin123 |
| 管理人员 | manager | manager123 |
| 一线人员 | worker1 | worker123 |
| 一线人员 | worker2 | worker123 |

## 工单流程

```
新建工单 → 待派工 → 已派工 → 处理中 → 待复核 → 复核通过 → 已结案
                                      ↑            ↓
                                      └── 复核不通过（重新处理）
```

## 主要特性说明

### 按日常处理节奏排序
工单列表按优先级（紧急→高→中→低）和创建时间排序，确保最紧急的任务优先处理。

### 复核不通过高亮
- 列表页：红色左边框 + 浅红背景突出显示
- 详情页：顶部红色警示条 + 退回次数统计

### 首次解决率
衡量一次性解决问题的能力，统计无需返工即可通过复核的工单占比。

### 派工规则
根据工单类别和优先级自动匹配派工规则，设置处理时限和默认处理人。

## API 接口

### 认证
- `POST /api/v1/auth/login` - 用户登录

### 用户
- `GET /api/v1/users/me` - 获取当前用户信息
- `GET /api/v1/users/workers` - 获取维修人员列表

### 工单
- `GET /api/v1/work-orders/daily` - 获取日常工单列表
- `GET /api/v1/work-orders` - 工单列表（支持筛选）
- `GET /api/v1/work-orders/{id}` - 工单详情
- `POST /api/v1/work-orders` - 创建工单
- `POST /api/v1/work-orders/{id}/assign` - 指派工单
- `POST /api/v1/work-orders/{id}/start` - 开始处理
- `POST /api/v1/work-orders/{id}/complete` - 完成处理
- `POST /api/v1/work-orders/{id}/review` - 复核工单
- `GET /api/v1/work-orders/{id}/communications` - 获取沟通记录
- `POST /api/v1/work-orders/{id}/communications` - 添加沟通记录

### 管理
- `GET /api/v1/dashboard/stats` - 看板统计数据
- `GET /api/v1/dispatch-rules` - 派工规则列表
- `POST /api/v1/dispatch-rules` - 创建派工规则
- `PUT /api/v1/dispatch-rules/{id}` - 更新派工规则
- `DELETE /api/v1/dispatch-rules/{id}` - 删除派工规则

## Celery 任务

- `check_overdue_orders` - 检查超时工单
- `send_notification` - 发送通知
- `daily_summary` - 每日汇总
- `process_new_work_order` - 新工单处理
- `remind_review` - 复核提醒

## 开发说明

- 后端使用 SQLAlchemy 自动建表，首次启动会自动创建表结构和初始化数据
- 前端使用 Vite 构建，支持热更新
- 前后端通过 /api 代理转发，避免跨域问题
