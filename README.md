# 长租公寓维修派单任务分派台

一个完整的长租公寓维修派单管理系统，包含从派单录入到关闭的全链路管理。

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **后端**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis

## 项目结构

```
.
├── backend/          # 后端服务 (NestJS)
│   ├── prisma/        # Prisma 数据模型和种子数据
│   └── src/           # 源码
│       ├── repair-order/    # 维修派单模块
│       ├── material/      # 材料管理模块
│       ├── repair-person/ # 维修人员模块
│       ├── statistics/   # 统计汇总模块
│       ├── route-plan/   # 路线计划模块
│       ├── prisma/      # Prisma 服务
│       └── redis/       # Redis 服务
└── frontend/         # 前端应用 (Next.js)
    ├── components/   # React 组件
    ├── pages/        # Next.js 页面
    ├── services/     # API 服务
    ├── store/       # 状态管理
    ├── types/       # TypeScript 类型定义
    ├── lib/         # 工具函数
    └── styles/      # 全局样式
```

## 核心功能

### 1. 派单全链路管理
- 派单录入、分派、处理、完成、关闭全流程
- 状态流转：待分派 → 已分派 → 处理中 → 待补料/复核中 → 已完成 → 已关闭

### 2. 单据详情同屏展示
- **签收凭证**：客户签名、现场照片、备注
- **延误原因**：延误类型、详情、时长
- **路线计划**：起点终点、计划/实际时间、距离

### 3. 处理区一体化
- 常用材料快速添加
- 状态操作（开始处理、完成、待补料、复核、关闭

### 4. 历史追溯
- 完整的状态流转记录
- 关闭后仍可查看历史

### 5. 统计汇总
- **准时率**：整体准时完成率统计
- **来源渠道**：电话、APP、微信、上门、巡检
- **责任人**：按维修人员统计绩效
- **复盘标签**：准时、延误、质量、服务等标签
- **延误分析**：延误原因分布和时长统计

## 快速开始

### 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 启动开发服务器
npm run start:dev
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## API 文档

启动后端服务后，访问 Swagger 文档：
http://localhost:3001/api

## 状态说明

| 状态 | 说明 |
|------|------|
| 待分派 | 新创建的派单，等待分派维修人员 |
| 已分派 | 已分派给维修人员，等待出发 |
| 处理中 | 维修人员正在处理 |
| 待补料 | 缺少材料，等待补充 |
| 复核中 | 完成后等待质量复核 |
| 已完成 | 维修已完成 |
| 已关闭 | 单据已关闭，不可再操作 |

## 延误原因

- 交通拥堵
- 材料短缺
- 上一任务超时
- 人员问题
- 天气原因
- 其他原因

## 复盘标签

- 准时完成
- 存在延误
- 质量优秀
- 待改进
- 客户投诉
- 服务优秀
