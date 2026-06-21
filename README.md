# 法律服务开庭日历任务分派台

> 解决法律服务开庭日历交接慢、记录散的问题。实现冲突检测前置、改约可追溯、到场状态清晰、提醒名单完整、利益冲突异常机制，数据导出附带口径解释，提升团队协作和客户满意度。

---

## 🏗️ 技术架构

| 层级 | 技术选型 | 作用 |
|------|----------|------|
| **前端** | Next.js 14 + TypeScript + Ant Design 5 | 日历分派台界面、可视化交互 |
| **后端** | NestJS 10 + TypeScript | RESTful API、业务逻辑、定时任务 |
| **ORM** | Prisma 5 | 类型安全的数据库访问层 |
| **主数据库** | PostgreSQL | 持久化存储开庭、案件、冲突、异常等业务数据 |
| **缓存/消息** | Redis | 缓存热点数据、分布式锁、消息通知队列 |
| **构建工具** | pnpm + Monorepo Workspaces | 前后端统一管理、依赖共享 |
| **API 文档** | Swagger / OpenAPI | 自动生成后端接口文档 |

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  分派台日历 │ 冲突管理 │ 改约审批 │ 异常单 │ 签到 │ 提醒 │ 导出 │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP (Rewrites → /api/*)
┌────────────────────────────▼────────────────────────────────┐
│                      NestJS Backend                          │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ Hearing │ │Conflict │ │Reschedule│ │ Exception(利益冲突)│ │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────────┬──────────┘ │
│       │           │           │                 │            │
│  ┌────▼───────────▼───────────▼─────────────────▼──────────┐ │
│  │ Prisma Client (Type-Safe)                               │ │
│  └────┬───────────────────────────────┬────────────────────┘ │
└───────┼───────────────────────────────┼──────────────────────┘
        │                               │
   ┌────▼─────┐                   ┌────▼────┐
   │PostgreSQL│                   │  Redis  │
   └──────────┘                   └─────────┘
```

---

## 📦 项目结构

```
MP0450/
├── package.json                 # Monorepo 根配置 (pnpm workspaces)
├── pnpm-workspace.yaml
├── .env.example                 # 环境变量模板
├── .gitignore
└── packages/
    ├── backend/                 # NestJS 后端
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── nest-cli.json
    │   ├── prisma/
    │   │   └── schema.prisma    # 数据模型定义（核心）
    │   └── src/
    │       ├── main.ts
    │       ├── app.module.ts
    │       ├── prisma/          # Prisma 全局模块
    │       ├── redis/           # Redis 全局模块
    │       ├── common/          # 拦截器/过滤器/通用DTO
    │       └── modules/
    │           ├── hearing/     # 开庭日历（CRUD + 冲突预检 + 时间线）
    │           ├── conflict/    # 冲突检测（5类冲突 + 解决流程）
    │           ├── reschedule/  # 改约申请 + 审批 + 受影响名单
    │           ├── attendance/  # 到场签到/签退 + 统计
    │           ├── timeline/    # 状态变更时间线（可追溯）
    │           ├── reminder/    # 提醒创建 + 发送 + 名单
    │           ├── exception/   # 利益冲突异常单（核心）
    │           └── export/      # Excel 导出 + 口径说明 Sheet
    └── frontend/                # Next.js 前端
        ├── package.json
        ├── next.config.js       # 含 /api 代理到后端 3001
        ├── tsconfig.json
        ├── tailwind.config.js
        ├── postcss.config.js
        └── src/
            ├── app/
            │   ├── layout.tsx   # AntD ConfigProvider + 中文包
            │   ├── page.tsx     # 主布局（侧边栏 + Tabs 路由）
            │   └── globals.css
            ├── components/      # 7 大业务模块组件
            │   ├── DispatchDesk.tsx     # 日历分派台
            │   ├── HearingForm.tsx      # 开庭表单
            │   ├── ConflictManager.tsx  # 冲突管理
            │   ├── RescheduleManager.tsx# 改约审批
            │   ├── ExceptionManager.tsx # 利益冲突异常单
            │   ├── AttendanceManager.tsx# 签到管理
            │   ├── TimelinePanel.tsx    # 时间线面板
            │   ├── ReminderManager.tsx  # 提醒管理
            │   └── ExportCenter.tsx     # 数据导出中心
            ├── lib/
            │   ├── request.ts   # Axios 封装 + 统一响应
            │   └── api.ts       # 业务 API 集中封装
            ├── store/
            │   └── app.ts       # Zustand 全局状态
            └── types/
                └── index.ts     # 完整 TypeScript 类型 + 标签映射
```

---

## 🎯 核心功能模块

### 1. 📅 开庭日历分派台
- **月/年视图日历**：按日展示开庭，重要开庭红色高亮，最多3条+更多
- **当日面板**：右侧实时显示选中日期开庭列表、时间轴、律师头像组
- **开庭CRUD**：内联表单创建/编辑，自动关联案件、法院、法庭、法官
- **分派律师**：主办/协办角色，支持多选，法院→法庭→法官三级联动
- **冲突预检测**：创建前自动执行 4 类冲突检测，支持强制创建
- **状态变更**：自动写入 StatusTimeline，变更记录可追溯

### 2. ⚠️ 冲突检测与改约
**5类冲突自动检测：**
- 🏛️ 法庭冲突（同时段占用）
- 👨‍⚖️ 法官时间冲突
- ⚖️ 律师时间冲突
- 🧑‍💼 客户利益冲突
- ⚔️ 案件对立冲突

**改约流程：**
- 提交改约申请 → 自动收集受影响名单（律师/法官/客户/当事人）
- 审批人在线审批 → 通过后事务性更新原/新开庭状态
- 完整改约链路历史，一键回溯
- 审批通过时自动生成时间线记录

### 3. ✅ 到场状态 + 时间线
**签到管理：**
- 6 种到场状态：未到场/已到场/迟到/缺席/请假/早退
- 签到/签退/批量登记，支持现场/远程/请假多种签到方式
- 实时统计卡片：应到/已到/迟到/缺席/请假/早退
- 按开庭分组面板，支持座位、备注记录

**时间线追溯：**
- 任一状态变更自动写入时间线（排期/确认/改约/完成/到场/异常等12种类型）
- 按日期分组展示：旧状态 → 新状态徽章、变更原因、操作人、关联开庭
- 支持关键字/变更类型/操作人/日期范围多维筛选

### 4. 🚨 利益冲突异常单
> **核心模块：** 当检测到利益冲突时，立即生成结构化异常单

- **异常单编号**自动生成（`EX-时间戳-随机`），支持关联案件/开庭
- **影响范围 JSON**：
  - 影响的案件列表
  - 影响的开庭列表
  - 影响的内部人员
  - 影响的客户清单
  - 附加文字说明
- **责任归属 JSON**：
  - 主要责任人（可多人）
  - 次要责任人（可多人）
  - 责任部门
  - 根本原因分析
  - 最终认定结论
- **处理全流程**：
  - 调查结果 / 处理结果
  - 纠正措施 / 预防措施
  - 预估损失 / 实际损失
  - 客户满意度反馈
- **状态机流转**：`待处理 → 调查中 → 已解决 → 已关闭`，支持`已升级`
- **独立时间线**：异常单自身状态变化、调查动作、处理动作全程记录
- **附件上传**：证据材料可挂载

### 5. 📢 提醒名单
- 5 种提醒类型：邮件 / 短信 / APP推送 / 微信 / 电话
- 灵活的接收人名单：支持关联用户/客户，也可直接录入
- 定时发送 / 立即发送 / 失败重发（自动计数）
- 五态追踪：待发送 → 已发送 → 已读 → 已确认 / 发送失败（记录失败原因）
- 批量发送操作

### 6. 📊 数据导出（带口径解释）
**6 种导出类型**，每次导出 Excel 包含 **双 Sheet**：

| Sheet | 内容 |
|-------|------|
| Sheet 1 数据表 | 蓝色表头、冻结首行、自动筛选、关联数据顿号展开 |
| Sheet 2 口径说明 | ① 导出元信息（类型、时间范围、筛选条件）② 字段口径表（字段名-中文名-业务定义） ③ 通用口径规则（4条+） ④ 温馨提示（客户满意向口径） |

- 支持 `includedFields` 自定义导出字段子集，口径 Sheet 自动同步精简
- 支持任意 JSON 筛选条件透传
- 每次导出自动入库 `ExportRecord`，历史记录可查可下载
- 内置口径定义文件 `export-caliber.ts`，字段定义可维护

---

## ⚙️ 快速开始

### 1. 环境准备

```bash
# 必须的服务
- PostgreSQL 14+ （默认端口 5432）
- Redis 6+       （默认端口 6379）
- pnpm 8+
- Node.js 18+
```

### 2. 安装依赖

```bash
cd MP0450
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 修改数据库连接等
```

关键变量：
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/legal_hearing_calendar?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
BACKEND_PORT=3001
FRONTEND_PORT=3000
JWT_SECRET=your-secret-key
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行迁移（首次推荐）
pnpm db:migrate --name init

# 或直接推送到现有数据库
pnpm db:push
```

### 5. 启动服务

```bash
# 开发模式（前后端同时启动）
pnpm dev

# 或分别启动
pnpm dev:backend     # http://localhost:3001
pnpm dev:frontend    # http://localhost:3000
```

### 6. 访问

| 地址 | 说明 |
|------|------|
| http://localhost:3000 | 前端主界面（分派台） |
| http://localhost:3001/api/docs | Swagger API 文档 |

---

## 🧱 数据模型核心关系

```
User ──┬──< HearingAssignment >── Hearing ──< AttendanceRecord
       │                              │
       │                              ├──< HearingAssignment
       │                              ├──< StatusTimeline  (状态变更)
       │                              ├──< RescheduleRecord (改约链路)
       │                              ├──< ConflictCheck    (冲突)
       │                              │       │
       │                              │       └─→ ExceptionRecord (异常)
       │                              │               │
       │                              │               ├── ExceptionTimeline
       │                              │               └── ExceptionAttachment
       │                              ├──< Reminder ──< ReminderRecipient (名单)
       │                              └─── Case ── Client
       │
       └── ExceptionRecord (创建/处理人)
```

**核心设计原则：**
- 所有状态变更 → `StatusTimeline` 自动记录（谁、什么时候、改了什么、为什么改）
- 利益冲突升级 → `ExceptionRecord`（影响范围 + 责任归属 + 处理闭环）
- 每次改约 → `RescheduleRecord` 链路追溯 + 受影响名单
- 每次导出 → 口径说明 Sheet + 导出记录留痕

---

## 🔌 核心 API 概览

| 模块 | 方法 | 路由 | 说明 |
|------|------|------|------|
| **开庭** | POST | `/api/hearings/create-with-check` | 创建开庭+自动冲突检测 |
| | GET | `/api/hearings/calendar` | 日历范围查询 |
| | PATCH | `/api/hearings/:id/status` | 变更状态+写时间线 |
| **冲突** | POST | `/api/conflicts/detect` | 执行5类冲突检测 |
| | POST | `/api/conflicts/:id/resolve` | 标记解决 |
| **改约** | POST | `/api/reschedules` | 提交改约申请 |
| | POST | `/api/reschedules/:id/approve` | 审批（事务性更新） |
| | GET | `/api/reschedules/hearing/:id/affected-parties` | 受影响名单 |
| **签到** | POST | `/api/attendance/check-in` | 签到（自动判定迟到） |
| | GET | `/api/attendance/stats` | 状态统计 |
| **时间线** | GET | `/api/timeline/hearing/:id` | 开庭完整变更历史 |
| **异常单** | POST | `/api/exceptions` | 创建利益冲突异常单 |
| | PATCH | `/api/exceptions/:id` | 更新影响范围/责任归属 |
| | POST | `/api/exceptions/:id/timeline` | 追加处理动作 |
| **提醒** | POST | `/api/reminders/send` | 批量发送 |
| **导出** | GET | `/api/exports/hearing-summary` | 开庭汇总(双Sheet口径) |
| | GET | `/api/exports/attendance-stats` | 签到统计 |
| | GET | `/api/exports/exception-stats` | 异常统计（重点） |
| | GET | `/api/exports/calibers` | 查询口径定义 |

> 所有接口文档：启动后端后访问 `http://localhost:3001/api/docs`

---

## 📈 推荐的后续扩展

1. **WebSocket 实时推送**：冲突/异常/改约实时通知到桌面端
2. **OCR 扫描**：法院传票自动识别，生成开庭草稿
3. **AI 辅助**：基于历史异常单智能识别潜在利益冲突
4. **移动端**：React Native/小程序版本，律师外出签到+确认
5. **审批工作流**：更复杂的多级审批引擎
6. **报表大屏**：月度/季度可视化数据看板（ECharts 已内置）

---

## 📄 License

Internal Use Only
