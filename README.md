# 🏥 康复中心康复评估风险监测系统

基于 Python Dash + Plotly + Pandas + PostgreSQL + Celery 构建的康复评估风险监测看板。

## ✨ 核心功能

### 📊 风险监测图
- 实时展示5大核心指标趋势：训练完成率、收费表延迟率、病历完整度、打卡一致性、医保拒付率
- 综合风险评分（加权计算）
- **异常标记功能**：
  - 🔶 收费表延迟（橙色三角）
  - 🟧 病历系统缺失（橙色方块）
  - 🟪 打卡记录口径变化（紫色菱形）
  - ❌ 医保拒付（红色叉号）
- 高风险区域高亮显示
- 时间范围选择（7/14/30/90天）
- 指标筛选功能

### 📅 治疗日历视图
- 各类型治疗时长分布堆叠图
- 治疗明细列表
- 疼痛改善效果标记
- 治疗完成状态追踪

### 🏥 器械状态视图
- 器械使用率柱状图
- 器械状态分布饼图
- 器械统计卡片（总数、正常使用、平均使用率、待维护）
- 维护提醒和状态高亮

### 📝 护理日志视图
- 每日护理记录统计
- 异常记录高亮
- 护理措施和患者反应追踪

### 🔄 数据刷新与同步
- 手动刷新按钮
- 5分钟自动刷新
- Celery定时任务（每日凌晨执行）
  - 每日指标计算
  - 异常检测
  - 器械使用率更新
  - 医保趋势分析

### ⬇️ CSV下载功能
下载的CSV包含：
1. **指标定义表** - 每个指标的名称、计算公式、描述、数据来源
2. **训练完成率计算规则** - 5步详细计算说明
3. **每日指标数据** - 所有指标的时间序列数据
4. **异常标记与复盘记录** - 异常点与复盘说明关联展示

> **重要**：复盘说明与异常点关联展示，不分开存储，确保上下文完整。

### ⚠️ 医保拒付趋势标记
- 近4周 vs 前4周拒付率对比
- 异常升高时自动生成时间标记
- 严重程度分级（中/高）
- 关联相关医保申报记录

## 🏗️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | **Dash 2.17.1** + **Plotly 5.22.0** | 交互式看板和图表 |
| 样式 | **Dash Bootstrap Components** | 响应式UI |
| 数据处理 | **Pandas 2.2.2** + **NumPy 1.26.4** | 指标计算和分析 |
| 数据库 | **PostgreSQL** / **SQLite** | 数据持久化（默认 PostgreSQL） |
| PostgreSQL 驱动 | **psycopg v3** (`psycopg[binary]>=3.1,<4`) | SQLAlchemy 官方推荐驱动，Python 3.14 兼容 |
| ORM | **SQLAlchemy `>=2.0.36,<3`** | 数据库操作，修复 Python 3.14 `FastIntFlag` 兼容性 |
| 异步任务 | **Celery 5.4.0** + **Redis** | 定时任务和异步处理 |
| 缓存 | **Flask-Caching** | 性能优化 |

## 📁 项目结构

```
MP0213/
├── config/
│   ├── settings.py          # 全局配置（阈值、指标定义）
│   └── celery_config.py     # Celery配置
├── database/
│   ├── db.py                # 数据库连接
│   └── models.py            # 13个数据模型
├── etl/
│   ├── metrics_calculator.py   # 指标计算引擎
│   ├── anomaly_detector.py     # 异常检测器
│   └── data_service.py         # 数据服务层
├── tasks/
│   └── scheduled_tasks.py   # Celery定时任务
├── dashboard/
│   ├── app.py               # Dash主应用
│   └── callbacks/
│       └── main_callbacks.py # 交互回调
├── scripts/
│   ├── init_database.py     # 数据库初始化
│   └── mock_data_generator.py # 模拟数据生成
├── requirements.txt
├── run.py                   # 启动脚本
├── start.sh                 # 一键启动
└── test_system.py           # 系统测试
```

## 🚀 快速开始

> **数据库驱动说明**：当 `DATABASE_URL` 以 `postgresql://` 开头时，系统自动改写为 `postgresql+psycopg://`，由 **psycopg v3** 驱动连接（SQLAlchemy 官方推荐，Python 3.14 兼容）。已显式指定 `+psycopg` 的 URL 会原样保留。

### 前置条件
- PostgreSQL 服务运行在 `localhost:5432`，已创建数据库 `rehab_center`，账号 `postgres` / 密码 `password`
- Redis 服务运行在 `localhost:6379`（供 Celery 任务队列使用，无 Redis 时看板仍可运行，仅无法执行定时任务）

### 方式一：一键启动（推荐）
```bash
./start.sh
```
脚本会自动：
1. 创建并激活虚拟环境
2. 安装依赖：**SQLAlchemy `>=2.0.36,<3`** + **psycopg v3**（`psycopg[binary]>=3.1,<4`）+ Dash/Plotly/Pandas/Celery
3. 使用代码默认的 PostgreSQL 连接串：`postgresql://postgres:password@localhost:5432/rehab_center`
4. 验证 PostgreSQL 连接
5. 启动 Dash 应用

首次运行后需要手动初始化数据库与模拟数据（见方式二第 3–4 步）。

