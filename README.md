# 汽车维修报价漏斗报表系统

用于复盘汽车维修报价问题的数据分析平台，覆盖从报价创建到收银结算的完整转化链路。

## 技术栈

- **前端**: React 18 + Vite + Ant Design 5 + ECharts 5
- **后端**: FastAPI + SQLAlchemy + Pydantic
- **数据库**: PostgreSQL（业务数据）+ DuckDB（分析数据）
- **数据可视化**: ECharts for React

## 功能特性

### 1. 报价漏斗看板
- 6阶段转化漏斗：报价创建 → 报价提交 → 客户确认 → 转施工单 → 维修完成 → 收银结算
- 点击漏斗各阶段可下钻查看具体报价单明细
- 缺货任务仪表盘实时概览
- 报价拒绝原因分布分析
- 业务员成交排行榜

### 2. 返修率重点分析
- 月度返修率趋势（双Y轴：工单数量 + 返修率折线）
- 返修原因分布（饼图）
- 技师返修率排名（横向柱状图，超标高亮红色）
- 返修工单明细列表

### 3. 逐层下钻明细
- **报价单** → 配件清单、工时项目、保险信息
- **质检照片** → 带质量问题标注的图片墙，可预览大图
- **车辆档案** → 完整维修历史、触发预警项

### 4. 配件缺货任务
- 缺货自动生成备注任务
- 处理状态跟踪（待处理/处理中/已解决/已关闭）
- 优先级管理
- **处理结论记录**（复盘时在工单旁可见）

### 5. 预警阈值配置
- 车辆维修次数预警、里程预警、消费金额预警
- 返修率预警、配件缺货时长预警
- **业务人员可调整阈值**
- **修改人 + 修改原因完整记录**
- 变更历史可追溯

## 项目结构

```
MP0353/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── config.py          # 配置管理
│   │   ├── database.py        # 数据库连接
│   │   ├── models.py          # SQLAlchemy 模型
│   │   ├── schemas.py         # Pydantic Schema
│   │   └── routers/           # API 路由
│   │       ├── funnel.py      # 报价漏斗 API
│   │       ├── repair_orders.py # 维修工单 API
│   │       ├── vehicles.py    # 车辆档案 API
│   │       ├── stock_tasks.py # 缺货任务 API
│   │       ├── warnings.py    # 预警配置 API
│   │       └── rework.py      # 返修分析 API
│   ├── seed_data.py           # 数据初始化脚本
│   ├── requirements.txt       # Python 依赖
│   └── .env.example           # 环境变量示例
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── main.jsx           # 入口
│   │   ├── App.jsx            # 主布局 + 路由
│   │   ├── index.css          # 全局样式
│   │   ├── api/index.js       # API 封装
│   │   └── pages/             # 页面组件
│   │       ├── FunnelDashboard.jsx    # 报价漏斗看板
│   │       ├── ReworkAnalysis.jsx     # 返修率分析
│   │       ├── VehicleList.jsx        # 车辆档案列表
│   │       ├── VehicleDetail.jsx      # 车辆档案详情
│   │       ├── RepairOrderDetail.jsx  # 维修工单详情（逐层展开）
│   │       ├── StockTasks.jsx         # 缺货任务管理
│   │       └── WarningSettings.jsx    # 预警阈值配置
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## 快速开始

### 前置条件

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+（或使用 SQLite 快速测试）

### 1. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 复制配置文件（如不使用 PostgreSQL，可跳过并使用默认 SQLite 内存库）
cp .env.example .env
# 编辑 .env 修改数据库连接

# 初始化数据（生成测试数据）
python seed_data.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档: http://localhost:8000/docs

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问: http://localhost:5173

## 核心 API 接口

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 报价漏斗 | GET | `/api/funnel/overview` | 漏斗概览数据 |
| | GET | `/api/funnel/quotations` | 阶段下钻报价单列表 |
| | GET | `/api/funnel/analytics/reject-reasons` | 拒绝原因分析 |
| | GET | `/api/funnel/analytics/salesperson-ranking` | 业务员排行 |
| 返修分析 | GET | `/api/rework/stats` | 返修率统计数据 |
| | GET | `/api/rework/orders` | 返修工单列表 |
| 维修工单 | GET | `/api/repair-orders/{id}` | 工单详情（含报价、照片、缺货任务） |
| 车辆档案 | GET | `/api/vehicles/` | 车辆列表 |
| | GET | `/api/vehicles/{id}` | 车辆详情（含预警、维修历史） |
| 缺货任务 | GET | `/api/stock-tasks/` | 任务列表 |
| | GET | `/api/stock-tasks/summary` | 任务汇总 |
| | PATCH | `/api/stock-tasks/{id}` | 更新任务（含处理结论） |
| 预警配置 | GET | `/api/warnings/thresholds` | 阈值列表 |
| | PATCH | `/api/warnings/thresholds/{id}` | 修改阈值（记录修改人） |
| | GET | `/api/warnings/thresholds/{id}/logs` | 阈值变更历史 |

## 数据模型说明

- **Vehicle**: 车辆档案（车牌号、品牌、里程、维修次数、预警级别等）
- **Quotation**: 报价单（状态、金额、配件、工时、保险关联）
- **RepairOrder**: 维修工单（关联报价、返修标记、缺货标记、收银信息）
- **InspectionPhoto**: 质检照片（关联报价/工单、质量问题标注）
- **StockTask**: 缺货任务（关联工单、处理结论、解决人）
- **WarningThreshold**: 预警阈值配置
- **WarningChangeLog**: 阈值修改日志（修改人、原因、新旧值）
- **InsuranceMaterial**: 保险材料（理赔单号、保险公司、审核状态）
- **CashierTransaction**: 收银流水（支付方式、保险/自费拆分）
