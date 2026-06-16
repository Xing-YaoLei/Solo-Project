# 🏥 养老护理床位排班排程台

> 基于 ASP.NET Core + React + SQL Server + Hangfire 的养老护理床位排班、审核、处理、复盘全流程管理系统。

---

## ✨ 系统特性

### 🎯 核心流程（一条线贯通）
```
录入排班 → 提交审核 → 审核通过/拒绝 → 开始处理 → 完成处理
                                              ↓（异常时）
                                        记录异常 → 调查处理
                                              ↓
                                    三种关闭方式（正常/补充/升级）
                                              ↓
                                       提交复盘 → 复盘审核 → 关闭归档
```

### 📋 统一单据设计（单屏显示）
将 **老人档案 + 护理等级 + 用药清单 + 排班信息** 全部放在同一页面，关键材料不分散：

| 区域 | 内容 |
|------|------|
| 左侧栏 25% | 老人基本信息、护理等级、来源、健康提示（病史/过敏/饮食） |
| 中间栏 45% | 排班单号、状态流程条、床位/医护/护理方案、处理记录、状态历史时间轴 |
| 右侧栏 30% | 用药清单表格 + 新增表单、相关异常记录列表 |
| 底部 Sticky | 根据当前状态动态显示操作按钮 |

### 🚨 异常处理（围绕跌倒设计）
- **默认异常类型**：跌倒（Fall），全程红色视觉强调
- **跌倒专用字段**：现场描述、跌倒原因、跌倒高度、受伤部位、初步症状、现场处置
- **三种关闭状态**，走不同状态流：

| 关闭类型 | 状态 | 说明 |
|---------|------|------|
| ✅ 正常关闭 | `ClosedNormal` | 处理完整，无需补充，无需升级 |
| 📎 补充材料 | `ClosedWithSupplement` | 处理不完整，需补充材料后关闭 |
| ⬆️ 升级处理 | `ClosedEscalated` | 严重情况，已升级到上级部门处理 |

### 🔍 已关闭记录追溯
- 所有状态变更均写入历史表（`ScheduleStatusHistory` / `ExceptionStatusHistory`）
- 结案后仍可查看完整处理链路：**谁操作的、什么时间、改了什么状态、原因是什么**
- 支持查看状态时间轴

### 📊 六大汇总维度

| 维度 | 统计内容 |
|------|---------|
| ✅ 护理达标 | 不达标/达标/超标 计数、占比、趋势、达标率 |
| 📥 来源统计 | 自行登记/医院转介/社区转介/家属介绍/线上预约 分布 |
| 👩‍⚕️ 处理人 | Top处理人排行、总案件、结案数、平均处理时长、结案率 |
| ⚠️ 异常原因 | 跌倒原因Top10、发生地点分布、受伤部位分布、预警提示 |
| 📅 排班统计 | 各状态计数、日趋势、占比 |
| 🚨 异常统计 | 类型/严重度/关闭方式分布、日趋势 |

---

## 🛠️ 技术选型

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | ASP.NET Core | .NET 8.0 |
| 前端框架 | React + TypeScript + Vite | React 18 |
| UI 组件库 | Ant Design | 5.x |
| 数据库 | SQL Server | 2019+ |
| ORM | Entity Framework Core | 8.0 |
| 后台任务 | Hangfire | 1.8.11 |
| 状态管理 | Zustand | 4.x |
| 图表库 | ECharts | 5.x |
| 路由 | React Router | 6.x |
| HTTP 客户端 | Axios | 1.x |

---

## 📁 项目结构

