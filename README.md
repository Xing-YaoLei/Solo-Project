# 合规审计整改跟踪系统

## 项目概述

本系统用于接住合规审计的整改跟踪流程，实现工单从创建、派工、处理、复核到闭环的全流程管理。支持桌面端批量查询、导出、统计分析，以及移动端快速处理、拍照上传。

## 技术栈

### 后端
- **FastAPI** - 高性能 Python Web 框架
- **PostgreSQL** - 关系型数据库
- **SQLAlchemy** - ORM 框架
- **Celery** - 异步任务队列
- **Redis** - 消息代理和缓存
- **Pydantic** - 数据验证

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **TanStack Router** - 文件路由
- **TanStack Query** - 服务端状态管理
- **Ant Design** - 桌面端 UI 组件库
- **Ant Design Mobile** - 移动端 UI 组件库
- **Zustand** - 全局状态管理
- **Recharts** - 图表库
- **Vite** - 构建工具
- **Tailwind CSS** - 原子化 CSS

## 项目结构

```
MP0468/
├── backend/                    # 后端 FastAPI 项目
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── config.py          # 配置文件
│   │   ├── database.py        # 数据库连接
│   │   ├── auth.py            # 认证逻辑
│   │   ├── celery_app.py      # Celery 配置
│   │   ├── models/            # 数据库模型
│   │   ├── schemas/           # Pydantic 模型
│   │   ├── api/               # API 路由
│   │   ├── services/          # 业务服务层
│   │   └── tasks/             # Celery 异步任务
│   ├── init_db.py             # 数据库初始化脚本
│   ├── requirements.txt       # Python 依赖
│   └── .env.example           # 环境变量示例
├── frontend/                   # 前端 React 项目
│   ├── src/
│   │   ├── main.tsx           # 应用入口
│   │   ├── routes/tree.tsx    # TanStack Router 路由配置
│   │   ├── components/        # 公共组件
│   │   ├── pages/
│   │   │   ├── desktop/       # 桌面端页面
│   │   │   └── mobile/        # 移动端页面
│   │   ├── services/api.ts    # API 服务
│   │   ├── hooks/useStore.ts  # 状态管理
│   │   └── types/index.ts     # TypeScript 类型定义
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## 业务功能

### 工单状态流转
```
待派工 → 已派工 → 处理中 → 处理完成 → 复核中 → 已闭环
                ↓                  ↑
            复核不通过 ────────────┘
```

### 桌面端功能
- ✅ **工单管理**：工单列表、批量查询、新建工单、导出 Excel
- ✅ **工单详情**：完整信息展示、状态流转、处理记录时间线
- ✅ **统计分析**：首次解决率分析、月度趋势图表、按审计员/部门统计
- ✅ **派工规则**：规则配置、默认处理人、处理时限设置
- ✅ **复盘视图**：待复核工单列表、复核不通过处理、受影响对象记录
- ✅ **复核不通过流程**：记录受影响对象、补充说明、调整负责人

### 移动端功能
- ✅ **工单列表**：按状态筛选、下拉刷新、搜索
- ✅ **工单详情**：信息展示、处理记录、受影响对象
- ✅ **快速处理**：状态流转、拍照上传、备注说明

### 处理记录特性
- ✅ 带附件上传
- ✅ 备注说明
- ✅ 经办人记录
- ✅ 状态变化追踪
- ✅ 时间线展示

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### 1. 数据库准备

创建 PostgreSQL 数据库：
```sql
CREATE DATABASE compliance_audit;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE compliance_audit TO postgres;
```

### 2. 后端启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改数据库连接信息

# 初始化数据库（创建表和测试账号）
python init_db.py

# 启动 FastAPI 服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档：http://localhost:8000/docs

### 3. 启动 Celery 异步任务（可选）

```bash
# 启动 Celery Worker
celery -A app.celery_app worker --loglevel=info -Q notifications,exports

# 启动定时任务（可选，用于超时提醒）
celery -A app.celery_app beat --loglevel=info
```

### 4. 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问地址：http://localhost:3000

## 默认测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 全部权限 |
| auditor | auditor123 | 审计员 | 创建工单、复核 |
| handler | handler123 | 处理员 | 处理工单 |
| reviewer | reviewer123 | 复核员 | 复核工单 |

## API 接口说明

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户

### 工单接口
- `GET /api/orders` - 获取工单列表（支持筛选、分页）
- `GET /api/orders/{id}` - 获取工单详情
- `POST /api/orders` - 创建工单
- `PUT /api/orders/{id}` - 更新工单
- `POST /api/orders/{id}/process` - 处理工单（状态流转）
- `POST /api/orders/{id}/review-failed` - 复核不通过（记录受影响对象）
- `POST /api/orders/{id}/supplement` - 添加补充说明/调整负责人
- `GET /api/orders/{id}/records` - 获取处理记录

### 统计分析接口
- `GET /api/analytics/first-time-resolution` - 首次解决率统计
- `POST /api/analytics/export` - 导出工单数据（异步任务）
- `GET /api/analytics/export/{task_id}` - 查询导出任务状态

### 派工规则接口
- `GET /api/dispatch-rules` - 获取派工规则列表
- `POST /api/dispatch-rules` - 创建派工规则
- `PUT /api/dispatch-rules/{id}` - 更新派工规则
- `DELETE /api/dispatch-rules/{id}` - 删除派工规则

### 用户接口
- `GET /api/users` - 获取用户列表
- `GET /api/users/{id}` - 获取用户详情
- `PUT /api/users/{id}` - 更新用户信息

### 文件上传接口
- `POST /api/upload` - 上传文件

## 移动端访问

开发模式下：
- 桌面端：http://localhost:3000/orders
- 移动端：http://localhost:3000/m/orders

在手机上访问时，需要将 localhost 替换为电脑的局域网 IP 地址。

## 核心业务流程

### 正常流程
1. **创建工单**：审计员录入问题，填写工单状态、现场照片、派工规则、处理时限
2. **自动派工**：根据派工规则自动分配处理人，设定截止时间
3. **处理工单**：处理员收到通知，开始处理，上传处理凭证和备注
4. **提交复核**：处理完成后提交复核
5. **复核通过**：复核员确认无误，工单闭环
6. **复盘视图**：所有已闭环工单可在复盘视图中追溯

### 复核不通过流程
1. **复核不通过**：复核员标记复核不通过
2. **记录受影响对象**：系统提示记录受影响的对象（系统、设备、人员等）
3. **补充说明**：对应角色可以添加补充说明
4. **调整负责人**：支持重新指派负责人处理
5. **重新处理**：新的处理人重新处理后再次提交复核

## 关键特性

- ✅ **双端适配**：桌面端和移动端自动适配，可一键切换
- ✅ **状态追踪**：完整的状态流转记录，每一步操作都有迹可循
- ✅ **首次解决率**：统计首次处理即通过的比例，分析处理质量
- ✅ **受影响对象**：复核不通过时必须记录受影响对象，便于追溯
- ✅ **异步导出**：大数据量导出使用 Celery 异步处理，不阻塞前端
- ✅ **通知提醒**：工单状态变化时自动通知相关人员
- ✅ **超时提醒**：定时检查即将超时和已超时的工单

## 开发说明

### 数据库迁移

如需修改数据库模型：

```bash
# 首次初始化
alembic init migrations

# 生成迁移脚本
alembic revision --autogenerate -m "add xxx field"

# 执行迁移
alembic upgrade head
```

### 生产部署

后端推荐使用 Gunicorn + Nginx：
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

前端构建：
```bash
npm run build
# 将 dist 目录部署到静态服务器
```

## 许可证

MIT License
