# 商户结算趋势看板

本地跑腿商户结算趋势看板系统，用于把商户结算从静态报表中独立拆分。

## 技术栈

- **前端**: React 18 + ECharts 5 + Ant Design 5 + Vite 5
- **后端**: FastAPI 0.109 + SQLAlchemy 2.0 + Pydantic 2
- **数据库**: PostgreSQL + DuckDB（嵌入式，开箱即用）
- **数据分析**: Pandas

## 项目结构

```
MP0433/
├── backend/                          # 后端服务
│   ├── app/
│   │   ├── main.py                   # FastAPI 应用入口
│   │   ├── core/                     # 核心配置
│   │   │   ├── config.py             # 配置管理
│   │   │   └── database.py           # PostgreSQL + DuckDB 连接
│   │   ├── models/                   # SQLAlchemy 数据模型
│   │   ├── schemas/                  # Pydantic 数据模式
│   │   ├── services/                 # 业务逻辑层
│   │   │   ├── data_service.py       # 统一数据服务入口（DuckDB优先，PG兜底，mock保底）
│   │   │   ├── duckdb_init.py        # DuckDB 建表+种子数据初始化
│   │   │   ├── duckdb_service.py     # DuckDB 查询实现
│   │   │   ├── postgres_service.py   # PostgreSQL 查询实现
│   │   │   └── mock_service.py       # Mock 数据（保底用）
│   │   └── api/v1/
│   │       ├── __init__.py           # 路由注册
│   │       └── endpoints.py          # API 端点定义
│   ├── data/                         # DuckDB 数据文件目录（自动生成）
│   ├── requirements.txt              # Python 依赖
│   └── venv/                         # Python 虚拟环境（自动创建）
│
├── frontend/                         # 前端应用
│   ├── src/
│   │   ├── main.jsx                  # 入口文件
│   │   ├── App.jsx                   # 根组件
│   │   ├── index.css                 # 全局样式
│   │   ├── pages/
│   │   │   └── SettlementDashboard.jsx  # 看板主页面
│   │   ├── components/               # 组件
│   │   │   ├── DashboardSummary.jsx     # 统计概览卡片
│   │   │   ├── SettlementTrendChart.jsx # 结算趋势图（含异常点/受影响区间）
│   │   │   ├── OrderDetailTable.jsx     # 单据明细表
│   │   │   ├── ApprovalTimeline.jsx     # 审批节点时间线
│   │   │   ├── AmountCheckTable.jsx     # 金额校验表
│   │   │   ├── CaliberDiffTable.jsx     # 口径差异表
│   │   │   └── DownloadPanel.jsx        # 下载面板
│   │   └── utils/api.js              # API 请求封装
│   ├── public/vite.svg               # 静态资源
│   ├── package.json
│   └── vite.config.js
│
├── start-backend.sh                  # 后端一键启动脚本
├── start-frontend.sh                 # 前端一键启动脚本
└── README.md
```

## 核心功能

### 1. 结算趋势看板
- 结算金额趋势图（双Y轴：金额折线 + 订单数柱状图）
- 异常点标注三种类型：
  - 🟡 **订单系统延迟**（橙色）
  - 🔴 **客服记录缺失**（红色）
  - 🔵 **支付流水口径变化**（蓝色）
- 受影响区间高亮：金额不一致改变趋势时，自动标出受影响区间及影响金额
- 复盘说明与异常点不分离，点击即可查看详情

### 2. 常用视图（Tab 切换）
- **单据明细**：订单列表、状态、系统延迟标记、客服记录数、支付流水数
- **审批节点**：审批流程时间线，含审批人、审批时间、审批意见
- **金额校验**：预期结算 vs 实际结算对比，差额、一致性标记
- **口径差异表**：客服记录与支付流水口径冲突时，保留完整差异表，不直接覆盖任何一方数据

### 3. 下载功能
- 支持自定义日期范围
- 可选是否附带回款周期计算规则
- 下载内容包含：趋势数据、单据明细、金额校验、口径差异、规则说明

