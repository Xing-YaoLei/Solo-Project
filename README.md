# 🚗 汽车维修保养提醒趋势看板

基于 **Streamlit + Polars + DuckDB + MinIO** 构建的汽车维修数据分析平台。

## 功能模块

### 📈 总览看板
- 核心经营指标（建档车辆、维修工单、保养提醒、返修率）
- 保养提醒趋势与状态分布
- 车辆档案概览（品牌、客户类型、城市分布）
- 高优先级保养提醒清单

### 💰 收银流水与工单版本
- 收银流水趋势分析（笔数、金额、支付方式）
- 维修工单版本追踪与变更历史
- 工单与收银流水差异对照（金额、版本一致性）

### 🛡️ 保险材料口径对照
- 保险公司口径对比汇总
- 金额差异趋势分析
- 配件数、工时数、金额三维度对照
- 差异案件深度排查（联动工单与项目明细）

### 📦 配件库存与缺货缺口
- 库存总览与异常点检测（Z-score 方法）
- 缺货缺口 Top 分析与紧急度分布
- **缺货样本明细回溯**（通过 sample_record_id）
- **出入库历史溯源**（跳回原始记录 original_record_ref）

### 🔧 返修率复盘分析
- 返修率趋势与原因分析
- **诊断结果与工单项目联动筛选**
- 返修率改善追踪（基准期 vs 当前期）
- 返修闭环结果统计

## 数据层设计

| 数据表 | 说明 | 关键字段 |
|--------|------|---------|
| vehicles | 车辆档案 | vehicle_id, plate_number, brand, model |
| cash_transactions | 收银流水 | transaction_id, work_order_id, actual_amount |
| work_orders | 维修工单 | work_order_id, vehicle_id, total_amount, status |
| work_order_items | 工单项目 | item_id, work_order_id, item_type, subtotal |
| work_order_versions | 工单版本 | version_id, work_order_id, version_number, change_type |
| parts_inventory | 配件库存 | inventory_id, part_id, stock_quantity, original_record_id |
| parts_inventory_history | 库存历史 | history_id, inventory_id, original_record_ref |
| insurance_docs | 保险材料 | doc_id, work_order_id, insurance_amount, workshop_amount |
| diagnosis_results | 诊断结果 | diagnosis_id, work_order_id, diagnosis_item, diagnosis_result |
| maintenance_reminders | 保养提醒 | reminder_id, vehicle_id, status, priority |
| rework_records | 返修记录 | rework_id, work_order_id, rework_reason, rework_cost |
| parts_shortage | 配件缺货 | shortage_id, part_id, sample_record_id, source_record_ref |

## 快速开始

### 安装依赖

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 启动应用

```bash
streamlit run app.py
```

### 环境变量（可选）

```bash
# MinIO 配置
export MINIO_ENDPOINT=localhost:9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_BUCKET=auto-maintenance

# DuckDB 持久化路径
export DUCKDB_PATH=./data/maintenance.db

# 使用模拟数据（默认 true）
export USE_MOCK_DATA=true
```

## 技术栈

- **Streamlit**: 前端交互界面
- **Polars**: 高性能数据处理
- **DuckDB**: 列式分析数据库
- **MinIO**: 对象存储服务
- **Plotly**: 可视化图表
