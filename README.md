# 景区运营演出排期任务分派台

## 项目介绍

景区运营演出排期任务分派台是一套完整的景区演出运营管理系统，包含演出排期管理、任务分派、订单管理、赞助管理、票种规则、核销记录、退票争议处理、月底复盘等核心功能。

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript + Ant Design 5 + ECharts
- **后端**: NestJS 10 + TypeScript + Prisma ORM
- **数据库**: PostgreSQL 15
- **缓存/消息**: Redis 7
- **导出**: ExcelJS

## 项目结构

```
MP0385/
├── docker-compose.yml          # Docker 编排文件 (PostgreSQL + Redis)
├── backend/                     # 后端服务 (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma        # 数据模型
│   │   └── seed.ts              # 种子数据
│   ├── src/
│   │   ├── main.ts              # 入口文件
│   │   ├── app.module.ts        # 根模块
│   │   ├── prisma/              # Prisma 服务
│   │   ├── redis/               # Redis 服务
│   │   ├── performance/         # 演出排期模块
│   │   ├── task/                # 任务分派模块
│   │   ├── order/               # 订单模块（含变更记录）
│   │   ├── sponsor/             # 赞助管理模块
│   │   ├── ticket/              # 票种规则模块
│   │   ├── verification/        # 核销记录模块
│   │   ├── dispute/             # 退票争议模块
│   │   ├── record/              # 记录页模块（三合一）
│   │   ├── system-log/          # 系统日志模块
│   │   ├── notification/        # 通知模块
│   │   ├── export/              # 导出模块
│   │   ├── review/              # 月底复盘模块
│   │   └── user/                # 用户模块
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env
└── frontend/                    # 前端服务 (Next.js)
    ├── src/
    │   ├── app/                 # App Router 页面
    │   │   ├── page.tsx         # 首页
    │   │   ├── layout.tsx       # 根布局
    │   │   ├── globals.css      # 全局样式
    │   │   ├── performances/    # 演出排期
    │   │   ├── tasks/           # 任务分派台
    │   │   ├── records/         # 记录页
    │   │   ├── orders/          # 订单管理
    │   │   ├── sponsors/        # 赞助管理
    │   │   ├── tickets/         # 票种规则
    │   │   ├── verifications/   # 核销记录
    │   │   ├── disputes/        # 退票争议
    │   │   ├── system-logs/     # 系统日志
    │   │   └── review/          # 月底复盘
    │   ├── components/          # 公共组件
    │   ├── services/            # API 服务
    │   └── utils/               # 工具函数
    ├── package.json
    ├── tsconfig.json
    └── next.config.js
```

## 核心功能

### 1. 演出排期管理
- 演出排期的增删改查
- 支持按时间范围、关键词搜索
- 演出详情包含票种、赞助商、任务等关联信息

### 2. 任务分派台
- 看板视图展示（待处理/进行中/已完成）
- 任务的创建、编辑、删除
- 任务分派给指定人员
- 任务状态流转
- 优先级标识（高/中/低）

### 3. 记录页（三合一）
- **赞助清单**: 赞助商列表、统计数据、支持导出
- **核销记录**: 核销记录列表、统计数据、支持导出
- **票种规则**: 票种列表、售票统计、规则详情

### 4. 订单管理
- 订单的增删改查
- **订单变更记录**: 记录每次修改的字段，保留前后值
- 订单状态流转（待支付→已支付→已核销/退票申请）
- 订单详情包含变更历史、核销记录、争议记录

### 5. 退票争议处理
- 争议的发起、分派、处理、关闭
- **争议日志时间线**: 完整记录争议处理过程（原因、动作、关闭时间）
- 多角色通知：争议发起时通知运营经理和财务
- 处理人分配和处理记录添加

### 6. 系统日志
- 全模块操作日志记录
- 支持按模块、动作、时间范围筛选
- 记录操作人、操作描述、关联实体

