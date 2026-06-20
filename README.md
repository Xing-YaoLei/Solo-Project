# 景区运营演出排期风险监测系统

## 项目概述

本系统用于拆解景区运营的演出排期数据，提供全方位的演出运营风险监测能力。

## 技术架构

- **前端**: React 18 + TypeScript + Vite + Ant Design 5 + ECharts
- **后端**: FastAPI (Python 3.10+)
- **数据库**: PostgreSQL (业务数据) + DuckDB (OLAP 分析)
- **认证**: JWT + 基于角色的访问控制 (RBAC)

## 核心功能

### 1. 数据接入
- 小程序订单数据同步
- 商户流水接入
- 摄像头人流统计明细追溯

### 2. 可视化图表
- **座位销售趋势图**: 实时展示座位已售/可售/预留变化及上座率趋势
- **签到码构成分析**: 二维码/条形码/NFC/人工核销的构成占比与使用率
- **赞助清单明细**: 各级别赞助商的现金贡献、实物赞助、票务分配详情
- **核销异常记录**: 重复核销、无效码、人脸不匹配等异常标注，支持摄像头快照追溯

### 3. 特色能力
- **最近刷新时间显示**: 顶部实时展示当前时间与各数据源最近刷新时间
- **角色权限控制**: 管理员 / 运营经理 / 分析师 / 查看者 四级权限
- **分享视图权限**: 分享链接不绕过角色权限，需指定允许访问的角色级别
- **CSV 导出与口径说明**:
  - 导出文件头部包含核销效率、上座率、收入等指标的统计口径
  - 文件末尾附加所有涉及指标的完整定义（定义、公式、单位、数据源、刷新频率）
  - 景区运营经理下载后可追溯每个数字的计算逻辑

### 4. 指标定义追溯
系统内置指标定义库，点击图表旁的信息按钮即可查看：
- `checkin_efficiency` 核销效率
- `occupancy_rate` 上座率
- `revenue` 收入金额
- `ticket_sold` 售票数量
- `anomaly_rate` 异常核销率
- `sponsor_contribution` 赞助金额

## 快速开始

### 后端启动

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置数据库连接等参数

# 初始化模拟数据（含用户、演出、订单、核销等）
python seed_data.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档: http://localhost:8000/docs

### 前端启动

```bash
cd frontend

# 安装依赖
npm install
# 或 yarn / pnpm install

# 启动开发服务
npm run dev
```

前端访问: http://localhost:5173

### 默认演示账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| ops_manager | ops123 | 运营经理 | 可导出CSV、分享视图 |
| analyst | analyst123 | 分析师 | 可查看明细与分析 |
| admin | admin123 | 管理员 | 全部权限 |
| viewer | viewer123 | 查看者 | 仅查看图表概览 |

## 目录结构

```
MP0393/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI 路由（认证、分析、数据接入、导出、分享）
│   │   ├── core/             # 配置、安全认证、权限依赖
│   │   ├── db/               # PostgreSQL & DuckDB 连接
│   │   ├── models/           # SQLAlchemy ORM 模型
│   │   ├── schemas/          # Pydantic 数据验证模型
│   │   ├── services/         # 业务逻辑服务层
│   │   └── main.py           # FastAPI 应用入口
│   ├── seed_data.py          # 模拟数据初始化脚本
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── api/              # Axios 请求封装与 API 定义
        ├── components/       # 可复用图表与明细组件
        ├── pages/            # 登录页 / Dashboard 主页
        ├── store/            # Zustand 状态管理（用户认证）
        ├── utils/            # 通用工具
        └── index.css         # 全局样式
```

## CSV 导出样例结构

每个导出的 CSV 文件包含以下三部分：

1. **统计口径说明**（文件头部，首行）:
   ```
   核销效率口径说明：核销效率 = 实际核销人数 / 应核销人数 × 100%...
   ```

2. **业务数据表格**（表头 + 数据行）

3. **指标定义章节**（文件末尾）:
   ```
   ===== 指标定义 =====
   [checkin_efficiency] 核销效率
     定义: 实际核销人数与应核销人数的比率...
     计算公式: 核销效率 = 有效核销记录数 / 已支付订单票务总数 × 100%
     单位: %
     数据来源: 核销记录表(checkin_records)、订单表(orders)
   ```
