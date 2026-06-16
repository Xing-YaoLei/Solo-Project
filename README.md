# 口腔诊所会员复诊排程台

基于 ASP.NET Core + React + SQL Server + Hangfire 的口腔诊所会员复诊排程管理系统。

## 技术栈

### 后端
- **框架**: ASP.NET Core 8.0 Web API
- **数据库**: SQL Server
- **ORM**: Entity Framework Core 8.0
- **定时任务**: Hangfire
- **文档**: Swagger (Swashbuckle)
- **对象映射**: AutoMapper

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI组件库**: Ant Design 5
- **路由**: React Router 6
- **图表**: Recharts
- **HTTP客户端**: Axios
- **日期处理**: Day.js

## 系统功能

### 一线处理流程（按处理顺序）
1. **治疗计划** - 记录患者的治疗方案和进度
2. **复诊排程** - 管理预约列表，按时间顺序处理
3. **随访任务** - 治疗后随访跟进
4. **影像附件** - 核对影像资料

### 后续追踪
5. **收费明细** - 记录费用和支付情况
6. **患者档案** - 完整的患者信息管理

### 管理层
7. **复诊率趋势** - 复诊率统计和趋势分析
8. **爽约管理** - 高风险患者识别和管理

## 项目结构

```
MP0182/
├── backend/                          # 后端项目
│   ├── DentalClinic.sln             # 解决方案文件
│   └── DentalClinic.API/            # Web API 项目
│       ├── Controllers/             # API 控制器
│       ├── Models/                  # 数据模型
│       ├── Data/                    # 数据库上下文
│       ├── DTOs/                    # 数据传输对象
│       ├── Services/                # 业务逻辑服务
│       ├── Hangfire/                # Hangfire 定时任务
│       ├── Enums/                   # 枚举定义
│       ├── Program.cs               # 程序入口
│       └── appsettings.json         # 配置文件
└── frontend/                        # 前端项目
    ├── src/
    │   ├── pages/                   # 页面组件
    │   ├── components/              # 公共组件
    │   ├── services/                # API 服务
    │   ├── types/                   # TypeScript 类型定义
    │   ├── utils/                   # 工具函数
    │   ├── App.tsx                  # 主应用组件
    │   └── main.tsx                 # 入口文件
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## 快速开始

### 前置要求
- .NET 8.0 SDK
- SQL Server
- Node.js 18+
- npm 或 yarn

### 后端启动

1. 配置数据库连接
   修改 `backend/DentalClinic.API/appsettings.json` 中的连接字符串：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DentalClinic;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;",
    "HangfireConnection": "Server=localhost;Database=DentalClinic;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;"
  }
}
```

2. 运行数据库迁移或初始化
```bash
cd backend
dotnet ef database update --project DentalClinic.API
```

或者执行 SQL 脚本初始化示例数据：
```bash
sqlcmd -S localhost -U sa -P YourPassword123! -i "DentalClinic.API/Data/SeedData.sql"
```

3. 启动后端服务
```bash
cd backend/DentalClinic.API
dotnet run
```

后端将运行在 `http://localhost:5000`

访问 Swagger 文档: `http://localhost:5000/swagger`
访问 Hangfire 仪表盘: `http://localhost:5000/hangfire`

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

前端将运行在 `http://localhost:3000`

## 核心功能说明

### 1. 复诊排程（一线处理首页）
- 按日期和时间排序的预约列表
- 显示患者信息、风险等级、状态
- 快捷标识：治疗计划、随访、影像、收费
- 支持按日期范围、状态、风险等级筛选

### 2. 预约详情页
按照一线处理顺序组织的信息：
- **治疗计划** tab - 治疗方案和项目进度
- **随访任务** tab - 随访记录和任务
- **影像附件** tab - 相关影像资料
- **收费明细** tab - 费用记录
- 右侧快捷操作：开始治疗、完成、标记爽约、沟通备注、复核意见

