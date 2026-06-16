# 药店连锁处方审核趋势看板

药店连锁处方审核全流程追踪与数据分析平台，覆盖从收银系统处方导入、会员档案关联、医保结算对接，到处方审核、药师意见、批号效期监控、回访管理的完整链路。

## 技术栈

- **展示层**: Python Dash + Plotly
- **数据处理**: Pandas + NumPy
- **数据库**: PostgreSQL (SQLAlchemy ORM)
- **异步任务**: Celery + Redis
- **UI框架**: Dash Bootstrap Components (Flatly主题)

## 功能模块

### 1. 数据导入层（带批次追踪）
- **收银系统导入** (`app/data/pos_importer.py`): 支持CSV/Excel，自动映射中英文列名，批量导入处方及药品明细
- **会员记录合并** (`app/data/member_merger.py`): 会员档案导入+自动关联已有处方
- **医保接口对接** (`app/data/insurance_client.py`): 医保结算数据批量导入和单笔API同步
- **批次管理** (`app/data/batch_manager.py`): 每轮导入生成唯一批次号，记录成功/失败数、源系统、耗时

### 2. 异步任务（Celery）
- `task_import_pos`: 收银数据异步导入
- `task_import_member`: 会员数据异步导入+处方关联
- `task_import_insurance`: 医保数据异步导入
- `task_compute_daily_metrics`: 每日审核指标计算
- `task_expiry_monitor`: 批号效期监控预警
- `task_auto_assign_follow_ups`: 自动生成回访任务

### 3. 分析区域
- **处方照片分布**: 各处方照片张数堆叠柱状图 + 照片质量（清晰/不清晰）环形图
- **药师意见漏斗**: 审核通过、剂量问题、药物相互作用、重复用药、禁忌症、信息不完整、照片不清
- **批号效期排行**: 近效期药品横向条形图，按剩余天数紧急程度分色
- **会员档案变化**: 会员总数/新增会员双轴趋势图
- **门店对比**: 各门店处方量/通过量/通过率
- **导入批次**: 历史批次执行记录

### 4. 处方注释与回访
- 照片不清晰、信息不完整时可写注释，支持多种注释类型
- 注释关联到处方，标记是否已解决
- 管理层可查看全部回访任务；执行角色仅看到分配给自己的回访
- 任务状态流转：待处理 → 进行中 → 已完成

### 5. 角色权限控制
| 角色 | 视图范围 |
|------|---------|
| 管理层 (management) | 全量总览、所有门店数据、全部分析模块 |
| 药师 (pharmacist) | 全量总览、审核分析 |
| 执行角色 (executor) | 仅分内回访任务列表，看不到其他用户任务和全局指标 |

## 目录结构

```
MP0231/
├── app.py                      # Dash应用入口，登录+路由
├── worker.py                   # Celery Worker入口
├── config.py                   # 配置管理
├── requirements.txt
├── app/
│   ├── models/
│   │   ├── database.py         # SQLAlchemy引擎与会话
│   │   └── models.py           # 全部ORM模型
│   ├── data/
│   │   ├── batch_manager.py    # 批次管理
│   │   ├── pos_importer.py     # 收银系统导入
│   │   ├── member_merger.py    # 会员合并
│   │   └── insurance_client.py # 医保对接
│   ├── tasks/
│   │   ├── celery_app.py       # Celery配置
│   │   └── data_tasks.py       # 异步任务定义
│   └── dashboards/
│       ├── data_service.py     # 看板数据查询服务
│       ├── charts.py           # Plotly图表工厂
│       ├── management_dashboard.py  # 管理层总览布局+回调
│       └── executor_dashboard.py    # 执行角色回访布局+回调
├── scripts/
│   ├── init_db.py              # 数据库初始化
│   └── seed_data.py            # 示例数据生成
└── data/uploads/               # 上传文件目录
```

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 配置环境
```bash
cp .env.example .env
# 编辑 .env，填入 PostgreSQL 和 Redis 连接信息
```

### 3. 初始化数据库
```bash
# 确保 PostgreSQL 已启动并创建数据库
# CREATE DATABASE prescription_review;

python scripts/init_db.py
```

### 4. 生成示例数据（可选）
```bash
python scripts/seed_data.py 300   # 生成300条处方示例数据
```

### 5. 启动服务
```bash
# 终端1: 启动 Redis
redis-server

# 终端2: 启动 Celery Worker
celery -A worker.celery_app worker --loglevel=info -c 2

# 终端3: 启动 Celery Beat（定时任务）
celery -A worker.celery_app beat --loglevel=info

# 终端4: 启动 Dash Web 服务
python app.py
```

访问 http://localhost:8050

### 6. 默认账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理层 | admin | admin123 |
| 执行角色 | worker | worker123 |
| 药师 | pharmacist | pharm123 |

## 数据库模型概览

| 表名 | 用途 |
|------|------|
| `pharmacies` | 连锁门店 |
| `users` | 用户+角色 |
| `members` | 会员档案 |
| `prescriptions` | 处方主表（状态/金额/审核） |
| `prescription_items` | 处方药品明细（批号/效期） |
| `prescription_photos` | 处方照片（质量评分） |
| `pharmacist_reviews` | 药师审核意见 |
| `prescription_notes` | 处方澄清注释 |
| `follow_ups` | 回访任务（按人分配） |
| `insurance_settlements` | 医保结算 |
| `import_batches` | 数据导入批次 |
