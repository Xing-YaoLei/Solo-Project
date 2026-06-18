# 🏗️ 家装工地客户确认风险监测系统

基于 **Streamlit + Polars + DuckDB + MinIO** 技术栈搭建的家装工地客户确认变化风险监测平台。

## ✨ 核心功能

| 功能模块 | 说明 |
|---------|------|
| 🎯 风险监测仪表盘 | 实时显示项目总数、完整率、高风险项目、资料缺失记录，含风险分布图和完整率分布图 |
| 📊 多维度报表分析 | 按资料完整率、日期、区域进行比较分析，支持排行榜和筛选 |
| 📎 附件材料分析 | 附件分类统计、标签分组同环比分析 |
| 🔍 明细查询 | 授权范围内的项目详情查看，支持跳转到设计/收款/采购/附件/变更记录 |
| 📜 变更时间线 | 记录项目口径变更历史，用于解释指标口径变化 |
| 🔄 同步链路追踪 | 设计软件导出、收款记录、采购单记录每一步的同步批次和结果 |
| 🛡️ 资料缺失跳转 | 检测到资料缺失时，支持一键跳转到对应样本明细 |
| ⚡ 图表容错机制 | 图表加载失败时显示最近更新时间和重试入口 |

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────┐
│                  Streamlit UI                     │
│  (仪表盘/报表/附件/明细/变更时间线)                │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              UI Components                       │
│  (图表/错误回退/筛选器/KPI卡片)                   │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│            Data Repository                       │
│  (项目确认/缺失样本/附件/变更/授权)               │
└─────────┬───────────────────┬────────────────────┘
          │                   │
┌─────────▼──────┐  ┌────────▼──────────┐
│  DuckDB 引擎   │  │  Polars 处理器    │
│  (SQL/持久化)   │  │  (计算/同环比)    │
└────────────────┘  └────────┬──────────┘
                             │
                   ┌─────────▼──────────┐
                   │   MinIO 存储       │
                   │  (附件/文件对象)    │
                   └────────────────────┘
```

## 📁 项目结构

```
MP0314/
├── app.py                      # Streamlit 主入口（仪表盘）
├── config.py                   # 全局配置
├── init_data.py                # 数据初始化脚本
├── run.sh                      # 一键启动脚本
├── requirements.txt            # Python 依赖
├── data_generator.py           # 模拟数据生成器
├── data_layer/                 # 数据层
│   ├── duckdb_engine.py        # DuckDB 存储引擎
│   ├── polars_processor.py     # Polars 数据处理器
│   ├── minio_storage.py        # MinIO 对象存储
│   └── repository.py           # 数据仓储层
├── sync_pipeline/              # 同步链路
│   ├── sync_pipeline.py        # 同步管道基类
│   ├── design_export_sync.py   # 设计软件导出同步
│   ├── payment_record_sync.py  # 收款记录同步
│   └── purchase_order_sync.py  # 采购单记录同步
├── ui_components/              # UI 组件
│   ├── ui_components.py        # 通用 UI 组件
│   └── chart_components.py     # 图表组件
├── pages/                      # Streamlit 多页面
│   ├── 1_📊_报表分析.py
│   ├── 2_📎_附件材料.py
│   ├── 3_🔍_明细查询.py
│   └── 4_📜_变更时间线.py
└── data/                       # 数据目录（DuckDB 文件）
```

## 🚀 快速开始

### 方式一：一键启动

```bash
./run.sh
```

### 方式二：手动启动

```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 初始化数据
python init_data.py

# 4. 启动应用
streamlit run app.py
```

访问 http://localhost:8501 即可使用。

## 🔧 环境配置

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

配置项：

| 变量 | 说明 | 默认值 |
|-----|------|-------|
| `MINIO_ENDPOINT` | MinIO 服务地址 | localhost:9000 |
| `MINIO_ACCESS_KEY` | MinIO Access Key | minioadmin |
| `MINIO_SECRET_KEY` | MinIO Secret Key | minioadmin |
| `MINIO_BUCKET` | MinIO 存储桶名 | home-decoration |
| `DUCKDB_PATH` | DuckDB 数据库路径 | ./data/home_decoration.duckdb |

> 💡 如未部署 MinIO，附件存储功能会自动降级，不影响核心功能使用。

## 📊 数据模型

### 核心数据表

- **sync_batches**：同步批次记录（所有数据源的同步历史）
- **design_exports**：设计软件导出记录
- **payment_records**：收款记录
- **purchase_orders**：采购单记录
- **project_confirmations**：项目客户确认状态（汇总）
- **attachments**：附件材料
- **change_timeline**：变更时间线（口径解释）
- **auth_scopes**：用户授权范围

### 风险等级判定规则

| 风险等级 | 资料完整率 |
|---------|-----------|
| 🟢 低风险 | ≥ 90% |
| 🟡 中风险 | 70% - 89% |
| 🟠 高风险 | 50% - 69% |
| 🔴 极高风险 | < 50% |

## 🎯 使用场景

1. **日常巡检**：项目经理每天通过仪表盘查看所辖区域的客户确认情况
2. **风险预警**：高风险项目自动标识，支持快速跳转到缺失资料明细
3. **趋势分析**：通过报表页面的区域/日期维度分析整体资料完整率变化
4. **审计追溯**：变更时间线记录所有口径调整，满足合规审计需求
5. **绩效评估**：附件材料同环比分析用于评估团队资料收集工作效率
