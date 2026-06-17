# 家装工地设计变更任务分派台

用于整理家装设计变更流程的全栈管理系统，把线下补充说明收回到系统记录里，支持批量操作与逐条复查，材料延期独立管理，原始记录与处理痕迹可互相对应。

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **后端**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + Passport.js

## 功能特性

### 核心业务
- **设计变更任务分派台** - 看板/列表双视图，按状态分列管理
- **变更单全流程管理** - 草稿→待审核→设计师审批→业主审批→施工→待验收→已验收
- **材料延期独立管理** - 不混在普通状态里，独立状态流转和记录
- **验收照片核对** - 照片上传、审核、复检全流程
- **工人签到** - 签到/签退、工种、位置记录
- **售后工单** - 售后问题跟踪处理

### 特色功能
- **批量操作** - 支持批量状态变更、批量分配，操作后可逐条复查
- **线下补充说明收回** - 评论/补充说明可标记为线下收回，有据可查
- **操作日志** - 所有操作记录，原始记录与处理痕迹互相对应
- **统计分析** - 工期偏差、成本增加、材料延期统计，可下钻到具体单据

### 角色权限
| 角色 | 说明 |
|------|------|
| 业主 (OWNER) | 查看项目、审批变更单、验收、查看统计 |
| 设计师 (DESIGNER) | 创建设计变更、审核设计方案、上传设计图 |
| 工长 (FOREMAN) | 执行施工、上传验收照片、工人签到管理 |
| 监理 (SUPERVISOR) | 全程监督、质量验收、进度跟踪 |

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14
- Redis >= 7

### 1. 启动数据库

```bash
docker-compose up -d
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`（已在 server 目录下创建）：

```bash
cd apps/server
cp .env.example .env
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充种子数据
npm run seed
```

### 5. 启动开发服务

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server  # 后端: http://localhost:3001
npm run dev:web     # 前端: http://localhost:3000
```

### 6. 访问系统

- 前端地址: http://localhost:3000
- API 文档: http://localhost:3001/api/docs

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 业主 | owner@test.com | 123456 |
| 设计师 | designer@test.com | 123456 |
| 工长 | foreman@test.com | 123456 |
| 监理 | supervisor@test.com | 123456 |

## 项目结构

```
.
├── apps/
│   ├── server/                 # NestJS 后端
│   │   ├── src/
│   │   │   ├── auth/           # 认证模块
│   │   │   ├── users/          # 用户管理
│   │   │   ├── projects/       # 项目管理
│   │   │   ├── change-orders/  # 设计变更单
│   │   │   ├── material-delays/ # 材料延期
│   │   │   ├── acceptance-photos/ # 验收照片
│   │   │   ├── worker-checkins/  # 工人签到
│   │   │   ├── after-sales/    # 售后工单
│   │   │   ├── batch-operations/ # 批量操作
│   │   │   ├── statistics/     # 统计分析
│   │   │   ├── operation-logs/ # 操作日志
│   │   │   ├── prisma/         # Prisma 服务
│   │   │   └── redis/          # Redis 服务
│   │   └── prisma/
│   │       ├── schema.prisma   # 数据模型
│   │       └── seed.ts         # 种子数据
│   └── web/                    # Next.js 前端
│       ├── app/                # App Router 页面
│       │   ├── change-orders/  # 设计变更单
│       │   ├── material-delays/ # 材料延期
│       │   ├── acceptance/     # 验收照片
│       │   ├── checkins/       # 工人签到
│       │   ├── after-sales/    # 售后工单
│       │   └── statistics/     # 统计分析
│       ├── components/         # 组件
│       │   ├── ui/             # 基础 UI 组件
│       │   └── Layout/         # 布局组件
│       ├── lib/                # 工具库
│       └── types/              # 类型定义
├── docker-compose.yml          # Docker 编排
└── package.json                # 根 package
```

## 数据模型

核心数据模型：

- **User** - 用户（业主/设计师/工长/监理）
- **Project** - 家装项目
- **DesignChangeOrder** - 设计变更单（核心）
- **ChangeStatusLog** - 变更单状态历史
- **MaterialDelay** - 材料延期（独立实体）
- **MaterialDelayLog** - 材料延期状态历史
- **AcceptancePhoto** - 验收照片
- **WorkerCheckin** - 工人签到
- **AfterSalesTicket** - 售后工单
- **Comment** - 评论/补充说明
- **Attachment** - 附件
- **OperationLog** - 操作日志
- **BatchOperation** - 批量操作
- **ProjectStat** - 项目统计

## API 概览

| 模块 | 接口前缀 | 说明 |
|------|----------|------|
| 认证 | /api/auth | 登录、获取用户信息 |
| 用户 | /api/users | 用户 CRUD |
| 项目 | /api/projects | 项目 CRUD |
| 设计变更单 | /api/change-orders | 变更单 CRUD、状态流转 |
| 材料延期 | /api/material-delays | 材料延期管理 |
| 验收照片 | /api/acceptance-photos | 照片上传审核 |
| 工人签到 | /api/worker-checkins | 签到管理 |
| 售后工单 | /api/after-sales | 工单管理 |
| 批量操作 | /api/batch-operations | 批量处理 |
| 统计 | /api/statistics | 统计数据 |
| 操作日志 | /api/operation-logs | 日志查询 |

完整 API 文档请访问: http://localhost:3001/api/docs

## 开发说明

### 后端开发

```bash
cd apps/server
npm run start:dev
```

### 前端开发

```bash
cd apps/web
npm run dev
```

### 数据库操作

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建新迁移
npm run prisma:migrate -- --name migration_name

# 打开 Prisma Studio
npm run prisma:studio
```

## License

MIT