```
MP0247/
├── scripts/                          # 启动脚本
│   ├── start-backend.sh             # 启动后端
│   ├── start-frontend.sh            # 启动前端
│   └── start-all.sh                 # 一键启动
│
├── src/
│   ├── ElderCareScheduling.API/      # 🔵 后端 ASP.NET Core
│   │   ├── Controllers/             # Web API 控制器
│   │   │   ├── EldersController.cs
│   │   │   ├── BedsController.cs
│   │   │   ├── CareLevelsController.cs
│   │   │   ├── SchedulesController.cs        # 排班流程核心
│   │   │   ├── ExceptionsController.cs       # 异常处理核心
│   │   │   └── StatisticsController.cs       # 统计分析
│   │   ├── Models/
│   │   │   ├── Entities/            # 数据库实体（10个表）
│   │   │   └── DTOs/                # 前后端数据传输对象
│   │   ├── Data/
│   │   │   └── ApplicationDbContext.cs   # EF Core 上下文
│   │   ├── Repositories/            # 仓储层 + UnitOfWork
│   │   ├── Services/                # 业务服务层
│   │   ├── Hangfire/                # Hangfire 定时任务
│   │   ├── Enums/                   # 枚举定义（14种枚举）
│   │   ├── Properties/
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   └── ElderCareScheduling.API.csproj
│   │
│   └── client/                      # 🟢 前端 React
│       ├── src/
│       │   ├── pages/               # 7个核心页面
│       │   │   ├── Dashboard.tsx            # 首页仪表盘
│       │   │   ├── ElderManagement.tsx      # 老人管理
│       │   │   ├── ScheduleManagement.tsx   # 排班管理列表
│       │   │   ├── ScheduleDetail.tsx       # ⭐ 统一单据详情
│       │   │   ├── ExceptionManagement.tsx  # 异常管理列表
│       │   │   ├── ExceptionDetail.tsx      # 异常详情+跌倒处理
│       │   │   └── StatisticsAnalysis.tsx   # 统计分析
│       │   ├── components/          # 公共组件
│       │   │   ├── StatusTag.tsx
│       │   │   ├── PageHeader.tsx
│       │   │   ├── EnumSelect.tsx
│       │   │   └── PaginationTable.tsx
│       │   ├── services/            # API 服务
│       │   ├── store/               # Zustand 状态
│       │   ├── types/               # TypeScript 类型
│       │   ├── utils/               # 工具函数（枚举映射/日期）
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
│
└── README.md
```

---

## 📊 数据模型（10 张表）

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `Elders` | 老人档案 | 姓名、性别、生日、身份证、紧急联系人、病史、过敏史、来源 |
| `CareLevels` | 护理等级（种子数据） | 5级：自理/半护理/全护理/特护/专护 |
| `Medications` | 用药清单 | 药品名、剂量、频次、用法、起止日期、剩余量 |
| `Beds` | 床位（种子数据） | 床号、房间、楼层、楼栋、状态 |
| `CareSchedules` | 排班单据 | 单号、老人/床位/护理等级、日期范围、班次、**13种状态**、方案 |
| `ScheduleStatusHistories` | 排班状态历史 | 旧状态→新状态、原因、时间、操作人 |
| `ExceptionRecords` | 异常记录 | 单号、类型/严重度/状态、**跌倒专用字段**、补充/升级、**3种关闭类型** |
| `ExceptionStatusHistories` | 异常状态历史 | 状态变更完整链路 |
| `ExceptionAttachments` | 异常附件 | 补充材料附件 |
| `ReviewRecords` | 审核记录 | 排班审核、异常审核、复盘审核 |

---

## 🚀 快速开始

### 前置条件

| 软件 | 版本要求 | 下载地址 |
|------|---------|---------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Node.js | 18+ | https://nodejs.org/ |
| SQL Server | 2019+ | https://www.microsoft.com/sql-server |

### 步骤 1：配置 SQL Server

修改后端配置文件中的数据库连接串：

```bash
# 文件位置：
src/ElderCareScheduling.API/appsettings.json
src/ElderCareScheduling.API/appsettings.Development.json
```

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=ElderCareSchedulingDB;User Id=sa;Password=你的密码;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  }
}
```

### 步骤 2：启动后端

```bash
# 方式一：使用启动脚本
bash scripts/start-backend.sh

# 方式二：手动启动
cd src/ElderCareScheduling.API
dotnet restore
dotnet run --launch-profile http
```

启动成功后：
- 📋 **API 文档**：http://localhost:5000/swagger
- 📊 **Hangfire 面板**：http://localhost:5000/hangfire  （账号：`admin`  密码：`Admin@123`）

首次启动会自动：
- ✅ 创建数据库（EnsureCreated）
- ✅ 插入护理等级种子数据（5个等级）
- ✅ 插入床位种子数据（60张床位）
- ✅ 注册 Hangfire 定时任务

### 步骤 3：启动前端

```bash
# 方式一：使用启动脚本
bash scripts/start-frontend.sh

