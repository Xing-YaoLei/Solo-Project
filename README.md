# 合规审计制度检查排程台 (Compliance Audit Management System)

基于 **ASP.NET Core + React + SQL Server + Hangfire** 的合规审计与制度检查全流程管理系统。

> 解决审计检查流程中处理记录散落在表格和聊天记录里的问题，实现排程、抽样、检查、整改、证据处理的全链路数字化。

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | ASP.NET Core Web API | .NET 9.0 |
| ORM | Entity Framework Core | 9.0 |
| 数据库 | SQL Server | 2019+ |
| 身份认证 | ASP.NET Core Identity + JWT | 9.0 |
| 后台任务 | Hangfire + SQL Server Storage | 1.8.14 |
| 前端框架 | React + TypeScript | 18.x |
| 构建工具 | Vite | 5.x |
| UI组件库 | Ant Design (antd) | 5.x |
| 图表 | @ant-design/plots | 2.x |
| 路由 | react-router-dom | 6.x |
| 状态管理 | Zustand | 5.x |
| HTTP 客户端 | Axios | 1.x |

---

## 目录结构

```
MP0467/
├── src/
│   ├── ComplianceAudit.API/               # ASP.NET Core Web API 层
│   │   ├── Controllers/                   # 所有业务控制器
│   │   │   ├── AuthController.cs          # 登录/注册/用户
│   │   │   ├── DashboardController.cs     # 排程台看板
│   │   │   ├── SchedulesController.cs     # 检查排程 CRUD + 工作流
│   │   │   ├── ChecklistController.cs     # 检查清单 + 批量
│   │   │   ├── SamplingController.cs      # 抽样记录 + 批量
│   │   │   ├── CheckRecordsController.cs  # 检查记录 + 复核
│   │   │   ├── RectificationsController.cs# 整改计划
│   │   │   ├── EvidenceMissingController.cs# 证据缺失独立处理
│   │   │   ├── EvidencesController.cs     # 附件/证据上传
│   │   │   ├── RegulationsController.cs   # 制度库 & 检查模板
│   │   │   └── StatisticsController.cs    # 统计分析 + 抽样覆盖
│   │   ├── DTOs/                          # 数据传输对象
│   │   ├── Program.cs                     # 启动入口 + Hangfire
│   │   └── appsettings.json               # SQL Server / JWT 配置
│   │
│   ├── ComplianceAudit.Core/              # 领域核心层
│   │   ├── Entities/                      # 12 个核心实体
│   │   │   ├── ApplicationUser.cs         # 用户 + 4种角色
│   │   │   ├── Regulation.cs              # 制度库
│   │   │   ├── AuditSchedule.cs           # 审计排程（核心）
│   │   │   ├── ChecklistTemplate*.cs      # 检查清单模板
│   │   │   ├── ChecklistItem.cs           # 检查项
│   │   │   ├── SamplingRecord.cs          # 抽样记录
│   │   │   ├── CheckRecord.cs             # 检查记录（含来源引用）
│   │   │   ├── Rectification.cs           # 整改计划
│   │   │   ├── Evidence.cs                # 附件/证据
│   │   │   ├── EvidenceMissingRecord.cs   # 证据缺失独立记录
│   │   │   ├── ProcessingHistory.cs       # 处理历史 + 溯源
│   │   │   └── AuditLog.cs                # 审计日志
│   │   ├── Enums/                         # 枚举（角色/状态/风险/频率）
│   │   └── Interfaces/                    # 仓储 & 业务服务接口
│   │
│   ├── ComplianceAudit.Infrastructure/    # 基础设施层
│   │   ├── Data/ApplicationDbContext.cs   # EF Core 配置 + 索引
│   │   ├── Repositories/                  # 泛型仓储 & UoW
│   │   ├── Services/                      # 8 个业务服务实现
│   │   ├── Hangfire/HangfireJobs.cs       # 定时作业 + 调度器
│   │   └── DependencyInjection.cs         # DI 注入配置
│   │
│   └── ComplianceAudit.Web/               # React 前端 (Vite)
│       ├── src/
│       │   ├── pages/                     # 业务页面 (7个)
│       │   │   ├── Login.tsx              # 登录/注册
│       │   │   ├── Dashboard.tsx          # 排程台看板（图表+统计）
│       │   │   ├── Schedules.tsx          # 排程列表+批量操作
│       │   │   ├── ScheduleDetail.tsx     # 排程详情（6个Tab，少跳页）
│       │   │   ├── Rectifications.tsx     # 整改计划
│       │   │   ├── EvidenceMissing.tsx    # 证据缺失处理
│       │   │   ├── Statistics.tsx         # 统计分析+抽样覆盖穿透
│       │   │   └── DocumentTrace.tsx      # 单据追溯
│       │   ├── layouts/MainLayout.tsx     # 主布局（面包屑+菜单）
│       │   ├── store/authStore.ts         # Zustand 权限状态
│       │   ├── services/api.ts            # Axios + 所有API封装
│       │   ├── router/index.tsx           # 路由+守卫
│       │   └── types/index.ts             # 100+ TS 类型定义
│       └── package.json
│
├── tests/ComplianceAudit.Tests/           # 测试 (预留)
└── ComplianceAudit.sln                    # VS 解决方案
```

