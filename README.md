# 跑腿物品核验任务分派台

基于 **Next.js 14 (App Router) + NestJS + Prisma + PostgreSQL + Redis** 搭建的本地跑腿物品核验任务分派管理系统。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS | App Router、React Query、Recharts 图表、Zustand 状态管理 |
| 后端 | NestJS 10 + TypeScript | RESTful API、JWT 认证、Passport、Swagger 文档 |
| ORM | Prisma 5 | 类型安全的数据库访问 |
| 数据库 | PostgreSQL 15 | 主数据存储 |
| 缓存 | Redis 7 | 统计数据缓存、热点数据加速 |
| 部署 | Docker Compose | 一键启动本地数据库与 Redis |

## 功能模块

### 🎯 日常处理入口（按节奏排列）
1. **核验照片** → 上传取件、物品、送达照片
2. **评价标签** → 正/负面标签选择 + 订单地址核对
3. **轨迹追踪** → 骑手轨迹点补录确认、地图回放
4. **补贴核算** → 里程/天气/夜间/特殊补贴规则计算发放

### 👥 骑手管理
- 骑手档案、车辆信息、身份证
- 实时在线状态（离线/空闲/配送中/休息）
- 评分、累计订单、工作时长统计

### 📊 管理层看板（活跃趋势）
- 近 7/14/30/90 天订单量面积图
- 骑手个人趋势对比折线图
- 任务状态分布饼图
- 人均工作时长柱状图
- 骑手排行榜 Top 10

### ⚠️ 物品损坏处理
- **风险等级**突出显示（低/中/高/极高）
- **处理页左右分栏**：
  - 左侧：多方即时沟通记录聊天窗（按角色配色）
  - 右侧：复核结论提交区（通过/重审 + 结论 + 建议）
- 损失金额、赔偿金额、责任人跟踪

## 快速开始

### 前置条件
- Node.js ≥ 18.17
- pnpm ≥ 8
- Docker（用于 PostgreSQL + Redis）

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动数据库服务
```bash
docker compose up -d
```
> 检查状态：`docker compose ps`
>
> PostgreSQL：`localhost:5432` | Redis：`localhost:6379`

### 3. 初始化数据库
```bash
# 生成 Prisma Client
pnpm prisma:generate

# 执行数据库迁移
pnpm prisma:migrate -- --name init

# 插入测试数据（含 5 种角色账号 + 15 任务 + 3 损坏 + 30 天活跃记录）
pnpm prisma:seed
```

### 4. 启动开发环境
```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:api    # 后端：http://localhost:3001
pnpm dev:web    # 前端：http://localhost:3000
```

### 5. 访问地址
| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | 主应用入口 |
| 后端 API | http://localhost:3001 | REST API |
| Swagger 文档 | http://localhost:3001/api | API 在线调试 |

## 测试账号

默认密码均为 `123456`，登录页提供快捷切换。

| 用户名 | 角色 | 权限说明 |
|--------|------|----------|
| `admin` | 系统管理员 | 全部权限 |
| `manager` | 管理层 | 查看骑手活跃趋势看板、损坏复核 |
| `dispatcher` | 调度员 | 任务分派台主入口、创建/分派任务 |
| `verifier` | 核验员 | 核验照片/标签/地址、轨迹确认、补贴核算 |
| `rider001` ~ `rider003` | 骑手 | 骑手端示例账号 |

## 项目结构

```
MP0430/
├── apps/
│   ├── api/                          # NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 数据模型
│   │   │   └── seed.ts               # 测试数据
│   │   └── src/
│   │       ├── auth/                 # JWT 认证
│   │       ├── user/                 # 用户管理
│   │       ├── rider/                # 骑手管理
│   │       ├── task/                 # 核验任务（核心业务）
│   │       ├── damage/               # 损坏处理
│   │       ├── dashboard/            # 管理层看板
│   │       ├── prisma/               # Prisma Service
│   │       ├── redis/                # Redis Service
│   │       └── common/               # 公共装饰器
│   └── web/                          # Next.js 前端
│       └── src/
│           ├── app/
│           │   ├── login/             # 登录页
│           │   ├── tasks/             # 核验任务（列表 + 详情）
│           │   ├── riders/            # 骑手管理（列表 + 详情）
│           │   ├── damages/           # 损坏处理（列表 + 详情）
│           │   ├── dashboard/         # 活跃趋势看板
│           │   └── page.tsx           # 分派工作台首页
│           ├── components/            # 布局组件（AppLayout、AuthGuard）
│           ├── lib/                   # API 封装、工具函数
│           └── store/                 # Zustand 状态（Auth）
├── docker-compose.yml                 # PG + Redis
├── pnpm-workspace.yaml
└── package.json
```

## 数据模型核心

```
User ──────┐
           ▼
RiderProfile 1──N VerificationTask 1──1 DamageReport
                │                         │
                ├── N TaskStepLog        ├── N DamageCommunication
                ├── N RiderTrack         └── N DamageReview
                └── 1 SubsidyRecord
```

关键枚举：
- `TaskStatus`：PENDING → ASSIGNED → IN_PROGRESS → VERIFIED → COMPLETED / DAMAGED
- `VerificationStep`：PHOTO_UPLOADED → TAG_REVIEWED → ADDRESS_CHECKED → TRACKING_CONFIRMED → SUBSIDY_APPLIED
- `RiskLevel`：LOW / MEDIUM / HIGH / CRITICAL（损坏风险）
- `DamageStatus`：REPORTED → COMMUNICATING → REVIEW_CONFIRMED → RESOLVED

## 常用命令

```bash
pnpm install                      # 安装依赖
pnpm dev                          # 全栈开发
pnpm build                        # 全栈生产构建
pnpm build:api && pnpm build:web  # 分别构建
pnpm prisma:generate              # 生成 Prisma Client
pnpm prisma:migrate               # 执行迁移
pnpm prisma:seed                  # 填充测试数据
```
