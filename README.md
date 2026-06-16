# 药店连锁处方审核排程台

基于 ASP.NET Core + React + SQL Server + Hangfire 构建的药店连锁处方审核管理系统。

## 功能特性

### 核心业务
- **处方审核排程台**：处方列表展示、筛选、批量审核、单条查看
- **处方详情**：患者信息、药品明细、处方照片、药师意见、处理痕迹、回访记录
- **附件上传**：处方照片、补充资料直接在处方流程中上传，无需单独入口
- **处方不清管理**：单独状态标识，与普通状态区分，原始记录与处理痕迹一一对应
- **线下补充说明**：将线下补充的资料收回系统记录，支持来源标记

### 业务核对
- **补货单核对**：补货单列表查询、明细查看、关联处方追溯
- **医保流水**：医保交易记录查询、与处方关联核对

### 权限管理
- **收银员**：创建处方、提交审核、查看处方
- **药师**：审核处方、添加意见、上传附件、回访管理
- **店长**：门店数据管理、查看报表、用户管理
- **总部运营**：全部门店数据、统计报表、系统管理

### 统计报表
- 处方概览统计（总数、待处理、通过、拒绝、不清等）
- 处方趋势分析（按日统计）
- 门店维度统计
- 从回访完成可追溯到具体单据

### 后台任务
- 使用 Hangfire 进行定时任务调度
- 过期处方自动处理
- 每日统计汇总
- 回访提醒

## 技术架构

### 后端
- **框架**: ASP.NET Core 8.0 Web API
- **ORM**: Entity Framework Core 8.0
- **数据库**: SQL Server
- **认证**: JWT Bearer Token
- **后台任务**: Hangfire
- **密码加密**: BCrypt.Net

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP 客户端**: Axios
- **日期处理**: Day.js

### 项目结构
```
MP0227/
├── src/
│   ├── PrescriptionReview.Api/          # Web API 项目
│   │   ├── Controllers/                 # API 控制器
│   │   ├── Program.cs                   # 启动入口
│   │   └── appsettings.json             # 配置文件
│   ├── PrescriptionReview.Core/         # 应用核心层
│   │   ├── Dtos/                        # 数据传输对象
│   │   ├── Interfaces/                  # 服务接口
│   │   ├── Services/                    # 业务服务
│   │   └── Common/                      # 公共类
│   ├── PrescriptionReview.Infrastructure/ # 基础设施层
│   │   ├── Data/                        # 数据库上下文
│   │   ├── Services/                    # 服务实现
│   │   └── Migrations/                  # 数据库迁移
│   └── PrescriptionReview.Domain/       # 领域层
│       ├── Entities/                    # 实体模型
│       └── Enums/                       # 枚举类型
├── client/                              # 前端 React 项目
│   ├── src/
│   │   ├── api/                         # API 请求
│   │   ├── pages/                       # 页面组件
│   │   ├── components/                  # 公共组件
│   │   ├── store/                       # 状态管理
│   │   ├── types/                       # TypeScript 类型
│   │   └── utils/                       # 工具函数
│   ├── package.json
│   └── vite.config.ts
└── PrescriptionReview.sln               # 解决方案文件
```

## 快速开始

### 环境要求
- .NET 8.0 SDK
- Node.js 18+
- SQL Server (LocalDB 或完整版)

### 数据库配置
修改 `src/PrescriptionReview.Api/appsettings.json` 中的连接字符串：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PrescriptionReview;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 启动方式

#### 方式一：使用启动脚本
```bash
chmod +x start.sh
./start.sh
```

#### 方式二：手动启动

**1. 启动后端**
```bash
cd src/PrescriptionReview.Api
dotnet run --urls "http://localhost:5000"
```

**2. 启动前端**
```bash
cd client
npm install
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- 后端 API: http://localhost:5000
- Swagger 文档: http://localhost:5000/swagger
- Hangfire 管理: http://localhost:5000/hangfire (账号: admin / admin123)

### 测试账号
| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 总部运营 | 全部权限 |
| manager001 | 123456 | 店长 | 门店管理 |
| pharmacist001 | 123456 | 药师 | 处方审核 |
| cashier001 | 123456 | 收银员 | 创建处方 |

系统首次启动会自动初始化数据库并生成种子数据（5家门店、50条处方、30条补货单、35条医保流水）。

## 主要业务流程

### 处方审核流程
1. **收银员** 创建处方，上传处方照片
2. **收银员** 提交审核，处方进入"审核中"状态
3. **药师** 查看处方，审核通过或拒绝
4. 如处方照片不清晰，药师可标记为"处方不清"
5. **收银员** 补充资料后，处方重新进入审核
6. 审核通过后，可进行回访
7. 回访完成，处方流程结束

### 处方不清处理
- "处方不清"作为独立状态，不与其他状态混淆
- 每次状态变更都有审计日志记录
- 原始记录和处理痕迹可互相对应追溯
- 补充资料后自动回到审核流程

### 批量处理
- 支持批量审核通过
- 支持批量审核拒绝
- 支持批量标记为处方不清
- 批量操作同样有审计记录

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 处方
- `GET /api/prescriptions` - 获取处方列表
- `GET /api/prescriptions/{id}` - 获取处方详情
- `POST /api/prescriptions` - 创建处方
- `PUT /api/prescriptions/{id}` - 更新处方
- `POST /api/prescriptions/{id}/submit` - 提交审核
- `POST /api/prescriptions/{id}/review` - 审核处方
- `POST /api/prescriptions/batch-review` - 批量审核
- `POST /api/prescriptions/{id}/status` - 状态变更
- `POST /api/prescriptions/{id}/supplement-notes` - 添加补充说明

### 附件
- `GET /api/attachments/prescription/{prescriptionId}` - 获取附件列表
- `POST /api/attachments/prescription/{prescriptionId}` - 上传附件
- `DELETE /api/attachments/{id}` - 删除附件

### 补货单
- `GET /api/restock-orders` - 获取补货单列表
- `GET /api/restock-orders/{id}` - 获取补货单详情

### 医保流水
- `GET /api/insurance-records` - 获取医保流水列表
- `GET /api/insurance-records/{id}` - 获取医保流水详情

### 统计
- `GET /api/statistics/overview` - 概览统计
- `GET /api/statistics/prescription-trend` - 处方趋势
- `GET /api/statistics/store-statistics` - 门店统计

### 用户管理
- `GET /api/users` - 用户列表
- `GET /api/users/{id}` - 用户详情
- `POST /api/users` - 创建用户
- `PUT /api/users/{id}` - 更新用户
- `DELETE /api/users/{id}` - 删除用户

### 门店
- `GET /api/stores` - 门店列表
- `GET /api/stores/{id}` - 门店详情

### 回访
- `GET /api/follow-ups/prescription/{prescriptionId}` - 获取回访
- `POST /api/follow-ups/prescription/{prescriptionId}` - 创建回访
- `PUT /api/follow-ups/{id}` - 更新回访

## 定时任务

- **每日统计汇总** (每天 23:00) - 统计当日数据
- **过期处方处理** (每天 00:00) - 7天未提交的处方自动标记
- **回访提醒** (每天 09:00) - 提醒需要回访的处方

## 开发说明

### 数据库迁移
```bash
cd src/PrescriptionReview.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../PrescriptionReview.Api
dotnet ef database update --startup-project ../PrescriptionReview.Api
```

### 前端开发
```bash
cd client
npm run dev    # 开发模式
npm run build  # 生产构建
```

## License
MIT
