# 家装工地客户确认任务分派台

基于 Next.js + NestJS + Prisma + PostgreSQL + Redis 的全栈家装工地客户确认管理系统。

## 功能特性

### 核心业务
- **四种确认类型**：节点验收、设计变更、材料替换、增项报价
- **完整确认流程**：提交 → 分派 → 业主确认 → 归档
- **版本管理**：确认内容、报价都有完整的版本历史
- **图片资料**：施工前后图片对比，支持多图上传
- **沟通记录**：任务关联的聊天备注，全程留痕

### 角色权限
- 👷 **工长**：更新现场进度，提交确认任务
- 🎨 **设计师**：补充方案说明，更新设计内容
- 🔍 **监理**：负责关闭争议
- 📋 **项目经理**：分派任务，跟进逾期
- 👤 **业主**：确认/拒绝任务，提出争议
- ⚙️ **管理员**：全部权限

### 智能提醒
- 业主逾期未确认自动提醒项目经理跟进
- 资料缺失时提醒补图
- 任务分派通知
- 争议开启通知

### 数据报表
- 确认耗时统计（按任务类型）
- 返工原因统计
- 未确认金额统计
- 项目维度统计

## 技术栈

### 前端
- **Next.js 14** - React 框架 (App Router)
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Hook Form** - 表单处理
- **SWR** - 数据请求
- **Lucide React** - 图标库
- **Recharts** - 图表库

### 后端
- **NestJS 10** - Node.js 框架
- **Prisma 5** - ORM
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存 + 消息队列
- **Bull** - 任务队列
- **JWT** - 身份认证
- **Swagger** - API 文档

## 项目结构

```
.
├── frontend/              # Next.js 前端
│   ├── app/               # 页面路由
│   │   ├── login/         # 登录注册
│   │   ├── dashboard/     # 工作台
│   │   ├── tasks/         # 任务管理
│   │   ├── projects/      # 项目管理
│   │   ├── reports/       # 数据报表
│   │   └── reminders/     # 提醒中心
│   ├── components/        # React 组件
│   └── lib/               # 工具库
├── backend/               # NestJS 后端
│   ├── src/
│   │   ├── common/        # 公共模块
│   │   │   ├── prisma/    # Prisma 服务
│   │   │   ├── redis/     # Redis 缓存
│   │   │   ├── bull/      # Bull 队列
│   │   │   ├── decorators/
│   │   │   └── dto/
│   │   └── modules/       # 业务模块
│   │       ├── auth/      # 认证
│   │       ├── user/      # 用户
│   │       ├── project/   # 项目
│   │       ├── confirmation-task/    # 确认任务
│   │       ├── confirmation-version/ # 版本管理
│   │       ├── chat/      # 聊天备注
│   │       ├── dispute/   # 争议处理
│   │       ├── reminder/  # 提醒系统
│   │       └── report/    # 报表统计
│   └── prisma/
│       ├── schema.prisma  # 数据模型
│       └── seed.ts        # 种子数据
├── docker-compose.yml     # 开发环境
└── package.json           # Monorepo 配置
```

## 快速开始

### 环境要求
- Node.js >= 18
- Docker & Docker Compose
- npm >= 9

### 1. 启动数据库和 Redis

```bash
docker-compose up -d
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 3. 初始化数据库

```bash
cd backend

# 生成 Prisma Client
npx prisma generate

# 推送数据库 schema
npx prisma db push

# 导入种子数据
npm run seed
```

### 4. 启动开发服务

```bash
# 启动后端 (端口 3001)
cd backend && npm run start:dev

# 启动前端 (端口 3000)
cd frontend && npm run dev
```

或者使用根目录命令同时启动：

```bash
npm run dev
```

### 5. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api
- API 文档: http://localhost:3001/api/docs

### 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | 123456 |
| 项目经理 | chenweiming@example.com | 123456 |
| 工长 | lijianguo@example.com | 123456 |
| 设计师 | wangxiaoya@example.com | 123456 |
| 监理 | zhaoziqiang@example.com | 123456 |
| 业主 | zhangmingyuan@example.com | 123456 |

## 数据模型

### 核心实体

- **User** - 用户（6种角色）
- **Project** - 家装项目
- **ConfirmationTask** - 确认任务（4种类型）
- **ConfirmationVersion** - 确认版本历史
- **QuoteVersion** - 报价版本历史
- **TaskImage** - 任务图片
- **ChatMessage** - 聊天备注
- **Dispute** - 争议记录
- **Reminder** - 提醒消息
- **Report** - 报表数据

## 主要 API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/profile` - 获取当前用户信息

### 任务
- `GET /api/confirmation-tasks` - 获取任务列表
- `GET /api/confirmation-tasks/:id` - 获取任务详情
- `POST /api/confirmation-tasks` - 创建任务
- `PUT /api/confirmation-tasks/:id` - 更新任务
- `PATCH /api/confirmation-tasks/:id/status` - 更新任务状态
- `POST /api/confirmation-tasks/:id/assign` - 分派任务

### 其他
- `GET /api/projects` - 项目列表
- `GET /api/chat/tasks/:taskId` - 聊天记录
- `POST /api/chat` - 发送消息
- `GET /api/reminders` - 提醒列表
- `GET /api/reports/*` - 各类报表

## 开发说明

### 环境变量

后端环境变量参考 `backend/.env.example`
前端环境变量参考 `frontend/.env.example`

### 常用命令

```bash
# 数据库操作
npm run db:push      # 推送 schema
npm run db:generate  # 生成 Prisma Client

# 代码检查
npm run lint

# 构建
npm run build
```

## License

MIT
