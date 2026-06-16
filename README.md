# 口腔诊所正畸病例漏斗报表系统

专门用于复盘口腔诊所正畸病例的漏斗报表系统，基于 Next.js + Recharts + Prisma + PostgreSQL + Supabase 技术栈构建。

## 功能特性

### 📊 漏斗报表
- 正畸病例全流程漏斗分析（初诊咨询 → 检查诊断 → 方案设计 → 托槽佩戴 → 正畸治疗中 → 保持期 → 治疗完成）
- 各阶段患者数量、转化率、复诊率可视化展示
- 复诊率趋势图表（近6个月变化追踪）
- 预约状态分布、缴费状态分布饼图

### 👤 患者档案管理
- 患者基本信息档案
- 预约记录（含爽约原因）
- 收费明细
- 影像附件分类管理
- 备注任务追踪

### ⚠️ 智能预警与复盘
- 患者爽约自动命中
- 复诊率低于阈值自动生成备注任务
- 两级预警机制（预警 / 严重）
- 处理结论留存，图表旁展示
- 任务优先级管理

### ⚙️ 阈值配置
- 非技术人员友好的可视化配置界面
- 复诊率预警/严重阈值
- 爽约次数预警/严重阈值
- 治疗周期预警阈值
- 缴费完成率预警阈值
- 按分类分组展示，支持恢复默认值

### 🔄 数据处理
- 多数据源接入（HIS、收费系统、预约系统）
- 数据清洗与去重
- 口径匹配与标准化
- 数据导入日志记录

## 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript + Tailwind CSS
- **图表**: Recharts
- **数据库**: PostgreSQL + Prisma ORM
- **存储/认证**: Supabase
- **工具库**: date-fns, lucide-react, clsx, tailwind-merge

## 项目结构

```
.
├── prisma/
│   ├── schema.prisma      # 数据模型定义
│   └── seed.ts           # 种子数据脚本
├── src/
│   ├── app/
│   │   ├── page.tsx          # 主报表页面
│   │   ├── thresholds/       # 阈值配置页面
│   │   ├── layout.tsx        # 根布局
│   │   ├── globals.css       # 全局样式
│   │   └── api/              # API 路由
│   │       ├── funnel/       # 漏斗数据接口
│   │       ├── thresholds/   # 阈值配置接口
│   │       ├── data/import/  # 数据导入接口
│   │       └── patients/[id]/review/  # 患者复盘接口
│   ├── components/           # 可复用组件
│   │   ├── FunnelChart.tsx        # 漏斗图
│   │   ├── RevisitRateChart.tsx   # 复诊率趋势图
│   │   ├── StatusPieChart.tsx     # 状态饼图
│   │   ├── PatientDetailPanel.tsx # 患者详情面板
│   │   ├── PatientList.tsx        # 患者列表
│   │   ├── NoteTaskList.tsx       # 备注任务列表
│   │   ├── StatCard.tsx           # 统计卡片
│   │   └── Sidebar.tsx            # 侧边栏导航
│   ├── services/             # 业务逻辑服务
│   │   ├── dataCleaningService.ts  # 数据清洗服务
│   │   ├── thresholdService.ts     # 阈值配置服务
│   │   └── funnelService.ts        # 漏斗分析服务
│   └── lib/                  # 工具库
│       ├── prisma.ts         # Prisma 客户端
│       ├── supabase.ts       # Supabase 客户端
│       ├── utils.ts          # 通用工具函数
│       └── mockData.ts       # 模拟数据生成器
├── .env.example              # 环境变量示例
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 数据模型

核心模型包括：

- **Patient** - 患者信息
- **Appointment** - 预约记录
- **ChargeRecord** - 收费记录
- **ImageAttachment** - 影像附件
- **ThresholdConfig** - 阈值配置
- **NoteTask** - 备注任务
- **FunnelRecord** - 漏斗记录
- **DataImportLog** - 数据导入日志

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入你的配置：

```bash
cp .env.example .env.local
```

配置内容：
- `DATABASE_URL` - PostgreSQL 数据库连接字符串
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 推送数据库 schema
npm run prisma:push

# 初始化种子数据
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 使用说明

### 查看漏斗报表

1. 进入首页即可看到正畸病例漏斗总览
2. 顶部标签页可切换：总览、患者列表、备注任务
3. 点击重点关注患者卡片可查看详细信息

### 管理阈值配置

1. 点击右上角「阈值配置」按钮进入配置页面
2. 点击分类标题展开/折叠该分类下的阈值
3. 直接输入数值调整阈值
4. 点击「保存配置」保存修改
5. 点击「恢复默认」恢复出厂设置

### 查看患者详情

1. 在「患者列表」标签页搜索或筛选患者
2. 点击患者卡片查看详情
3. 详情面板包含5个标签：患者档案、预约记录、收费明细、影像附件、备注任务

### 处理备注任务

1. 在「备注任务」标签页查看所有任务
2. 点击任务展开详情
3. 输入处理结论并提交
4. 结论会显示在图表旁边供复盘参考

## API 接口

### 获取漏斗数据

```
GET /api/funnel?startDate=2025-01-01&endDate=2025-06-30
```

### 阈值配置

```
GET /api/thresholds       # 获取所有阈值配置
PUT /api/thresholds       # 批量更新阈值配置
```

### 数据导入

```
POST /api/data/import
Content-Type: application/json

{
  "source": "HIS",
  "dataType": "patient",
  "rawData": [...]
}
```

### 患者复盘

```
GET  /api/patients/:id/review    # 获取患者复盘材料
POST /api/patients/:id/review    # 检查并生成预警任务
```

## 预警规则

系统根据以下规则自动生成备注任务：

| 触发条件 | 预警级别 | 优先级 |
|---------|---------|--------|
| 复诊率 < 50% | 严重 | 高 |
| 复诊率 < 70% 且 ≥ 50% | 预警 | 中 |
| 爽约次数 ≥ 4次 | 严重 | 高 |
| 爽约次数 ≥ 2次 且 < 4次 | 预警 | 中 |

*注：以上阈值均可在阈值配置页面自定义调整。*

## 开发说明

### 添加新的阈值配置

1. 在 `src/services/thresholdService.ts` 的 `DEFAULT_THRESHOLDS` 中添加新配置
2. 在阈值配置页面会自动按分类展示

### 接入新数据源

1. 在 `src/services/dataCleaningService.ts` 中添加对应的数据清洗函数
2. 在数据导入 API 中添加对应的数据类型处理
3. 确保口径匹配逻辑正确

## License

MIT