### 7. 月底核销效率复盘
- 月度核销数据汇总
- 各演出核销效率对比
- **每日核销趋势图** (柱状图+折线图)
- **核销员效率排行榜**
- 售票率、核销率统计
- **支持导出 Excel**，导出文件包含：
  - 筛选条件
  - 生成时间
  - 操作人
  - 数据明细

### 8. 通知系统
- 基于 Redis Pub/Sub 的实时通知
- 任务分派通知
- 退票争议通知
- 未读消息统计

## 快速启动

### 1. 启动数据库和 Redis

```bash
docker-compose up -d
```

### 2. 启动后端服务

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

后端服务将在 `http://localhost:3001/api` 启动

### 3. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## 数据模型说明

### 核心实体
- **User (用户)**: 系统用户，支持多种角色
- **PerformanceSchedule (演出排期)**: 演出计划
- **PerformanceTask (演出任务)**: 演出相关任务分派
- **TaskChangeLog (任务变更日志)**: 任务修改记录
- **Sponsor (赞助商)**: 演出赞助商
- **TicketType (票种)**: 票种规则和定价
- **Order (订单)**: 购票订单
- **OrderChangeLog (订单变更日志)**: 订单修改记录（保留前后值）
- **VerificationRecord (核销记录)**: 门票核销记录
- **RefundDispute (退票争议)**: 退票争议工单
- **DisputeLog (争议日志)**: 争议处理记录
- **Notification (通知)**: 系统通知消息
- **SystemLog (系统日志)**: 全系统操作日志
- **ExportRecord (导出记录)**: 数据导出历史

### 角色说明
- `ADMIN`: 系统管理员
- `OPERATION_MANAGER`: 运营经理
- `TICKET_STAFF`: 售票/检票人员
- `FINANCE`: 财务人员
- `SPONSOR_CONTACT`: 赞助联络人
- `PERFORMER`: 演出人员

## API 接口

### 演出排期
- `GET /api/performances` - 获取演出列表
- `GET /api/performances/:id` - 获取演出详情
- `POST /api/performances` - 创建演出
- `PUT /api/performances/:id` - 更新演出
- `DELETE /api/performances/:id` - 删除演出

### 任务分派
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/board/:scheduleId` - 获取任务看板
- `GET /api/tasks/:id` - 获取任务详情
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `PUT /api/tasks/:id/assign` - 分派任务
- `PUT /api/tasks/:id/status` - 更新任务状态

### 记录页
- `GET /api/records/schedule/:scheduleId` - 获取演出记录（赞助+核销+票种）
- `GET /api/records/overview` - 获取记录概览

### 订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `GET /api/orders/:id/change-logs` - 获取订单变更记录
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单
- `PUT /api/orders/:id/status` - 更新订单状态

### 退票争议
- `GET /api/disputes` - 获取争议列表
- `GET /api/disputes/stats` - 获取争议统计
- `GET /api/disputes/:id` - 获取争议详情
- `GET /api/disputes/:id/logs` - 获取争议日志
- `POST /api/disputes` - 发起争议
- `PUT /api/disputes/:id/assign` - 分派处理人
- `PUT /api/disputes/:id/resolve` - 处理争议
- `PUT /api/disputes/:id/close` - 关闭争议

### 月底复盘
- `GET /api/reviews/monthly` - 获取月度复盘数据
- `GET /api/reviews/trend` - 获取趋势数据

### 导出
- `POST /api/exports/verifications` - 导出核销记录
- `POST /api/exports/sponsors` - 导出赞助清单
- `POST /api/exports/review` - 导出月底复盘

## 导出文件说明

所有导出的 Excel 文件包含以下信息：
1. **数据明细** - 完整的业务数据
2. **筛选条件** - 导出时的筛选参数
3. **生成时间** - 文件生成的精确时间
4. **操作人** - 执行导出操作的用户

## 注意事项

1. 系统已内置种子数据，启动后可直接体验
2. 默认管理员 ID 为 1，用于演示操作
3. 生产环境请配置真实的用户认证系统
4. Redis 用于实时通知和缓存，未配置也可正常使用主要功能
