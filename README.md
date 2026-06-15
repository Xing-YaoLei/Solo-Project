# 职业教育学员社群跟进台

> 把职业教育里的学员社群录入、审核、处理和复盘串成一条流程的管理平台。

---

## 技术栈

| 模块 | 技术选型 |
|------|---------|
| **前端** | React 18 + TypeScript + Vite + **TanStack Router** |
| **后端** | FastAPI + Pydantic v2 + SQLAlchemy 2.0 |
| **数据库** | PostgreSQL |
| **任务队列** | Celery + Redis |
| **状态管理** | Zustand |
| **HTTP客户端** | Axios |

---

## 核心功能模块

### 📋 社群单据工作流（录入 → 审核 → 处理 → 复盘）
8种状态严格流转，**补资料/升级复核/完成三池独立不混淆**：

```
草稿(DRAFT) → 待审核(PENDING_REVIEW) → 审核中(REVIEWING)
                                                    ↓
                                         ┌──────────────────────┐
                                         │ 要求补资料           │ 升级复核
                                         ↓                      ↓
                                    补资料(SUPPLEMENT)    升级复核池(ESCALATED)
                                         ↓                      ↓
                                    重新提交 ─────────→ 处理中(PROCESSING)
                                                              ↓
                                                         完成(COMPLETED)
                                                              ↓
                                                         关闭(CLOSED) ← 不影响查证，历史完整保留
```

### 👥 同屏三栏复核设计
单据详情页一屏展示完整信息，复核时无需切换页面：
| 左栏：会员档案 | 中栏：权益规则 + 单据详情 | 右栏：账户流水 + 复核追溯 |
|--------------|------------------------|------------------------|
| 基本信息/考试信息/等级标签/社群 | 关联权益列表（含累计价值）<br/>问题描述/凭证/补资料要求 | 关联流水（收支统计）<br/>复盘记录（**引用ID锚点追溯**）<br/>审计轨迹时间线 |

### ⚠️ 作业抄袭异常处理
围绕作业抄袭全流程：举报 → 调查 → 确认/驳回 → 申诉 → 处理
- 4级严重程度（轻微/中等/严重/极严重）
- 相似度分数可视化
- 处罚措施记录 + 申诉期限追踪
- 与会员档案、社群单据双向关联

### 📊 多维度汇总统计
- **考试通过率**（总览 + 按会员等级分组）
- **来源渠道**（数量/占比/渠道通过率 TOP3）
- **责任人绩效**（处理总数/完成率排行，带奖牌）
- **复盘标签分布**（环形图可视化）
- **单据状态流向**（堆叠条形图）

---

## 项目结构

```
MP0168/
├── backend/                          # FastAPI 后端
│   ├── app/
│   │   ├── api/                      # API 路由模块
│   │   │   ├── auth.py               # 认证（登录/注册/当前用户）
│   │   │   ├── members.py            # 会员档案 CRUD
│   │   │   ├── benefits.py           # 权益规则 + 会员权益映射
│   │   │   ├── transactions.py       # 账户流水
│   │   │   ├── tickets.py            # 社群单据（核心工作流）
│   │   │   ├── plagiarism.py         # 作业抄袭异常处理
│   │   │   └── summary.py            # 汇总统计（多维度）
│   │   ├── tasks/
│   │   │   └── tasks.py              # Celery 异步任务
│   │   ├── schemas/
│   │   │   └── schemas.py            # Pydantic 请求/响应模型
│   │   ├── models.py                 # SQLAlchemy ORM 模型
│   │   ├── enums.py                  # 枚举定义（状态/类型/等级）
│   │   ├── config.py                 # 配置管理
│   │   ├── database.py               # 数据库连接
│   │   ├── celery_app.py             # Celery 配置
│   │   └── main.py                   # FastAPI 应用入口
│   ├── scripts/
│   │   └── seed_data.py              # 数据库初始化种子数据（20会员/8权益/30单据/60流水/15抄袭）
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                         # React + Vite 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # 数据汇总看板
│   │   │   ├── tickets/
│   │   │   │   ├── TicketList.tsx    # 单据列表（8 Tab 分流）
│   │   │   │   ├── TicketNew.tsx     # 新建/录入单据
│   │   │   │   ├── TicketDetail.tsx  # 单据详情（同屏三栏）
│   │   │   │   └── StatusPool.tsx    # 独立状态池（补资料/升级/完成）
│   │   │   ├── members/MemberList.tsx
│   │   │   ├── benefits/BenefitList.tsx
│   │   │   ├── transactions/TransactionList.tsx
│   │   │   └── plagiarism/
│   │   │       ├── PlagiarismList.tsx    # 抄袭案例列表
│   │   │       ├── PlagiarismNew.tsx     # 新建抄袭案例
│   │   │       └── PlagiarismDetail.tsx  # 抄袭详情+调查处理
│   │   ├── components/
│   │   │   ├── Layout.tsx            # 主布局（侧边栏+Header）
│   │   │   └── common/               # 通用组件（表格/Modal/状态徽章）
│   │   ├── store/index.ts            # Zustand 全局状态
│   │   ├── api/client.ts             # Axios 客户端
│   │   ├── utils/enums.ts            # 枚举→中文/颜色映射
│   │   ├── types/index.ts            # TypeScript 类型定义
│   │   ├── styles/index.css          # 全局样式
│   │   ├── router.tsx                # TanStack Router 路由配置
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                # Vite 配置（含 /api 代理到后端）
│   └── tsconfig.json
│
└── start.sh                          # 一键启动脚本
```

