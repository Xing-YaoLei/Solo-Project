# 连锁咖啡设备清洁风险监测系统

基于 **React + ECharts + FastAPI + PostgreSQL + DuckDB** 的连锁咖啡设备清洁风险监测与数据分析平台。

---

## 🌟 核心功能

### 1. 设备清洁风险监测图
- 双Y轴组合图：平均风险分折线 + 高风险设备柱状图 + 离线时长面积图
- 阈值警戒线：高风险(70分)/中风险(50分)自动标记
- **延迟同步标注**：库存表/POS延迟同步的时间点在图表上用阴影高亮 + 三角标注
- **异常点散点**：高风险/离线/巡检失败/故障触发 四类异常可点击
- 异常点明细：列出设备状态解释，可回溯样本
- 离线缺口回溯：前5条/缺口期间/后5条 三段上下文对比

### 2. 数据一致性管理
- **库存版本对比**：V1/V2版本SKU级差异（新增/删除/修改/金额差）
- **POS流水对比**：每日交易数+金额差异、各门店横向对比
- **口径冲突检测**：
  - POS独有、会员独有、金额不一致 三类冲突
  - 差异明细表格 + 冲突摘要饼图
  - 导出冲突明细CSV

### 3. 故障记录与整改任务联动
- 左栏故障总览：故障类型分布饼图 + 严重程度进度条 + 30天趋势
- 右栏任务筛选 **（联动设计）**：
  - 门店 → 设备联动过滤
  - 有无复查 Radio + 复查结果 Select
  - 截止日期范围、优先级、任务状态
  - **点击故障行 → 自动填入故障ID筛选关联任务**
- 任务详情 Drawer：复查结果 Timeline 时间线展示

### 4. 巡检合格率复盘
- 大数字对比卡片：当前/上期合格率、改善率箭头着色
- 双周期对比图（柱状+折线）：合格率前后对比 + 改善率趋势
- TOP问题整改前后对比条形图
- 门店排名Table（改善率正负着色、排名徽章）
- **离线缺口回溯面板**：三栏对比（前/缺口/后），可"回到样本明细"
- 影响评估：估算离线时长对月度合格率的影响

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React 18)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Dashboard│  │RiskChart │  │DataCons. │  │Faults+Ins│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │              │          │
│       └─────────────┴──────┬──────┴──────────────┘          │
│                            │                                 │
│                    Ant Design 5 + ECharts                   │
└────────────────────────────┬────────────────────────────────┘
                             │ axios (proxy:8000)
