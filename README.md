# Auto Repair Collaboration Platform

汽车维修报价协同台 - 基于 SvelteKit、tRPC、Drizzle、PostgreSQL 和 Lucia Auth 的全栈应用。

## 技术栈

- **前端框架**: SvelteKit ^2.0
- **语言**: TypeScript ^5.4
- **API 协议**: tRPC ^11
- **ORM**: Drizzle ORM ^0.30
- **数据库**: PostgreSQL ^16
- **认证**: Lucia Auth ^3.0
- **验证**: Zod ^3.22
- **样式**: Tailwind CSS ^3.4
- **图表**: Chart.js ^4.4
- **图标**: Lucide Svelte

## 功能模块

### 管理人员功能
- 报价单字典管理（维修项目分类、工时定价、配件价格库）
- 质检照片规则配置
- 车辆档案阈值设置

### 一线人员功能
- 诊断结果录入
- 工单项目选择与报价生成
- 配件缺货上报

### 负责人功能
- 缺货待办处理
- 补录/重试/关闭操作
- 完整处理轨迹记录

### 分析功能
- 多维度组合查询（状态、日期、区域、负责人）
- 返修率趋势分析
- 原因分布、区域对比、技师排行

## 项目结构

```
src/
├── lib/
│   ├── components/          # UI 组件
│   ├── stores/              # Svelte stores
│   ├── trpc/                # tRPC 客户端
│   └── server/
│       ├── auth/            # Lucia Auth 配置
│       ├── db/              # Drizzle ORM 配置与 Schema
│       └── trpc/            # tRPC 服务端路由
├── routes/                  # SvelteKit 页面路由
├── hooks.server.ts          # 服务端 hooks
├── app.css                  # 全局样式
└── app.d.ts                 # 类型定义
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置数据库连接。

### 3. 初始化数据库

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173

## 演示账号

- 管理员: `admin` / `admin123`
- 一线人员: `tech01` / `tech123`

## 设计风格

- 工业深色主题
- 主色: #165DFF (工业蓝)
- 强调色: #FF7D00 (警示橙)
- 字体: Space Grotesk (标题) + Inter (正文) + JetBrains Mono (数字)
