# 活动票务 / 演出票务任务分派台

解决活动票务里演出票务交接慢、记录散的问题。

> 技术底座：**Next.js + NestJS + Prisma + PostgreSQL + Redis**

## ✨ 核心能力

| 模块 | 说明 |
| --- | --- |
| 🏷️ 票种规则 | 票价、库存、限购、售卖状态全流程状态留痕 |
| 🛒 购票订单 | 从创建 → 支付 → 确认 → 完成/退款/争议的生命周期管理，状态变更永久记录可回看 |
| 💺 座位图 | 分区可视化座位管理，支持锁定/释放/维护，防止超售冲突 |
| 🎟️ 签到核销 | 签到码验证 + 入场核销，扫码枪友好，实时核销效率看板 |
| 🤝 赞助清单 | 冠名/金/银/铜等多级赞助管理，合同、联系人、权益记录 |
| 🚨 异常处理 | 退票争议、重复支付、座位冲突等异常单闭环处理，明确影响范围、责任归属、处理结果 |
| 📊 报表导出 | 核销效率/订单/销售/异常四大报表，**自带口径说明 Sheet**，团队对数据理解一致 |
| 📈 仪表盘 | 全局 KPI 看板，票种销售、订单状态、异常进度一目了然 |

## 🗂️ 项目结构

```
MP0405/
├── apps/
│   ├── web/                 # Next.js 14 前端 (App Router, Tailwind)
│   │   └── src/app/
│   │       ├── page.tsx              # 运营总览仪表盘
│   │       ├── ticket-types/         # 票种规则管理 + 状态历史
│   │       ├── orders/               # 订单列表 + 详情 + 新建 + 状态流
│   │       ├── seats/                # 可视化座位图
│   │       ├── check-in/             # 签到核销台
│   │       ├── sponsors/             # 赞助清单
│   │       ├── exceptions/           # 异常处理台 (退票争议等)
│   │       └── exports/              # 报表导出中心 (带口径说明)
│   └── api/                 # NestJS 后端 API
│       └── src/
│           ├── common/
│           │   ├── prisma/           # PrismaService
│           │   ├── redis/            # Redis 缓存服务 (优雅降级)
│           │   └── status-history/   # 状态变更历史服务
│           └── modules/
│               ├── activity/         # 活动
│               ├── ticket-type/      # 票种
│               ├── order/            # 订单 + 支付 + 状态流转
│               ├── seat/             # 座位图
│               ├── check-in/         # 签到码核销
│               ├── sponsor/          # 赞助
│               ├── exception/        # 异常单 (争议/冲突)
│               ├── export/           # 报表导出 (含口径说明)
│               └── dashboard/        # 仪表盘聚合
├── packages/
│   └── prisma/              # Prisma Schema + 枚举标签 + 种子数据
│       └── prisma/
│           ├── schema.prisma        # 所有数据模型
│           └── seed.ts              # 示例数据 (音乐节)
├── package.json             # Monorepo Workspaces 根
└── .env.example             # 环境变量模板
```

## 🚀 快速启动

### 1. 环境准备

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Redis ≥ 6 (可选，未启动时自动降级为内存/无缓存)

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，修改数据库连接
```

### 3. 安装依赖

```bash
npm install
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 Schema 到数据库 (非生产环境)
npm run db:push

# 写入示例数据 (音乐节 + 票种/订单/签到码/异常单)
npm run db:seed
```

### 5. 启动服务

```bash
# 终端 1: 启动后端 API (端口 3001)
npm run dev:api

# 终端 2: 启动前端 Web (端口 3000)
npm run dev:web
```

访问：
- 前端管理台：http://localhost:3000
- 后端 API：http://localhost:3001/api
- Swagger 文档：http://localhost:3001/api/docs

## 🧩 关键设计说明

### 🔄 状态变更历史（可回看）

所有关键状态变更（票种、订单）均通过 `StatusHistoryService` 写入 `status_histories` 表：
- 记录 `fromStatus → toStatus`
- 变更操作人、时间戳、原因、备注、扩展元数据
- 前端订单详情 / 票种详情页以「时间线」形式展示，可审计追溯

### ⚠️ 异常单闭环（退票争议等）

`ExceptionRecord` 模型覆盖：
- **类型**：退票争议 / 重复支付 / 座位冲突 / 核销异常 / 系统错误 / 其他
- **影响范围**：文本描述 + 结构化 `affectedOrders` / `affectedSeats`
- **责任归属**：客户 / 平台 / 场馆 / 主办方 / 第三方 / 待确认，附判定说明
- **生命周期**：OPEN → INVESTIGATING → PENDING_RESPONSE → RESOLVED → CLOSED，支持 ESCALATED 升级
- **解决方案**：`resolution`（定性）+ `resolutionDetail`（结构化）+ `handlingResult`（处理结果）

### 📋 报表口径说明（团队沟通友好）

每次导出的 Excel 首 Sheet 为「口径说明」，覆盖：
- 核销率 = 已核销 / 总发放，取值范围定义
- 已支付订单 = 状态 ∈ {PAID, CONFIRMED, COMPLETED}
- 各时间范围以什么字段（paidAt / createdAt）过滤
- 异常单处理周期计算方式等

支持导出类型：核销效率 / 订单明细 / 销售统计 / 异常单

### 🔐 Redis 优雅降级

`RedisService` 连接失败不阻断服务，全部 `get/set` 方法在未连接时安全跳过，不影响核心功能。

## 📌 数据模型速览

核心实体关系：
- **Activity** 1:N **TicketType** 1:N **OrderItem** ⊂ **Order**
- **SeatMap** 1:N **Seat** 1:1 **OrderItem**
- **Order** 1:N **CheckInCode**（支付后自动生成）
- **Order** 1:N **RefundRecord**，可关联 **ExceptionRecord**
- **Activity** 1:N **Sponsor** / **ExceptionRecord** / **StatusHistory**

详见 [schema.prisma](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0405/packages/prisma/prisma/schema.prisma)

## 📦 Monorepo 脚本

```bash
# 前端
npm run dev:web          # Next.js 开发模式
# 后端
npm run dev:api          # NestJS 开发模式
# 数据库
npm run db:generate      # Prisma Client 生成
npm run db:push          # Schema 推送 (开发用)
npm run db:seed          # 种子数据
# 全量构建
npm run build
```
