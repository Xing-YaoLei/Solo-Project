# 养老护理入住评估趋势看板

基于 Python Dash + Plotly + Pandas + PostgreSQL + Celery 构建的养老护理入住评估趋势分析看板。

## 技术栈

| 组件 | 技术选型 | 用途 |
|------|----------|------|
| Web框架 | Dash (Flask) | 交互式看板前端 |
| 图表库 | Plotly | 数据可视化 |
| 数据处理 | Pandas / NumPy | 数据清洗、聚合分析 |
| 数据库 | PostgreSQL | 业务数据持久化 |
| 异步任务 | Celery + Redis | 数据同步、异常检测、缓存刷新 |
| UI组件 | Dash Bootstrap Components | 响应式布局 |

## 核心功能

### 1. 入住评估趋势看板
- 每日平均护理评分趋势图（双Y轴叠加评估人数）
- 护理等级分布饼图
- 各等级评分箱线图
- 月度护理等级堆叠趋势图

### 2. 异常标记（看板刷新时自动检测）
- 🔔 **门禁记录延迟**: 同步时间 > 3600秒自动标黄
- ❌ **护理终端缺失**: 当日应有护理项未记录标红
- 🔄 **收费口径变化**: 版本号变更自动标蓝

### 3. 常用视图
- **老人档案**: 基本信息、紧急联系人、房间号
- **护理等级**: 历史评估曲线、当前等级标识
- **用药清单**: 药品名称、剂量、频次、给药途径
- **复盘备注**: 支持按类型添加备注（常规评估/跌倒事件/护理调整）

### 4. 跌倒事件处理
- 按损伤等级自动计算影响时间范围：
  - 无损伤: 3天
  - 轻伤: 7天
  - 中度: 14天
  - 重伤: 30天
- 趋势图上红色虚线标注跌倒时间，阴影区域标记影响范围

### 5. 数据导出
- 下载评估报告（附带护理达标计算规则）
- 下载口径差异表（保留差异，不自动覆盖）
- 单独导出护理达标计算规则

### 6. 口径冲突处理
- 护理终端实际执行 vs 收费系统计费口径自动比对
- 冲突记录独立保存，不做自动覆盖
- 支持按日期范围筛选、仅看未解决项
- 黄色高亮标记未解决冲突

## 项目结构

```
MP0253/
├── app.py                          # Dash 应用入口
├── init_db.py                      # 数据库建表脚本
├── requirements.txt                # Python 依赖
├── .env.example                    # 环境变量模板
├── run_worker.sh                   # Celery Worker 启动脚本
├── run_beat.sh                     # Celery Beat 启动脚本
├── app/
│   ├── models/
│   │   └── schema.py              # SQLAlchemy ORM 模型（10张核心表）
│   ├── services/
│   │   ├── data_processor.py      # 数据处理：清洗、冲突检测、达标率计算
│   │   └── export_service.py      # Excel 导出服务
│   ├── tasks/
│   │   ├── sync_tasks.py          # 数据同步任务（门禁/护理终端/收费）
│   │   ├── detection_tasks.py     # 异常检测任务
│   │   └── refresh_tasks.py       # 缓存刷新任务
│   ├── callbacks/
│   │   ├── trend_callbacks.py     # 趋势图交互回调
│   │   ├── elder_callbacks.py     # 老人档案交互回调
│   │   └── export_callbacks.py    # 导出与差异表回调
│   ├── layouts/
│   │   └── main_layout.py         # 页面布局定义
│   ├── utils/
│   │   ├── database.py            # 数据库连接配置
│   │   ├── celery_app.py          # Celery 配置与定时任务
│   │   └── sample_data.py         # 示例数据生成器
│   └── data/                      # 缓存数据目录
└── tests/                         # 测试目录
```

## 数据库表设计

| 表名 | 说明 |
|------|------|
| elder_profiles | 老人档案 |
| admission_assessments | 入住评估记录 |
| access_records | 门禁记录（含延迟标记） |
| care_terminal_records | 护理终端记录（含缺失标记） |
| billing_records | 收费系统记录（含口径版本） |
| fall_incidents | 跌倒事件（含影响时间范围） |
| medications | 用药清单 |
| review_notes | 复盘备注 |
| data_sync_status | 系统同步状态 |
| caliber_conflicts | 口径冲突差异表 |

## 快速开始

### 1. 安装依赖

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 配置数据库和Redis连接信息
```

### 3. 初始化数据库

```bash
# 确保PostgreSQL已启动并创建数据库
python init_db.py
```

### 4. 生成示例数据（可选）

```bash
python -m app.utils.sample_data
```

### 5. 启动 Celery Worker（异步任务）

```bash
# 确保Redis已启动
./run_worker.sh
```

### 6. 启动 Celery Beat（定时调度）

```bash
./run_beat.sh
```

### 7. 启动 Dash 看板

```bash
python app.py
# 访问 http://localhost:8050
```

## Celery 定时任务

| 任务 | 频率 | 说明 |
|------|------|------|
| sync_access_records | 每5分钟 | 同步门禁记录，检测延迟 |
| sync_care_terminal_records | 每10分钟 | 同步护理终端记录，检测缺失 |
| sync_billing_records | 每小时 | 同步收费记录，检测口径变更 |
| detect_all_anomalies | 每15分钟 | 执行全部异常检测 |
| refresh_dashboard_cache | 每30分钟 | 刷新看板缓存 |

## 护理达标计算规则

### 护理等级标准
| 等级 | 护理评分 ≥ | 每日护理项数 |
|------|-----------|-------------|
| 自理 | 90分 | 5项 |
| 半自理 | 60分 | 8项 |
| 全护理 | 30分 | 12项 |
| 特护 | 0分 | 15项 |

### 达标率公式
```
达标率 = (实际完成护理项数 / 预期护理项总数) × 100%
```
