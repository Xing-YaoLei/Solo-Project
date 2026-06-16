# 养老护理康复活动跟进系统

解决养老护理中康复活动交接慢、记录散的问题的全栈管理系统。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TanStack Router + Zustand
- **后端**: FastAPI + SQLAlchemy + PostgreSQL
- **异步任务**: Celery + Redis
- **认证**: JWT

## 核心功能

### 1. 老人档案管理
- 老人基本信息、健康状况、护理等级管理
- 病史、过敏史、饮食限制记录
- 状态变更全程留痕

### 2. 用药清单
- 每位老人的用药明细记录
- 用药状态管理（在用/停用/完成）
- 方便交接班时快速了解用药情况

### 3. 探访记录
- 家属探访记录
- 老人身体、精神状态记录
- 关注老人心理健康

### 4. 活动签到
- 康复活动创建和管理
- 活动签到/签退
- 参与情况跟踪

### 5. 风险事件
- 跌倒、压疮、用药错误等风险事件记录
- 事件等级和状态管理
- 处理结果跟踪

### 6. 异常单
- 严重事件生成异常单（跌倒自动生成）
- **影响范围**、**责任归属**、**处理结果**三要素清晰
- 异常单号自动生成（INC-YYYYMMDD-XXXX）
- 家属通知情况记录

### 7. 数据导出
- 支持多维度数据导出（Excel格式）
- **每份导出都附带口径说明**，便于向团队解释护理达标变化
- 导出类型：老人档案、用药清单、探访记录、活动签到、风险事件、异常单

### 8. 审计日志
- 每次状态变更都留下痕迹
- 支持按实体类型、操作类型、用户筛选
- 旧值/新值对比，完整追溯

## 项目结构

```
MP0248/
├── backend/                 # 后端 FastAPI 项目
│   ├── app/
│   │   ├── main.py          # 应用入口
│   │   ├── config.py        # 配置
│   │   ├── database.py      # 数据库连接
│   │   ├── models/          # ORM 模型
│   │   ├── schemas/         # Pydantic 模型
│   │   ├── routers/         # API 路由
│   │   ├── core/            # 核心模块（认证等）
│   │   ├── utils/           # 工具类（审计、导出）
│   │   └── tasks/           # Celery 异步任务
│   ├── scripts/
│   │   └── init_db.py       # 数据库初始化脚本
│   ├── requirements.txt     # Python 依赖
│   └── run.sh               # 启动脚本
└── frontend/                # 前端 React 项目
    ├── src/
    │   ├── pages/           # 页面组件
    │   ├── components/      # 公共组件
    │   ├── api/             # API 接口
    │   ├── stores/          # 状态管理
    │   ├── styles/          # 样式
    │   ├── router.tsx       # 路由配置
    │   └── main.tsx         # 入口文件
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+（可选，用于 Celery）

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 复制环境变量配置
cp .env.example .env
# 修改 .env 中的数据库连接信息

# 初始化数据库（创建表和测试数据）
python scripts/init_db.py

# 启动服务
sh run.sh
# 或
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 构建生产版本
npm run build
```

### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| nurse | nurse123 | 护士 |

### Celery 异步任务（可选）

```bash
cd backend

# 启动 Worker
celery -A app.celery_app.celery_app worker --loglevel=info
```

## API 文档

启动后端服务后，访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 核心设计理念

### 1. 状态可追溯
所有状态变更都通过审计日志记录，确保每一次操作都有迹可循。

### 2. 交接更高效
用药清单、探访记录、活动签到等信息集中管理，换班交接时一目了然。

### 3. 异常有预案
跌倒等严重事件自动生成异常单，明确影响范围、责任归属和处理结果，形成闭环管理。

### 4. 达标准解释
每份导出数据都附带口径说明，方便护理管理者向团队解释护理达标情况的变化。

## 状态说明

### 老人状态
- `active` - 在院
- `inactive` - 离院
- `discharged` - 出院

### 健康状态
- `stable` - 稳定
- `monitoring` - 观察中
- `critical` - 危重

### 护理等级
- `basic` - 基础护理
- `intermediate` - 中级护理
- `advanced` - 高级护理
- `special` - 特护

### 风险事件等级
- `general` - 一般
- `serious` - 严重
- `critical` - 危重

### 异常单状态
- `pending` - 待处理
- `processing` - 处理中
- `closed` - 已结案

## 导出口径说明

每份Excel导出文件都包含：
1. 标题行
2. 数据口径说明（统计范围、字段含义、更新时间）
3. 数据表头（带样式）
4. 数据内容

口径说明便于向团队解释数据统计标准，避免因理解不一致产生的争议。
