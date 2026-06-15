# 职业教育题库练习跟进台

一个完整的职业教育题库练习跟进系统，采用前后端分离架构。

## 技术栈

### 前端
- React 18
- TypeScript
- TanStack Router (路由)
- TailwindCSS (样式)
- Zustand (状态管理)
- Axios (HTTP 客户端)
- Recharts (图表)
- Vite (构建工具)

### 后端
- FastAPI (Web 框架)
- SQLAlchemy (ORM)
- PostgreSQL (数据库)
- Celery (异步任务队列)
- Redis (消息代理)
- Pydantic (数据验证)
- JWT (身份认证)

## 功能特性

### 核心功能
- **题库管理**: 题目、标签、课程、章节的增删改查
- **学习进度**: 练习记录、完成率、正确率统计
- **风险等级**: 自动评估学习风险（正常/提醒/风险/严重）
- **提醒规则**: 可配置的提醒规则，支持完成率阈值和未练习天数
- **处理详情**: 沟通记录、复核结论、风险调整
- **待办事项**: 不同角色的待办任务管理
- **管理层看板**: 完成率趋势图、整体统计数据

### 角色权限
- **管理员 (admin)**: 全部功能
- **管理层 (manager)**: 数据看板、提醒规则、学习进度查看
- **教师 (teacher)**: 题库管理、学习进度跟进、复核结论
- **学生 (student)**: 练习、查看自己的进度和待办

## 项目结构

```
MP0163/
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 应用入口
│   │   ├── config.py        # 配置文件
│   │   ├── database.py      # 数据库连接
│   │   ├── models.py        # SQLAlchemy 模型
│   │   ├── schemas.py       # Pydantic 模式
│   │   ├── auth.py          # 认证与权限
│   │   ├── celery_app.py    # Celery 任务
│   │   └── routers/         # API 路由
│   │       ├── auth.py
│   │       ├── courses.py
│   │       ├── questions.py
│   │       ├── tags.py
│   │       ├── study_progress.py
│   │       ├── reminders.py
│   │       └── processing.py
│   ├── init_db.py           # 数据库初始化脚本
│   ├── requirements.txt     # Python 依赖
│   └── .env.example         # 环境变量示例
└── frontend/                # 前端项目
    ├── src/
    │   ├── main.tsx         # React 入口
    │   ├── api/             # API 接口
    │   ├── components/      # 通用组件
    │   ├── pages/           # 页面组件
    │   ├── store/           # 状态管理
    │   ├── types/           # TypeScript 类型
    │   └── index.css        # 全局样式
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

## 快速开始

### 前置要求
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 创建虚拟环境并安装依赖
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

4. 初始化数据库（创建表和测试数据）
```bash
python init_db.py
```

5. 启动 FastAPI 服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. 启动 Celery Worker (可选，用于定时任务)
```bash
celery -A app.celery_app.celery worker --loglevel=info
celery -A app.celery_app.celery beat --loglevel=info
```

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问 http://localhost:3000

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 管理层 | manager | manager123 |
| 教师 | teacher | teacher123 |
| 学生 | student1 | student1123 |
| 学生 | student2 | student2123 |

## API 文档

启动后端服务后，访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 业务流程

### 学习进度跟进流程
1. 学生练习题目，系统自动记录练习结果
2. 系统根据完成率和未练习天数自动评估风险等级
3. 教师/管理层查看风险学生列表
4. 教师与学生进行沟通（消息记录）
5. 教师提交复核结论，可调整风险等级
6. 学生查看待办事项和沟通消息

### 提醒规则
- 完成率低于阈值触发对应风险等级
- 连续多天未练习触发提醒
- 定时任务每小时自动评估风险
- 每天发送练习提醒

## 数据库设计

核心数据表：
- `users` - 用户表
- `courses` - 课程表
- `chapters` - 章节表
- `questions` - 题目表
- `tags` - 标签表
- `question_tags` - 题目标签关联
- `study_progresses` - 学习进度
- `practice_records` - 练习记录
- `reminder_rules` - 提醒规则
- `reminder_records` - 提醒记录
- `risk_records` - 风险变更记录
- `communications` - 沟通记录
- `review_conclusions` - 复核结论
- `todo_items` - 待办事项
