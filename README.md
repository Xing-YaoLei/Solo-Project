
# 长租公寓退租验房排程台

面向长租公寓的退租验房流程管理系统，支持处理过程溯源和复盘结果反查。

## 技术栈

- **后端**: ASP.NET Core 8.0 + Entity Framework Core + SQL Server
- **前端**: React 18 + TypeScript + Vite + Ant Design 5
- **后台任务**: Hangfire
- **图表**: ECharts
- **状态管理**: Zustand

## 项目结构

```
MP0287/
├── src/
│   ├── Backend/                          # 后端 ASP.NET Core
│   │   ├── MoveOutInspection.sln         # 解决方案文件
│   │   ├── MoveOutInspection.Core/       # 核心领域模型、DTOs、接口
│   │   │   ├── Entities/                 # 实体类
│   │   │   ├── Enums/                    # 枚举类型
│   │   │   ├── DTOs/                     # 数据传输对象
│   │   │   └── Interfaces/               # 仓储和服务接口
│   │   ├── MoveOutInspection.Infrastructure/  # 基础设施层
│   │   │   ├── Data/                     # DbContext
│   │   │   ├── Repositories/             # 仓储实现
│   │   │   └── Services/                 # 业务服务
│   │   └── MoveOutInspection.Api/        # Web API
│   │       ├── Controllers/              # API 控制器
│   │       ├── Program.cs                # 应用入口
│   │       └── appsettings.json          # 配置文件
│   └── Frontend/                         # 前端 React 应用
│       ├── src/
│       │   ├── api/                      # API 请求封装
│       │   ├── components/               # 通用组件
│       │   ├── pages/                    # 页面组件
│       │   │   ├── desktop/              # 桌面端页面
│       │   │   └── mobile/               # 移动端页面
│       │   ├── store/                    # Zustand 状态管理
│       │   ├── types/                    # TypeScript 类型定义
│       │   ├── utils/                    # 工具函数
│       │   └── App.tsx                   # 路由配置
│       └── package.json
└── README.md
```

## 核心业务功能

### 业务视图
- **水电读数**: 抄录退租时水电表读数，计算用量和费用
- **验房清单**: 按标准清单完成验房，记录损坏情况和责任归属
- **收款流水**: 记录租金、押金退款、赔偿款等各类收付款
- **投诉标签**: 标记租客投诉历史，支持严重程度分级

### 时间线追踪
- 附件、备注、处理人变更沿时间线保存
- 支持回溯录入来源（SourceRecord）
- 复盘结果可反查关联业务记录

### 租金逾期处理
- 自动识别并记录租金逾期
- 记录所有受影响对象（员工、部门等）
- 被指派角色可补充说明
- 支持责任归属调整与审批流程

### 双端视图
- **移动端**: 待办任务处理，支持现场操作
- **桌面端**: 批量检索、数据导出、维修时长分析

## 快速开始

### 前置要求
- .NET 8.0 SDK
- Node.js >= 18
- SQL Server (LocalDB 或完整版)

### 启动后端

```bash
cd src/Backend/MoveOutInspection.Api
dotnet restore
dotnet run
```

后端将运行在 `http://localhost:5000`，Swagger 文档地址：`http://localhost:5000/swagger`

Hangfire 后台任务面板：`http://localhost:5000/hangfire`

### 启动前端

```bash
cd src/Frontend
npm install
npm run dev
```

前端将运行在 `http://localhost:5173`

### 数据库初始化

首次运行时会自动创建数据库并初始化种子数据（员工、公寓、租客、退租单、待办任务、验房模板等）。

## API 接口概览

| 模块 | 接口 | 说明 |
|------|------|------|
| 退租单 | GET/POST/PUT /api/moveoutorders | 退租单CRUD |
| 退租单 | GET /api/moveoutorders/export | 导出CSV |
| 水电读数 | GET/POST /api/moveoutorders/{id}/utilityreadings | 水电读数管理 |
| 验房 | GET/POST /api/moveoutorders/{id}/inspections | 验房记录管理 |
| 验房 | GET /api/moveoutorders/{id}/inspections/items | 获取验房清单项 |
| 收款 | GET/POST /api/moveoutorders/{id}/payments | 收款流水管理 |
| 投诉 | GET/POST /api/moveoutorders/{id}/complaints | 投诉标签管理 |
| 时间线 | GET/POST /api/moveoutorders/{id}/timeline | 时间线与备注 |
| 待办 | GET/POST/PUT /api/todotasks | 待办任务管理 |
| 待办 | PUT /api/todotasks/{id}/complete | 完成待办 |
| 员工 | GET /api/staff | 员工列表 |
| 逾期 | GET/POST /api/overdue | 租金逾期记录 |
| 逾期 | PUT /api/overdue/{id}/affected/{pid}/supplement | 补充说明 |
| 逾期 | POST /api/overdue/{id}/adjust-responsibility | 调整责任归属 |
| 分析 | GET /api/analysis/repair-duration | 维修时长统计 |
| 分析 | GET /api/analysis/repair-records | 维修记录列表 |
| 分析 | GET /api/analysis/dashboard-stats | 仪表盘统计 |
