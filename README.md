# 旅游民宿套餐售卖跟进台

解决旅游民宿里套餐售卖交接慢、记录散的问题的一体化管理系统。

## 🏔️ 技术栈

### 后端
- **FastAPI** - 高性能 Python Web 框架
- **PostgreSQL** - 关系型数据库（10 张核心表）
- **SQLAlchemy 2.0** - ORM 数据层
- **Celery + Redis** - 异步任务（超卖巡检、异步导出）
- **Alembic** - 数据库迁移
- **Pandas + openpyxl** - Excel 导出（含 3 Sheet 口径说明）

### 前端
- **React 18 + Vite 5** - 现代化开发体验
- **TanStack Router** - 文件路由系统
- **TailwindCSS 3** - 原子化 CSS
- **ECharts** - 数据可视化（漏斗、柱状、饼图）
- **Zustand** - 轻量状态管理
- **Lucide Icons** - 图标库
- **React Hot Toast** - 消息提示

## 📁 项目结构

```
MP0368/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI 主入口
│   │   ├── celery_app.py            # Celery 应用入口
│   │   ├── core/                    # 核心配置（config.py/database.py）
│   │   ├── models/                  # 10 个数据库模型
│   │   ├── schemas/                 # Pydantic 请求/响应 Schema
│   │   ├── services/                # 业务逻辑层
│   │   ├── tasks/                   # Celery 异步任务（oversold/export）
│   │   └── api/                     # FastAPI 路由
│   │       ├── __init__.py          # 主业务路由（9 大模块）
│   │       └── export.py            # 带口径说明的导出 API
│   ├── scripts/
│   │   └── seed_data.py             # 种子数据初始化脚本
│   ├── exports/                     # 导出文件存储目录
│   ├── requirements.txt             # Python 依赖
│   └── .env.example                 # 环境变量示例
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # React 入口
│   │   ├── router/                  # TanStack Router 配置
│   │   ├── layouts/                 # AppLayout 主布局（侧边栏+顶栏）
│   │   ├── components/ui.jsx        # 通用组件（Modal/Pagination/StatusBadge）
│   │   ├── lib/                     # API 封装、常量定义
│   │   ├── routes/                  # 10 个页面
│   │   └── index.css                # Tailwind 样式
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## 🔥 核心功能

### 1. 价格规则 & 入住日期（上游）
- 套餐管理（基础信息、房型、容量、基础价格）
- **4 类价格规则**：平日规则 / 周末规则 / 节假日规则 / 自定义日期
- 支持「固定金额」或「百分比」加价
- 规则**优先级匹配**，大数字优先
- **价格测算工具**：选择入住区间，实时展示每天适用规则与总价
- 入住日历可视化配置，一键**开放/关闭**日期
- 批量生成未来 N 天可售配置

### 2. 套餐库存
- **30 日库存热力图**：色块深浅反映销售压力
- 单天快速编辑：总库存/已售/预留/单价
- 销售率自动百分比计算与可视化
- **超卖实时预警**：红色高亮可售 < 0 的日期
- 一键跳到异常超卖日期处理

### 3. 订单跟进台（中台核心）
- 左列表 + 右详情双栏布局，高效处理
- **智能创建**：
  - 选择套餐+日期→自动匹配价格规则测算
  - 实时库存校验与预警
  - 超卖时**强制创建但自动生成异常单**
- 完整金额结构：原价、优惠、实收、押金
- **状态流转时间线**（4 步+2 异常分支）：
  - 待确认 → 已确认 → 已入住 → 已退房
  - 已取消 / 已退款（自动释放库存）
- 每一步都记录「操作人+原因+时间」，完整留痕

### 4. 核销记录
- 核销码管理
- **实际入住/退房时间**登记
- 客人证件核验列表
- 核销备注

### 5. 押金明细
- 应付/已付/已退/扣款 4 类金额追踪
- **押金收取**：微信/支付宝/现金/刷卡/银行转账，记录流水号
- **押金退还**：
  - 支持添加**扣款明细**（布草赔偿/设施损坏/超时等）
  - 自动计算实际退款 = 已付 - 已退 - 本次扣款
  - 完整记录退款方式、流水、经手人

### 6. 超卖异常单（风控）
> 遇到套餐超卖时**自动生成异常单**，把影响范围、责任归属和处理结果写清楚

- **5 类异常**：套餐超卖 / 价格异常 / 库存错误 / 核销失败 / 押金问题
- **影响范围结构化记录**：受影响订单号列表、受影响日期、库存冲突明细
- **责任归属**：销售部 / 运营部 / 前台 / 系统 / 客户 → 具体责任人
- **处理过程时间线**：每条步骤记录（动作/操作人/备注/时间）
- 赔付金额追踪
- 根因分析 + 最终处理结果

### 7. 套餐转化率分析（数据赋能）
- 整体转化漏斗：咨询→下单→确认→入住
- 6 个核心 KPI 卡片
- 各套餐**下单/确认/入住**数量柱状对比
- **三率折线图**：订单确认率 / 确认入住率 / 整体转化率
- 营收占比环形图
- 转化明细表（含颜色标记的转化风险）
- 页面内嵌**口径说明**提示框

### 8. 数据导出（团队沟通）
> 每份导出结果都要说明口径，方便围绕套餐转化率向团队解释变化

- **4 类导出**：订单明细 / 套餐转化率 / 库存明细 / 异常单
- 每个 Excel 包含 **3 个 Sheet**：
  1. **数据明细** - 实际业务数据
  2. **数据口径说明** - 字段对照表（字段名→中文含义）
  3. **口径补充** - 指标公式、状态映射、筛选规则、责任归属映射等
- 新建导出时**实时预览口径**
- 导出任务列表，文件大小/行数记录，一键下载

### 9. Celery 异步任务
- `detect_oversold_globally`：周期性扫描未来 60 天库存，检测超卖自动生成异常单
- `detect_daily_snapshot`：按天快照式超卖检测
- `run_export_async`：异步导出大文件，进度可追踪

## 🗄️ 数据模型

| 表名 | 核心用途 |
|------|---------|
| `packages` | 套餐基础信息 |
| `price_rules` | 价格规则（平日/周末/节假日/自定义） |
| `stay_dates` | 入住日期配置（开放/关闭/时间） |
| `package_inventories` | 每日库存与单价 |
| `orders` | 订单主表 |
| `order_status_logs` | 订单状态流转记录（时间线） |
| `verifications` | 核销记录 |
| `deposits` | 押金明细（含扣款 JSON 数组） |
| `anomaly_orders` | 异常单（含影响范围 JSON、处理过程 JSON） |
| `export_tasks` | 导出任务与口径快照 |

## 🚀 快速开始

### 前置依赖
- Python 3.10+
- Node.js 18+
- PostgreSQL 12+
- Redis 6+（Celery Broker）

### 1. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 修改 PostgreSQL/Redis 配置

# 初始化数据库（会自动建表）
# 可以通过启动 FastAPI 自动建表，或手动：
# python -c "from app.core.database import Base, engine; Base.metadata.create_all(engine)"

# （可选）载入示例数据
python scripts/seed_data.py

# 启动 API 服务（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# 访问 Swagger 文档: http://localhost:8000/docs
# 访问 Redoc:           http://localhost:8000/redoc
```