┌────────────────────────────┼────────────────────────────────┐
│                       后端 (FastAPI)                         │
│  ┌─────────────────────────┴───────────────────────────┐    │
│  │              7 API Routers (40+ endpoints)           │    │
│  │ equipment | inventory | pos | faults | tasks | ...   │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                 │
│     ┌──────────────────────┴──────────────────────┐        │
│     │              数据服务层                       │        │
│     └──────────┬───────────────────┬───────────────┘        │
│                │                   │                        │
│    ┌───────────▼──────┐  ┌─────────▼───────────┐            │
│    │   PostgreSQL     │  │     DuckDB          │            │
│    │ (主业务数据)     │  │ (OLAP版本对比/分析) │            │
│    │ • 设备/门店      │  │ • 库存版本对比       │            │
│    │ • 故障/任务/巡检 │  │ • POS版本对比        │            │
│    │ • POS/库存原始   │  │ • 口径冲突检测       │            │
│    │                  │  │ • 风险时间序列聚合   │            │
│    └──────────────────┘  │ • 巡检合格率对比     │            │
│                           └─────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
MP0011/
├── backend/                          # FastAPI 后端
│   ├── main.py                       # 应用入口，路由注册
│   ├── requirements.txt              # Python依赖
│   ├── start.sh                      # 启动脚本（一键venv+安装+初始化+启动）
│   └── app/
│       ├── core/
│       │   └── database.py           # SQLAlchemy配置、会话管理
│       ├── models/                   # SQLAlchemy ORM 模型
│       │   ├── equipment.py          # 设备、门店、状态日志、延迟日志
│       │   ├── inventory.py          # 库存版本+明细
│       │   ├── pos.py                # POS版本+交易+明细
│       │   ├── member.py             # 会员小票、数据冲突记录
│       │   ├── faults.py             # 故障、整改任务、复查结果
│       │   └── inspection.py         # 巡检模板、记录、趋势
│       ├── schemas/                  # Pydantic 接口Schema
│       ├── routers/                  # API路由（7个模块）
│       │   ├── analytics.py          # 风险时序/缺口样本/仪表盘初始化
│       │   ├── equipment.py          # 门店/设备/状态日志/同步延迟
│       │   ├── inventory.py          # 库存版本列表/对比/导出
│       │   ├── pos.py                # POS版本/对比/冲突检测/导出
│       │   ├── faults.py             # 故障总览/列表/统计/解决
│       │   ├── tasks.py              # 任务联动筛选/复查/工作流
│       │   └── inspection.py         # 巡检记录/模板/趋势/复盘对比
│       └── services/
│           ├── duckdb_service.py     # DuckDB分析引擎（版本对比+冲突检测+时序聚合）
│           └── mock_data.py          # 完整Mock数据生成（5门店/20设备/80故障/68任务/320巡检）
│
└── frontend/                         # React 前端
    ├── package.json                  # React18 + Antd5 + ECharts
    ├── public/
    └── src/
        ├── index.js                  # 入口，ConfigProvider中文
        ├── App.js                    # 路由+布局（Sider+Header+Content）
        ├── services/api.js           # API封装（axios+后端失败时本地Mock兜底）
        ├── utils/api.js              # 备用API封装
        └── pages/                    # 5个核心页面
            ├── Dashboard.js          # 仪表盘首页（6卡片+TOP10+分布饼+趋势）
            ├── RiskChart.js          # 风险监测图（双Y轴+标注+Tab+回溯Modal）
            ├── DataConsistency.js    # 数据一致性（3个Tab：库存/POS/会员冲突）
            ├── FaultsTasks.js        # 故障任务（左右联动布局+Timeline复查）
            └── Inspection.js         # 巡检复盘（大数字卡片+排名+缺口回溯）
```

---

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 后端
cd backend
chmod +x start.sh
./start.sh
# 服务启动于 http://localhost:8000
# Swagger文档: http://localhost:8000/docs

# 前端（新终端）
cd frontend
npm start
# 浏览器打开: http://localhost:3000
```

### 方式二：手动启动

#### 后端（FastAPI + uvicorn）

```bash
cd backend

# 创建虚拟环境（可选）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 初始化Mock数据
python3 -c "
from app.services.mock_data import generate_mock_data
r = generate_mock_data()
print(f'初始化: {len(r[\"stores\"])}门店/{len(r[\"equipments\"])}设备/{len(r[\"fault_records\"])}故障')
"

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 前端（React + create-react-app）

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（默认3000端口，proxy转发到8000后端）
npm start
```

---

## 📊 关键技术说明

### DuckDB 版本对比与冲突检测（`services/duckdb_service.py`）

| 能力 | 实现方式 |
|------|----------|
| 库存版本对比 | FULL OUTER JOIN 两个version_id，按SKU聚合，计算数量/金额差异% |
| POS版本对比 | 按日聚合交易数+金额，FULL JOIN识别缺失日期/新增日期/金额变更 |
| 会员-POS口径冲突 | 三向UNION：POS独有 / 会员独有 / 金额不一致（ABS差值>0.01） |
| 风险时间序列 | 按日统计AVG/PERCENTILE/COUNT，输出异常点+延迟标注 |
| 离线缺口样本 | BETWEEN起止时间筛选 + 前后5条LAG/LEAD上下文 |
| 巡检合格率对比 | 周期窗口pass_rate + prev_pass_rate + improvement_rate |

### Mock 数据生成（`services/mock_data.py`）

