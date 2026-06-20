# 🎟️ 活动票务赞助权益风险监测系统

面向活动运营方的数据驾驶舱，用于实时监控票务销售、赞助权益兑现、入场核销全链路数据，及时发现异常风险。
技术栈：**React 18 + ECharts 5 + FastAPI + PostgreSQL/DuckDB**

---

## ✨ 核心功能

| 模块 | 功能说明 |
|------|---------|
| 📊 **总览看板** | 5 大 KPI 卡片（含环比 + sparkline）、赞助权益风险趋势、实时同步链路动画、退票分布、票种占比 |
| 🔀 **取数链路监控** | 报名表 / 支付流水 / 闸机记录三路同步状态、延迟监控、手动触发、**分级同步日志抽屉**（JSON 详情） |
| 🗺️ **座位图分析** | 10 区域 SVG 多边形热力图、**同比 / 环比切换高亮差异**、签到码双轴趋势（含同环比对比线） |
| 🤝 **赞助权益监测** | 赞助商清单、完成率进度条、风险标签；**点击跳转权益明细 Drawer**，兑现记录时间轴、进度仪表盘 |
| ✅ **核销报表** | 按通道效率 / 日期趋势 / 区域比较三 Tab 切换柱图+折线+条形图；**核销口径 5 条规则 Drawer 解释**（公式+数据源+异常+示例） |
| 🎫 **票种规则排行** | 顶部 Segmented 切换 **绝对值 ↔ 占比**，柱图点击展开规则详情，双环饼图联动，斑马纹规则表 |
| ⚠️ **退票争议中心** | 退票量柱图 + **争议点红色脉冲散点**；点击散点 **跳转样本 Drawer**，三联卡片（报名+支付+闸机）+ 5 节点操作时间轴，支持标记处理 |

---

## 🏗️ 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Vite + React 18 + TS)                             │
│  ├─ ECharts 5 · 深色大屏数据驾驶舱 · 发光描边风格            │
│  ├─ Zustand 全局状态 · 活动期/时间范围/对比模式              │
│  └─ React Router 7 页面：7 个核心模块 + 详情跳转             │
└──────────────┬───────────────────────────────────────────────┘
               │   Vite Proxy /api → :8000
┌──────────────▼───────────────────────────────────────────────┐
│  Backend (FastAPI + Uvicorn)                                 │
│  ├─ 21 个 RESTful API · Pydantic 校验                       │
│  ├─ 7 Router → 7 Service → 2 Repository                     │
│  └─ 3 路 Pipeline 同步任务（带日志写入同步链）               │
└──────────────┬───────────────────────────────────────────────┘
               │
  ┌────────────┴─────────────┐
  │                          │
  ▼                          ▼
 PostgreSQL (可选)         DuckDB (默认嵌入式分析库)
 · 业务明细主库            · 6 张聚合宽表（含同环比列）
 · 权限配置                · 首次启动自动生成 ~5200 条 Mock
 · 同步日志表              · 纯文件 ./backend/data/analytics.duckdb