---

## 核心业务能力

### 1. 排程台看板（首页）
- 8 个统计卡片（待处理/进行中/待复核/证据缺失/逾期整改/合规率…）
- 排程状态分布柱状图 + 风险等级饼图
- 最新排程列表 + 合规完成度仪表盘

### 2. 检查排程（Schedules）
- 创建排程：关联制度、审计员、业务负责人、周期、风险等级
- **批量操作栏**：多选后批量提交复核 / 批量复核 / 批量关闭（少跳页面）
- 排程工作流：待处理 → 开始 → 进行中 → 提交 → 复核通过 → 关闭

### 3. 排程详情页（ScheduleDetail · 6 合 1 Tab，少跳页）
| Tab | 功能 |
|-----|------|
| 总览 | 关键进度指标 + 检查清单概览 + 最近处理历史时间线 |
| **检查清单** | + 多选批量更新状态 + 单条录入抽屉 + 附件管理 + 缺证据一键登记 |
| **抽样记录** | + 批量新增（一次加多条）+ 批量改状态 + 关联跳转 |
| **检查记录** | + 批量复核 + 每条：提交/复核/附件/缺证据/**溯源查看** |
| **整改计划** | 创建/更新/提交/验证整改 → 少弹窗 |
| **证据缺失处理** | 独立的证据缺失列表（来源留痕） |

> 设计亮点：所有动作（录入、附件、历史、缺证据）**均在抽屉/弹窗内**，不需要离开排程页。

### 4. 整改计划（Rectifications）
- 未开始/整改中/待复核/已验证/已逾期 5 状态追踪
- 5 张状态卡片 + 筛选 + 负责人筛选 + 只看分配给我
- 每条可提交复核 / 验证 / 关闭

### 5. 证据缺失处理（EvidenceMissing）
- **独立处理记录**（EvidenceMissingRecord），每条都有独立编号
- 完整 5 状态：缺失 → 请求补充 → 业务补充 → 合规官审核 → 完整/豁免
- 每项保留处理历史（溯源）和补充的附件

### 6. 统计分析（Statistics）
- 四大核心指标卡 + 排程状态饼图 + 制度合规率柱状图
- 整改玫瑰图 + **抽样覆盖表**（点击排程 → 弹窗显示：
  - 总单据数 / 抽样数 / 覆盖率
  - 按类型明细 + **已抽样单据号标签**（可点击跳单据追溯）
- 审计员绩效表（仅管理层可见）

### 7. 单据追溯（DocumentTrace）
- 输入任意单据号（PO/INV/PAY 等），一键查全生命周期
- 4 张统计卡 + 关联检查记录表（合规/风险/证据/状态）
- **完整时间线**（抽样 → 检查 → 每次处理动作），处理人、时间、备注、来源引用全留痕

---

## 权限模型（4 角色）

```csharp
public enum AuditRole {
  Auditor = 1,          // 审计员：排程、抽样、检查、录结果、提交、请求补证据
  BusinessOwner = 2,    // 业务负责人：整改、补充证据
  ComplianceOfficer = 3,// 合规官：复核排程、复核检查记录、审核证据、验证整改
  Management = 4        // 管理层：关闭排程、豁免证据、查看绩效、全权限
}
```

API 策略：
- `[Authorize(Policy = "RequireAuditor")]` → 角色 1/3/4
- `[Authorize(Policy = "RequireBusinessOwner")]` → 角色 2/3/4
- `[Authorize(Policy = "RequireComplianceOfficer")]` → 角色 3/4
- `[Authorize(Policy = "RequireManagement")]` → 角色 4

前端 `useRolePermissions()` 控制按钮显示。

---

## 溯源能力

所有业务操作都写入 `ProcessingHistory` 表：

| 字段 | 作用 |
|------|------|
| `EntityType + EntityId` | 关联到任何业务记录 |
| `ActionType` | Created/Updated/Submitted/Reviewed/Waived... |
| `FromStatus → ToStatus` | 前后状态对比，一目了然 |
| `OperatorId + OperatorRole` | 操作人 + 角色 |
| `BatchId` | 批量操作共用同 BatchId，可追踪哪一批 |
| `SourceReference` | 如 `ChecklistItem/123`，点击即可反查来源 |

单据追溯页就是基于 `ProcessingHistory` + 聚合查询实现。

---

## Hangfire 定时作业（`HangfireJobScheduler`）

| Job | Cron | 作用 |
|-----|------|------|
| `check-overdue-rectifications` | 每小时 | 扫描逾期整改，自动标记 `Overdue` |
| `generate-daily-digest` | 每日 08:00 | 生成每日摘要（可扩展邮件） |
| `archive-closed-schedules` | 每周日 02:00 | 归档已关闭排程 |
| `send-pending-reminders` | 每日 09:00 | 发送待办提醒 |

Hangfire 看板地址：`http://localhost:5000/hangfire`
（账号 `admin` / 密码 `Hangfire@Admin123`，生产请必改）

---

## 快速开始

### 前置条件
- .NET 9 SDK
- Node.js 18+ （推荐 20+）
- SQL Server 2019+ （或 LocalDB 开发）
- 可选：SQL Server Management Studio

### 1. 配置数据库

编辑 `src/ComplianceAudit.API/appsettings.json`：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ComplianceAuditDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
  }
}
```

### 2. 初始化数据库 & 迁移

```bash
cd src/ComplianceAudit.API
dotnet ef migrations add InitialCreate --project ../ComplianceAudit.Infrastructure/ComplianceAudit.Infrastructure --startup-project .
dotnet ef database update --project ../ComplianceAudit.Infrastructure/ComplianceAudit.Infrastructure --startup-project .
```

> 或在 Package Manager Console 执行 `Update-Database`。

### 3. 启动后端

```bash
cd src/ComplianceAudit.API
dotnet run            # 默认 http://localhost:5000
```

启动成功后可访问：
- **Swagger UI**：http://localhost:5000/swagger
- **Hangfire Dashboard**：http://localhost:5000/hangfire

### 4. 启动前端

```bash
cd src/ComplianceAudit.Web
npm install           # 首次
npm run dev           # 默认 http://localhost:5173
```

Vite 已配置反代 `/api` → `http://localhost:5000`，直接打开前端即可使用。

### 5. 初始化账号

注册页注册即可（4 种角色可选），示例：
- 审计员 `auditor@demo.com` / `Auditor@123`
- 业务负责人 `biz@demo.com` / `Business@123`
- 合规官 `compliance@demo.com` / `Compliance@123`
- 管理层 `admin@demo.com` / `Admin@1234`

---

## 常用 API 速查

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，获取 JWT |
| GET  | `/api/dashboard/stats` | 看板统计 |
| GET/POST/PUT/DELETE | `/api/schedules` | 排程 CRUD |
| POST | `/api/schedules/{id}/start/submit/close` | 工作流动作 |
| POST | `/api/schedules/review` | 合规官复核 |
| GET  | `/api/checklist/schedule/{id}` | 某排程检查清单 |
| POST | `/api/checklist/bulk-update-status` | 批量更新（少跳页核心） |
| POST | `/api/sampling` | 批量新增抽样 |
| POST | `/api/checkrecords/bulk-update-status` | 批量复核 |
| POST | `/api/evidencemissing` | 登记证据缺失（独立记录） |
| GET  | `/api/statistics/sampling-coverage/{id}` | 抽样覆盖详情 |
| GET  | `/api/statistics/document-trace/{no}` | 单据追溯查询 |

---

## 设计亮点总结

✅ **少跳页面**：排程详情页 6 Tab，录入/附件/历史都用 Drawer + Modal  
✅ **批量处理**：检查项、抽样、检查记录均有多选 + 批量改状态，统一 BatchId 溯源  
✅ **证据缺失独立处理**：`EvidenceMissingRecord` 一记录一编号，状态机完整  
✅ **处理前后留痕**：`ProcessingHistory` 记录所有状态变更 + 操作人  
✅ **来源可查**：`SourceReference` 字段 + 单据追溯页，点击穿透到原始记录  
✅ **4 角色权限**：审计员/业务负责人/合规官/管理层，按钮级控制  
✅ **抽样→单据追溯**：统计页点排程看覆盖，再点单据号跳追溯看全流程  
✅ **Hangfire 后台任务**：逾期扫描、提醒、摘要、归档全自动  
✅ **全栈强类型**：后端枚举 + TS 100+ 类型定义，两端一致性高  

---

## License

本项目用于内部合规审计管理。
