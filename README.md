# 旅游民宿房态管理任务分派台 (RMS Platform)

一个基于 Next.js + NestJS + Prisma + PostgreSQL + Redis 的全栈民宿房态管理系统。

## 技术栈

### 后端
- **NestJS** - 企业级 Node.js 框架
- **Prisma** - 下一代 ORM
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和会话存储
- **JWT** - 身份认证
- **Passport** - 认证策略
- **Swagger** - API 文档

### 前端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **TailwindCSS** - 样式框架
- **Zustand** - 状态管理
- **Axios** - HTTP 客户端
- **Recharts** - 数据可视化
- **Lucide React** - 图标库

## 项目结构

```
MP0365/
├── apps/
│   ├── backend/              # NestJS 后端
│   │   ├── prisma/           # Prisma schema 和 seed
│   │   └── src/
│   │       ├── auth/         # 认证模块
│   │       ├── prisma/       # Prisma 服务
│   │       ├── redis/        # Redis 服务
│   │       ├── users/        # 用户管理
│   │       ├── properties/   # 房源管理
│   │       ├── calendar/     # 房源日历
│   │       ├── orders/       # 渠道订单
│   │       ├── cleaning/     # 保洁任务
│   │       ├── documents/    # 入住证件
│   │       ├── deposits/     # 押金明细
│   │       ├── conflicts/    # 房态冲突
│   │       ├── reports/      # 报表分析
│   │       ├── dashboard/    # 仪表盘
│   │       └── main.ts
│   └── frontend/             # Next.js 前端
│       └── src/
│           ├── pages/        # 页面路由
│           ├── components/   # 组件
│           ├── store/        # 状态管理
│           ├── lib/          # 工具函数
│           └── styles/       # 样式
├── package.json
└── .env.example
```

## 功能模块

### 1. 任务分派台 (首页)
按日常处理节奏排列：
- 房源日历 → 渠道订单 → 保洁任务 → 入住证件 → 押金明细 → 房态冲突
- 今日待办任务列表
- 快速统计卡片
- 高风险冲突高亮提醒

### 2. 房源日历
- 日历视图展示所有房间状态
- 房态：可用/占用/清洁中/维护中/锁定
- 价格管理
- 批量设置房态

### 3. 渠道订单
- 多渠道订单管理（Airbnb、Booking、美团、携程等）
- 订单状态流转：待确认 → 已确认 → 已入住 → 已退房
- 客人信息管理
- 房态冲突检查

### 4. 保洁任务
- 任务分派和跟踪
- 优先级管理
- 保洁人员分配
- 状态流转：待分配 → 已分配 → 进行中 → 已完成 → 已检查

### 5. 入住证件
- 证件上传和审核
- 证件类型管理
- 审核流程：待审核 → 已验证 / 已拒绝

### 6. 押金明细
- 押金收取记录
- 退还管理
- 扣除管理
- 状态：待支付 → 已支付 → 已退还 / 部分退还 / 已扣除

### 7. 房态冲突
- 冲突自动检测和记录
- **高风险冲突高亮显示**（紧急/高风险红色高亮 + 动画）
- **沟通过程**（实时聊天式沟通记录）
- **复核意见**（管理层审批和意见）
- 风险等级：低/中/高/紧急

### 8. 报表分析 (管理层专属)
- 入住率趋势图
- 渠道分布分析
- 收入报表
- 房型表现分析

### 9. 用户与权限
- 三级角色：系统管理员 / 运营经理 / 一线人员
- 数据隔离：一线人员只能看到自己的任务范围
- 管理层可看所有数据和报表

## 快速开始

### 前置要求
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd apps/backend && npm install

# 安装前端依赖
cd apps/frontend && npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example apps/backend/.env

# 编辑数据库连接等配置
```

### 初始化数据库

```bash
# 生成 Prisma Client
cd apps/backend
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 填充测试数据
npx prisma db seed
```

### 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd apps/backend
npm run start:dev

# 启动前端 (端口 3000)
cd apps/frontend
npm run dev
```

或者使用根目录命令同时启动：

```bash
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api
- API 文档: http://localhost:3001/api/docs

### 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | password123 | 系统管理员 | 所有权限 |
| manager | password123 | 运营经理 | 运营管理 + 报表 |
| frontline1 | password123 | 一线人员 | 前台组 |
| frontline2 | password123 | 一线人员 | 保洁组 |

## 设计特点

### 日常处理节奏
入口按日常处理节奏排布：
1. **房源日历** - 先看房态，了解整体情况
2. **渠道订单** - 核对订单，处理入住退房
3. **保洁任务** - 安排和跟进清洁工作
4. **入住证件** - 后续追踪证件审核
5. **押金明细** - 管理押金收支
6. **房态冲突** - 处理异常情况

### 高风险冲突处理
- 列表中高风险记录通过左侧红色边框 + 背景色突出显示
- 紧急级别带脉冲动画效果
- 详情页保留完整沟通过程
- 管理层可添加复核意见

### 权限隔离
- **管理层**: 查看所有数据、报表分析、用户管理
- **一线人员**: 只进入自己的处理范围，只能操作分配给自己的任务
- 后端通过 RolesGuard 进行接口级权限校验
- 前端通过菜单过滤和路由保护实现页面级控制

## 开发说明

### 后端开发
```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建新迁移
npx prisma migrate dev --name <migration-name>

# 查看数据库
npm run prisma:studio
```

### API 规范
- 所有接口前缀: `/api`
- 认证方式: Bearer Token
- 分页参数: `page`, `pageSize`
- 统一响应格式

## License

MIT