# 方式二：手动启动
cd src/client
npm install
npm run dev
```

启动成功后：
- 🌐 **前端页面**：http://localhost:3000

### 一键启动（Mac/Linux）

```bash
bash scripts/start-all.sh
```

---

## 📱 主要界面说明

### 1. 首页仪表盘 (`/dashboard`)
- 4 个关键指标卡片
- 6 个 ECharts 图表
- 异常类型饼图突出显示跌倒

### 2. 排班管理 (`/schedules`)
- 7 条件筛选
- 新建排班 Modal
- 分页表格显示
- 每行根据当前状态动态显示可用操作按钮

### 3. ⭐ 统一单据页面 (`/schedules/:id`)
**三栏式布局，老人档案+护理等级+用药清单+排班信息一屏显示：**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [左侧25%]      │ [中间45%]              │ [右侧30%]               │
│                 │                        │                         │
│ 👤 老人档案    │ 📋 排班单号: SCH-xxxx  │ 💊 用药清单             │
│ 张XX, 男, 78岁 │ Steps状态流程条         │ [表格: 药品/剂量/频次] │
│ 身份证: xxx    │                        │ [+ 新增用药折叠表单]   │
│ 紧急联系人...  │ 🏥 床位: 1F-01-1       │                         │
│                 │ 📅 2024-01-01 ~ 01-31 │ ⚠️ 相关异常            │
│ ⭐ 护理等级    │ 👩‍⚕️ 主责护士: 李XX      │ [列表: 跌倒 高 红]     │
│ 全护理级       │ 📝 护理方案...         │ [查看详情按钮]         │
│ 8h/天, 1:4护患 │                        │                         │
│                 │ 🔍 处理记录: ...       │                         │
│ 📥 来源: 医院  │ 📜 复盘总结: ...       │                         │
│ 🏥 病史: 高血压│ ⏱️ 状态时间轴          │                         │
│                 │                        │                         │
├─────────────────────────────────────────────────────────────────────┤
│ 【底部 Sticky 毛玻璃操作栏 - 根据状态动态显示】                     │
│  [草稿→提交审核] [已审核→开始处理] [进行中→完成处理] [异常→记录异常] │
│  [复盘完成/关闭单据] ...                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. 异常详情 (`/exceptions/:id`)
- **跌倒专用信息红色边框高亮**
- 6 个 Tab：基本信息 / 处理过程 / 补充材料 / 升级处理 / 结案总结 / 状态历史
- 右侧 Sticky 操作面板，根据状态动态显示：
  - 分配处理人
  - 开始调查
  - 开始处理
  - 请求补充材料
  - 提交补充材料
  - 升级处理
  - 标记解决
  - **正常关闭 / 补充材料关闭 / 升级关闭**（3种按钮）

### 5. 统计分析 (`/statistics`)
6 个 Tab 覆盖全部汇总维度：
1. 排班统计
2. 异常统计（跌倒高亮）
3. 护理达标统计
4. 来源统计
5. 处理人统计
6. **跌倒原因深度分析**（原因Top10+地点+部位+预警）

---

## 🔄 Hangfire 后台任务

在 `Program.cs` 启动时自动注册，可在 Hangfire 面板查看/管理：

| 任务 | Cron | 说明 |
|------|------|------|
| 排班状态自动检查 | `0 8 * * *`（每天8点） | 检查逾期未处理的排班，发送提醒 |
| 异常超期提醒 | `0 */4 * * *`（每4小时） | 提醒超过24小时未关闭的异常 |
| 每日统计汇总 | `0 1 * * *`（每天凌晨1点） | 生成前一日统计数据快照 |
| 自动归档任务 | `0 2 1 * *`（每月1号凌晨2点） | 归档超过180天的已关闭记录 |

---

## 🔐 数据安全

- 所有表均包含 `CreatedAt/CreatedBy/UpdatedAt/UpdatedBy` 审计字段
- 状态变更完整记录历史（操作人+时间+原因）
- 已关闭记录不可修改，仅可追溯查看
- 敏感字段（身份证号）建议生产环境加密存储

---

## 📝 开发建议

1. **数据库迁移**：首次启动使用 `EnsureCreated`，后续请使用 EF Core Migrations：
   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

2. **前端 Mock 开发**：后端未启动时，可在 `src/client/src/services/api.ts` 中配置 Mock 数据

3. **用户认证**：当前版本简化处理，生产环境建议集成 Identity Server 或 JWT

4. **文件上传**：异常附件当前仅存元数据，生产环境建议接入 OSS/MinIO

---

## 📞 技术支持

如遇问题：
1. 查看后端 Swagger 文档调试 API
2. 查看 Hangfire 面板确认后台任务执行
3. 检查 SQL Server 连接串配置
4. 确认端口 5000/3000 未被占用

---

**💡 本系统已将养老护理里的床位排班录入、审核、处理和复盘串成完整流程，关键材料统一单据不分散，跌倒异常三种关闭方式区分处理，已关闭记录完整追溯，六大维度汇总分析全面覆盖。**