### 3. 爽约管理
- 按风险等级排序（极高风险 > 高风险 > 中风险 > 低风险）
- 风险等级根据患者历史爽约率自动计算
- 沟通备注和复核意见集中展示
- 一键创建随访任务

### 4. 复诊率趋势（管理层）
- 月度复诊率趋势图
- 患者构成分析（复诊 vs 初诊）
- 高风险爽约患者TOP10
- 支持选择统计周期（3/6/12个月）

### 5. Hangfire 定时任务
- **每日9:00** - 发送随访提醒
- **每日8:30** - 发送次日预约提醒
- **每日18:00** - 检查当日爽约患者，自动创建随访任务

## 风险等级计算规则

风险等级根据患者的历史爽约率自动计算：
- **低风险**: 爽约率 < 15%
- **中风险**: 爽约率 15% - 30%
- **高风险**: 爽约率 30% - 50%
- **极高风险**: 爽约率 ≥ 50%

## API 接口

### 患者管理
- `GET /api/patients` - 获取患者列表
- `GET /api/patients/{id}` - 获取患者详情
- `POST /api/patients` - 创建患者
- `PUT /api/patients/{id}` - 更新患者信息
- `DELETE /api/patients/{id}` - 删除患者

### 预约管理
- `GET /api/appointments` - 获取预约列表
- `GET /api/appointments/{id}` - 获取预约详情
- `POST /api/appointments` - 创建预约
- `PUT /api/appointments/{id}` - 更新预约
- `DELETE /api/appointments/{id}` - 删除预约
- `PUT /api/appointments/{id}/status` - 更新预约状态
- `GET /api/appointments/no-show` - 获取爽约列表
- `PUT /api/appointments/{id}/communication-notes` - 更新沟通备注
- `PUT /api/appointments/{id}/review-comments` - 更新复核意见

### 治疗计划
- `GET /api/treatmentplans` - 获取治疗计划列表
- `GET /api/treatmentplans/{id}` - 获取治疗计划详情
- `POST /api/treatmentplans` - 创建治疗计划
- `PUT /api/treatmentplans/{id}` - 更新治疗计划
- `DELETE /api/treatmentplans/{id}` - 删除治疗计划

### 随访任务
- `GET /api/followups` - 获取随访任务列表
- `GET /api/followups/{id}` - 获取随访任务详情
- `POST /api/followups` - 创建随访任务
- `PUT /api/followups/{id}` - 更新随访任务
- `DELETE /api/followups/{id}` - 删除随访任务
- `PUT /api/followups/{id}/complete` - 完成随访任务

### 收费管理
- `GET /api/billing` - 获取收费记录列表
- `GET /api/billing/{id}` - 获取收费记录详情
- `POST /api/billing` - 创建收费记录
- `PUT /api/billing/{id}` - 更新收费记录
- `DELETE /api/billing/{id}` - 删除收费记录
- `GET /api/billing/revenue` - 获取营收统计

### 影像附件
- `GET /api/images` - 获取影像列表
- `GET /api/images/{id}` - 获取影像详情
- `POST /api/images/upload` - 上传影像
- `DELETE /api/images/{id}` - 删除影像

### 报表
- `GET /api/reports/dashboard` - 工作台统计数据
- `GET /api/reports/appointment-rates` - 预约率统计
- `GET /api/reports/reappointment-trend` - 复诊率趋势
- `GET /api/reports/high-risk-noshows` - 高风险爽约患者

## 开发说明

### 数据库迁移
```bash
cd backend/DentalClinic.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 前端构建
```bash
cd frontend
npm run build
```

### Hangfire 任务管理
访问 Hangfire 仪表盘可以查看和管理所有定时任务：
- URL: `http://localhost:5000/hangfire`
- 支持手动触发任务
- 查看任务执行历史

## 注意事项

1. 生产环境请修改 JWT 密钥和数据库密码
2. Hangfire 仪表盘生产环境建议添加身份验证
3. 图片上传目录需要设置适当的权限
4. 建议配置 HTTPS
