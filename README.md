# 长租公寓退租验房趋势看板

## 项目概述

长租公寓退租验房趋势看板系统，用于追踪和分析长租公寓的退租验房数据。系统整合CRM、支付流水、电子合同等多源数据，提供水电读数分布、验房清单漏斗、收款流水排行、投诉标签变化等多维度分析。

## 技术栈

- **前端**: React 18 + TypeScript + ECharts 5 + Ant Design 5
- **后端**: FastAPI + Python 3.11 + SQLAlchemy 2
- **数据库**: PostgreSQL 16 (业务数据) + DuckDB (分析数据)
- **容器化**: Docker + Docker Compose

## 核心功能

### 数据处理层
1. **CRM数据优先处理**: 先导入和清洗CRM客户信息
2. **多源数据合并**: 合并支付流水、电子合同数据
3. **批次记录**: 每轮导入保留完整批次记录，支持数据回溯
4. **DuckDB分析**: 使用DuckDB进行高性能OLAP分析

### 分析看板
1. **水电读数分布**: 展示退租时水电表读数的分布情况
2. **验房清单漏斗**: 从退租申请到验房完成的转化漏斗
3. **收款流水排行**: 按房源/区域统计收款流水排行
4. **投诉标签变化**: 投诉类型标签的时间序列变化

### 特色功能
1. **租金逾期注释**: 遇到租金逾期情况可添加备注说明
2. **权限控制**: 
   - 管理层: 查看全量数据总览
   - 个人视图: 只显示自己负责的维修时长数据
3. **维修时长口径版本管理**: 保留不同时期的统计口径，复盘时可解释数字变化原因

## 快速开始

### 环境要求
- Docker Desktop 4.0+
- Node.js 18+ (本地开发)
- Python 3.11+ (本地开发)

### 启动服务

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 启动所有服务
docker-compose up -d

# 3. 初始化数据库
docker-compose exec backend python -m app.database.init_db

# 4. 导入示例数据
docker-compose exec backend python -m app.scripts.import_sample_data
```

### 访问地址
- 前端看板: http://localhost:3000
- 后端API文档: http://localhost:8000/docs
- 测试账号: 
  - 管理员: admin@example.com / admin123
  - 维修员: worker@example.com / worker123

## 项目结构

```
MP0291/
├── backend/                    # FastAPI后端
│   ├── app/
│   │   ├── api/               # API路由
│   │   ├── core/              # 核心配置
│   │   ├── database/          # 数据库模型和连接
│   │   ├── models/            # SQLAlchemy模型
│   │   ├── schemas/           # Pydantic数据模型
│   │   ├── services/          # 业务逻辑
│   │   ├── analytics/         # DuckDB分析模块
│   │   └── scripts/           # 数据导入脚本
│   ├── data/                  # DuckDB数据文件
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                  # React前端
│   ├── src/
│   │   ├── components/        # 图表组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API服务
│   │   ├── store/             # 状态管理
│   │   └── types/             # TypeScript类型
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 数据导入流程

```
1. CRM数据导入 → 批次记录生成
2. 支付流水导入 → 关联CRM客户
3. 电子合同导入 → 关联房源和客户
4. 数据清洗合并 → 生成统一视图
5. DuckDB聚合 → 生成分析指标
```

## 维修时长口径版本

系统维护维修时长的统计口径版本，支持在复盘时追溯：

| 版本号 | 生效日期 | 口径说明 |
|--------|----------|----------|
| v1.0   | 2024-01-01 | 从报修到工单关闭的自然日 |
| v1.1   | 2024-06-01 | 排除周末和法定节假日 |
| v2.0   | 2025-01-01 | 从派单开始计算，排除待客户确认时间 |

## 开发说明

### 后端开发
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 前端开发
```bash
cd frontend
npm install
npm start
```

## 许可证

MIT License
