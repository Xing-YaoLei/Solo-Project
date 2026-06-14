# 青少年培训续费跟进系统

基于 Nuxt 3 + Naive UI + Django REST + PostgreSQL + MinIO 的青少年培训续费跟进管理系统。

## 技术栈

### 前端
- **框架**: Nuxt 3 (Vue 3)
- **UI 组件**: Naive UI
- **状态管理**: Pinia
- **图表**: ECharts + vue-echarts
- **HTTP 客户端**: Axios
- **日期处理**: Day.js

### 后端
- **框架**: Django 4.2 + Django REST Framework
- **数据库**: PostgreSQL
- **对象存储**: MinIO
- **认证**: JWT (djangorestframework-simplejwt)
- **Excel 导出**: openpyxl

## 核心功能

### 1. 续费跟进台
- 统一管理所有续费跟进任务
- 支持按状态、优先级、咨询师筛选
- 跟进任务状态流转：待跟进 → 跟进中 → 已完成/已续费/已关闭
- 支持手动创建跟进任务和自动触发

### 2. 记录详情页
- **成绩反馈**: 查看和添加学员成绩反馈记录
- **提醒规则**: 展示系统生效的提醒规则
- **课程章节**: 查看课程的所有章节内容
- **跟进记录**: 时间线形式展示跟进历史
- **变更日志**: 作业记录改动时保留前后值、原因、动作、关闭时间

### 3. 进度落后提醒
- 配置提醒规则（进度落后、续费到期、成绩偏低、长期不活跃）
- 自动检测进度落后学员并创建跟进任务
- 通知对应负责人（咨询师/老师）

### 4. 月底复盘
- 完成率统计
- 状态分布、优先级分布图表
- 平均学习进度
- 历史复盘记录查询

### 5. 下载导出
- 导出 Excel 格式报表
- 导出文件包含：筛选条件、生成时间、操作人
- 下载记录可追溯

## 项目结构

```
MP0123/
├── backend/                    # 后端 Django 项目
│   ├── apps/
│   │   ├── users/              # 用户管理模块
│   │   ├── courses/            # 课程管理模块
│   │   ├── assignments/        # 作业管理模块（含变更日志）
│   │   ├── followups/          # 续费跟进模块
│   │   ├── notifications/      # 通知模块
│   │   └── reports/            # 报表模块
│   ├── config/                 # Django 配置
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/                   # 前端 Nuxt 3 项目
    ├── pages/
    │   ├── login.vue           # 登录页
    │   ├── dashboard.vue       # 工作台
    │   ├── followups/          # 续费跟进台
    │   ├── reminder-rules/     # 提醒规则
    │   └── reports/            # 月底复盘
    ├── components/             # 公共组件
    ├── composables/            # 组合式函数
    ├── stores/                 # Pinia 状态
    ├── assets/                 # 静态资源
    ├── layouts/                # 布局
    ├── nuxt.config.ts
    └── package.json
```

## 快速开始

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 修改 .env 中的数据库配置等

# 数据库迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动服务
python manage.py runserver
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 数据库配置

确保 PostgreSQL 已启动，并创建对应的数据库：

```sql
CREATE DATABASE youth_training;
```

### MinIO 配置（可选）

如需使用文件存储功能，启动 MinIO 服务：

```bash
minio server /data --console-address ":9001"
```

## API 接口

### 认证
- `POST /api/auth/users/login/` - 登录
- `GET /api/auth/users/me/` - 获取当前用户信息

### 续费跟进
- `GET /api/followups/follow-ups/` - 跟进列表
- `POST /api/followups/follow-ups/` - 创建跟进
- `GET /api/followups/follow-ups/{id}/` - 跟进详情
- `POST /api/followups/follow-ups/{id}/start/` - 开始跟进
- `POST /api/followups/follow-ups/{id}/mark_renewed/` - 标记已续费
- `POST /api/followups/follow-ups/{id}/close/` - 关闭跟进
- `POST /api/followups/follow-ups/check_progress_and_create_reminders/` - 检测进度并创建提醒

### 提醒规则
- `GET /api/followups/reminder-rules/` - 规则列表
- `POST /api/followups/reminder-rules/` - 创建规则

### 作业与变更日志
- `GET /api/assignments/submissions/` - 作业提交列表
- `POST /api/assignments/submissions/{id}/grade/` - 批改作业
- `GET /api/assignments/change-logs/` - 变更日志列表
- `POST /api/assignments/submissions/{id}/close_log/` - 关闭日志

### 报表
- `GET /api/reports/monthly-reviews/completion_rate/` - 月度完成率
- `POST /api/reports/monthly-reviews/export_follow_ups/` - 导出跟进记录
- `POST /api/reports/monthly-reviews/export_monthly_report/` - 导出月度报告
- `GET /api/reports/downloads/` - 下载记录

## 核心设计说明

### 作业变更日志
作业记录的任何改动（成绩、反馈、状态等）都会自动记录到变更日志表中，保留：
- 变更字段
- 变更前值
- 变更后值
- 变更原因
- 执行动作
- 操作人
- 关闭时间

### 提醒规则引擎
支持多种触发类型：
- 进度落后：课程进度低于阈值时触发
- 续费到期：续费日期临近时触发
- 成绩偏低：作业/考试分数低于阈值时触发
- 长期不活跃：学员长时间无操作时触发

### 下载记录追溯
所有导出的文件都会记录：
- 筛选条件（JSON 格式）
- 生成时间
- 操作人
- 文件类型
