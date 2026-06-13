# 健身私教课程消耗跟进系统 💪

> Fitness Private Training Course Consumption Tracking System

一个用于管理和跟踪健身私教课程消耗进度的全栈系统，支持课程管理、进度记录、月底复盘和进度落后通知等核心功能。

---

## ✨ 核心功能

### 1. 📚 记录页（课程详情页）
- **课程章节**：分层展示课程章节与小节
- **作业记录**：每个作业包含类型（力量/有氧/饮食/评估）、组数、次数、重量、时长
- **题目标签**：作业支持多标签标记（增肌/减脂/塑形/力量等），带颜色区分
- **进度变更历史**：每次进度改动**自动保留前后值**，包括操作人、时间、变更原因

### 2. 📊 月底复盘
- **完成率统计**：整体完成率、已完成/正常/落后人数分布、TOP落后榜
- **多维度筛选**：按教练、学员、课程、年月筛选
- **导出下载**：Excel导出时**自动保留筛选条件、生成时间、操作人信息**（3个独立sheet）
- **导出日志**：记录所有历史导出操作

### 3. 🔔 进度落后通知
- **自动检测**：Celery定时任务检测实际进度落后预期≥5%时，自动生成通知
- **通知角色**：自动发送到对应教练，并抄送管理员
- **处理记录**：处理时必须填写：
  - **落后原因**：记录导致进度落后的根因
  - **处理动作**：记录采取的解决措施
  - **关闭时间**：关闭时自动记录时间和操作人
- **通知状态**：待处理 → 处理中 → 已解决 → 已关闭

### 4. 🗂️ 其他功能
- 🔐 用户角色体系：管理员 / 运营经理 / 教练 / 学员
- 📈 工作台Dashboard：整体数据概览
- 📋 课程管理：创建课程、添加学员、设置周期与课时
- 🕑 全局进度记录查询：支持按课程/学员/关键词搜索

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 18 + TypeScript | 核心框架 |
| | TanStack Router | 路由管理（文件式+代码式） |
| | Ant Design 5 | UI组件库 |
| | TanStack Query | 服务端状态管理 |
| | Zustand | 客户端状态管理 |
| | TailwindCSS | 样式工具 |
| **后端** | FastAPI (Python) | 高性能API框架 |
| | SQLAlchemy 2.0 | ORM |
| | PostgreSQL | 关系型数据库 |
| | Celery + Redis | 异步任务队列 |
| | Pydantic v2 | 数据校验 |
| | Passlib + JWT | 认证鉴权 |
| | Pandas + openpyxl | Excel导出 |

---

## 📁 项目结构

```
MP0108/
├── backend/                          # FastAPI 后端
│   ├── app/
│   │   ├── api/                      # API路由层
│   │   │   └── routes/
│   │   │       ├── auth.py           # 认证接口
│   │   │       ├── users.py          # 用户接口
│   │   │       ├── courses.py        # 课程/章节/作业/标签接口
│   │   │       ├── progress.py       # 进度记录接口（保留前后值）
│   │   │       ├── review.py         # 月底复盘+导出接口
│   │   │       └── notifications.py  # 通知管理接口
│   │   ├── core/
│   │   │   ├── config.py             # 配置加载
│   │   │   ├── database.py           # 数据库连接
│   │   │   ├── security.py           # JWT+密码认证
│   │   │   └── celery_app.py         # Celery配置
│   │   ├── models/                   # SQLAlchemy ORM模型
│   │   ├── schemas/                  # Pydantic请求/响应模型
│   │   ├── services/                 # 业务服务层
│   │   ├── tasks/                    # Celery异步任务
│   │   │   └── progress_tasks.py     # 进度落后检测/通知生成
│   │   └── main.py                   # FastAPI入口
│   ├── scripts/
│   │   ├── init_db.py                # 数据库初始化+种子数据
│   │   └── run_celery.sh             # Celery启动脚本
│   ├── requirements.txt
│   ├── .env.example                  # 环境变量模板
│   └── start.sh                      # 一键启动后端
│
├── frontend/                         # React 前端
│   ├── src/
│   │   ├── api/                      # Axios API封装
│   │   ├── components/
│   │   │   └── Layout.tsx            # 主布局（侧边栏+顶栏）
│   │   ├── pages/
│   │   │   ├── Login.tsx             # 登录页
│   │   │   ├── Dashboard.tsx         # 工作台
│   │   │   ├── Courses.tsx           # 课程列表
│   │   │   ├── CourseDetail.tsx      # ⭐ 记录页（章节+作业+标签+变更历史）
│   │   │   ├── Records.tsx           # 全局进度记录查询
│   │   │   ├── Review.tsx            # ⭐ 月底复盘（完成率+导出）
│   │   │   └── Notifications.tsx     # ⭐ 通知管理（原因+动作+关闭）
│   │   ├── store/
│   │   │   └── auth.ts               # Zustand认证状态
│   │   ├── types/                    # TypeScript类型定义
│   │   ├── utils/                    # 工具函数
│   │   ├── router.tsx                # TanStack Router配置
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── start.sh                      # 一键启动前端
│
└── README.md
```

---

## 🗄️ 数据库核心表设计

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `users` | 用户 | role: admin/trainer/member/manager |
| `courses` | 课程 | trainer_id, total_sessions, start/end_date, status |
| `chapters` | 章节 | course_id, chapter_order, is_completed |
| `assignments` | 作业 | chapter_id, assignment_type, sets, reps, weight, is_completed |
| `tags` | 标签 | name, color |
| `assignment_tags` | 作业-标签关联 | 多对多 |
| `course_members` | 课程-学员关联 | expected_progress_rate, actual_progress_rate |
| `progress_records` | ⭐ 进度记录（审计） | old_progress, **new_progress**, operator_id, change_reason, consumed_sessions |
| `notifications` | ⭐ 进度落后通知 | expected/actual_progress, **delay_reason**, **action_taken**, resolved_at, **closed_at**, closed_by_id |
| `export_logs` | ⭐ 导出日志 | filter_conditions(JSON), generated_at, operator_id |