- **5个门店**：上海/北京/广州 × 南京路/陆家嘴/国贸/中关村/天河城
- **20台设备**：每个门店4台（2台意式咖啡机+磨豆机+奶泡机）
- **45天数据窗口**：2026-05-01 ~ 2026-06-14
- **900条清洁指标**：每日每台设备风险分，周末偏高
- **120条库存记录**（2版本）：V1原始 + V2修正（~30%SKU有差异）
- **数万条POS**（2版本）：每店每日80-200单 + 会员45%覆盖率
- **80条故障**：清洁相关占65%，含解决流程
- **68条整改任务**：~70%有复查结果
- **320条巡检**：含8周趋势数据 + 改善率计算

---

## 🔌 核心API列表

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **分析** | POST | `/api/analytics/init-data` | 初始化Mock数据 |
| | GET | `/api/analytics/overview/dashboard` | 仪表盘6大指标 |
| | GET | `/api/analytics/clean-risk/timeseries` | 风险时序+异常点+延迟标注 |
| | GET | `/api/analytics/offline-gap/samples` | 离线缺口三段样本对比 |
| | GET | `/api/analytics/top-risks` | TOP风险设备排名 |
| **数据一致性** | GET | `/api/inventory/compare` | 两版本库存差异 |
| | GET | `/api/pos/compare` | 两版本POS差异 |
| | GET | `/api/pos/conflicts` | 会员-POS口径冲突（汇总+明细） |
| **故障任务** | GET | `/api/faults/overview` | 故障总览+30天趋势 |
| | POST | `/api/tasks/filter` | 任务联动筛选（多条件含复查结果） |
| | GET | `/api/tasks/{id}/rechecks` | 任务复查历史 |
| | GET | `/api/tasks/linked/{fault_id}` | 故障→任务联动 |
| **巡检** | GET | `/api/inspection/trends` | 周/月合格率趋势 |
| | GET | `/api/inspection/comparison` | 核心复盘（TOP问题+门店排名） |
| 设备 | GET | `/api/equipment/stores/` | 门店列表 |
| | GET | `/api/equipment/` | 设备列表 |

完整接口文档启动后端后访问：`http://localhost:8000/docs`

---

## 🎨 关键交互体验

| 场景 | 交互设计 |
|------|----------|
| 库存表延迟同步 | 风险图上对应日期用灰色阴影+三角标记，悬停显示"库存延迟同步N分钟，避免误判趋势" |
| 异常点解释 | 点击散点弹出Modal：设备状态前5/缺口/后5对比 + 传感器数据 + 原因推断 |
| 故障-任务联动 | 点击故障表格行 → 右栏筛选器自动填充fault_id并刷新任务列表 |
| 复查通过率 | 任务列表底部卡片实时显示：复查通过数/总数 = XX% |
| 巡检改善 | 合格率变化用↑绿色/↓红色箭头，改善率列正负自动着色 |
| 口径冲突 | 金额差异列：+X.XX绿色，-X.XX红色，绝对值>10元加重显示 |

---

## ⚠️ 说明

- **数据库**：为降低首次运行门槛，默认使用 **SQLite**（`./data/coffee_equipment.db`），
  如需切换PostgreSQL，请设置环境变量：
  ```bash
  export DATABASE_URL="postgresql://user:pass@host:5432/coffee_equipment"
  ```
- **DuckDB路径**：默认 `./data/coffee_analytics.db`，可通过 `DUCKDB_PATH` 覆盖
- **前端代理**：`package.json` 中配置 `"proxy": "http://localhost:8000"`，所有 `/api/*` 请求自动转发
- **Mock兜底**：前端 `services/api.js` 在后端不可用时自动降级到本地生成数据，方便独立调试

---

## ✅ 验证清单

- [x] 所有Python文件语法检查通过
- [x] 前端npm依赖安装成功
- [x] 后端路由模块7个，接口40+
- [x] DuckDB分析引擎6大核心查询
- [x] 5个核心React页面完整实现
- [x] 完整Mock数据（10万+量级）
