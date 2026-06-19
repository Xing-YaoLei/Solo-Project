# 旅游民宿保洁排班任务分派台

基于 Next.js + NestJS + Prisma + PostgreSQL + Redis 构建的民宿保洁排班与任务分派管理系统。

## 功能特性

### 🏠 核心功能
- **记录台（三栏同屏）**：同时展示房源日历、保洁任务、入住证件，一目了然
- **保洁任务管理**：任务创建、分派、状态流转、进度跟踪
- **押金管理**：押金收取、退还、扣款，**所有变更保留前后值审计日志**
- **入住证件**：证件登记、查看、管理
- **月底复盘**：保洁准时率统计、完成率分析、房源排行
- **漏单处理**：自动检测漏单、多角色通知、处理闭环
- **操作日志**：记录所有操作的原因、动作、关闭时间，可追溯

### 🔔 通知系统
- 漏单自动检测（每小时检查）
- 支持按角色批量通知
- Redis 消息队列实时推送

### 📊 导出功能
- 导出文件包含**筛选口径、生成时间、操作者**信息
- 支持按月导出保洁报表

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + TypeScript + Tailwind CSS |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 缓存/消息 | Redis + Bull |
| API 文档 | Swagger/OpenAPI |

## 项目结构

```
MP0370/
├── frontend/                 # Next.js 前端
│   ├── src/
│   │   ├── pages/            # 页面
│   │   │   ├── index.tsx     # 记录台（三栏同屏）
│   │   │   ├── tasks.tsx     # 保洁任务
│   │   │   ├── deposits.tsx  # 押金管理
│   │   │   ├── documents.tsx # 入住证件
│   │   │   ├── reports.tsx   # 月底复盘
│   │   │   ├── logs.tsx      # 操作日志
│   │   │   └── missed-orders.tsx  # 漏单处理
│   │   ├── components/       # 组件
│   │   ├── utils/            # 工具函数
│   │   └── styles/           # 样式
│   └── package.json
│
├── backend/                  # NestJS 后端
│   ├── src/
│   │   ├── records/          # 记录页统一接口
│   │   ├── properties/       # 房源模块
│   │   ├── cleaning-tasks/   # 保洁任务模块
│   │   ├── deposits/         # 押金模块（含审计日志）
│   │   ├── checkin-documents/ # 入住证件模块
│   │   ├── notifications/    # 通知模块
│   │   ├── system-logs/      # 系统日志模块
│   │   ├── reports/          # 报表模块
│   │   ├── missed-orders/    # 漏单模块
│   │   ├── users/            # 用户模块
│   │   ├── prisma/           # Prisma 服务
│   │   ├── redis/            # Redis 服务
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma     # 数据库 schema
│   └── package.json
│
├── docker-compose.yml        # PostgreSQL + Redis
└── package.json              # 根项目配置
```

## 快速开始

### 前置要求
- Node.js >= 18
- Docker & Docker Compose（或本地安装 PostgreSQL 和 Redis）

### 1. 启动数据库和 Redis

```bash
docker-compose up -d
```

### 2. 安装依赖

```bash
# 根目录（可选，用于 concurrently 同时启动前后端）
npm install

# 后端
cd backend && npm install

# 前端
cd frontend && npm install
```

### 3. 初始化数据库

```bash
cd backend

# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate
```

### 4. 启动服务

```bash
# 方式一：根目录同时启动前后端
npm run dev

# 方式二：分别启动
# 后端 (端口 3001)
cd backend && npm run start:dev

# 前端 (端口 3000)
cd frontend && npm run dev
```

### 5. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001/api
- API 文档：http://localhost:3001/api/docs

## 核心 API

### 记录台
- `GET /api/records/view` - 获取记录页三栏数据
- `GET /api/records/property/:id/timeline` - 房源时间线

### 保洁任务
- `GET /api/cleaning-tasks` - 任务列表
- `POST /api/cleaning-tasks` - 创建任务
- `PUT /api/cleaning-tasks/:id/status` - 更新任务状态
- `PUT /api/cleaning-tasks/:id/assign` - 分派任务

### 押金管理
- `GET /api/deposits` - 押金列表
- `PUT /api/deposits/:id` - 更新押金（自动记录审计日志）
- `GET /api/deposits/:id/audit-logs` - 押金变更审计记录

### 报表导出
- `GET /api/reports/monthly` - 月度报表
- `POST /api/reports/export/monthly` - 导出月度报表（含筛选口径、生成时间、操作者）

### 漏单处理
- `GET /api/missed-orders` - 漏单列表
- `PUT /api/missed-orders/:id/resolve` - 处理漏单

### 系统日志
- `GET /api/system-logs` - 日志列表（分页）
- `PUT /api/system-logs/:id/close` - 关闭日志

## 数据模型

主要实体：
- **User** - 用户（管理员、经理、保洁员、前台）
- **Property** - 房源
- **Booking** - 预订/入住
- **CleaningTask** - 保洁任务
- **Deposit** - 押金
- **DepositAuditLog** - 押金变更审计日志（保留前后值）
- **CheckinDocument** - 入住证件
- **Notification** - 通知
- **SystemLog** - 系统日志（原因、动作、关闭时间）
- **MissedOrder** - 漏单记录

## 漏单检测机制

1. 每小时定时扫描超时未完成的保洁任务
2. 自动标记为漏单并创建漏单记录
3. 通知管理员和经理角色
4. 通过 Redis 发布实时消息
5. 支持手动处理和关闭漏单

## 审计日志

押金明细变更时，自动记录：
- 变更字段名
- **变更前的值**
- **变更后的值**
- 操作人
- 变更原因
- 变更时间

## 导出文件格式

导出的 JSON 文件包含：
- `reportType` - 报表类型
- `title` - 报表标题
- `filters` - **筛选口径**（日期范围、房源、状态等）
- `generatedAt` - **生成时间**
- `operator` - **操作者**（ID 和姓名）
- `totalCount` - 数据总数
- `data` - 详细数据