### 方式二：手动启动
```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 2. 安装依赖
#    - SQLAlchemy >=2.0.36,<3（Python 3.14 兼容性修复版本）
#    - psycopg[binary]>=3.1,<4（PostgreSQL 驱动，v3 纯 Python + C 加速）
pip install -r requirements.txt

# 3. 初始化数据库（在 PostgreSQL 中创建全部 13 张表）
DATABASE_URL=postgresql://postgres:password@localhost:5432/rehab_center \
python scripts/init_database.py

# 4. 生成模拟数据
DATABASE_URL=postgresql://postgres:password@localhost:5432/rehab_center \
python scripts/mock_data_generator.py

# 5. 启动应用（未设置 DATABASE_URL 时，默认仍使用上面的 PostgreSQL 连接串）
DATABASE_URL=postgresql://postgres:password@localhost:5432/rehab_center \
python run.py
```

> 💡 如需永久固化连接串，可复制 `.env.example` 为 `.env` 并修改其中的 `DATABASE_URL`。不提供 `.env` 时，系统以代码默认值为准。

### 方式三：快速体验（SQLite 模式，无需 PostgreSQL）
在项目根目录创建 `.env` 并写入：
```env
DATABASE_URL=sqlite:///rehab_center.db
```
然后执行：
```bash
pip install -r requirements.txt
python scripts/init_database.py
python scripts/mock_data_generator.py
python run.py
```
或直接 `./start.sh`，脚本会检测到 SQLite URL 并自动初始化本地数据库。

### 访问应用
打开浏览器访问：http://localhost:8050

## 📊 数据模型

### 核心业务表
| 表名 | 说明 |
|------|------|
| `patients` | 患者基础信息 |
| `rehab_assessments` | 康复评估记录 |
| `treatment_plans` | 治疗计划 |
| `treatment_records` | 治疗执行记录 |
| `medical_records` | 病历记录 |
| `payment_records` | 收费记录 |
| `attendance_records` | 打卡/出勤记录 |
| `equipment` | 康复器械 |
| `nursing_logs` | 护理日志 |
| `insurance_claims` | 医保申报 |

### 系统表
| 表名 | 说明 |
|------|------|
| `anomaly_markers` | 异常标记（含4种类型） |
| `review_notes` | 复盘记录（与异常关联） |
| `daily_metrics` | 每日指标快照 |

## ⚙️ 指标定义

所有指标定义在 `config/settings.py` 中，可根据实际业务调整。

### 训练完成率
- **公式**：`实际完成治疗次数 / 计划治疗次数 * 100%`
- **说明**：衡量患者按计划完成康复训练的比例
- **数据来源**：治疗计划表、治疗记录表

### 收费表延迟率
- **公式**：`延迟收费记录数 / 总收费记录数 * 100%`
- **阈值**：延迟超过3天标记为异常

### 病历完整度
- **公式**：`完整病历数 / 应建病历数 * 100%`
- **阈值**：缺失率超过10%标记为异常

### 打卡一致性
- **公式**：`1 - |实际打卡人数 - 系统登记人数| / 系统登记人数`
- **口径变化检测**：版本号变化或出席率波动超过50%标记

### 医保拒付率
- **公式**：`医保拒付金额 / 总申报金额 * 100%`
- **趋势检测**：近4周平均值超过前4周150%且>5%时标记

## 🔧 异常检测规则

在 `etl/anomaly_detector.py` 中实现4种异常检测：

1. **收费表延迟检测**：延迟天数 >= 配置阈值
2. **病历缺失检测**：不完整率 >= 配置阈值
3. **打卡口径变化检测**：两周版本号变化或出席率差异过大
4. **医保拒付趋势检测**：近4周 vs 前4周拒付率显著上升

## 📈 Celery定时任务

启动Celery worker和beat：
```bash
# 启动worker
celery -A config.celery_config worker --loglevel=info

# 启动定时任务调度
celery -A config.celery_config beat --loglevel=info
```

### 定时任务列表
| 任务 | 时间 | 说明 |
|------|------|------|
| 指标计算 | 02:00 | 计算前一天所有指标 |
| 异常检测 | 03:00 | 检测4类异常并生成标记 |
| 器械使用率 | 04:00 | 更新器械使用率 |
| 医保趋势分析 | 05:00 | 分析医保拒付趋势 |

## 🧪 系统测试

```bash
python test_system.py
```

测试内容包含：
- 配置加载
- 数据库连接
- 数据服务初始化
- 指标计算
- 异常检测
- CSV导出
- Dash应用导入
- 各视图数据获取

## 🔄 从静态报表迁移

本系统将康复评估从静态报表中拆分出来，实现：
1. **实时性**：数据自动刷新，异常实时告警
2. **可追溯**：每个数字都关联指标定义和计算规则
3. **关联性**：异常点与复盘记录绑定，上下文不丢失
4. **交互性**：支持多维度筛选、钻取和导出
5. **智能化**：自动异常检测和趋势分析

## 📝 使用说明

### 康复治疗师下载CSV后：
1. 打开CSV文件，首先查看「指标定义」部分
2. 了解每个指标的计算公式和数据来源
3. 查看「训练完成率计算规则」理解计算逻辑
4. 查看每日指标数据和异常标记
5. 异常标记后的复盘说明提供问题分析和整改措施

## 🔮 后续扩展

- 接入真实HIS系统接口
- 添加预测模型（风险预警）
- 移动端适配
- 多角色权限控制
- 自动生成分析报告
