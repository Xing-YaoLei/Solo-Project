# 连锁咖啡设备清洁漏斗报表

专门用于复盘连锁咖啡设备清洁情况的数据报表系统。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design + ECharts
- **后端**: FastAPI (Python)
- **数据库**: PostgreSQL (主数据) + DuckDB (报表查询)
- **数据处理**: Pandas + 自研ETL

## 项目结构

```
MP0015/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── models/            # SQLAlchemy 数据模型
│   │   ├── schemas/           # Pydantic 数据结构
│   │   ├── services/          # 业务服务层
│   │   ├── api/               # API 路由
│   │   ├── etl/               # ETL 数据清洗模块
│   │   ├── config.py          # 配置
│   │   ├── database.py        # 数据库连接
│   │   └── main.py            # FastAPI 入口
│   ├── scripts/
│   │   └── init_data.py       # 示例数据初始化脚本（完成后自动同步 DuckDB）
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── services/          # API 服务封装
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── data/                       # 示例数据
    ├── sample_member_receipts.csv
    ├── sample_pos_flow.csv
    └── sample_inventory.csv
```

## 核心功能

### 1. 数据清洗与 ETL（三源合一）

数据从三个系统进入后先做清洗、去重和口径匹配：

- **会员小票数据** ([member_receipt_etl.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/etl/member_receipt_etl.py)): 从会员消费小票中提取设备清洁记录
- **POS流水数据** ([pos_flow_etl.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/etl/pos_flow_etl.py)): 从 POS 交易流水匹配清洁服务记录
- **库存表数据** ([inventory_etl.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/etl/inventory_etl.py)): 从设备库存表同步设备基础信息
- **口径匹配** ([data_calibration.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/etl/data_calibration.py)): 统一设备类型、清洁类型、状态等业务口径，并对清洁记录去重
- **DuckDB 报表库** ([duckdb_service.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/services/duckdb_service.py)): PostgreSQL 主数据自动同步到 DuckDB，供报表高效查询

### 2. 图表区（三分离）

不要把所有指标挤进一张表，图表拆成三个独立区域：

- **清洁复查漏斗图** ([CleaningFunnelChart.tsx](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/frontend/src/components/CleaningFunnelChart.tsx)): 展示总设备数 → 待清洁 → 已派单 → 已完成清洁 → 巡检合格 的转化率
- **设备状态分布图** ([EquipmentStatusChart.tsx](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/frontend/src/components/EquipmentStatusChart.tsx)): 饼图展示正常/离线/维修中分布，右侧列出异常设备并可加备注
- **点位清单表** ([StoreListTable.tsx](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/frontend/src/components/StoreListTable.tsx)): 各门店设备统计、清洁次数、巡检合格率，支持搜索、筛选、排序、分页

### 3. 预警阈值配置（阈值联动）

业务人员可自行调整，阈值调整后**立即影响设备离线命中判断与复盘结论**：

| 阈值 Key | 说明 | 默认值 | 影响 |
| --- | --- | --- | --- |
| `cleaning_cycle_days` | 清洁周期阈值 | 7 天 | 设备正常清洁周期，作为超期判断基线 |
| `offline_warning_days` | 离线预警天数 | 3 天 | 设备未清洁超过 `cleaning_cycle_days + offline_warning_days` 即命中预警标记 |
| `inspection_pass_rate` | 巡检合格率阈值 | 90% | 低于此值时复盘材料判定为需重点关注 |
| `maintenance_cycle_days` | 维护周期阈值 | 30 天 | 设备深度维护周期参考 |
| `equipment_offline_hours` | 设备离线时长阈值 | 24 小时 | 设备离线超过此时长触发告警 |

阈值配置入口：[ThresholdPanel.tsx](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/frontend/src/components/ThresholdPanel.tsx)

### 4. 设备异常备注（复盘可追溯）

- 异常设备可添加备注（异常/巡检/清洁/维修四类）
- 历史备注可追溯，复盘材料自动聚合当时的判断
- 服务层见 [remark_service.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/services/remark_service.py)

### 5. 复盘材料生成（围绕巡检合格率）

围绕**巡检合格率**自动形成完整复盘材料，接口：`GET /api/reports/review-material`

复盘材料包含：
- **整体指标**：合格率、合格/不合格次数、平均得分、离线设备数
- **核心摘要**：自动生成 5-6 条关键结论
- **复盘结论**：根据阈值动态判定是否达标
- **离线设备明细**：命中预警的设备及当时备注
- **不合格巡检明细**：问题描述与改进建议
- **低合格率门店**：低于阈值的门店清单及进度条

前端组件：[ReviewMaterialPanel.tsx](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/frontend/src/components/ReviewMaterialPanel.tsx)

服务层实现：[review_service.py](file:///Users/yaoleyxing/Developer/solo-mange-pro/MP0015/backend/app/services/review_service.py)

## 快速开始

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 修改 .env 中的数据库配置

# 初始化示例数据（会自动同步 DuckDB）
python -m scripts.init_data

# 启动服务（启动时会再次自动同步 DuckDB）
uvicorn app.main:app --reload --port 8000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

访问 http://localhost:3000

## API 接口

### 报表接口

- `GET /api/reports/funnel` - 清洁漏斗数据
- `GET /api/reports/equipment-status` - 设备状态分布
- `GET /api/reports/inspection-pass-rate` - 巡检合格率
- `GET /api/reports/offline-equipments` - 离线设备列表（动态读取阈值）
- `GET /api/reports/stores` - 点位清单（分页）
- `GET /api/reports/review-material` - **生成巡检复盘材料**（含阈值、合格率、异常、备注）

### 阈值配置

- `GET /api/thresholds` - 获取所有阈值
- `GET /api/thresholds/{config_key}` - 获取单个阈值
- `PUT /api/thresholds/{config_key}` - 更新阈值（更新后下次复盘/离线查询自动生效）

### 备注管理

- `GET /api/remarks/equipment/{equipment_id}` - 设备备注列表
- `GET /api/remarks/store/{store_id}` - 门店备注列表
- `POST /api/remarks` - 添加备注
- `DELETE /api/remarks/{id}` - 删除备注

### ETL 数据导入

每次导入完成后会自动把 PostgreSQL 数据同步到 DuckDB 报表库：

- `POST /api/etl/member-receipt` - 导入会员小票数据
- `POST /api/etl/pos-flow` - 导入 POS 流水数据
- `POST /api/etl/inventory` - 导入库存表数据
- `POST /api/etl/sync-duckdb` - 手动触发同步

## 数据流向

```
会员小票 ──┐
POS 流水 ──┼─► 清洗 / 去重 / 口径匹配 ──► PostgreSQL ──► 自动同步 ──► DuckDB ──► 报表 & 复盘材料
库存表   ──┘                                      ▲
                                                 │
                                         阈值配置 / 备注写入
```

业务人员调整阈值后，离线命中判断与复盘结论会**实时反映**新阈值。
