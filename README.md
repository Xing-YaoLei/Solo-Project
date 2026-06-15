# 青少年培训续费跟进风险监测图

> 基于 Vue 3 + D3.js + Spring Boot + MySQL + Redis 的青少年培训续费跟进风险监测可视化系统

## 系统简介

本系统用于追踪青少年培训的续费跟进情况，通过多维度数据分析和可视化展示，帮助管理层和一线员工及时发现续费风险，提高续费率。

## 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **D3.js** - 数据可视化库
- **Element Plus** - Vue 3 UI 组件库
- **Pinia** - 状态管理
- **Vite** - 前端构建工具
- **Axios** - HTTP 客户端

### 后端
- **Spring Boot 3.2** - Java 应用框架
- **Spring Data JPA** - ORM 框架
- **Spring Data Redis** - Redis 数据访问
- **MySQL 8** - 关系型数据库
- **Redis** - 缓存数据库
- **Lombok** - Java 工具库
- **Fastjson2** - JSON 序列化

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                        前端展示层                         │
│  Vue 3 + D3.js + Element Plus                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │标签分布 │ │进度漏斗 │ │成绩排行 │ │规则变化 │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────────┐
│                        业务层                            │
│  Spring Boot + REST API                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │仪表盘   │ │批次管理 │ │数据导入 │ │规则引擎 │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
   ┌──────────┐               ┌──────────┐
   │  MySQL   │               │  Redis   │
   │ 持久化   │               │ 缓存层   │
   └──────────┘               └──────────┘
```

## 核心功能

### 1. 总览仪表盘
- 学员总数、进度落后学员、待处理反馈、到期学员统计
- 题目标签分布饼图
- 学习进度漏斗图
- 咨询师完成率排行（管理层）/ 我的学员列表（一线）

### 2. 数据分析区
- **题目标签分布**：各课程标签学员人数及占比、平均完成率
- **学习进度漏斗**：不同完成率区间的学员分布、各年级进度对比
- **成绩反馈排行**：成绩排行榜、进度落后榜、家长反馈情绪分布
- **提醒规则变化**：规则变更时间线、规则类型分布、近期变更记录

### 3. 学员管理
- 学员列表分页查询
- 学员详情查看（基本信息、成绩记录、进度注释）
- 进度注释添加与管理
- 续费状态标记

### 4. 批次管理
- 数据导入批次记录（报名表、成绩、反馈）
- 批次详情查看
- 延迟同步批次标注
- 导入数据统计

### 5. 提醒规则
- 规则列表管理
- 规则创建与编辑
- 规则变更历史
- 规则版本追踪

### 6. 权限分层
- **管理层视图**：全局数据总览、咨询师排行、全量数据分析
- **一线员工视图**：仅查看自己负责的学员、个人完成率统计

### 7. 特色功能
- **延迟同步标注**：报名表延迟同步时在图表和列表上标注时间，避免误判趋势
- **进度注释**：遇到进度落后学员可添加注释和跟进计划
- **Redis 缓存**：热点数据缓存，提升查询性能
- **批次追溯**：每轮导入都保留批次记录，支持数据追溯

## 项目结构

```
MP0131/
├── backend/                     # 后端项目
│   ├── src/main/java/com/training/renewal/
│   │   ├── RenewalRiskMonitorApplication.java  # 启动类
│   │   ├── common/             # 公共类
│   │   ├── config/             # 配置类
│   │   ├── controller/         # 控制器层
│   │   ├── entity/             # 实体类
│   │   ├── repository/         # 数据访问层
│   │   └── service/            # 业务逻辑层
│   ├── src/main/resources/
│   │   ├── application.yml     # 应用配置
│   │   └── db/init.sql         # 数据库初始化脚本
│   └── pom.xml                 # Maven 依赖
│
└── frontend/                    # 前端项目
    ├── src/
    │   ├── api/                 # API 接口
    │   ├── components/          # 组件
    │   │   └── charts/          # D3 图表组件
    │   ├── router/              # 路由
    │   ├── store/               # 状态管理
    │   ├── styles/              # 样式
    │   ├── utils/               # 工具函数
    │   ├── views/               # 页面视图
    │   ├── App.vue              # 根组件
    │   └── main.js              # 入口文件
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 环境要求
- JDK 17+
- MySQL 8.0+
- Redis 6.0+
- Node.js 18+
- Maven 3.6+

