# 汽车维修预约进厂风险监测图

基于 Python Dash + Plotly + Pandas + PostgreSQL + Celery 构建的汽车维修预约进厂风险监测与分析系统。

## 功能特性

### 📊 风险监测仪表盘
- **预约进厂趋势图**：每日预约数量、到店率、风险等级分布
- **返修率趋势分析**：按日统计返修率，高风险线自动预警
- **维修类型分布**：各维修类型工单数量与金额占比
- **KPI 卡片**：今日预约、待处理工单、返修率、待处理异常等关键指标

### 🔧 工单管理与下钻
- 工单列表支持筛选、排序、搜索
- **一键下钻**：点击工单行可查看详细信息
- **配件库存**：查看工单关联配件的实时库存状态
- **报价单**：关联报价单信息
- **原始样本**：完整的工单原始数据视图
- **配件缺货染色**：缺货配件/工单自动黄色高亮标注

### 📝 备注系统
- 工单、配件、保险单据等支持添加备注
- 备注支持置顶标记
- 实时添加，无需刷新

### ⚠️ 异常清单
- 多维度异常检测：配件缺货、高返修工单、保险问题、数据错误
- 按类型分类查看（全部/配件缺货/高返修/保险问题/数据错误）
- 严重程度分级：严重/高/中/低
- 支持状态跟踪（待处理/处理中/已解决/已关闭）

### 📤 导出功能
- **返修率报告导出**：导出 Excel 格式报告
- **保留筛选口径**：导出文件包含统计周期、统计口径、筛选条件说明
- **多 Sheet 结构**：统计概览、每日返修率、返修工单明细、维修类型分布

### 🔄 数据同步 (Celery)
- 配件系统同步
- 维修工单同步
- 保险材料同步
- 自动异常检测
- 同步日志记录

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Dash 2.x | Python 数据可视化框架 |
| 图表库 | Plotly 5.x | 交互式图表 |
| 数据处理 | Pandas 2.x | 数据清洗与分析 |
| 数据库 | PostgreSQL | 关系型数据库 |
| ORM | SQLAlchemy 2.x | 数据库操作 |
| 任务队列 | Celery 5.x | 异步任务调度 |
| 消息代理 | Redis | Celery Broker |
| UI 组件 | Dash Bootstrap Components | Bootstrap 风格组件 |

## 项目结构

```
MP0355/
├── app/                          # Dash 应用
│   ├── __init__.py
│   ├── dash_app.py               # Dash 应用初始化
│   ├── layouts/                  # 页面布局
│   │   ├── __init__.py
│   │   ├── app_layout.py         # 总布局（单页应用）
│   │   ├── main_dashboard.py     # 主仪表盘
│   │   └── work_order_detail.py  # 工单详情页
│   └── callbacks/                # 回调函数
│       ├── __init__.py
│       ├── dashboard_callbacks.py # 仪表盘回调
│       ├── detail_callbacks.py   # 详情页回调
│       └── export_callbacks.py   # 导出功能回调
├── models/                       # 数据模型
│   ├── __init__.py
│   ├── database.py               # 数据库连接
│   ├── appointment.py            # 预约模型
│   ├── work_order.py             # 工单模型
│   ├── parts.py                  # 配件模型
│   ├── insurance.py              # 保险模型
│   ├── quote.py                  # 报价单模型
│   ├── anomaly.py                # 异常清单模型
│   ├── remark.py                 # 备注模型
│   └── sync_log.py               # 同步日志模型
├── tasks/                        # Celery 任务
│   ├── __init__.py
│   ├── celery_app.py             # Celery 应用
│   ├── utils.py                  # 任务工具
│   ├── sync_parts.py             # 配件同步
│   ├── sync_work_orders.py       # 工单同步
│   ├── sync_insurance.py         # 保险同步
│   └── anomaly_detection.py      # 异常检测
├── data/                         # 数据层
│   ├── __init__.py
│   ├── queries.py                # 数据查询函数
│   └── seed_data.py              # 示例数据脚本
├── config/                       # 配置
│   ├── __init__.py
│   └── settings.py               # 配置项
├── assets/                       # 静态资源
├── run.py                        # 应用入口
├── requirements.txt              # 依赖包
├── .env.example                  # 环境变量示例
└── README.md                     # 项目说明
```

## 快速开始

### 1. 环境准备

