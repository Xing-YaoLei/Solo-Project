# 长租公寓保洁排班跟进台

基于 **React + TanStack Router + FastAPI + PostgreSQL + Celery** 技术栈构建的长租公寓保洁运营管理系统。

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    前端 (React)                      │
│  React 18 + TanStack Router + Zustand + Tailwind     │
│  Recharts 图表 + Lucide 图标                         │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS /api/v1
┌────────────────────▼────────────────────────────────┐
│                  后端 (FastAPI)                      │
│  REST API / 认证鉴权 / 业务逻辑 / 冲突检测            │
├────────────┬─────────────┬──────────────────────────┤
│ PostgreSQL │    Redis    │    Celery (Worker)       │
│  业务数据   │  消息队列   │  定时任务/异步处理        │
└────────────┴─────────────┴──────────────────────────┘
```

## ✨ 核心功能

### 📅 排班流程管理
- **日历时段录入**：月/周/人员三视图排班日历，时段容量配置（高峰/普通）
- **容量规则引擎**：全局日上限/时段上限/人员日上限/间隔规则
- **实时冲突检测**：
  - 保洁员时间重叠 & 间隔不足
  - 公寓重复排期
  - 容量饱和预警
  - 自动风险等级标注（低/中/高/严重）

### 🔄 跟进与追踪
- **改约记录**：完整保留每次改约历史（原时间、新时间、原因、审批人）
- **到场状态**：未开始 → 已出发 → 已到场 → 已离场 全流程
- **质量评分**：完成后打分与客户反馈记录

### 📊 管理层看板
- 到场率趋势图（近14天）
- 人员绩效排行榜
- 日度任务量柱状统计
- 今日任务状态分布饼图

### 🔐 角色权限控制
| 角色 | 可见范围 |
|------|----------|
| **管理员 (admin)** | 全部功能 + 人员/公寓管理 |
| **主管 (supervisor)** | 团队排班 + 冲突处理 + 数据报表 |
| **保洁员 (cleaner)** | 个人任务 + 签到/完成 + 个人待办 |

### 📝 冲突详情中心
- 风险等级可视化标注
- 完整沟通记录时间线
- 主管复核意见（冲突复核/改约复核/质量复核）
- 冲突处理状态跟踪

## 🚀 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose（用于数据库/Redis）

### 一键启动
```bash
chmod +x start.sh
./start.sh
```

### 分步启动

**1. 启动基础设施（PostgreSQL + Redis）**
```bash
docker compose up -d
```

**2. 启动后端服务**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 init_db.py          # 初始化表结构和示例数据
uvicorn app.main:app --reload --port 8000
```

**3. 启动前端服务**
```bash
cd frontend
npm install
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- Swagger 文档: http://localhost:8000/docs

### 演示账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | admin123 |
| 调度主管 | supervisor1 | super123 |
| 保洁员 | cleaner1 | clean123 |

## 📁 项目结构

```
MP0288/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/                # API 路由
│   │   │   ├── auth.py         # 认证登录
│   │   │   ├── schedules.py    # 排班 CRUD + 冲突检测
│   │   │   ├── details.py      # 改约/到场/沟通/复核
│   │   │   ├── reports.py      # 报表统计
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── scheduler.py    # 冲突检测 & 容量规则引擎
│   │   ├── models.py           # SQLAlchemy ORM 模型
│   │   ├── schemas.py          # Pydantic 数据模型
│   │   ├── crud.py             # 数据访问层
│   │   ├── security.py         # JWT 鉴权
│   │   ├── celery_app.py       # Celery 配置
│   │   ├── tasks.py            # 定时任务 (到场检查/提醒/周报)
│   │   └── main.py             # FastAPI 入口
│   └── init_db.py              # 初始化脚本
│
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── pages/              # 页面组件
│   │   │   ├── DashboardPage       # 工作台/管理看板
│   │   │   ├── CalendarPage        # 排班日历 (3种视图)
│   │   │   ├── ScheduleListPage    # 任务列表
│   │   │   ├── ScheduleDetailPage  # 任务详情 (5个Tab)
│   │   │   ├── ScheduleCreatePage  # 五步创建排班
│   │   │   ├── TodoPage            # 我的待办
│   │   │   ├── ConflictPage        # 冲突管理中心
│   │   │   ├── UsersPage           # 人员管理
│   │   │   ├── ApartmentsPage      # 公寓管理
│   │   │   └── ReportsPage         # 数据报表
│   │   ├── components/Layout/      # 侧边栏布局
│   │   ├── api/                # Axios 封装
│   │   ├── store/              # Zustand 状态 (Auth)
│   │   ├── types/              # TypeScript 类型
│   │   └── utils/              # 格式化工具
│   └── ...
│
├── docker-compose.yml          # PG + Redis
└── start.sh                    # 一键启动脚本
```

## 🧩 核心数据模型

| 表名 | 说明 |
|------|------|
| users | 用户（管理员/主管/保洁员） |
| apartments | 公寓房源 + 租客信息 |
| time_slots | 时段配置（容量/高峰标记） |
| cleaning_schedules | 排班主表 |
| conflict_records | 冲突记录（风险等级） |
| reschedule_records | 改约历史 |
| attendance_records | 到场追踪时间线 |
| communication_records | 沟通备注记录 |
| review_opinions | 主管复核意见 |
| capacity_rules | 容量规则配置 |

## 🎯 设计亮点

1. **实时冲突检测**：创建/改约前自动校验，返回冲突详情+风险分级
2. **角色化视图**：侧边栏根据角色动态渲染，API 层强制鉴权
3. **完整审计链**：改约、到场、沟通、复核 全部可追溯
4. **渐进式录入**：创建排班采用 5 步向导式，降低操作门槛