---

## 快速开始

### ⚠️ 前置依赖
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 13+**（默认连接 `postgresql://postgres:postgres@localhost:5432/community_followup`）
- **Redis**（Celery Broker，可选，开发模式可用内存模拟）

### 🚀 一键启动（推荐）

```bash
cd MP0168

# 首次运行：自动安装依赖 + 初始化数据库 + 启动前后端
./start.sh dev

# 或分步执行
./start.sh setup      # 仅安装依赖和初始化数据库
./start.sh backend    # 仅启动后端
./start.sh frontend   # 仅启动前端
./start.sh celery     # 仅启动 Celery
./start.sh all        # 后端 + 前端 + Celery 全部启动
./start.sh help       # 查看所有命令
```

### 👆 手动启动

#### 1️⃣ 后端

```bash
cd backend

# 虚拟环境 + 依赖
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 环境变量
cp .env.example .env
# 编辑 .env，确认 DATABASE_URL / REDIS_URL

# 初始化数据库（建表 + 种子数据）
python3 -m scripts.seed_data

# 启动 API 服务
uvicorn app.main:app --reload --port 8000
```

后端地址：http://localhost:8000
Swagger 文档：http://localhost:8000/docs

#### 2️⃣ 前端

```bash
cd frontend
npm install
npm run dev
```

前端地址：http://localhost:3000

#### 3️⃣ Celery（可选）

```bash
cd backend
source venv/bin/activate
celery -A app.celery_app.celery_app worker --loglevel=info -B
```

---

## 核心 API 接口速览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **认证** | POST | `/api/auth/login` | 登录（简化：用户名即token） |
| | POST | `/api/auth/register` | 注册用户 |
| | GET | `/api/auth/me` | 当前用户 |
| **会员** | GET | `/api/members/` | 会员列表（多条件过滤+分页） |
| | POST | `/api/members/` | 新建会员 |
| | GET | `/api/members/{id}` | 会员详情 |
| | GET | `/api/members/{id}/benefits` | 会员权益 |
| | GET | `/api/members/{id}/transactions` | 会员流水 |
| **权益** | GET/POST/PUT/DELETE | `/api/benefits/{...}` | 权益规则 CRUD |
| **流水** | GET | `/api/transactions/` | 流水列表（支持日期范围） |
| | POST | `/api/transactions/` | 新建流水 |
| | GET | `/api/transactions/by-ticket/{id}` | 单据关联流水 |
| **单据** | GET | `/api/tickets/` | 单据列表（**多status独立过滤**） |
| | POST | `/api/tickets/` | 新建单据（自动生成编号） |
| | GET | `/api/tickets/{id}` | **单据完整详情（含全部关联）** |
| | POST | `/api/tickets/{id}/status` | **工作流状态流转（状态机校验）** |
| | POST | `/api/tickets/{id}/review` | 新建复盘记录（可升级） |
| | GET | `/api/tickets/{id}/audit-trail` | 完整审计轨迹 |
| **抄袭** | GET | `/api/plagiarism/` | 案例列表（状态分流） |
| | POST | `/api/plagiarism/` | 新建举报 |
| | GET | `/api/plagiarism/{id}` | 案例详情 |
| | POST | `/api/plagiarism/{id}/status` | 调查处理状态流转 |
| **汇总** | GET | `/api/summary/overview` | 全维度汇总（仪表盘数据） |
| | GET | `/api/enums` | 所有枚举值（前端下拉用） |