> 🔒 **关键设计**：
> - `progress_records` 表同时记录 `old_progress` 和 `new_progress`，实现**进度改动前后值保留**
> - `export_logs` 表将筛选条件以JSON格式存入 `filter_conditions`，包含生成时间、操作人

---

## 🚀 快速启动

### 前置依赖
- Python ≥ 3.10
- Node.js ≥ 18
- PostgreSQL ≥ 14
- Redis ≥ 6（用于Celery）

### 1️⃣ 配置数据库
```sql
-- 在PostgreSQL中执行
CREATE DATABASE fitness_tracker;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE fitness_tracker TO postgres;
```

### 2️⃣ 启动后端
```bash
cd backend

# 配置环境变量
cp .env.example .env
# 编辑 .env 修改数据库连接

# 一键启动（依赖安装+建表+种子数据+启动服务）
./start.sh

# 或手动执行：
pip install -r requirements.txt
python scripts/init_db.py     # 建表&初始化测试账号
uvicorn app.main:app --reload --port 8000
```

### 3️⃣ 启动前端（新终端）
```bash
cd frontend

# 一键启动
./start.sh

# 或手动：
npm install
npm run dev
```

### 4️⃣ 启动Celery（可选，用于自动进度检测）
```bash
cd backend
./scripts/run_celery.sh

# 手动触发检测任务（测试用）
celery -A app.core.celery_app.celery_app call app.tasks.progress_tasks.check_progress_behind
```

---

## 🔑 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | `admin` | `admin123` |
| 运营经理 | `manager` | `manager123` |
| 教练 | `trainer1` / `trainer2` | `trainer123` |
| 学员 | `member1` / `member2` / `member3` | `member123` |

---

## 🧭 系统使用指南

### 基本工作流
1. **管理员/经理** 创建课程，分配教练，添加学员
2. **教练** 在「课程详情页」添加章节和作业，打标签
3. **教练或学员** 完成作业时勾选，点击「记录进度」录入进度
4. 系统**自动保留**每次进度变更的**前后值**和操作人
5. **月底** 在「月底复盘」页筛选时间和人员，查看完成率统计
6. **导出Excel**，文件自动包含筛选条件、生成时间、操作人
7. 如果进度落后≥5%，Celery任务**自动生成通知**
8. **教练**在「进度通知」页处理：填写落后原因、处理动作
9. 问题解决后关闭通知，系统**自动记录关闭时间和操作人**

### Celery定时任务
可使用celery-beat或系统cron定时执行：
```python
# 每小时检测一次进度落后
check_progress_behind.apply_async(countdown=0)

# 每天凌晨更新预期进度
update_expected_progress.apply_async(countdown=0)
```

---

## 📡 API 速览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登录获取JWT |
| GET  | `/api/v1/courses` | 课程列表 |
| GET  | `/api/v1/courses/{id}` | 课程详情（含章节+作业+标签） |
| POST | `/api/v1/courses/{id}/chapters` | 创建章节 |
| POST | `/api/v1/courses/chapters/{id}/assignments` | 创建作业 |
| **POST** | **`/api/v1/progress`** | **记录进度（前后值自动存档）** |
| GET  | `/api/v1/progress/history/{course_id}/{member_id}` | 进度变更历史 |
| **POST** | **`/api/v1/review/monthly`** | **月度复盘统计** |
| **POST** | **`/api/v1/review/export/monthly`** | **导出Excel（含筛选条件）** |
| GET  | `/api/v1/notifications` | 落后通知列表 |
| **POST** | **`/api/v1/notifications/{id}/handle`** | **处理通知（原因+动作）** |
| POST | `/api/v1/notifications/{id}/close` | 关闭通知（记录关闭时间） |

> 完整API文档：启动后端后访问 `http://localhost:8000/docs`（Swagger UI）

---

## ⚠️ 注意事项

1. **生产部署**：请务必修改 `.env` 中的 `SECRET_KEY`
2. **Celery**：生产环境建议使用 `prefork` 或 `gevent` pool，而非 `solo`
3. **导出目录**：后端会自动创建 `exports/` 目录存放Excel文件，定期清理
4. **Redis**：如无Redis，也可将Celery broker改为SQLAlchemy transport
5. **权限**：学员角色默认只能看到自己的课程和进度

---

## 📝 License

MIT License

---

## 🎯 功能需求对照清单

| 需求 | 实现位置 | 状态 |
|------|---------|------|
| ✅ 记录页同时看到课程章节、作业、题目标签 | `CourseDetail.tsx` | ✅ 已完成 |
| ✅ 进度改动保留前后值 | `progress_records`表 + `progress.py` | ✅ 已完成 |
| ✅ 月底复盘看完成率 | `Review.tsx` + `review.py` | ✅ 已完成 |
| ✅ 下载保留筛选条件、生成时间、操作人 | `review.py`导出逻辑+`export_logs`表 | ✅ 已完成 |
| ✅ 进度落后通知相关角色 | `check_progress_behind` Celery任务 | ✅ 已完成 |
| ✅ 留下落后原因、处理动作 | `notifications`表+Notifications.tsx | ✅ 已完成 |
| ✅ 记录关闭时间 | `closed_at`字段自动写入 | ✅ 已完成 |
