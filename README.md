# 青少年培训作业批改风险监测系统

专门用于青少年培训作业批改的风险监测与复盘系统。

## 技术栈

- **前端框架**: SvelteKit 5 (TypeScript)
- **图表库**: Apache ECharts
- **数据库**: SQLite (sql.js)
- **数据处理**: Apache Arrow
- **部署平台**: Vercel
- **样式**: TailwindCSS

## 功能特性

### 📊 数据处理
- 支持报名表、作业平台、家长群反馈多源数据接入
- 数据清洗与去重
- 多口径字段自动匹配（中英文、别名映射）
- Arrow 列式数据处理，高效批量运算

### ⚙️ 阈值配置
- 可视化配置界面，非技术人员可直接操作
- 按分类管理阈值（完成率、成绩、时效性、反馈、知识点、进度、复盘）
- 实时保存与生效

### 📈 图表分析
**题目标签分析**
- 各知识点正确率柱状图
- 知识点掌握雷达图
- 风险等级标识
- 支持多种排序方式

**学习进度监测**
- 完成率趋势折线图
- 每日提交人数统计
- 平均分趋势追踪
- 多时间维度切换（7天/14天/30天/60天）

**成绩反馈分析**
- 分数段分布饼图
- 成绩分布柱状图
- 家长反馈情绪分析
- 最新反馈列表

### 📋 复盘材料
- 围绕完成率自动生成复盘报告
- 薄弱知识点自动识别
- 进度落后学生清单
- 改进建议自动生成
- 支持导出文本报告

### 🚨 风险预警
- 多维度风险监测（完成率、成绩、反馈、进度、知识点）
- 四级风险等级（正常/关注/预警/危急）
- 实时计算，动态更新

## 项目结构

```
src/
├── lib/
│   ├── components/          # UI 组件
│   │   ├── Chart.svelte     # ECharts 通用封装
│   │   ├── TagChart.svelte  # 题目标签图表
│   │   ├── ProgressChart.svelte  # 学习进度图表
│   │   ├── ScoreChart.svelte     # 成绩分布图表
│   │   ├── StatCard.svelte       # 统计卡片
│   │   ├── AlertPanel.svelte     # 风险预警面板
│   │   └── NavHeader.svelte      # 导航栏
│   └── server/              # 服务端逻辑
│       ├── db.ts            # 数据库初始化
│       ├── dataPipeline.ts  # 数据清洗与 Arrow 处理
│       ├── thresholdService.ts  # 阈值配置服务
│       ├── analysisService.ts   # 数据分析服务
│       └── mockData.ts          # 模拟数据生成
├── routes/
│   ├── +page.svelte        # 监测总览
│   ├── tags/+page.svelte   # 题目标签分析
│   ├── progress/+page.svelte # 学习进度监测
│   ├── scores/+page.svelte   # 成绩反馈分析
│   ├── review/+page.svelte   # 复盘材料
│   ├── thresholds/+page.svelte # 阈值配置
│   └── api/                  # API 路由
│       ├── thresholds/+server.ts
│       ├── analysis/
│       │   ├── tags/+server.ts
│       │   ├── progress/+server.ts
│       │   ├── scores/+server.ts
│       │   └── alerts/+server.ts
│       ├── review/+server.ts
│       ├── import/+server.ts
│       └── mock-data/+server.ts
├── app.html
└── app.css
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run check
```

## 数据导入 API

系统支持通过 API 导入多种数据源：

### 导入学生数据

```bash
POST /api/import
Content-Type: application/json

{
  "sourceType": "students",
  "data": [
    {
      "学号": "S0001",
      "姓名": "张小明",
      "年级": "7年级",
      "课程": "数学"
    }
  ]
}
```

### 导入作业数据

```bash
POST /api/import
{
  "sourceType": "assignments",
  "data": [...]
}
```

### 导入提交数据

```bash
POST /api/import
{
  "sourceType": "submissions",
  "data": [...]
}
```

### 导入家长反馈

```bash
POST /api/import
{
  "sourceType": "feedback",
  "data": [...]
}
```

## 阈值配置项

| 配置键 | 分类 | 默认值 | 说明 |
|--------|------|--------|------|
| completion_rate_warning | completion | 0.7 | 作业完成率预警阈值 |
| completion_rate_critical | completion | 0.5 | 作业完成率危急阈值 |
| average_score_warning | score | 60 | 平均分预警阈值 |
| average_score_critical | score | 40 | 平均分危急阈值 |
| submission_delay_hours | timeliness | 24 | 提交延迟预警小时数 |
| negative_feedback_threshold | feedback | 3 | 负面反馈预警次数 |
| tag_mastery_warning | tag | 0.6 | 知识点掌握度预警阈值 |
| progress_lag_days | progress | 3 | 进度落后天数预警 |
| review_material_auto_generate | review | true | 是否自动生成复盘材料 |

## 部署到 Vercel

1. 将代码推送到 Git 仓库
2. 在 Vercel 中导入项目
3. 配置环境变量（如需要）
4. 点击部署

系统会自动使用 `@sveltejs/adapter-vercel` 进行适配。

## 注意事项

- 本项目使用 sql.js（纯 JavaScript 实现的 SQLite），数据存储在内存中，刷新后会重置
- 生产环境建议使用持久化数据库（如 PostgreSQL、MySQL 或 Vercel Postgres）
- 首次访问会自动生成模拟数据用于演示
