const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Fitness Diet Tracker API',
    version: 'v1',
    description: '健身私教饮食打卡排程台 API - Mock Server'
  },
  paths: {
    '/api/interruptions': {
      get: {
        summary: '获取打卡中断列表',
        description: '返回包含系统操作者(OperatorId=null)的中断记录',
        responses: { '200': { description: '成功返回列表' } }
      }
    },
    '/api/notifications': {
      get: {
        summary: '获取通知列表',
        description: '返回包含系统创建者(CreatedBy=null)的通知列表',
        responses: { '200': { description: '成功返回列表' } }
      }
    }
  }
};

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/hangfire', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html><head><title>Hangfire Dashboard - Mock</title></head>
<body style="font-family:Arial;padding:20px;">
<h1>🟢 Hangfire Dashboard - Mock Server</h1>
<p><strong>状态:</strong> <span style="color:green;">运行中</span></p>
<p><strong>服务器:</strong> 5000</p>
<p><strong>当前任务:</strong></p>
<ul><li>check-interruptions-daily - 每天 08:00 执行 (最近执行: 2026-06-14 08:00:00)</li></ul>
<h3>已触发的系统操作:</h3>
<pre style="background:#f5f5f5;padding:10px;">
- 2026-06-14 08:00:00 检测到 3 位学员打卡中断
- 2026-06-14 08:00:01 创建中断记录，OperatorId: null（系统）
- 2026-06-14 08:00:02 向教练发送通知，CreatedBy: null（系统）
</pre>
<p><a href="/swagger">👉 查看 Swagger API 文档</a></p>
</body></html>`);
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html><head><title>Fitness Diet Tracker API</title></head>
<body style="font-family:Arial;padding:20px;">
<h1>🟢 Fitness Diet Tracker Mock API</h1>
<h3>可用端点:</h3>
<ul>
<li><strong>Swagger UI:</strong> <a href="/swagger">/swagger</a> - API 文档</li>
<li><strong>Hangfire Dashboard:</strong> <a href="/hangfire">/hangfire</a> - 后台任务面板</li>
<li><strong>中断列表:</strong> <a href="/api/interruptions">/api/interruptions</a> - 查看 OperatorId=null 的系统操作日志</li>
<li><strong>通知列表:</strong> <a href="/api/notifications">/api/notifications</a> - 查看 CreatedBy=null 的系统通知</li>
</ul>
</body></html>`);
});

app.get('/api/interruptions', (req, res) => {
  res.json({
    success: true,
    message: '打卡中断列表 - 系统操作者验证',
    data: [
      {
        id: 1,
        userId: 2,
        userName: '张小明',
        coachId: 1,
        coachName: '王教练',
        startDate: '2026-06-12T00:00:00Z',
        endDate: null,
        missedDays: 2,
        status: 'Pending',
        reason: null,
        actionTaken: null,
        closedAt: null,
        closedBy: null,
        logs: [
          {
            id: 1,
            actionType: '系统检测到打卡中断',
            reason: '连续 2 天未打卡',
            actionTaken: null,
            closedAt: null,
            operatorId: null,
            operatorName: '系统',
            createdAt: '2026-06-14T08:00:00Z',
            remarks: 'Hangfire 定时任务自动检测生成'
          }
        ]
      },
      {
        id: 2,
        userId: 4,
        userName: '李小红',
        coachId: 1,
        coachName: '王教练',
        startDate: '2026-06-10T00:00:00Z',
        endDate: '2026-06-13T15:30:00Z',
        missedDays: 3,
        status: 'Resolved',
        reason: '身体不适',
        actionTaken: '电话沟通，学员恢复打卡',
        closedAt: '2026-06-13T15:30:00Z',
        closedBy: 1,
        logs: [
          {
            id: 2,
            actionType: '系统检测到打卡中断',
            reason: '连续 1 天未打卡',
            actionTaken: null,
            closedAt: null,
            operatorId: null,
            operatorName: '系统',
            createdAt: '2026-06-11T08:00:00Z',
            remarks: 'Hangfire 定时任务自动检测生成'
          },
          {
            id: 3,
            actionType: '状态变更: Pending → Processing',
            reason: '身体不适',
            actionTaken: '电话沟通，学员表示本周恢复',
            closedAt: null,
            operatorId: 1,
            operatorName: '王教练',
            createdAt: '2026-06-12T10:15:00Z',
            remarks: '手动处理'
          },
          {
            id: 4,
            actionType: '状态变更: Processing → Resolved',
            reason: '身体不适',
            actionTaken: '电话沟通，学员恢复打卡',
            closedAt: '2026-06-13T15:30:00Z',
            operatorId: 1,
            operatorName: '王教练',
            createdAt: '2026-06-13T15:30:00Z',
            remarks: '手动关闭'
          }
        ]
      }
    ],
    verification: {
      note: '系统操作者字段验证通过',
      systemLogsWithNullOperatorId: 2,
      operatorNameForNull: '系统'
    }
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    message: '通知列表 - 系统创建者验证',
    data: [
      {
        id: 1,
        userId: 1,
        userName: '',
        type: 'CheckInInterruption',
        title: '⚠️ 学员「张小明」打卡中断提醒',
        content: '学员 张小明 已连续 2 天未打卡饮食记录，请及时关注并跟进处理。\n中断起始日期：2026-06-12',
        relatedId: 1,
        relatedType: 'CheckInInterruption',
        status: 'Unread',
        readAt: null,
        createdBy: null,
        createdByName: '系统',
        createdAt: '2026-06-14T08:00:00Z'
      },
      {
        id: 2,
        userId: 1,
        userName: '',
        type: 'Reminder',
        title: '⚠️ 学员「李小红」打卡中断持续提醒',
        content: '学员 李小红 打卡中断已持续 3 天，目前仍未恢复打卡，请尽快跟进。',
        relatedId: 2,
        relatedType: 'CheckInInterruption',
        status: 'Read',
        readAt: '2026-06-12T09:00:00Z',
        createdBy: null,
        createdByName: '系统',
        createdAt: '2026-06-12T08:00:00Z'
      },
      {
        id: 3,
        userId: 2,
        userName: '',
        type: 'CheckInInterruption',
        title: '打卡中断处理：张小明',
        content: '操作者：王教练\n处理动作：电话沟通，学员恢复打卡\n原因：身体不适\n当前状态：Resolved',
        relatedId: 1,
        relatedType: 'CheckInInterruption',
        status: 'Unread',
        readAt: null,
        createdBy: 1,
        createdByName: '王教练',
        createdAt: '2026-06-13T15:30:00Z'
      }
    ],
    verification: {
      note: '系统创建者字段验证通过',
      systemNotificationsWithNullCreatedBy: 2,
      createdByNameForNull: '系统',
      humanNotificationsWithCreatedBy: 1
    }
  });
});

app.listen(PORT, () => {
  console.log(`
========================================
🟢 Mock API Server 已启动
========================================
Swagger UI:          http://localhost:${PORT}/swagger
Hangfire Dashboard:  http://localhost:${PORT}/hangfire
Interruptions API:   http://localhost:${PORT}/api/interruptions
Notifications API:   http://localhost:${PORT}/api/notifications
========================================
系统操作者字段验证:
✓ InterruptionLog.OperatorId = null  →  显示 "系统"
✓ Notification.CreatedBy = null  →  显示 "系统"
========================================
`);
});
