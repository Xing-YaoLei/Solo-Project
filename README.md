# 健身私教会员续费漏斗报表系统

用于复盘健身私教的会员续费问题的数据分析系统。

## 技术栈

- **前端**: React 18 + Vite + Ant Design + ECharts
- **后端**: FastAPI + SQLAlchemy + PostgreSQL
- **数据分析**: DuckDB (列式分析数据库)

## 功能特性

### 📊 续费漏斗看板
- 五阶段转化漏斗：总会员 → 活跃会员 → 即将到期 → 已触达 → 已续费
- 续费率趋势图（双轴：人数 + 比率）
- 教练续费率排行榜
- 即将到期会员预警列表
- 点击漏斗各阶段可展开查看详情和复盘备注

### 🔍 逐层钻取明细
- **核销记录**: 所有课程/门禁核销明细，可追溯到具体课程
- **退款分析**: 按退款原因分布统计，饼图 + 柱状图双视图
- **会员档案**: 完整会员信息，包含会籍卡、课程记录、交易记录、退款记录、门禁记录、续费备注

### 📝 复盘备注任务
- 权益到期自动生成备注任务
- 每个漏斗阶段都可以添加备注
- 备注支持状态管理（待处理/处理中/已解决/已关闭）
- 处理结论展示在图表旁

### ⚙️ 预警阈值配置
- 续费预警天数
- 低续费率预警
- 不活跃预警天数
- 即将到期提醒
- 低课时预警
- **所有修改记录操作人，支持审计追溯**

## 项目结构

```
MP0113/
├── backend/                    # 后端 FastAPI 服务
│   ├── app/
│   │   ├── api/                # API 路由
│   │   │   ├── analytics.py    # 数据分析接口
│   │   │   ├── thresholds.py   # 预警阈值接口
│   │   │   ├── renewal_notes.py # 续费备注接口
│   │   │   └── members.py      # 会员管理接口
│   │   ├── models/             # SQLAlchemy 数据模型
│   │   ├── schemas/            # Pydantic 数据结构
│   │   ├── services/           # 业务逻辑服务
│   │   │   ├── analytics_service.py  # 数据分析服务
│   │   │   └── sync_service.py       # 数据同步服务
│   │   ├── scripts/            # 脚本工具
│   │   │   └── mock_data.py    # Mock 数据生成
│   │   ├── db/                 # 数据库连接
│   │   │   ├── database.py     # PostgreSQL 连接
│   │   │   └── duckdb_conn.py  # DuckDB 连接
│   │   └── main.py             # 应用入口
│   ├── requirements.txt
│   └── start.sh                # 启动脚本
└── frontend/                   # 前端 React 应用
    ├── src/
    │   ├── pages/              # 页面组件
    │   │   ├── FunnelDashboard.jsx    # 续费漏斗看板
    │   │   ├── MemberList.jsx         # 会员列表
    │   │   ├── MemberDetail.jsx       # 会员详情
    │   │   ├── VerificationRecords.jsx # 核销记录
    │   │   ├── RefundAnalysis.jsx     # 退款分析
    │   │   └── ThresholdSettings.jsx  # 预警阈值
    │   ├── services/           # API 服务
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## 数据模型

### PostgreSQL 业务库
- `members` - 会员档案
- `memberships` - 会籍卡
- `courses` - 课程表
- `course_records` - 核销记录
- `transactions` - 收银/交易记录
- `access_records` - 门禁记录
- `refunds` - 退款记录
- `warning_thresholds` - 预警阈值配置
- `threshold_audit_logs` - 阈值修改审计日志
- `renewal_notes` - 续费备注任务

### DuckDB 分析库
- `dim_member` - 会员维度表
- `dim_membership` - 会籍维度表
- `fact_transaction` - 交易事实表
- `fact_course_record` - 核销事实表
- `fact_access` - 门禁事实表
- `fact_refund` - 退款事实表
- `fact_renewal_note` - 备注事实表

## 快速开始

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置数据库连接
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitness_renewal"

# 启动（含 Mock 数据）
bash start.sh
```

后端服务将运行在 http://localhost:8000

API 文档: http://localhost:8000/docs

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 http://localhost:3000

## 核心功能说明

### 续费漏斗分析
系统设计了五层转化漏斗，帮助业务团队定位流失环节：

1. **总会员数** - 全部在籍会员
2. **活跃会员** - 统计周期内有到店记录
3. **即将到期** - 权益将在指定时间内到期
4. **已触达会员** - 已经过续费提醒
5. **已续费会员** - 成功完成续费

### 数据钻取路径
```
漏斗看板 → 点击阶段 → 查看详情/备注
         → 教练排行 → 教练下会员列表
         → 到期会员 → 会员详情 → 课程/交易/退款/门禁记录
退款分析 → 点击原因 → 退款会员列表 → 会员详情
```

### 阈值审计
所有预警阈值的修改都会记录：
- 修改人
- 修改前/后的值
- 修改时间
- 修改原因备注
