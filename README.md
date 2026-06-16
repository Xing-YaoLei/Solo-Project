# 🦷 口腔诊所洁牙预约风险监测看板

## 项目概述

本系统是针对口腔诊所洁牙预约业务的风险监测看板，将洁牙预约数据从静态报表中独立拆分，实现实时风险监测与异常预警。

### 核心功能
- **HIS同步延迟监测** - 实时标注HIS数据同步延迟的时间点，避免趋势误判
- **影像系统缺失预警** - 检测洁牙完成后影像资料未上传的异常
- **收费口径变化标注** - 标记收费数据版本变更对统计口径的影响
- **爽约影响趋势分析** - 自动检测爽约率异常时段并高亮标注
- **复诊率自动计算** - 基于180天随访窗口期的复诊率统计
- **常用视图集成** - 治疗计划、随访任务、影像附件统一管理
- **复盘说明关联** - 异常点与复盘说明不分离，统一展示

### 技术选型
| 组件 | 技术栈 | 说明 |
|------|--------|------|
| Web看板 | **Python Dash** | 交互式数据可视化前端 |
| 图表库 | **Plotly** | 专业级统计图表绘制 |
| 数据处理 | **Pandas** | 结构化数据统计分析 |
| 数据存储 | **PostgreSQL** | 业务数据持久化存储 |
| 异步任务 | **Celery** | 后台监测任务调度执行 |
| 消息队列 | **Redis** | Celery Broker与缓存后端 |

---

## 快速开始

### 一键启动（推荐）

```bash
./start.sh
```

按菜单选项选择操作模式。首次运行时请先选择 **6) 创建数据库表结构**，然后选择 **5) 填充示例测试数据**，最后选择 **1) 仅启动看板**。

---

### 分步安装

#### 1. 创建虚拟环境并安装依赖

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置数据库连接、Redis、HIS接口等
```

#### 3. 初始化数据库

```bash
# 确保 PostgreSQL 服务已启动
python scripts/init_db.py
```

#### 4. 生成示例测试数据（可选）

```bash
python scripts/generate_sample_data.py
```

#### 5. 启动各服务

**方式A：仅启动看板（开发/演示用）**
```bash
python run_dashboard.py
```
访问 http://localhost:8050

**方式B：启动完整服务集群**

```bash
# 终端1: 启动 Redis
redis-server

# 终端2: 启动 Celery Worker
celery -A celery_tasks.app.celery_app worker --loglevel=info -Q sync_queue,monitor_queue,analytics_queue

# 终端3: 启动 Celery Beat (定时任务)
celery -A celery_tasks.beat_config beat --loglevel=info

# 终端4: 启动 Dash 看板
python run_dashboard.py
```

---

## 项目目录结构

```
MP0191/
├── config/                        # 配置模块
│   ├── __init__.py
│   └── settings.py                # 全局配置（阈值、接口地址等）
├── database/                      # 数据库模块
│   ├── __init__.py
│   ├── connection.py              # SQLAlchemy连接与会话管理
│   └── models.py                  # ORM数据模型定义
├── celery_tasks/                  # Celery异步任务
│   ├── __init__.py
│   ├── app.py                     # Celery应用实例
│   ├── beat_config.py             # 定时任务调度配置
│   └── tasks.py                   # 业务任务（同步/检测/分析）
├── data/                          # 数据查询与处理层
│   ├── __init__.py
│   └── queries.py                 # Pandas数据查询、复诊率计算
├── dashboard/                     # Dash看板模块
│   ├── __init__.py
│   ├── app.py                     # Dash应用与缓存配置
│   ├── components.py              # 图表组件定义（KPI/趋势/散点等）
│   └── layout.py                  # 页面布局与回调逻辑
├── scripts/                       # 运维脚本
│   ├── __init__.py
│   ├── init_db.py                 # 数据库表初始化
│   └── generate_sample_data.py    # 示例数据生成
├── run_dashboard.py               # 看板启动入口
├── run_celery.py                  # Worker启动入口
├── run_beat.py                    # Beat启动入口
├── start.sh                       # 一键启动脚本
├── requirements.txt               # Python依赖
├── .env.example                   # 环境变量模板
└── README.md                      # 本文档
```

---

## 核心监测指标说明

### 风险异常类型

| 异常类型 | 标识 | 判定规则 | 标注方式 |
|---------|------|---------|---------|
| **HIS同步延迟** | `HIS_DELAY` | 同步时间 - HIS创建时间 > 60分钟 | 趋势图竖虚线+散点图橙色 |
| **影像系统缺失** | `IMAGING_MISSING` | 洁牙完成7天后无对应影像记录 | 异常表青绿色+散点图青色 |
| **收费口径变化** | `BILLING_CALIBER` | 收费记录data_version ≠ "v1" | 异常表紫色+散点图紫色 |
| **爽约影响期** | 时段标注 | 单日爽约率 ≥ 5% 且持续≥2天 | 趋势图红色背景高亮 |

### 复诊率计算规则

> **复诊率 = (180天内复诊或完成随访的人数 / 已过180天随访期的洁牙人数) × 100%**

1. **随访窗口期**: 洁牙术后 180 天
2. **合格样本**: 洁牙日距统计日已超过180天（避免复诊率被低估）
3. **复诊判定**（满足任一）:
   - 同一患者窗口期内有新的非爽约预约/治疗记录
   - 关联随访任务状态为 `completed`
4. **详细说明**: 导出Excel的「复诊率计算规则」工作簿中包含完整定义

---

## Celery定时任务配置

| 任务名称 | 频率 | 队列 | 说明 |
|---------|------|------|------|
| `sync_his_data` | 每5分钟 | sync_queue | 拉取HIS洁牙预约数据 |
| `check_his_delay` | 每10分钟 | monitor_queue | 检测HIS同步延迟并打标 |
| `check_imaging_missing` | 每15分钟 | monitor_queue | 检测洁牙后影像上传缺失 |
| `check_no_show_impact` | 每小时 | analytics_queue | 分析爽约率异常时段 |
| `check_billing_caliber_change` | 每日02:00 | monitor_queue | 检查收费口径版本变更 |

---

## 数据导出说明

点击 **📥 导出Excel** 可下载完整数据包，包含以下工作表：

| 工作表 | 内容说明 |
|--------|---------|
| 洁牙预约明细 | 原始预约数据 + 异常标记 + 复盘说明 |
| 每日统计 | 按日聚合的预约/完成/爽约/异常统计 |
| 爽约影响时段 | 自动识别的爽约率异常时间段 |
| 复诊率计算规则 | **完整复诊率计算公式说明** + 本次统计结果 |
| 复诊率明细 | 每笔洁牙记录的复诊判定详情 |
| 随访任务 | 随访任务列表与完成状态 |
| 影像附件 | 影像记录上传状态（含缺失标记） |
| 治疗计划 | 治疗计划制定与执行情况 |

---

## 自定义配置

在 `config/settings.py` 中可调整以下参数：

```python
HIS_DELAY_THRESHOLD_MINUTES = 60      # HIS延迟告警阈值（分钟）
NO_SHOW_IMPACT_THRESHOLD = 0.05       # 爽约率影响阈值（5%）
FOLLOW_UP_DAYS = 180                  # 随访窗口期（天）
CLEANING_PROCEDURE_CODES = [...]      # 洁牙项目编码列表
CACHE_TIMEOUT = 300                   # 看板自动刷新间隔（秒）
```

---

## License

内部项目，未经授权不得外传。
