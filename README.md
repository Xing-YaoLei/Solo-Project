# 商户结算趋势看板

本地跑腿商户结算趋势看板系统，用于把商户结算从静态报表中独立拆分。

## 技术栈

- **前端**: React + ECharts + Ant Design + Vite
- **后端**: FastAPI + SQLAlchemy
- **数据库**: PostgreSQL + DuckDB
- **数据分析**: Pandas

## 项目结构

```
MP0433/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── core/            # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/         # Pydantic 模式
│   │   ├── services/      # 业务逻辑
│   │   └── main.py         # 应用入口
│   ├── data/               # DuckDB 数据目录
│   └── requirements.txt   # Python 依赖
│
└── frontend/               # 前端应用
    ├── src/
    │   ├── components/     # 组件
    │   ├── pages/         # 页面
    │   ├── utils/         # 工具
    │   └── main.jsx       # 入口
    └── package.json       # Node 依赖
```

## 核心功能

### 1. 结算趋势看板
- 结算金额趋势图（双Y轴：金额 + 订单数
- 异常点标注：
  - 🟡 订单系统延迟
  - 🔴 客服记录缺失
  - 🔵 支付流水口径变化
- 受影响区间高亮显示

### 2. 常用视图（Tab 切换
- **单据明细**：订单列表、状态、延迟标记
- **审批节点**：审批流程时间线
- **金额校验**：预期结算 vs 实际结算对比
- **口径差异表**：客服记录与支付流水差异保留完整差异表，不直接覆盖

### 3. 下载功能
- 支持自定义日期范围
- 附带回款周期计算规则
- 包含完整结算数据

### 4. 数据异常处理原则
- 复盘说明与异常点不分离
- 金额不一致时标出受影响区间
- 客服记录与支付流水口径冲突时保留差异表

## 快速开始

### 后端启动

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

## API 接口

- `GET /api/v1/settlement/trend - 结算趋势数据
- `GET /api/v1/settlement/orders - 单据明细
- `GET /api/v1/settlement/approval-nodes - 审批节点
- `GET /api/v1/settlement/amount-checks - 金额校验
- `GET /api/v1/settlement/caliber-diffs - 口径差异表
- `GET /api/v1/settlement/dashboard/summary - 看板概览
- `GET /api/v1/settlement/settlement/rules - 回款周期规则
- `GET /api/v1/settlement/download - 下载数据

## 回款周期计算规则

1. 结算周期：T+7 自然日
2. 结算日：每周一进行上周结算
3. 到账时效：结算审批完成后3个工作日内到账
4. 金额计算：结算金额 = 订单总额 - 退款金额 - 服务费 - 其他扣除

## 数据口径说明

- 订单口径：以订单完成时间为准
- 退款口径：以客服记录的退款时间为准
- 支付口径：以支付渠道实际到账时间为准