### 4. 数据异常处理原则
- ✅ 复盘说明与异常点不分离（Tooltip 中同时展示）
- ✅ 金额不一致时自动标出受影响区间（ECharts markArea 高亮）
- ✅ 客服记录与支付流水口径冲突时保留完整差异表

## 快速开始（按顺序执行）

### 第一步：启动后端服务

```bash
# 方式一：使用一键启动脚本
./start-backend.sh

# 方式二：手动执行
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动后访问：
- API 服务: http://localhost:8000
- 接口文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

> **DuckDB 说明**: 后端首次启动会自动创建 `backend/data/settlement.duckdb` 数据库文件，并初始化完整的演示数据（3个商户、30天结算数据、240+订单、87条差异记录等）。无需手动配置数据库。

### 第二步：启动前端服务

```bash
# 方式一：使用一键启动脚本
./start-frontend.sh

# 方式二：手动执行
cd frontend
npm install
npm run dev
```

前端启动后访问：http://localhost:3000

## API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/settlement/trend` | 结算趋势数据（含异常点和受影响区间） |
| GET | `/api/v1/settlement/orders` | 单据明细列表（分页） |
| GET | `/api/v1/settlement/approval-nodes` | 审批节点列表 |
| GET | `/api/v1/settlement/amount-checks` | 金额校验记录 |
| GET | `/api/v1/settlement/caliber-diffs` | 口径差异表（分页） |
| GET | `/api/v1/settlement/dashboard/summary` | 看板概览统计 |
| GET | `/api/v1/settlement/rules` | 回款周期计算规则 |
| GET | `/api/v1/settlement/download` | 下载完整结算数据 |

## 回款周期计算规则

```
一、基础规则
1. 结算周期：T+7 自然日
2. 结算日：每周一进行上周结算
3. 到账时效：结算审批完成后3个工作日内到账

二、金额计算规则
结算金额 = 订单总额 - 退款金额 - 服务费 - 其他扣除

三、口径说明
1. 订单口径：以订单完成时间为准
2. 退款口径：以客服记录的退款时间为准
3. 支付口径：以支付渠道实际到账时间为准

四、异常处理
1. 订单延迟：延迟超过24小时的订单顺延至下一结算周期
2. 记录缺失：客服记录缺失时暂按支付流水计算，待补录后调整
3. 口径变化：口径变更前按旧口径，变更后按新口径，过渡期保留差异表
```

## 数据层架构

系统采用三级降级数据服务架构，PostgreSQL 优先，DuckDB 作为本地备选：

```
API 请求
    ↓
data_service.py (统一入口)
    ↓
┌─────────────┬──────────────┬──────────────┐
│ PostgreSQL  │   DuckDB     │  Mock Data   │
│  (优先)     │  (本地备选)  │  (保底)      │
└─────────────┴──────────────┴──────────────┘
```

- **PostgreSQL**（优先）: 配置存在且可连接时，所有查询从 PG 表读取，适合生产环境
- **DuckDB**（本地备选）: PG 不可用时自动启用，嵌入式分析数据库，零配置开箱即用
- **Mock Data**: 前两者均不可用时的兜底方案

### PostgreSQL 配置

配置 PostgreSQL 后，`/api/v1/settlement/dashboard/summary` 等接口将从 PG 表读取数据：

```bash
export POSTGRES_SERVER=localhost
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password
export POSTGRES_DB=merchant_settlement
export POSTGRES_PORT=5432
```

> **无需手动建表**: 后端启动时 `postgres_init.py` 会自动创建表结构并填充演示数据。

## 核心模型

- **Merchant** - 商户信息
- **Settlement** - 结算单（含异常标记 `has_anomaly`、`anomaly_type`、`anomaly_desc`）
- **Order** - 订单（含延迟标记 `has_delay`、`delay_hours`）
- **CustomerServiceRecord** - 客服记录
- **PaymentFlow** - 支付流水（含口径版本 `caliber_version`）
- **ApprovalNode** - 审批节点
- **AmountCheck** - 金额校验记录
- **CaliberDiff** - 口径差异记录
