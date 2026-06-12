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
│   │   └── init_data.py       # 示例数据初始化脚本
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

### 1. 数据清洗与ETL

- **会员小票数据**: 从会员消费小票中提取设备清洁记录
- **POS流水数据**: 从POS交易流水匹配清洁服务记录
- **库存表数据**: 从设备库存表同步设备基础信息
- **口径匹配**: 统一设备类型、清洁类型、状态等业务口径
- **去重处理**: 基于设备+日期+清洁类型去重

### 2. 图表区（三分离

- **清洁复查漏斗图**: 展示总设备数 → 待清洁 → 已派单 → 已完成 → 巡检合格
- **设备状态分布图**: 饼图展示正常/离线/维修中设备分布，附带异常设备清单
- **点位清单表**: 各门店设备统计，支持搜索、筛选、排序、分页

### 3. 预警阈值配置

业务人员可自行调整：
- 清洁周期阈值
- 离线预警天数
- 巡检合格率阈值
- 维护周期阈值
- 设备离线时长阈值

### 4. 设备异常备注

- 异常设备可添加备注
- 支持多种备注类型（异常/巡检/清洁/维修）
- 历史备注可追溯，复盘时可见当时判断

## 快速开始

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 修改 .env 中的数据库配置

# 初始化示例数据
python -m scripts.init_data

# 启动服务
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
- `GET /api/reports/offline-equipments` - 离线设备列表
- `GET /api/reports/stores` - 点位清单（分页）

### 阈值配置

- `GET /api/thresholds` - 获取所有阈值
- `GET /api/thresholds/{config_key}` - 获取单个阈值
- `PUT /api/thresholds/{config_key}` - 更新阈值

### 备注管理

- `GET /api/remarks/equipment/{equipment_id}` - 设备备注列表
- `GET /api/remarks/store/{store_id}` - 门店备注列表
- `POST /api/remarks` - 添加备注
- `DELETE /api/remarks/{id}` - 删除备注

### ETL 数据导入

- `POST /api/etl/member-receipt` - 导入会员小票数据
- `POST /api/etl/pos-flow` - 导入POS流水数据
- `POST /api/etl/inventory` - 导入库存表数据
- `POST /api/etl/sync-duckdb` - 同步数据到DuckDB

## 数据来源说明

### 数据从三个系统汇聚：

1. **会员小票** - 记录会员消费时附带的设备清洁确认
2. **POS流水** - 门店POS系统中的清洁服务交易记录
3. **库存表** - 设备库存与盘点数据

经过清洗、去重、口径匹配后，形成统一的设备清洁数据仓库，
再通过DuckDB提供高效的报表查询能力。
