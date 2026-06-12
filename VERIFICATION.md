# 快速启动验证指南

## 一、环境准备

### 1. 启动 PostgreSQL
```bash
# Mac (Homebrew)
brew services start postgresql

# 或手动启动
pg_ctl -D /usr/local/var/postgres start
```

### 2. 创建数据库
```bash
psql -U postgres
```
```sql
CREATE DATABASE coffee_loss;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE coffee_loss TO postgres;
\q
```

### 3. 启动 Redis
```bash
# Mac (Homebrew)
brew services start redis

# 或手动启动
redis-server
```

## 二、启动后端服务

```bash
cd backend

# 1. 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，确保数据库连接正确

# 4. 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**验证后端是否启动成功：**
- 访问 http://localhost:8000/docs 查看API文档
- 访问 http://localhost:8000/api/health 应该返回 `{"status": "healthy"}`

## 三、初始化测试数据

```bash
# 方法1: 通过API
curl -X POST http://localhost:8000/api/auth/init-data

# 方法2: 通过前端
# 启动前端后，在登录页点击「初始化测试数据」按钮
```

## 四、启动前端服务

```bash
cd frontend

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

**验证前端是否启动成功：**
- 访问 http://localhost:5173 应该看到登录页面

## 五、功能验证

### 1. 登录测试

**管理层账号：**
- 用户名：`manager`
- 密码：`123456`

**一线人员账号：**
- 用户名：`staff1` (南京东路店)
- 密码：`123456`

### 2. 报损单流程验证

#### 步骤1: 一线人员创建报损单
1. 使用 `staff1` 登录
2. 点击「新建报损单」
3. 填写信息并保存
4. 点击「提交复核」

#### 步骤2: 复核处理（管理层或门店负责人）
1. 使用 `manager` 登录
2. 进入「复核管理」
3. 找到待复核的报损单，点击「复核」
4. **先填写复核意见**（必填）
5. 勾选「成本金额已核对」和「责任门店已核对」
6. 选择复核结果：确认无误 / 需要跟进 / 存在争议

#### 步骤3: 跟进处理（如选择需要跟进）
1. 使用相关责任人账号登录
2. 在「工作台」或「我的待办」中找到待办
3. 进入详情页，在「沟通记录」中跟进处理
4. 点击「完成跟进，提交审批」

#### 步骤4: 审批处理
1. 使用 `manager` 登录
2. 进入「审批管理」
3. 查看详情，确认复核意见和审批记录
4. 填写审批意见，选择通过或驳回

### 3. 接口功能验证

使用 curl 测试关键接口：

#### 登录接口
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=manager&password=123456"
```

#### 获取报损单列表（需要先登录获取token）
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/loss-reports
```

#### 获取报损单详情（包含复核、审批、沟通记录）
```bash
TOKEN="your_token_here"
REPORT_ID=1
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/loss-reports/$REPORT_ID
```

#### 复核接口
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:8000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_opinion": "经核实，损耗原因属实，责任门店和金额确认无误。",
    "result": "confirmed",
    "verified_amount": 1500.00,
    "cost_verified": true,
    "store_verified": true,
    "follow_up_days": 3,
    "loss_report_id": 1
  }'
```

#### 审批接口
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:8000/api/approvals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_opinion": "同意报损，计入门店损耗统计。",
    "result": "approved",
    "loss_report_id": 1
  }'
```

#### 沟通记录接口
```bash
TOKEN="your_token_here"
# 获取沟通记录
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/communications?loss_report_id=1"

# 发送消息
curl -X POST http://localhost:8000/api/communications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "已完成整改，加强了库存管理。",
    "loss_report_id": 1
  }'
```

### 4. 页面功能验证

| 页面 | 功能 | 预期结果 |
|------|------|---------|
| 登录页 | 初始化测试数据 | 成功创建测试账号 |
| 登录页 | manager登录 | 显示管理层菜单 |
| 登录页 | staff1登录 | 显示一线人员菜单 |
| 工作台 | 查看统计卡片 | 显示今日数据、待办等 |
| 工作台 | 查看趋势图 | 显示近7天损耗趋势 |
| 工作台 | 查看待办列表 | 点击可进入详情 |
| 报损单列表 | 筛选异常报损 | 红色背景高亮异常记录 |
| 报损单列表 | 筛选我的待办 | 显示分配给我的任务 |
| 新建报损单 | 创建草稿 | 成功创建，状态为草稿 |
| 新建报损单 | 提交复核 | 状态变为待复核 |
| 报损单详情 | 查看处理流程 | 显示完整时间线 |
| 报损单详情 | 查看复核意见 | 显示复核记录 |
| 报损单详情 | 查看审批记录 | 显示审批记录 |
| 报损单详情 | 发送沟通消息 | 消息实时显示 |
| 复核管理 | 列表筛选 | 按状态筛选 |
| 复核管理 | 处理复核 | 先填意见，再核对门店和金额 |
| 审批管理 | 处理审批 | 填写意见，通过/驳回 |
| 统计分析 | 查看趋势图 | 损耗率趋势、门店排名 |
| 统计分析 | 查看异常分布 | 异常类型分布图 |
| 门店管理 | 新增/编辑门店 | 门店信息管理 |

## 六、异常检测验证

### 创建异常报损单测试

1. 创建一笔金额 > 5000元的报损单
2. 系统应该自动标记为「大额报损」异常
3. 列表中应该以红色背景高亮显示

### 高损耗率测试

1. 同一门店创建多笔报损单，使月损耗率 > 5%
2. 系统应该自动标记为「高损耗率」异常
3. 工作台统计卡片会显示异常提醒

## 七、Celery 异步任务（可选）

```bash
# 启动 Worker
cd backend
source venv/bin/activate
celery -A app.celery_app.celery_app worker --loglevel=info --pool=solo

# 启动 Beat (定时任务)
# 另开一个终端
cd backend
source venv/bin/activate
celery -A app.celery_app.celery_app beat --loglevel=info
```

定时任务：
- 每小时自动检测异常报损
- 每天生成日报表

## 八、常见问题排查

### 1. 数据库连接失败
```
错误：Is the server running locally and accepting connections?
```
**解决：** 确保PostgreSQL已启动，检查.env中的DATABASE_URL

### 2. 报损单列表无数据
**解决：**
- 检查是否已初始化测试数据
- 检查用户角色是否正确（一线人员只能看本店数据）
- 检查筛选条件是否正确

### 3. 复核按钮不显示
**解决：**
- 检查报损单状态是否为「待复核」
- 检查用户权限（一线人员只能复核本店的报损单）

### 4. 审批菜单不显示
**解决：** 审批功能仅对管理层（manager角色）开放

### 5. 响应字段为空（如creator_name）
**解决：** 已通过 `joinedload` 预先加载关联数据，确保使用最新代码

## 九、权限矩阵

| 功能 | 管理层 | 一线人员 |
|------|--------|----------|
| 查看所有门店数据 | ✅ | ❌（仅本店） |
| 创建报损单 | ✅ | ✅（仅本店） |
| 编辑报损单 | ✅ | ✅（仅自己的草稿） |
| 删除报损单 | ✅ | ✅（仅自己的草稿） |
| 提交复核 | ✅ | ✅ |
| 复核处理 | ✅ | ✅（仅本店） |
| 审批处理 | ✅ | ❌ |
| 查看统计分析 | ✅ | ❌ |
| 门店管理 | ✅ | ❌ |
| 用户管理 | ✅ | ❌ |
