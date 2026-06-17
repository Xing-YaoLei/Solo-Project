# 家装工地量房报价排程台

基于 ASP.NET Core + React + SQL Server + Hangfire 的家装工程管理平台，用于整理量房报价流程，避免靠群消息确认最新状态。

## 🏗️ 技术栈

### 后端
- **ASP.NET Core 9.0** - Web API 框架
- **Entity Framework Core 9.0** - ORM
- **SQL Server** - 关系型数据库
- **ASP.NET Core Identity** - 用户认证与授权
- **JWT Bearer Authentication** - Token 认证
- **Hangfire** - 后台任务调度
- **AutoMapper** - 对象映射
- **Swagger / OpenAPI** - API 文档

### 前端
- **React 18** + **TypeScript** - 前端框架
- **Vite** - 构建工具
- **Ant Design 5** - UI 组件库
- **React Query (TanStack Query)** - 数据状态管理
- **Zustand** - 全局状态管理
- **React Router 6** - 路由管理
- **Axios** - HTTP 客户端
- **Day.js** - 日期处理

## ✨ 核心功能

### 1. 单据管理
- 支持多种单据类型：量房单、报价单、变更单、材料单、付款申请、竣工验收
- 单据明细逐条录入，支持关联材料库
- 批量调整状态、逐条复核、补附件统一管理
- 完整的变更历史记录，处理前后的材料、结论和来源可追溯

### 2. 金额一致性检测
- 自动检测预期金额与实际金额不一致
- 支持单独筛选金额不一致的单据
- 金额差异高亮显示，差异百分比计算
- 手动/自动金额校验机制

### 3. 审批工作流
- 多级审批节点（监理审核 → 设计师确认）
- 审批/拒绝操作带意见留痕
- 审批超时自动提醒（Hangfire 后台任务）
- 审批状态实时更新

### 4. 角色权限管理
- **业主 (Owner)** - 查看项目、单据、支付记录
- **设计师 (Designer)** - 创建/编辑项目、单据、材料，参与审批
- **工长 (Foreman)** - 查看项目、创建单据、上传附件
- **监理 (Supervisor)** - 全功能访问、审批、批量操作、统计分析

### 5. 支付流水管理
- 支付记录与项目、单据关联
- 支付状态跟踪（待付、已付、部分、逾期、退款）
- 支付流水完整记录

### 6. 统计分析
- 数据概览仪表盘
- 回款周期统计（可追溯到具体单据）
- 项目绩效分析
- 金额不一致异常报表

### 7. 后台任务 (Hangfire)
- 每小时自动检测金额一致性
- 每日 9:00 发送审批提醒
- 每日 0:00 更新支付逾期状态

## 📁 项目结构

```
MP0307/
├── src/
│   ├── backend/
│   │   └── HomeImprovementPlatform.API/
│   │       ├── Controllers/          # API 控制器
│   │       ├── DTOs/                 # 数据传输对象
│   │       ├── Data/                 # EF Core DbContext
│   │       ├── Models/               # 数据库实体模型
│   │       ├── Enums/                # 枚举定义
│   │       ├── Services/             # 业务逻辑服务
│   │       ├── Mappings/             # AutoMapper 配置
│   │       ├── Helpers/              # 辅助类
│   │       └── Program.cs            # 应用入口
│   └── frontend/
│       ├── src/
│       │   ├── api/                  # API 服务层
│       │   ├── types/                # TypeScript 类型定义
│       │   ├── store/                # Zustand 状态管理
│       │   ├── router/               # 路由配置
│       │   ├── layouts/              # 布局组件
│       │   ├── pages/                # 页面组件
│       │   ├── config/               # 配置文件
│       │   └── main.tsx              # 应用入口
│       ├── vite.config.ts            # Vite 配置
│       └── package.json
└── HomeImprovementPlatform.sln       # 解决方案文件
```

## 🚀 快速开始

### 前置条件
- .NET 9.0 SDK
- Node.js 26+
- SQL Server (LocalDB 或完整版)

### 数据库配置

修改 `src/backend/HomeImprovementPlatform.API/appsettings.json` 中的连接字符串：

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HomeImprovementPlatform;Trusted_Connection=True;TrustServerCertificate=True;",
  "HangfireConnection": "Server=(localdb)\\mssqllocaldb;Database=HomeImprovementPlatform;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### 后端启动

```bash
cd src/backend/HomeImprovementPlatform.API

# 还原依赖
dotnet restore

# 创建数据库迁移
dotnet ef migrations add InitialCreate

# 应用数据库迁移
dotnet ef database update

# 启动后端服务
dotnet run
```

后端将运行在 `http://localhost:5000`

- API 文档: `http://localhost:5000/swagger`
- Hangfire 控制台: `http://localhost:5000/hangfire`

### 前端启动

```bash
cd src/frontend

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev
```

前端将运行在 `http://localhost:5173`，所有 `/api/*` 请求将自动代理到后端。

## 🔐 默认用户角色

| 角色 | 权限 |
|------|------|
| Owner (业主) | 查看项目、单据、支付记录 |
| Designer (设计师) | 项目/单据/材料 CRUD，参与审批 |
| Foreman (工长) | 查看项目，创建单据，上传附件 |
| Supervisor (监理) | 完整权限，审批，批量操作，统计 |

## 📋 核心实体关系

```
Project (项目)
├── Owner (业主)
├── Designer (设计师)
├── Foreman (工长)
├── Supervisor (监理)
├── Documents (单据)
│   ├── DocumentItems (单据明细)
│   │   └── Material (关联材料)
│   ├── ApprovalNodes (审批节点)
│   ├── Attachments (附件)
│   └── DocumentHistories (变更历史)
├── PaymentRecords (支付记录)
└── ScheduleTasks (排程任务)
```

## 🧪 测试 API

使用 Swagger UI (`http://localhost:5000/swagger`) 或 `HomeImprovementPlatform.API.http` 文件测试 API。

### 注册新用户

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "designer@example.com",
  "password": "123456",
  "fullName": "张设计师",
  "phoneNumber": "13800138000",
  "role": 1
}
```

### 登录获取 Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "designer@example.com",
  "password": "123456"
}
```

## 🎯 业务流程示例

1. **创建设计师账号** → 登录系统
2. **创建新项目** → 分配业主、设计师、工长、监理
3. **创建量房单** → 录入量房明细，上传量房图纸
4. **提交审批** → 监理审核 → 设计师确认
5. **创建报价单** → 关联材料库，自动计算金额
6. **金额校验** → 系统自动检测金额一致性
7. **创建支付记录** → 跟踪回款进度
8. **查看统计** → 分析回款周期、项目绩效

## 🔧 Hangfire 后台任务

- **check-amount-consistency** - 每小时检测金额一致性
- **send-approval-reminders** - 每日 9:00 发送审批超时提醒
- **update-payment-status** - 每日 0:00 更新支付逾期状态

## 🛡️ 安全特性

- JWT Token 认证，无状态会话
- 基于角色的访问控制 (RBAC)
- 密码哈希存储 (ASP.NET Core Identity)
- CORS 策略配置
- 敏感操作审计日志

## 📊 特色功能详解

### 金额不一致检测

系统自动检测单据的预期金额与实际金额差异：
- `AmountConsistencyStatus` 枚举标识状态
- 支持按状态筛选单据
- 变更历史完整记录金额调整过程
- 统计页面单独展示金额异常列表

### 数据可追溯性

每次操作都记录：
- 操作人、操作时间
- 变更前后的值（JSON 序列化）
- 材料清单变更前后对比
- 处理结论和数据来源
- 状态变更轨迹

## 📝 许可证

MIT License
