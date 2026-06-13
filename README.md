# 健身私教饮食打卡排程台

技术栈：ASP.NET Core 8 + React 18 + SQL Server + Hangfire

## 项目结构

```
MP0102/
├── src/
│   ├── FitnessDietTracker.API/          # ASP.NET Core Web API 后端
│   │   ├── Controllers/                 # API 控制器
│   │   ├── Models/                      # 数据库实体模型
│   │   ├── Data/                        # EF Core DbContext
│   │   ├── Services/                    # 业务服务层
│   │   ├── Dtos/                        # 数据传输对象
│   │   ├── Enums/                       # 枚举定义
│   │   ├── BackgroundJobs/              # Hangfire 后台任务
│   │   ├── Program.cs                   # 程序入口
│   │   └── appsettings.json             # 配置文件
│   └── FitnessDietTracker.Client/       # React 前端
│       ├── src/
│       │   ├── pages/                   # 页面组件
│       │   ├── components/              # 公共组件
│       │   ├── services/                # API 服务
│       │   ├── hooks/                   # 状态管理 (Zustand)
│       │   ├── types/                   # TypeScript 类型
│       │   └── App.tsx / main.tsx       # 入口
│       └── package.json
└── FitnessDietTracker.sln
```

## 核心功能

### 1. 记录页 (饮食记录 + 打卡照片 + 体测指标)
- 同一页面展示学员饮食记录、打卡照片、体测指标
- 支持按学员、日期范围筛选
- 支持添加饮食记录（含照片上传）和体测指标
- 数据按日期分组展示

### 2. 教练点评及变更历史
- 教练可对每条饮食记录添加/编辑点评
- **每次修改自动保存变更历史（修改前值 + 修改后值 + 修改人 + 修改时间）**
- 前端可查看完整点评变更时间线

### 3. 月底复盘（体脂变化）
- 按月查看学员体脂率、体重变化趋势图（Recharts）
- 统计打卡率、中断天数
- 展示本月所有体测明细
- 体脂变化率自动计算

### 4. 数据导出
- 支持导出 **饮食记录** 和 **体测指标**
- 支持 **Excel (.xlsx)** 和 **CSV** 格式
- **导出文件自动写入**：
  - ✅ 筛选口径（用户、教练、日期范围等）
  - ✅ 生成时间戳
  - ✅ 操作者姓名
- 导出历史记录可追溯

### 5. 打卡中断提醒
- **Hangfire 每日定时任务**（默认每天 8:00）自动检测连续未打卡用户
- 超过阈值（默认 1 天）自动创建中断提醒
- 中断处理完整记录：
  - ✅ 中断原因
  - ✅ 处理动作
  - ✅ 关闭时间
  - 所有操作记入 `InterruptionLog` 日志表

## 快速启动

### 前置条件
- .NET 8 SDK
- Node.js >= 18
- SQL Server

### 启动后端
```bash
cd src/FitnessDietTracker.API
# 修改 appsettings.json 中的数据库连接字符串
dotnet restore
dotnet run
# Swagger: http://localhost:5000/swagger
# Hangfire 仪表板: http://localhost:5000/hangfire
```

### 启动前端
```bash
cd src/FitnessDietTracker.Client
npm install
npm run dev
# http://localhost:5173
```

## 数据库说明

核心表结构：
- **Users**: 用户表（学员/教练/管理员）
- **DietRecords**: 饮食记录表
- **CheckInPhotos**: 打卡照片表
- **BodyMeasurements**: 体测指标表
- **CoachComments**: 教练点评表
- **CoachCommentHistories**: 点评变更历史表（保留前后值）
- **CheckInInterruptions**: 打卡中断记录表
- **InterruptionLogs**: 中断处理日志表（原因/动作/关闭时间）
- **ExportRecords**: 导出记录表（含筛选口径、生成时间、操作者）