### 数据库初始化

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS training_renewal DEFAULT CHARACTER SET utf8mb4;

-- 执行初始化脚本
source backend/src/main/resources/db/init.sql;
```

### 后端启动

```bash
cd backend

# 修改数据库和 Redis 配置
vim src/main/resources/application.yml

# 启动应用
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080/api` 启动。

系统首次启动会自动初始化模拟数据（200名学员、成绩记录、家长反馈等）。

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## API 接口

### 仪表盘
- `GET /api/dashboard/overview` - 获取总览数据
- `GET /api/dashboard/tag-distribution` - 获取标签分布
- `GET /api/dashboard/progress-funnel` - 获取进度漏斗数据
- `GET /api/dashboard/score-ranking?limit=20` - 获取成绩排行
- `GET /api/dashboard/consultant-stats` - 获取咨询师统计

### 批次管理
- `GET /api/batches/{batchId}` - 获取批次详情
- `GET /api/batches/recent?limit=10` - 获取最近批次
- `GET /api/batches/delayed` - 获取延迟批次
- `POST /api/batches/create` - 创建批次
- `POST /api/batches/{batchId}/complete` - 完成批次

### 数据导入
- `POST /api/import/enrollment` - 导入报名表
- `POST /api/import/academic` - 导入成绩数据
- `POST /api/import/feedback` - 导入家长反馈

### 学员管理
- `GET /api/students/{studentNo}` - 获取学员详情
- `GET /api/students?page=0&size=20` - 分页查询学员
- `PUT /api/students/{studentNo}` - 更新学员信息

### 评论管理
- `GET /api/comments/student/{studentNo}` - 获取学员评论
- `GET /api/comments/consultant/{consultantId}` - 获取咨询师评论
- `POST /api/comments` - 创建评论
- `PUT /api/comments/{id}` - 更新评论

### 提醒规则
- `GET /api/reminder-rules/active` - 获取生效规则
- `GET /api/reminder-rules/recent-changes?limit=10` - 获取近期变更
- `POST /api/reminder-rules` - 创建规则
- `PUT /api/reminder-rules/{id}` - 更新规则

## 数据库表结构

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| sys_user | 系统用户 | username, real_name, role, department |
| import_batch | 导入批次 | batch_id, batch_type, status, is_delayed |
| student_enrollment | 学员报名表 | student_no, course_tag, completion_rate, consultant_id |
| academic_record | 成绩记录 | student_no, score, progress_rate, exam_date |
| parent_feedback | 家长反馈 | student_no, sentiment, handle_status |
| progress_comment | 进度注释 | student_no, risk_level, follow_up_plan |
| reminder_rule | 提醒规则 | rule_name, rule_type, status, version |

## 数据处理流程

1. **报名表导入** → 生成批次记录 → 存储学员基本信息
2. **教务系统合并** → 导入成绩数据 → 更新学员完成率
3. **家长反馈合并** → 导入反馈数据 → 关联到对应学员
4. **指标计算** → 多维度聚合分析 → 生成统计数据
5. **缓存加速** → 热点数据存入 Redis → 提升查询性能
6. **可视化展示** → D3.js 渲染图表 → 支持交互分析

## 特色设计

### 延迟同步机制
- 每批次数据记录预期同步时间和实际同步时间
- 超过阈值自动标记为延迟
- 前端顶部警告栏展示延迟批次
- 避免因数据延迟导致的趋势误判

### 分层权限设计
- 管理层：全局视角，所有数据可见，咨询师对比分析
- 一线员工：仅查看自己负责学员，专注个人完成率

### 数据可追溯
- 所有导入数据保留批次信息
- 规则变更记录版本号和变更原因
- 支持按批次回溯历史数据

### 进度注释系统
- 支持对进度落后学员添加注释
- 记录风险等级和跟进计划
- 支持跟进状态追踪
