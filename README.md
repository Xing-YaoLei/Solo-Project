# 合规审计制度检查趋势看板

基于 Python Dash + Plotly + Pandas + PostgreSQL + Celery 构建的合规审计制度检查追踪看板系统。

## 功能特性

### 数据处理层
- **邮件材料处理**：解析邮件主题、正文、附件，自动提取关键词与所属部门
- **权限日志处理**：规范化用户操作日志，统一操作类型与部门编码
- **审计底稿处理**：结构化导入审计工作底稿数据
- **数据合并流水线**：按部门、时间窗口、关键词匹配关联三类数据，生成抽样记录
- **批次管理**：每次数据导入自动记录批次号、开始/完成时间、成功/失败记录数

### 分析展示层（4大核心图表）
1. **检查清单分布**：各合规检查类别的抽样数量柱状图
2. **抽样记录漏斗**：从抽样总数→已关联证据→处理中→已完成→证据缺失的漏斗图
3. **整改计划排行**：按优先级排序的 Top10 整改计划横向条形图
4. **风险等级变化**：风险等级变更时间线 / 当前风险分布环形图

### 权限与交互
- **角色权限**：
  - 管理层 / 管理员：查看全量数据总览
  - 一线审计人员：仅查看分配给自己的抽样覆盖范围
- **证据缺失注释**：抽样记录可添加注释，支持标记为"证据缺失"
- **状态跟踪**：待处理 / 处理中 / 已完成 / 证据缺失
- **风险等级变更历史**：记录每次风险等级调整的原因与时间

## 项目结构

```
MP0471/
├── app/
│   ├── __init__.py
│   ├── config.py                  # 配置（数据库、Redis、密钥）
│   ├── database.py                # SQLAlchemy 引擎与会话
│   ├── models.py                  # 数据模型（用户、批次、抽样、整改等）
│   ├── celery_app.py              # Celery 应用配置
│   ├── services/
│   │   ├── batch_service.py       # 批次管理
│   │   ├── email_service.py       # 邮件材料解析与导入
│   │   ├── permission_service.py  # 权限日志处理
│   │   ├── workpaper_service.py   # 审计底稿处理
│   │   ├── merge_service.py       # 数据合并生成抽样记录
│   │   ├── query_service.py       # 看板数据查询接口
│   │   └── sample_service.py      # 抽样记录操作（注释/状态/指派）
│   ├── tasks/
│   │   └── import_tasks.py        # Celery 异步导入任务
│   └── dash_app/
│       ├── server.py              # Flask + Flask-Login 登录服务
│       ├── layouts.py             # 页面布局组件
│       ├── charts.py              # Plotly 图表生成
│       ├── callbacks.py           # Dash 交互回调
│       └── app.py                 # Dash 应用主入口
├── scripts/
│   └── seed_data.py               # 示例数据初始化脚本
├── run.py                         # 应用启动入口
├── requirements.txt
├── .env.example
├── setup.sh
└── README.md
```

## 快速开始

### 环境要求
- Python 3.10+
- PostgreSQL 12+
- Redis 6+

### 一键安装
```bash
chmod +x setup.sh
./setup.sh
```

### 手动安装

```bash
# 1. 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 修改数据库和 Redis 连接

# 4. 初始化数据库和示例数据
python scripts/seed_data.py

# 5. 启动 Celery Worker（可选，用于异步导入）
celery -A app.celery_app.celery_app worker --loglevel=info

# 6. 启动 Web 应用
python run.py
```

访问 http://localhost:8050

### 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|--------|------|------|
| admin | admin123 | 系统管理员 | 查看全部数据 |
| manager | manager123 | 管理层 | 查看全部数据 |
| auditor1 | auditor123 | 一线审计 | 仅查看分配给自己的数据（财务部） |
| auditor2 | auditor123 | 一线审计 | 仅查看分配给自己的数据（采购部） |
| auditor3 | auditor123 | 一线审计 | 仅查看分配给自己的数据（人事部） |

## 数据导入格式

### 邮件材料 CSV/Excel 列
- `subject` / `主题`：邮件标题
- `sender` / `发件人`：发件人地址
- `recipients` / `收件人`：收件人列表
- `body` / `正文` / `content`：邮件正文
- `sent_at` / `发送时间` / `date`：发送时间
- `attachments` / `附件`：附件列表（可选）

### 权限日志 CSV/Excel 列
- `user_identifier` / `用户ID` / `user_id`：用户标识
- `user_name` / `用户名` / `user`：用户名
- `department` / `部门` / `dept`：所属部门
- `action` / `操作` / `行为`：操作类型
- `resource` / `资源` / `target`：操作对象
- `action_time` / `操作时间` / `timestamp`：操作时间

### 审计底稿 CSV/Excel 列
- `workpaper_id` / `底稿编号`：底稿编号
- `title` / `标题` / `name`：底稿标题
- `audit_period` / `审计期间` / `period`：审计期间
- `department` / `部门` / `dept`：所属部门
- `checklist_item` / `检查项`：对应检查项
- `finding` / `发现问题`：审计发现
- `workpaper_date` / `底稿日期` / `date`：底稿日期
