# 景区门票预约跟进台

景区运营门票预约流程管理系统，用于梳理景区运营的门票预约流程，支持录入记录、处理说明、后续复盘。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TanStack Router + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy + PostgreSQL
- **异步任务**: Celery + Redis

## 功能特性

### 单据视图
- 📅 日历时段管理 - 可视化展示每日时段及容量
- 📊 容量规则 - 灵活配置时段容量规则
- ⚠️ 冲突检测 - 自动检测时段容量冲突
- 🔄 改约记录 - 完整的改约历史追踪

### 时间线
- 📝 备注记录 - 处理说明沿时间线保存
- 📎 附件上传 - 支持相关文件附件
- 👤 处理人记录 - 操作人全程可追溯

### 冲突处理
- 🎯 受影响对象 - 清晰展示受影响预约
- 🤝 责任角色接手 - 分配处理人跟进
- ✏️ 补充说明 - 处理过程可补充说明

### 响应式设计
- 📱 手机端 - 保留最常用的处理入口
- 🖥️ 桌面端 - 强化批量筛选、导出、到场率分析

## 项目结构

```
MP0383/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/             # API 路由
│   │   │   ├── time_slots.py      # 时段管理
│   │   │   ├── reservations.py    # 预约管理
│   │   │   ├── conflicts.py       # 冲突管理
│   │   │   └── misc.py            # 统计与其他
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic Schema
│   │   ├── tasks.py         # Celery 任务
│   │   ├── config.py        # 配置
│   │   ├── database.py      # 数据库连接
│   │   └── main.py          # 应用入口
│   ├── requirements.txt
│   └── .env.example
└── frontend/                # 前端应用
    ├── src/
    │   ├── components/      # 公共组件
    │   ├── pages/           # 页面组件
    │   ├── routes/          # 路由配置
    │   ├── services/        # API 服务
    │   ├── types/           # TypeScript 类型
    │   ├── utils/           # 工具函数
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## 快速开始

### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### Celery 启动（可选，用于异步任务）

```bash
cd backend
source venv/bin/activate

celery -A app.tasks.celery worker --loglevel=info
```

## 数据库模型

### 核心表
- **users** - 用户表
- **time_slots** - 时段表
- **capacity_rules** - 容量规则表
- **reservations** - 预约单表
- **reschedule_records** - 改约记录表
- **timeline_records** - 时间线记录表
- **attachments** - 附件表
- **conflict_records** - 冲突记录表
- **conflict_affected_objects** - 冲突受影响对象表

## API 接口

### 时段管理
- `GET /api/time-slots` - 获取时段列表
- `POST /api/time-slots` - 创建时段
- `GET /api/time-slots/{id}` - 获取时段详情
- `PUT /api/time-slots/{id}` - 更新时段
- `DELETE /api/time-slots/{id}` - 删除时段

### 预约管理
- `GET /api/reservations` - 获取预约列表
- `POST /api/reservations` - 创建预约
- `GET /api/reservations/{id}` - 获取预约详情
- `PUT /api/reservations/{id}` - 更新预约
- `POST /api/reservations/{id}/check-in` - 签到
- `POST /api/reservations/{id}/reschedule` - 改约
- `POST /api/reservations/batch` - 批量操作

### 冲突管理
- `GET /api/conflicts` - 获取冲突列表
- `POST /api/conflicts` - 创建冲突记录
- `GET /api/conflicts/{id}` - 获取冲突详情
- `PUT /api/conflicts/{id}` - 更新冲突状态
- `POST /api/conflicts/detect` - 检测冲突

### 统计分析
- `GET /api/stats/attendance` - 到场率统计
- `GET /api/stats/summary` - 数据概览