```bash
# 克隆或进入项目目录
cd MP0355

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库和 Redis 连接：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/auto_repair
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 3. 初始化数据库和示例数据

```bash
# 初始化数据库表
python -c "from models import init_db; init_db()"

# 生成示例数据
python data/seed_data.py
```

### 4. 启动服务

**启动 Dash 应用：**
```bash
python run.py
```

访问 http://localhost:8050 查看应用。

**启动 Celery Worker（可选，用于数据同步）：**
```bash
celery -A tasks.celery_app worker --loglevel=info
```

**启动 Celery Beat（可选，用于定时同步）：**
```bash
celery -A tasks.celery_app beat --loglevel=info
```

## 核心功能详解

### 风险等级判定
- **高风险**：返修次数 ≥ 2 次，或配件严重缺货
- **中风险**：返修 1 次，或库存低于安全线
- **低风险**：正常工单

### 配件缺货染色规则
- 库存 ≤ 安全库存：标记为缺货（黄色背景）
- 库存 = 0：严重缺货（红色预警）
- 工单关联缺货配件：整行黄色高亮

### 导出报告口径
- 返修率 = 返修工单数 / 完工工单数 × 100%
- 统计周期：以筛选条件的日期范围为准
- 时间维度：按工单创建日期统计
- 报告包含：统计概览、每日趋势、明细数据、类型分布

### 数据同步机制
- **增量同步**：默认模式，仅同步变更数据
- **全量同步**：可手动触发，同步全部数据
- **自动调度**：每 30 分钟自动同步一次
- **异常检测**：每次同步后自动运行异常检测

## 使用说明

### 日常复盘流程
1. 打开仪表盘，查看 KPI 概览
2. 关注返修率趋势，识别异常波动
3. 查看异常清单，处理待处理异常
4. 点击工单下钻，查看详细信息
5. 添加备注记录复盘结论
6. 导出返修率报告存档

### 工单下钻操作
1. 在工单列表中点击任意一行
2. 页面切换到工单详情视图
3. 查看工单基本信息、项目明细
4. 切换标签页查看：配件库存 / 报价单 / 原始样本
5. 在右侧备注栏添加备注
6. 点击「返回仪表盘」回到主页面

## 配置说明

### 风险阈值配置
在 `config/settings.py` 中可调整：

```python
RISK_THRESHOLDS = {
    "high_risk_repair_rate": 0.15,       # 高风险返修率阈值 (15%)
    "medium_risk_repair_rate": 0.08,     # 中风险返修率阈值 (8%)
    "parts_shortage_warning": 3,         # 配件缺货预警数量
    "appointment_delay_warning_hours": 2, # 预约延迟预警(小时)
}
```

### 导出配置
```python
EXPORT_CONFIG = {
    "retain_filter_context": True,       # 保留筛选上下文
    "default_export_format": "xlsx",     # 默认导出格式
    "include_caliber_note": True,        # 包含口径说明
}
```

## 数据库表说明

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| appointments | 预约进厂 | 预约单号、车牌号、预约时间、风险等级、状态 |
| work_orders | 维修工单 | 工单号、维修类型、状态、技师、是否返修、缺货标记 |
| work_order_items | 工单项目 | 项目类型、编码、名称、数量、单价、状态 |
| parts | 配件档案 | 配件编码、名称、分类、库存、安全库存、是否缺货 |
| parts_stock_records | 库存变动记录 | 变动类型、数量、结存、关联单据 |
| insurance_documents | 保险材料 | 保险公司、保单号、理赔金额、状态、材料清单 |
| quotes | 报价单 | 报价单号、总金额、状态、有效期、明细 |
| anomaly_records | 异常清单 | 异常类型、严重度、状态、关联单据、处理结果 |
| remarks | 备注 | 关联类型、内容、作者、是否置顶 |
| sync_logs | 同步日志 | 任务名、状态、记录数、耗时、错误信息 |

## 扩展开发

### 添加新的同步任务
1. 在 `tasks/` 目录下创建新文件
2. 使用 `@celery_app.task` 装饰器定义任务
3. 使用 `@sync_task_decorator` 自动记录同步日志
4. 在 `tasks/__init__.py` 中导出任务

### 添加新的图表
1. 在 `app/layouts/` 中添加图表组件
2. 在 `app/callbacks/` 中添加对应回调
3. 在 `data/queries.py` 中添加数据查询函数

## 许可证

MIT License
