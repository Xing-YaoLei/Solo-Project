# 长租公寓房源上架任务分派台

基于 Next.js、NestJS、Prisma、PostgreSQL 和 Redis 构建的长租公寓管理系统，沉淀长租公寓的房源上架数据，承接真实业务流程。

## 技术栈

### 前端
- **Next.js 14** - React 框架，App Router
- **TypeScript** - 类型安全
- **TailwindCSS** - 样式框架
- **Zustand** - 状态管理
- **Axios** - HTTP 客户端
- **Recharts** - 图表库
- **Radix UI** - 无样式组件库
- **Lucide React** - 图标库
- **Sonner** - Toast 提示

### 后端
- **NestJS** - Node.js 企业级框架
- **Prisma** - ORM
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和会话管理
- **JWT** - 身份认证
- **Passport.js** - 认证策略
- **Swagger** - API 文档

### 工程化
- **Turborepo** - Monorepo 构建工具
- **pnpm** - 包管理器
- **ESLint** - 代码检查

## 项目结构

```
MP0285/
├── apps/
│   ├── api/              # NestJS 后端服务
│   │   └── src/
│   │       ├── auth/           # 认证模块
│   │       ├── users/          # 用户模块
│   │       ├── properties/     # 房源模块
│   │       ├── tenants/        # 租客模块
│   │       ├── contracts/      # 合同模块
│   │       ├── maintenance/    # 维修模块
│   │       ├── utilities/      # 水电模块
│   │       ├── tasks/          # 任务模块
│   │       ├── finance/        # 财务模块
│   │       ├── reports/        # 报表模块
│   │       ├── prisma/         # Prisma 服务
│   │       └── redis/          # Redis 服务
│   └── web/              # Next.js 前端应用
│       └── src/
│           ├── app/            # App Router 页面
│           ├── components/     # 组件
│           ├── lib/            # 工具库
│           ├── stores/         # 状态管理
│           └── styles/         # 样式
├── packages/
│   └── db/               # 共享 Prisma 包
│       ├── prisma/
│       │   └── schema.prisma   # 数据模型
│       └── src/
│           ├── index.ts        # Prisma 客户端导出
│           └── seed.ts         # 种子数据
├── package.json
├── turbo.json
└── tsconfig.json
```

## 核心功能

### 🏠 任务分派台
- **操作区**：房源照片、租客档案、合同版本、补充材料、处理记录
- **侧边配置**：维修记录配置、水电读数留痕、常用筛选、快速操作、操作日志
- **任务池**：全部任务、逾期池、待处理、进行中、已完成
- **任务操作**：完成、驳回、重新提交、重新分派

### 💰 租金逾期处理
- 租金逾期自动进入待办池
- 支持补充材料
- 支持驳回重提
- 支持重新分派给其他负责人
- 逾期提醒和通知

### 📊 数据报表
- **出租率报表**：按区域、按负责人下钻分析
- **任务报表**：任务类型分布、负责人完成率
- **收入报表**：收入类型分布、收支对比
- **维修报表**：维修员工作量、维修成本

### 👥 多角色视图
- **租客视图**：查看个人合同、缴费记录、维修申请
- **管家视图**：房源管理、租客管理、合同管理
- **维修员视图**：维修工单、维修记录
- **财务视图**：收支记录、租金管理、财务报表
- **一线处理视图**：水电抄表、现场巡检

### 🏘️ 房源管理
- 房源信息管理（基本信息、照片、配置）
- 房源状态流转（空置、上架中、已出租、维修中、已下架）
- 房源照片管理（上传、排序、封面设置）
- 房源筛选（区域、价格、户型、状态）

### 👤 租客档案
- 租客基本信息管理
- 证件资料管理
- 紧急联系人
- 租住历史

### 📝 合同管理
- 合同版本管理
- 合同续签/终止
- 合同条款配置
- 合同状态流转

### 🔧 维修管理
- 维修记录管理
- 工单分派
- 维修进度跟踪
- 维修成本统计

### 💧 水电读数
- 水电燃气抄表
- 用量统计
- 读数留痕（照片）
- 历史趋势

### 💵 财务管理
- 收支记录
- 租金管理
- 押金管理
- 逾期提醒

## 数据模型