---

## 前端路由一览

| 路径 | 页面 | 说明 |
|------|------|------|
| `/dashboard` | 数据汇总看板 | 多维度统计可视化 |
| `/tickets` | 全部单据 | 8个状态Tab（补资料/升级/完成独立） |
| `/tickets/new` | 新建单据 | 录入表单 |
| `/tickets/{id}` | 单据详情 | **同屏三栏复核 + 引用追溯** |
| `/tickets/status/supplement` | 补资料池 | 独立待处理 |
| `/tickets/status/escalated` | 升级复核池 | 独立高级复核 |
| `/tickets/status/completed` | 已完成池 | 可查证/关闭 |
| `/members` | 会员档案 | 列表 + 筛选 |
| `/benefits` | 权益规则 | 列表 + 筛选 |
| `/transactions` | 账户流水 | 列表 + 汇总卡片 |
| `/plagiarism` | 抄袭案例 | 列表 + 状态分流 |
| `/plagiarism/new` | 新建举报 | 异常录入 |
| `/plagiarism/{id}` | 案例详情 | 调查/处理操作 |

---

## 设计亮点

### 🔗 复核依据追溯机制
复盘记录中引用的流水ID（`cited_transaction_ids`）和权益ID（`cited_benefit_ids`）在页面上呈现为**可点击锚点**：
1. 点击 `#流水1001` → 自动滚动到右栏流水列表对应行
2. 目标行背景色闪烁高亮 **3秒**（5次呼吸动画）
3. 复核人无需手动翻找，秒级定位证据

### 🔒 状态机严格校验
后端 `STATUS_TRANSITIONS` 字典预定义所有合法流转路径：
- `CLOSED` 为终态，**任何操作均无法重开**
- 非法流转请求返回 `400 Bad Request` + 明确原因
- 每次状态变更自动写入 `AuditLog`（操作人/前后状态/备注/凭证）

### 📊 关闭不影响查证
单据 `CLOSED` 状态下：
- 所有「编辑/状态操作」按钮自动 `disabled`
- 但**所有关联数据（会员/权益/流水/复盘/审计）100%可读**
- 历史单据随时可回溯核查

### 🎯 状态池独立设计
三个特殊状态从主列表中独立出来：
- **补资料池**：`SUPPLEMENT_NEEDED` - 等待学员补充材料
- **升级复核池**：`ESCALATED_REVIEW` - 需要高级权限人员处理
- **已完成池**：`COMPLETED` - 等待最终关闭归档

避免了"所有单据混在一起找不着"的常见问题，处理人一目了然知道自己的待办。

---

## 种子数据说明

运行 `seed_data.py` 会自动生成：
| 数据 | 数量 | 说明 |
|------|------|------|
| 用户 | 5 | admin/zhangsan/lisi/wangwu/zhaoliu（不同角色） |
| 会员档案 | 20 | 覆盖所有等级/来源，考试通过率约70% |
| 权益规则 | 8 | 折扣/返现/积分/资料/服务等多种类型 |
| 社群单据 | 30 | 8种状态按比例分布，含审计日志/复盘 |
| 账户流水 | 60 | 覆盖5种交易类型，关联单据/会员 |
| 抄袭案例 | 15 | 6种状态+4级严重程度，含完整调查流程 |

---

## 开发说明

- **前端API代理**：Vite 已配置 `/api` 自动代理到 `http://localhost:8000`
- **Mock降级**：所有页面API失败时自动展示Mock数据，可独立开发调试
- **纯CSS图表**：汇总页所有可视化用原生CSS + SVG实现，零额外图表库依赖
- **枚举同步**：前端启动时可调用 `/api/enums` 拉取，保证前后端枚举一致性

## License

内部项目
