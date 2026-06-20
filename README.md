# 活动票务 / 演出票务 漏斗分析报表

团队例会专用票务漏斗分析系统，覆盖从赞助到核销的全链路数据追踪。

## 技术栈

- **前端**: Python Dash + Plotly + Dash Bootstrap Components
- **数据处理**: Pandas + NumPy
- **数据库**: PostgreSQL (默认 SQLite 可直接运行)
- **异步任务**: Celery + Redis
- **数据导出**: Excel (openpyxl) / CSV

## 功能特性

### 核心漏斗分析
- 赞助分配 → 报名 → 支付完成 → 核销入场 四级转化漏斗
- 实时 KPI 指标卡片展示
- 按活动、日期范围、票种、赞助级别多维度筛选

### 下钻分析
- 从赞助清单点击下钻查看详情
- **核销记录**: 按赞助商维度的核销明细
- **票种规则**: 各票种价格、销量、核销率
- **原始样本**: 订单级别的原始数据抽样

### 数据质量
- **异常清单**: 自动检测支付异常、闸机异常、订单异常、数据不匹配
- 严重程度分级 (error/warning/info)
- 异常记录可追踪处理状态

### 退票争议
- 退票争议订单单独染色标记 (红色高亮)
- 争议原因记录
- 争议订单在核销记录和原始样本中均有标识

### 备注功能
- 漏斗图旁快捷备注入口
- 支持多人备注，记录创建人
- 备注历史可追溯

### 报表导出
- 围绕核销效率为核心的导出
- 导出时自动带出筛选口径和生成时间
- 支持 Excel 和 CSV 格式
- 可选择导出内容：漏斗数据、核销效率、赞助清单、异常清单、票种分析

### 数据同步
- Celery 异步任务支持
- 支付流水、闸机记录、报名表三路同步
- 同步日志与异常统计

## 快速开始

### 方式一：快速体验 (SQLite)

```bash
# 安装依赖
pip install -r requirements.txt

# 初始化数据库和示例数据
python -c "from app.init_db import init_db; init_db()"
python -c "from app.utils.sample_data import generate_sample_data; generate_sample_data()"

# 启动应用
python run.py
```

访问 http://localhost:8050

### 方式二：完整部署 (PostgreSQL + Redis + Celery)

1. 配置环境变量
```bash
cp .env.example .env
# 修改 .env 中的数据库和 Redis 连接信息
```

2. 初始化数据库
```bash
python -c "from app.init_db import init_db; init_db()"
python -c "from app.utils.sample_data import generate_sample_data; generate_sample_data()"
```

3. 启动 Celery Worker
```bash
celery -A app.celery_app.celery_app worker --loglevel=info
```

4. 启动 Dash 应用
```bash
python run.py
```

## 项目结构

```
MP0413/
├── app/
│   ├── __init__.py
│   ├── config.py              # 配置管理
│   ├── database.py            # 数据库连接
│   ├── models.py              # SQLAlchemy 数据模型
│   ├── celery_app.py          # Celery 应用配置
│   ├── init_db.py             # 数据库初始化脚本
│   ├── dashboard/
│   │   ├── __init__.py
│   │   ├── app.py             # Dash 应用实例
│   │   ├── layouts.py         # 页面布局
│   │   ├── callbacks.py       # 交互回调
│   │   └── charts.py          # 图表生成
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── sync_tasks.py      # 数据同步任务
│   └── utils/
│       ├── __init__.py
│       ├── data_service.py    # 数据服务层
│       ├── anomaly_detector.py # 异常检测
│       └── sample_data.py     # 示例数据生成
├── requirements.txt
├── .env.example
├── run.py                     # 应用入口
├── setup.sh                   # 快速安装脚本
└── README.md
```

## 数据模型

### 核心表
- **activities**: 活动/演出信息
- **ticket_types**: 票种规则
- **sponsors**: 赞助清单
- **registrations**: 报名表/订单
- **payments**: 支付流水
- **gate_records**: 闸机核销记录
- **anomaly_records**: 异常清单
- **remarks**: 备注
- **sync_logs**: 同步日志

## 使用说明

### 团队例会看数口径
1. 默认展示所有活动汇总数据
2. 选择具体活动查看单活动漏斗
3. 关注 KPI 卡片四个核心指标
4. 查看转化漏斗各环节转化率
5. 点击赞助清单行下钻查看明细
6. 查看异常清单了解数据质量

### 退票争议处理
- 在原始样本和核销记录中，争议订单会以红色背景高亮显示
- 争议原因在异常清单中可查看

### 导出报表
1. 点击侧边栏「导出报表」按钮
2. 确认筛选口径和生成时间
3. 选择导出格式和内容
4. 点击「确认导出」下载文件