```

---

## 🚀 快速启动

### 方式一：一键启动全部服务（推荐）
```bash
./scripts/start-all.sh
```
打开浏览器访问 **http://localhost:5173** 即可使用。后端 API 文档：**http://localhost:8000/docs**

### 方式二：分别启动

**后端 API（端口 8000）**
```bash
cd backend
./start.sh
```

**前端 Dev Server（端口 5173）**
```bash
cd frontend
npm install        # 首次
npm run dev
```

---

## 📁 项目结构

```
MP0415/
├── frontend/                       # React + Vite 前端
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts             # Fetch 封装（解包 ApiResponse + snake→camel）
│   │   │   └── modules/              # 7 个 API 模块
│   │   ├── components/
│   │   │   ├── layout/               # Sidebar / Header / MainLayout
│   │   │   ├── common/               # Panel / KpiCard / ChartCard / TagChip
│   │   │   └── charts/               # SeatHeatmapChart / CheckinTrendChart
│   │   ├── pages/                    # 7 个页面
│   │   ├── store/useAppStore.ts      # Zustand 全局状态
│   │   └── types/index.ts            # 全局 TypeScript 类型
│   └── tailwind.config.js            # 主题色/发光/动画
│
├── backend/                        # FastAPI 后端
│   ├── app/
│   │   ├── main.py                   # FastAPI 入口
│   │   ├── config.py / database.py   # 配置 + DuckDB 单例 + DDL 建表
│   │   ├── api/                      # 7 个 APIRouter 模块
│   │   ├── services/                 # 7 个业务 Service
│   │   ├── repositories/
│   │   │   └── duckdb_repository.py  # 15 个查询方法（含自动 Mock 初始化）
│   │   ├── pipeline/                 # 3 路 Pipeline 同步任务（带日志）
│   │   ├── models/schemas.py         # 18 个 Pydantic Schema
│   │   └── utils/logger.py           # 彩色双输出日志
│   ├── data/analytics.duckdb         # DuckDB 数据文件（首次启动生成）
│   ├── requirements.txt
│   └── start.sh
│
└── scripts/start-all.sh            # 一键启动脚本
```

---

## 🔌 核心 API 列表

| Method | Path | 功能 |
|--------|------|------|
| `GET`  | `/api/kpi/overview` | 总览 5 大 KPI + 环比 |
| `GET`  | `/api/kpi/trend?days=30` | 权益兑现率趋势 |
| `GET`  | `/api/pipeline/status` | 三路同步状态 |
| `GET`  | `/api/pipeline/logs?task=&level=&page=` | 同步日志（分页+筛选） |
| `POST` | `/api/pipeline/sync/{task}` | 手动触发同步（写日志） |
| `GET`  | `/api/seatmap/heatmap?period=&compare=` | 座位热力（compare 支持 yoy/mom） |
| `GET`  | `/api/seatmap/checkin-trend?period=` | 签到码生成+核销趋势（含同环比双轴） |
| `GET`  | `/api/sponsorship/list?page=&status=` | 赞助清单 |
| `GET`  | `/api/sponsorship/{id}/detail` | **赞助权益明细（跳转目标）** |
| `GET`  | `/api/verification/efficiency?group=` | 核销通道效率对比 |
| `GET`  | `/api/verification/date-trend?start=&end=` | 按日期核销趋势 |
| `GET`  | `/api/verification/area-compare` | 区域核销对比 |
| `GET`  | `/api/verification/definition` | **核销口径 5 条规则（解释用）** |
| `GET`  | `/api/ticket/rank?metric=absolute&top=10` | 票种排行（metric 切换 absolute/ratio） |
| `GET`  | `/api/refund/distribution?start=&end=` | 退票分布 + 争议点 ID |
| `GET`  | `/api/refund/{id}/sample` | **退票样本详情（跳转目标，全链路证据）** |

---

## 🎨 设计规范

- **主色调**：深海蓝 `#0B1E3F` 背景 + 青蓝 `#00D4FF` 主数据色
- **五色体系**：青（主）/绿（成功）/橙（预警）/红（风险）/紫（赞助）
- **字体**：`Chakra Petch` 标题（科技感等宽）+ `Inter` 正文
- **动效**：发光脉冲（animate-pulse-glow）、流动虚线（animate-flow-line）、右侧滑入（animate-slide-in-right）
- **视觉细节**：全局 40px 网格纹理 + 顶部径向辉光 + 毛玻璃面板

---

## 🔧 对接真实数据

默认使用 DuckDB + Mock 数据即可开箱即用。

### 切换到 PostgreSQL + 真实同步

1. 在 `backend/.env` 中配置：
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DUCKDB_PATH=./data/analytics.duckdb
```
2. 修改 `app/pipeline/*_pipeline.py` 的 `extract()` 方法，连接真实数据源（报名 API / 支付网关 / 闸机 WebSocket）
3. 同步链路每步自动写入 `sync_logs`，前端 Pipeline 页实时显示同步进度

### DuckDB → PostgreSQL 混合模式

PostgreSQL 存业务明细（INSERT ONLY 大表）；每日定时把聚合结果写入 DuckDB 宽表，专供前端分析查询，避免把分析压力打到业务主库。

---

## 🧪 验证清单

- [x] 7 个页面路由全部可达
- [x] 21 个 API 全部有 Mock 返回
- [x] 3 路 Pipeline 可手动触发 + 生成日志
- [x] 座位图同比/环比切换正常（差异描边高亮）
- [x] 赞助清单 → 明细 Drawer 跳转正常（含兑现时间轴）
- [x] 核销报表三 Tab 切换 + 口径 Drawer 展示
- [x] 票种排行 绝对值 ↔ 占比 Segmented 切换联动
- [x] 退票散点点击 → 样本 Drawer 全链路证据
- [x] `tsc --noEmit` **0 错误**
- [x] FastAPI `/docs` Swagger 可直接测试

---

## 📝 License

内部项目 © 活动运营分析团队
