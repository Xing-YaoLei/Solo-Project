# 🏥 养老护理康复活动趋势看板

专门用于复盘养老护理康复活动的数据分析看板系统。

## 技术栈

- **Streamlit** - 前端界面框架
- **Polars** - 高性能数据处理
- **DuckDB** - 嵌入式分析数据库
- **MinIO** - 对象存储服务
- **Plotly** - 交互式图表

## 功能特性

### 📊 核心功能

1. **多源数据接入**
   - 护理终端记录
   - 门禁进出记录
   - 健康设备数据（智能手环、床垫等）

2. **数据清洗处理**
   - 自动去重
   - 无效数据过滤
   - 字段口径标准化匹配
   - 清洗质量报告

3. **阈值配置管理**
   - 非技术人员可通过界面调整
   - 跌倒响应时间阈值
   - 护理达标预警线
   - 康复活动时长要求
   - 健康监测异常阈值

4. **跌倒事件复盘**
   - 跌倒事件自动检测
   - 护理响应合规性分析
   - 完整复盘材料生成
   - 改进建议自动生成

5. **分层图表展示**
   - 👴 老人档案（含用药清单、健康趋势）
   - 🎚️ 护理等级分布
   - 🏃 康复活动趋势
   - ✅ 护理达标趋势
   - 📊 护理活动分类统计
   - ❤️ 健康数据概览

6. **口径版本管理**
   - 护理达标标准版本化
   - 版本对比分析
   - 历史数据回溯
   - 数字变化解释说明

## 项目结构

```
MP0256/
├── app.py                      # 主应用入口
├── requirements.txt            # Python依赖
├── .env.example               # 环境变量示例
├── data/                       # 数据存储目录
├── sample_data/                # 示例数据目录
└── src/
    ├── __init__.py
    ├── config/                 # 配置模块
    │   ├── __init__.py
    │   └── settings.py         # 系统配置（护理等级、活动类型等）
    ├── data/                   # 数据层
    │   ├── __init__.py
    │   ├── minio_client.py     # MinIO数据接入
    │   └── duckdb_store.py     # DuckDB存储查询
    ├── processing/             # 处理层
    │   ├── __init__.py
    │   ├── data_cleaner.py     # 数据清洗模块
    │   └── data_matcher.py     # 数据关联匹配
    ├── services/               # 业务服务层
    │   ├── __init__.py
    │   ├── threshold_service.py    # 阈值配置服务
    │   ├── fall_review_service.py  # 跌倒复盘服务
    │   └── care_standard_service.py # 口径版本服务
    ├── widgets/                # UI组件
    │   ├── __init__.py
    │   └── charts.py           # 图表组件
    ├── pages/                  # 页面模块
    │   ├── __init__.py
    │   ├── dashboard_page.py   # 主看板页面
    │   ├── threshold_page.py   # 阈值配置页面
    │   ├── standard_page.py    # 口径版本页面
    │   └── data_page.py        # 数据管理页面
    └── utils/                  # 工具模块
        ├── __init__.py
        └── sample_data_generator.py  # 示例数据生成器
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

根据需要编辑 `.env` 文件：
```
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET=elder-care-data

DUCKDB_PATH=./data/elder_care.duckdb
```

### 3. 启动MinIO（可选，用于真实数据接入）

```bash
# 使用Docker启动MinIO
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -v ./minio-data:/data \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 4. 运行应用

```bash
streamlit run app.py
```

应用将在 `http://localhost:8501` 启动。

### 5. 生成示例数据（首次使用）

1. 进入「📥 数据管理」页面
2. 切换到「🎲 示例数据生成」标签
3. 选择老人数量和数据天数
4. 点击「生成示例数据」

## 主要页面说明

### 📊 趋势看板

- **KPI指标卡片**: 在院老人数、今日活动数、护理达标率、本月跌倒事件
- **总体概览**: 护理等级分布、活动分类统计、质量评分分布、健康数据
- **老人档案**: 搜索筛选、个人详情、用药清单、健康趋势
- **康复活动**: 康复趋势、活动明细、多样性分析
- **护理达标**: 达标率趋势、各等级达标情况、未达标预警
- **跌倒复盘**: 跌倒事件分析、待复盘事件、复盘记录创建

### ⚙️ 阈值配置

按分类管理各项阈值：
- 应急处理（跌倒响应时间、最低质量分）
- 护理达标（预警线）
- 康复活动（每周时长、多样性要求）
- 健康监测（心率、血压、血氧阈值）
- 数据清洗（有效时长范围）

### 📜 口径版本

- 版本概览：查看所有历史版本
- 创建新版本：调整各护理等级标准时长
- 版本影响分析：对比两个版本对历史达标率的影响，生成变化解释

### 📥 数据管理

- 数据导入：从MinIO批量导入或手动上传文件
- 数据清洗：查看清洗规则和统计报告
- 数据查询：支持预定义查询和自定义SQL
- 示例数据生成：用于测试和演示

## 护理达标口径说明

| 护理等级 | 标准名称 | 每日标准时长(分钟) | 说明 |
|---------|---------|------------------|------|
| level_1 | 自理 | 30 | 生活完全自理 |
| level_2 | 半自理 | 60 | 部分生活需要协助 |
| level_3 | 半失能 | 90 | 大部分生活需要照护 |
| level_4 | 失能 | 120 | 完全需要照护 |
| level_5 | 特护 | 180 | 24小时专人照护 |

## 数据处理流程

```
数据源 → MinIO → 数据清洗(去重/标准化) → DuckDB存储
    ↓
 关联匹配 → 每日护理汇总 → 达标率计算 → 可视化展示
    ↓
 跌倒检测 → 合规性分析 → 复盘材料生成
```

## 配置数据说明

系统初始化时会自动创建以下默认配置：

1. **阈值配置**: 5大类共11项可配置阈值
2. **口径版本**: 初始版本V1.0_202401，包含各护理等级标准时长

所有配置存储在DuckDB中，可通过界面动态调整。

## 生产环境部署建议

1. 使用独立的MinIO集群存储原始数据
2. 定期备份DuckDB数据库文件
3. 配置Nginx反向代理和HTTPS
4. 设置用户认证和权限控制
5. 配置监控告警（数据导入失败、异常值等）

## 开发说明

```bash
# 开发模式运行
streamlit run app.py --server.port 8501

# 代码检查
python -m py_compile src/**/*.py

# 导出数据库schema
duckdb ./data/elder_care.duckdb ".schema"
```

## License

MIT License