### 核心实体
- **User** - 用户（多角色）
- **Property** - 房源
- **PropertyPhoto** - 房源照片
- **Tenant** - 租客
- **Contract** - 合同
- **ContractAmendment** - 合同变更记录
- **MaintenanceRecord** - 维修记录
- **MaintenanceWorkOrder** - 维修工单
- **UtilityReading** - 水电读数
- **Task** - 任务
- **TaskComment** - 任务评论
- **TaskAuditLog** - 任务审计日志
- **FinanceRecord** - 财务记录
- **PropertyFilter** - 房源筛选配置
- **ReportSnapshot** - 报表快照

## 快速开始

### 前置要求
- Node.js >= 18
- pnpm >= 9
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖

```bash
# 安装 pnpm (如果没有)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

环境变量说明：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rental_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

### 启动数据库

使用 Docker 启动 PostgreSQL 和 Redis（可选）：

```bash
# PostgreSQL
docker run -d --name rental-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rental_db postgres:14

# Redis
docker run -d --name rental-redis -p 6379:6379 redis:7
```

### 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库 schema
pnpm db:push

# 填充种子数据
pnpm db:seed
```

### 启动开发服务

```bash
# 同时启动前后端
pnpm dev

# 或者分别启动
pnpm --filter @rental/api dev
pnpm --filter @rental/web dev
```

### 访问应用

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:4000
- **API 文档**: http://localhost:4000/api/docs

### 默认账号

种子数据中包含以下测试账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 系统管理员 | admin@rental.com | 123456 |
| 管家 | manager@rental.com | 123456 |
| 维修员 | worker@rental.com | 123456 |
| 财务 | finance@rental.com | 123456 |
| 一线处理 | frontline@rental.com | 123456 |
| 租客 | tenant@rental.com | 123456 |

## 常用命令

```bash
# 开发模式
pnpm dev

# 构建所有包
pnpm build

# 代码检查
pnpm lint

# 数据库操作
pnpm db:generate     # 生成 Prisma Client
pnpm db:push         # 推送 schema 到数据库
pnpm db:migrate      # 创建并运行迁移
pnpm db:seed         # 填充种子数据
```

## 业务流程

### 房源上架流程
1. 创建房源信息
2. 上传房源照片
3. 提交上架审核
4. 生成上架任务
5. 审核通过 / 驳回
6. 房源状态更新为上架中

### 租金逾期处理流程
1. 系统检测租金逾期
2. 自动生成逾期任务进入待办池
3. 负责人处理：
   - 联系租客催缴
   - 补充材料（沟通记录等）
   - 完成处理（租金已收）
   - 驳回（需要重新处理）
   - 重新分派给其他负责人
4. 任务闭环

### 维修流程
1. 创建维修记录
2. 创建维修工单
3. 分派维修员
4. 维修员处理
5. 标记完成并记录费用
6. 生成财务记录

### 水电抄表流程
1. 一线人员现场抄表
2. 录入读数和照片
3. 系统自动计算用量
4. 生成费用记录
5. 关联租客账单

## Redis 缓存策略

- **用户任务计数**：缓存每个用户的待办任务数（1 天过期）
- **仪表盘数据**：缓存仪表盘汇总数据（5 分钟过期）
- **热点数据**：房源详情、租客信息等高频访问数据
- **会话管理**：支持分布式会话

## 安全特性

- JWT 身份认证
- 基于角色的访问控制（RBAC）
- 密码哈希（bcrypt）
- 请求参数校验（class-validator）
- CORS 配置
- SQL 注入防护（Prisma 参数化查询）

## 开发说明

### 添加新的 API 端点

1. 在对应模块的 service 中添加方法
2. 在 controller 中添加路由
3. 在前端 api.ts 中添加对应调用函数

### 添加新页面

1. 在 `src/app/` 下创建对应的目录和 `page.tsx`
2. 在 Sidebar 中添加导航链接
3. 在对应模块中实现业务逻辑

### 数据库迁移

```bash
# 创建迁移
pnpm --filter @rental/db db:migrate --name migration_name

# 部署到生产
pnpm --filter @rental/db db:migrate deploy
```

## 部署建议

### 生产环境部署
- 使用 Docker 容器化部署
- PostgreSQL 使用主从复制
- Redis 使用哨兵或集群模式
- 前端使用 Vercel 或自建 CDN
- 后端使用 PM2 或 Kubernetes

### 性能优化
- 数据库索引优化
- Redis 缓存热点数据
- 图片使用 CDN 和缩略图
- 接口分页和按需加载
- 前端代码分割和懒加载

## License

MIT