### 2. 启动 Celery Worker（可选）

```bash
# 新开一个终端，backend 目录下
celery -A app.celery_app worker --loglevel=info -Q homestay_default,homestay_anomaly,homestay_export --concurrency=2

# 启动 Beat 周期性任务（可选）
celery -A app.celery_app beat --loglevel=info
```

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install
# 或
yarn install

# 启动开发服务器
npm run dev
# 访问: http://localhost:5173
```

Vite 已配置代理：`/api` → `http://localhost:8000`

### 4. 生产构建

```bash
# 前端
cd frontend && npm run build
# 产物在 dist/ 目录，用 Nginx 或任意静态服务器部署

# 后端
cd backend
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## 🎯 典型使用流程

1. **配置阶段**（运营人员）
   - 新建套餐 → 配置价格规则 → 批量生成入住日期 → 设置每日库存
   - 用价格测算工具验证定价合理性

2. **销售阶段**（销售/前台）
   - 客户下单 → 创建订单（自动算价+库存校验）
   - 超卖 → 自动生成异常单，运营介入
   - 状态推进：待确认→已确认（收押金）→入住核销→退房（退押金）

3. **管理阶段**（店长/运营）
   - 工作台一览核心指标
   - 转化率分析页看销售表现
   - 异常单页处理问题并留痕
   - 导出带口径的数据 Excel → 团队周会解释数据

## 📚 API 速览

| 模块 | 前缀 | 典型接口 |
|------|------|---------|
| 套餐 | `/api/v1/packages` | CRUD、搜索、上架状态 |
| 价格规则 | `/api/v1/price-rules` | 按套餐查询、新增、修改、**测算价格** |
| 入住日期 | `/api/v1/stay-dates` | **批量生成**、查询、开放/关闭 |
| 库存 | `/api/v1/inventories` | **校验可用性**、更新、列表 |
| 订单 | `/api/v1/orders` | CRUD、**状态变更**、详情（含核销+押金+日志） |
| 核销 | `/api/v1/verifications` | 查询、更新（实际入住退房） |
| 押金 | `/api/v1/deposits` | **收款**、**退款（支持扣款明细）** |
| 异常单 | `/api/v1/anomalies` | CRUD、**追加处理步骤** |
| 分析 | `/api/v1/analytics` | 整体转化、**按套餐转化** |
| 导出 | `/api/exports` | 创建（带口径）、任务列表、**下载** |

## 🎨 界面亮点

- 深色渐变侧边栏 + 浅色内容区，专业 B 端视觉
- 订单详情右侧面板：状态流转时间线、客户、入住、金额、核销、押金、日志 7 段式
- 套餐卡片式列表，价格规则抽屉、独立价格测算弹窗
- 入住日期双月历，色块区分开放/关闭/今日
- 库存热力图，鼠标悬停编辑，超卖一键跳转
- 异常单详情：影响范围红色区域 + 处理过程时间线
- 转化率 3 图（柱/线/饼）+ 漏斗进度条 + 明细表
- 导出类型卡片 + 口径预览琥珀色卡片

## 🛡️ 设计思路

- **交接慢** → 每个订单右侧 7 段完整上下文，状态流转全留痕
- **记录散** → 订单+核销+押金+异常+日志全关联，点一次全可见
- **口径不清** → 每次导出自带口径 Sheet，团队会议打开 Excel 即可解释
- **超卖甩锅** → 异常单强制记录责任归属、处理过程、赔付金额、根因

---

✨ **云宿跟进台** · 让每一笔套餐销售都清晰可追溯
