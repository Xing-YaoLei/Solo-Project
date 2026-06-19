# 旅游民宿房态管理趋势看板

> 基于 Python Dash + Plotly + Pandas + PostgreSQL + Celery 构建的旅游民宿房态管理综合分析看板，适用于复盘会议直接引用。

## 功能特性

### 📊 核心看板
- **房源日历热力图**：以日期×房源的矩阵视图展示房态，支持房态冲突单独染色（红色高亮）
- **入住率趋势图**：按天/周/月维度展示各房源入住率走势，含整体平均线和60%基准线
- **渠道订单分布**：饼图展示各OTA渠道订单占比（携程、美团、飞猪、去哪儿、Airbnb等）
- **数据质量监控**：异常值分布和严重程度统计，清洗时不直接吞掉异常值，全部留存可追溯
- **KPI指标卡片**：活跃房源数、平均入住率、已确认订单数、房态冲突数

### 🔍 下钻分析
从房源日历点击任意单元格，可下钻查看三个维度的详情：
1. **渠道订单**：该房源该日期涉及的所有OTA订单明细
2. **保洁任务**：该日期的保洁任务安排和执行状态
3. **原始样本**：OTA订单、收款流水、门锁记录的原始数据样本（含raw_data）

### 📝 备注管理
- 每个图表旁边设有备注入口按钮（💬图标）
- 下钻详情页内也可添加备注
- 备注按实体类型和实体ID关联存储

### ⚠️ 房态冲突检测
- 同一房源同一日期同一房型存在多个状态时自动标记冲突
- 日历中以红色（#dc3545）单独染色显示
- 冲突详情记录在conflict_detail字段（JSONB）
- 异常统一写入data_anomalies表，支持严重程度分级（error/warning/info）

### 💾 入住率报表导出
导出Excel文件围绕入住率，包含以下Sheet：
1. **筛选口径**：日期范围、统计维度、房源筛选、渠道筛选、生成时间（必带）
2. **汇总指标**：统计周期、平均入住率、累计占用间夜数、房态冲突数量、房源数量
3. **入住率明细**：按房源×日期的详细入住率数据
4. **OTA订单**：筛选范围内的全部渠道订单明细
5. **收款流水**：筛选范围内的全部交易流水
6. **保洁任务**：筛选范围内的全部保洁任务

### 🔄 异步数据同步
Celery任务覆盖三大数据源：
- **OTA订单同步** (`sync_ota_orders`)
- **收款流水同步** (`sync_payment_transactions`)
- **门锁记录同步** (`sync_door_lock_records`)
- **全量同步** (`run_full_sync`) 并行执行以上三个任务
- 订单同步后自动触发房态计算与冲突检测 (`update_room_status_from_orders`)

---

## 技术架构

```
MP0373/
├── app.py                      # Dash主应用入口
├── app/
│   ├── components/             # UI组件
│   │   ├── filters.py          # 筛选面板
│   │   ├── kpi_cards.py        # KPI指标卡片
│   │   ├── calendar_view.py    # 房态日历热力图 + 下钻模态框
│   │   └── trend_charts.py     # 入住率趋势图 + 渠道饼图 + 异常监控图
│   └── callbacks/
│       └── main_callbacks.py   # 所有交互回调逻辑
├── data/
│   ├── models.py               # SQLAlchemy ORM模型（9张核心表）
│   └── queries.py              # 数据库查询封装（Pandas DataFrame输出）
├── tasks/
│   ├── celery_app.py           # Celery应用配置
│   └── sync_tasks.py           # 同步任务定义（OTA/收款/门锁/房态更新）
├── utils/
│   ├── config.py               # 环境配置（PostgreSQL/Redis/Dash）
│   ├── database.py             # 数据库连接池与Session管理
│   ├── data_cleaner.py         # 数据清洗模块（保留异常值，不丢弃）
│   └── exporter.py             # Excel报表导出（含筛选口径与生成时间）
├── scripts/
│   ├── init_db.py              # 数据库表初始化
│   └── seed_data.py            # 模拟数据生成（演示用）
├── sql/
│   └── schema.sql              # PostgreSQL DDL脚本
├── tests/
│   └── test_data_cleaner.py    # 数据清洗单元测试
├── exports/                    # 导出报表存放目录
├── requirements.txt            # Python依赖
├── .env.example                # 环境变量示例
└── run.sh                      # 一键启动脚本
```

---

## 快速开始

### 1. 环境准备
- Python 3.10+
- PostgreSQL 13+
- Redis 6+（Celery Broker）

### 2. 安装依赖
```bash
./run.sh install
# 或手动执行: pip install -r requirements.txt
```

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 填入PostgreSQL和Redis连接信息
```

### 4. 初始化数据库
```bash
./run.sh init-db
```

### 5. 生成模拟数据（可选，用于演示）
```bash
./run.sh seed-data
```

### 6. 启动服务
```bash
# 方式一：一键启动全部服务
./run.sh all

# 方式二：分别启动
./run.sh worker    # 终端1：启动Celery Worker
./run.sh app       # 终端2：启动Dash看板应用
```

访问 http://localhost:8050 即可查看看板。

---

## 数据库核心表结构

| 表名 | 说明 |
|------|------|
| `properties` | 房源基础信息 |
| `room_status` | 房态日历（含has_conflict冲突标记） |
| `ota_orders` | OTA渠道订单（含is_anomaly异常标记和anomaly_detail详情） |
| `payment_transactions` | 收款流水记录 |
| `door_lock_records` | 门锁操作记录 |
| `cleaning_tasks` | 保洁任务 |
| `notes` | 备注信息（可关联任意实体） |
| `sync_logs` | 数据同步执行日志 |
| `data_anomalies` | 数据质量异常（清洗时保留的异常值，不丢弃） |

---

## 数据清洗策略

**核心原则：异常值不直接丢弃，全部标记留存**

1. **必填字段校验**：缺失时标记anomaly但仍入库
2. **日期范围校验**：退房≤入住、未来交易时间等异常不丢弃
3. **枚举值校验**：未知渠道/状态/操作类型记录为warning
4. **金额校验**：负数、零值、异常高值全部保留并标记
5. **房态冲突检测**：多源数据不一致时全部入库，has_conflict=True，冲突详情JSON记录

异常数据可通过以下方式查看：
- 看板"数据质量监控"板块统计展示
- 下钻"原始样本"Tab查看raw_data原始数据
- PostgreSQL `data_anomalies` 表完整追溯

---

## 复盘会议引用说明

本看板专为运营复盘会议设计，建议使用方式：

1. **整体概览**：先看顶部4个KPI卡片，快速了解经营大盘
2. **趋势分析**：入住率趋势图观察各房源走势，对比60%基准线找差距
3. **渠道拆解**：渠道订单占比分析各渠道贡献，制定渠道策略
4. **问题定位**：日历上的红色冲突单元格直接点击下钻，查看具体订单冲突原因
5. **数据留痕**：发现异常可直接查看原始样本，备注入口一键添加会议决议
6. **导出归档**：点击"导出报表"生成Excel，含完整筛选口径和生成时间，可直接附入会议纪要

---

## 测试

```bash
# 运行数据清洗单元测试
python tests/test_data_cleaner.py
```

---

## License

Internal Project © 2026
