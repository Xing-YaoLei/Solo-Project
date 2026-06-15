# 高校教务选课排课排程台系统

基于 ASP.NET Core + React + SQL Server + Hangfire 的高校教务排课管理系统。

## 技术栈

### 后端
- ASP.NET Core 8.0 Web API
- Entity Framework Core 8.0
- SQL Server 数据库
- Hangfire 后台任务调度
- JWT 身份认证
- BCrypt 密码哈希

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Ant Design UI 组件库
- Zustand 状态管理
- React Router DOM 路由
- Axios HTTP 客户端
- Recharts 图表库
- Day.js 日期处理

## 系统功能

### 核心业务流程
1. **课程目录管理** - 录入和维护课程基础信息
2. **教室资源管理** - 管理教室信息和设备配置
3. **学生名单管理** - 学生信息录入和批量导入
4. **排课排程台** - 可视化排课、周视图、冲突检测
5. **冲突处理** - 风险等级识别、沟通过程记录、复核意见留存
6. **审核流程** - 多级审核、待办事项、角色权限控制
7. **成绩单管理** - 成绩录入、统计分析、成绩单打印
8. **申请材料管理** - 选课/退课/换课申请、审批流程

### 特色功能
- **冲突风险等级**：低/中/高/紧急四级风险标识
- **审核时长趋势**：管理层视图，实时监控审核效率
- **角色权限控制**：6种角色（管理员、教师、学生、系主任、教务处、院长）各负其责
- **沟通过程留存**：冲突处理全程记录沟通内容
- **后台定时任务**：Hangfire 自动检测冲突、发送提醒

## 系统角色

| 角色 | 权限范围 |
|------|----------|
| Administrator | 系统管理员，全部权限 |
| AcademicAffairs | 教务处，课程/教室/学生管理、排课、审核 |
| Dean | 院长，审批、查看统计报表 |
| DepartmentHead | 系主任，本部门排课审核 |
| Teacher | 教师，查看排课、录入成绩 |
| Student | 学生，选课申请、查看成绩 |

## 项目结构

```
MP0147/
├── src/
│   ├── EduSchedule.API/          # 后端 Web API
│   │   ├── Controllers/          # API 控制器
│   │   ├── Models/               # 数据模型
│   │   ├── Data/                 # 数据库上下文
│   │   ├── Services/             # 业务服务
│   │   ├── Enums/                # 枚举定义
│   │   ├── Hangfire/             # 后台任务
│   │   ├── Program.cs            # 启动配置
│   │   └── appsettings.json      # 配置文件
│   └── EduSchedule.React/        # 前端 React 应用
│       ├── src/
│       │   ├── pages/            # 页面组件
│       │   ├── layouts/          # 布局组件
│       │   ├── components/       # 公共组件
│       │   ├── services/         # API 服务
│       │   ├── store/            # 状态管理
│       │   ├── types/            # TypeScript 类型
│       │   ├── utils/            # 工具函数
│       │   ├── contexts/         # React Context
│       │   ├── App.tsx           # 应用根组件
│       │   └── main.tsx          # 应用入口
│       ├── package.json
│       └── vite.config.ts
├── EduSchedule.sln               # Visual Studio 解决方案
└── README.md
```

## 快速开始

### 环境要求
- .NET SDK 8.0+
- Node.js 18+
- SQL Server 2019+
- npm 或 yarn

### 数据库配置

1. 修改 `src/EduSchedule.API/appsettings.json` 中的数据库连接字符串：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EduSchedule;User Id=sa;Password=YourPassword123;TrustServerCertificate=True;"
  }
}
```

2. 执行数据库迁移：

```bash
cd src/EduSchedule.API
dotnet ef database update
```

### 启动后端服务

```bash
cd src/EduSchedule.API
dotnet run
```

后端服务将在 `http://localhost:5000` 启动

### 启动前端应用

```bash
cd src/EduSchedule.React
npm install
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

### Hangfire 后台任务

访问 `http://localhost:5000/hangfire` 查看后台任务管理面板

## API 接口

### 认证接口
- `POST /api/auth/login` - 用户登录

### 课程管理
- `GET /api/courses` - 获取课程列表
- `POST /api/courses` - 创建课程
- `PUT /api/courses/{id}` - 更新课程
- `DELETE /api/courses/{id}` - 删除课程

### 教室管理
- `GET /api/classrooms` - 获取教室列表
- `POST /api/classrooms` - 创建教室
- `PUT /api/classrooms/{id}` - 更新教室
- `DELETE /api/classrooms/{id}` - 删除教室

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `PUT /api/students/{id}` - 更新学生
- `DELETE /api/students/{id}` - 删除学生

### 排课管理
- `GET /api/schedules` - 获取排课列表
- `POST /api/schedules` - 创建排课
- `PUT /api/schedules/{id}` - 更新排课
- `DELETE /api/schedules/{id}` - 删除排课
- `POST /api/schedules/detect-conflicts` - 检测冲突
- `POST /api/schedules/{id}/submit-approval` - 提交审核

### 冲突管理
- `GET /api/conflicts` - 获取冲突列表
- `GET /api/conflicts/{id}` - 获取冲突详情
- `POST /api/conflicts/{id}/assign` - 分配处理人
- `POST /api/conflicts/{id}/resolve` - 解决冲突
- `POST /api/conflicts/{id}/escalate` - 升级处理
- `POST /api/conflicts/{id}/communications` - 添加沟通记录
- `POST /api/conflicts/{id}/reviews` - 添加复核意见

### 审核管理
- `GET /api/approvals/todo` - 我的待办
- `GET /api/approvals/done` - 我的已办
- `POST /api/approvals/{id}/approve` - 审核通过
- `POST /api/approvals/{id}/reject` - 审核驳回
- `GET /api/approvals/stats` - 审核统计
- `GET /api/approvals/trend` - 审核趋势

### 仪表盘
- `GET /api/dashboard/overview` - 总览数据
- `GET /api/dashboard/approval-trend` - 审核时长趋势

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| teacher | teacher123 | 教师 |
| student | student123 | 学生 |
| dean | dean123 | 院长 |
| academic | academic123 | 教务处 |
| depthead | depthead123 | 系主任 |

## 冲突检测算法

系统基于多因素计算冲突风险等级：

- **冲突类型**：教室冲突、教师冲突、学生冲突
- **风险因素**：课程规模、教室类型、时间紧迫性
- **等级划分**：
  - 低风险（< 20分）：不影响教学秩序
  - 中风险（20-40分）：需要关注
  - 高风险（40-60分）：优先处理
  - 紧急（> 60分）：立即处理

## 后台定时任务

Hangfire 定时执行以下任务：

1. **每日凌晨 2:00** - 全量冲突检测
2. **每小时** - 待处理冲突提醒
3. **每日上午 9:00** - 审核超时提醒
4. **每周一上午 10:00** - 周统计报表生成

## 开发规范

### 代码风格
- 后端遵循 C# 官方编码规范
- 前端使用 TypeScript 严格模式
- 接口返回统一格式：`{ success: boolean, data: T, message: string }`

### Git 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

## License

MIT License
