import { db } from './index';
import { roles, permissions, rolePermissions, users, tags, complaints, complaintTags, escalationRecords, callbackResults, processingLogs, reassignmentRecords } from './schema';
import { Scrypt } from 'lucia';

const scrypt = new Scrypt();

async function seed() {
  const roleRows = await db.insert(roles).values([
    { name: 'visitor', label: '游客' },
    { name: 'ticket_agent', label: '票务员' },
    { name: 'patrol_agent', label: '巡场员' },
    { name: 'operator', label: '运营' }
  ]).returning();

  const permissionRows = await db.insert(permissions).values([
    { code: 'complaint:view', label: '查看投诉', category: 'complaint' },
    { code: 'complaint:create', label: '创建投诉', category: 'complaint' },
    { code: 'complaint:assign', label: '分配投诉', category: 'complaint' },
    { code: 'complaint:close', label: '关闭投诉', category: 'complaint' },
    { code: 'complaint:escalate', label: '升级投诉', category: 'complaint' },
    { code: 'complaint:callback', label: '投诉回访', category: 'complaint' },
    { code: 'complaint:supplement', label: '补充材料', category: 'complaint' },
    { code: 'complaint:reject', label: '驳回投诉', category: 'complaint' },
    { code: 'complaint:resubmit', label: '重提投诉', category: 'complaint' },
    { code: 'complaint:reassign', label: '重新分派', category: 'complaint' },
    { code: 'complaint:export', label: '导出投诉', category: 'complaint' },
    { code: 'user:view', label: '查看用户', category: 'user' },
    { code: 'user:create', label: '创建用户', category: 'user' },
    { code: 'user:edit', label: '编辑用户', category: 'user' },
    { code: 'user:delete', label: '删除用户', category: 'user' },
    { code: 'role:view', label: '查看角色', category: 'role' },
    { code: 'role:manage', label: '管理角色', category: 'role' },
    { code: 'tag:view', label: '查看标签', category: 'tag' },
    { code: 'tag:manage', label: '管理标签', category: 'tag' },
    { code: 'dashboard:view', label: '查看看板', category: 'dashboard' },
    { code: 'report:view', label: '查看报表', category: 'report' },
    { code: 'report:export', label: '导出报表', category: 'report' },
    { code: 'system:settings', label: '系统设置', category: 'system' }
  ]).returning();

  const visitorRole = roleRows.find((r) => r.name === 'visitor')!;
  const ticketAgentRole = roleRows.find((r) => r.name === 'ticket_agent')!;
  const patrolAgentRole = roleRows.find((r) => r.name === 'patrol_agent')!;
  const operatorRole = roleRows.find((r) => r.name === 'operator')!;

  const permMap = new Map(permissionRows.map((p) => [p.code, p.id]));

  const visitorPerms = ['complaint:create', 'complaint:view', 'complaint:resubmit'];
  const ticketAgentPerms = ['complaint:view', 'complaint:create', 'complaint:assign', 'complaint:supplement', 'complaint:reject', 'tag:view', 'dashboard:view'];
  const patrolAgentPerms = ['complaint:view', 'complaint:create', 'complaint:assign', 'complaint:escalate', 'complaint:supplement', 'complaint:reject', 'tag:view', 'dashboard:view'];
  const operatorPerms = permissionRows.map((p) => p.code);

  const rpValues: { roleId: string; permissionId: string }[] = [];

  for (const code of visitorPerms) rpValues.push({ roleId: visitorRole.id, permissionId: permMap.get(code)! });
  for (const code of ticketAgentPerms) rpValues.push({ roleId: ticketAgentRole.id, permissionId: permMap.get(code)! });
  for (const code of patrolAgentPerms) rpValues.push({ roleId: patrolAgentRole.id, permissionId: permMap.get(code)! });
  for (const code of operatorPerms) rpValues.push({ roleId: operatorRole.id, permissionId: permMap.get(code)! });

  await db.insert(rolePermissions).values(rpValues);

  const passwordHash = await scrypt.hash('password123');

  const userRows = await db.insert(users).values([
    { username: 'visitor1', passwordHash, displayName: '张游客', phone: '13800000001', roleId: visitorRole.id },
    { username: 'agent1', passwordHash, displayName: '李票务', phone: '13800000002', roleId: ticketAgentRole.id },
    { username: 'patrol1', passwordHash, displayName: '王巡场', phone: '13800000003', roleId: patrolAgentRole.id },
    { username: 'operator1', passwordHash, displayName: '赵运营', phone: '13800000004', roleId: operatorRole.id },
    { username: 'visitor2', passwordHash, displayName: '刘游客', phone: '13800000005', roleId: visitorRole.id },
    { username: 'agent2', passwordHash, displayName: '孙票务', phone: '13800000006', roleId: ticketAgentRole.id },
    { username: 'patrol2', passwordHash, displayName: '周巡场', phone: '13800000007', roleId: patrolAgentRole.id }
  ]).returning();

  const tagRows = await db.insert(tags).values([
    { code: 'noise', label: '噪音扰民', category: 'type' },
    { code: 'facility', label: '设施故障', category: 'type' },
    { code: 'service', label: '服务态度', category: 'type' },
    { code: 'safety', label: '安全隐患', category: 'type' },
    { code: 'entrance', label: '入口区域', category: 'area' },
    { code: 'scenic', label: '景区内部', category: 'area' },
    { code: 'parking', label: '停车场', category: 'area' },
    { code: 'restaurant', label: '餐饮区', category: 'area' },
    { code: 'urgent', label: '紧急', category: 'priority' },
    { code: 'normal', label: '一般', category: 'priority' }
  ]).returning();

  const visitor1 = userRows[0];
  const visitor2 = userRows[4];
  const agent = userRows[1];
  const patrol = userRows[2];
  const operator = userRows[3];
  const agent2 = userRows[5];
  const patrol2 = userRows[6];

  const complaintRows = await db.insert(complaints).values([
    { visitorId: visitor1.id, assigneeId: agent.id, description: '入口处售票人员态度恶劣，拒绝解答购票问题', status: 'assigned', deadline: new Date(Date.now() + 86400000 * 2), isOverdue: false },
    { visitorId: visitor1.id, assigneeId: patrol.id, description: '景区湖边栈道护栏松动，存在严重安全隐患', status: 'in_progress', deadline: new Date(Date.now() + 86400000), isOverdue: false },
    { visitorId: visitor2.id, assigneeId: agent.id, description: '停车场区域播放音乐音量过大，影响周边居民休息', status: 'pending', isOverdue: false },
    { visitorId: visitor1.id, assigneeId: patrol.id, description: '观光车等候区域无遮阳设施，排队游客中暑', status: 'resolved', closedAt: new Date(), isOverdue: false },
    { visitorId: visitor2.id, assigneeId: null, description: '餐厅区域地面湿滑无人处理，已有游客摔倒', status: 'pending', deadline: new Date(Date.now() + 86400000 * 3), isOverdue: false },
    { visitorId: visitor1.id, assigneeId: agent.id, description: '景区导览牌信息过时，导致游客走错路线', status: 'closed', closedAt: new Date(), isOverdue: false },
    { visitorId: visitor2.id, assigneeId: patrol.id, description: '儿童游乐区设备损坏，无人维修和设置警示', status: 'escalated', deadline: new Date(Date.now() - 86400000), isOverdue: true },
    { visitorId: visitor1.id, assigneeId: agent.id, description: '景区卫生间脏乱差，异味严重，清洁不及时', status: 'in_progress', deadline: new Date(Date.now() + 86400000), isOverdue: false },
    { visitorId: visitor2.id, assigneeId: null, description: '门票退换政策不合理，现场工作人员拒绝处理', status: 'rejected', isOverdue: false },
    { visitorId: visitor1.id, assigneeId: patrol.id, description: '景区内部道路照明不足，夜间行走危险', status: 'assigned', deadline: new Date(Date.now() + 86400000 * 2), isOverdue: false },
    { visitorId: visitor1.id, assigneeId: agent2.id, description: '停车场出入口拥堵严重，无人疏导', status: 'in_progress', deadline: new Date(Date.now() - 3600000), isOverdue: true },
    { visitorId: visitor2.id, assigneeId: patrol2.id, description: '景区指示牌被遮挡，导致迷路', status: 'resubmitted', isOverdue: false }
  ]).returning();

  const noiseTag = tagRows.find((t) => t.code === 'noise')!;
  const facilityTag = tagRows.find((t) => t.code === 'facility')!;
  const serviceTag = tagRows.find((t) => t.code === 'service')!;
  const safetyTag = tagRows.find((t) => t.code === 'safety')!;
  const entranceTag = tagRows.find((t) => t.code === 'entrance')!;
  const scenicTag = tagRows.find((t) => t.code === 'scenic')!;
  const parkingTag = tagRows.find((t) => t.code === 'parking')!;
  const restaurantTag = tagRows.find((t) => t.code === 'restaurant')!;
  const urgentTag = tagRows.find((t) => t.code === 'urgent')!;
  const normalTag = tagRows.find((t) => t.code === 'normal')!;

  await db.insert(complaintTags).values([
    { complaintId: complaintRows[0].id, tagId: serviceTag.id },
    { complaintId: complaintRows[0].id, tagId: entranceTag.id },
    { complaintId: complaintRows[0].id, tagId: urgentTag.id },
    { complaintId: complaintRows[1].id, tagId: safetyTag.id },
    { complaintId: complaintRows[1].id, tagId: scenicTag.id },
    { complaintId: complaintRows[1].id, tagId: urgentTag.id },
    { complaintId: complaintRows[2].id, tagId: noiseTag.id },
    { complaintId: complaintRows[2].id, tagId: parkingTag.id },
    { complaintId: complaintRows[3].id, tagId: facilityTag.id },
    { complaintId: complaintRows[3].id, tagId: scenicTag.id },
    { complaintId: complaintRows[3].id, tagId: normalTag.id },
    { complaintId: complaintRows[4].id, tagId: safetyTag.id },
    { complaintId: complaintRows[4].id, tagId: restaurantTag.id },
    { complaintId: complaintRows[4].id, tagId: urgentTag.id },
    { complaintId: complaintRows[5].id, tagId: facilityTag.id },
    { complaintId: complaintRows[5].id, tagId: scenicTag.id },
    { complaintId: complaintRows[6].id, tagId: safetyTag.id },
    { complaintId: complaintRows[6].id, tagId: scenicTag.id },
    { complaintId: complaintRows[7].id, tagId: serviceTag.id },
    { complaintId: complaintRows[7].id, tagId: restaurantTag.id },
    { complaintId: complaintRows[8].id, tagId: serviceTag.id },
    { complaintId: complaintRows[8].id, tagId: entranceTag.id },
    { complaintId: complaintRows[9].id, tagId: safetyTag.id },
    { complaintId: complaintRows[9].id, tagId: scenicTag.id },
    { complaintId: complaintRows[10].id, tagId: noiseTag.id },
    { complaintId: complaintRows[10].id, tagId: parkingTag.id },
    { complaintId: complaintRows[10].id, tagId: urgentTag.id },
    { complaintId: complaintRows[11].id, tagId: facilityTag.id },
    { complaintId: complaintRows[11].id, tagId: scenicTag.id }
  ]);

  await db.insert(escalationRecords).values([
    { complaintId: complaintRows[6].id, fromUserId: patrol.id, toUserId: operator.id, reason: '安全隐患紧急，巡场员无法处理，需运营介入', level: 2 },
    { complaintId: complaintRows[3].id, fromUserId: patrol.id, toUserId: agent.id, reason: '遮阳设施属于基础设施，转交票务后勤处理', level: 1 }
  ]);

  await db.insert(callbackResults).values([
    { complaintId: complaintRows[3].id, visitorSatisfied: true, comment: '游客表示满意，遮阳设施已到位', operatorId: agent.id },
    { complaintId: complaintRows[5].id, visitorSatisfied: false, comment: '导览牌仍未更新，游客不满意', operatorId: agent.id }
  ]);

  await db.insert(processingLogs).values([
    { complaintId: complaintRows[0].id, action: 'assigned', operatorId: agent.id, detail: { note: '自动分配给票务员' } },
    { complaintId: complaintRows[1].id, action: 'in_progress', operatorId: patrol.id, detail: { note: '已到场查看，护栏维修中' } },
    { complaintId: complaintRows[6].id, action: 'escalated', operatorId: patrol.id, detail: { note: '安全隐患紧急，升级处理', toLevel: 2 } },
    { complaintId: complaintRows[8].id, action: 'rejected', operatorId: agent.id, detail: { note: '退换政策合规，投诉不成立', reason: '退票政策已在购票页面明确标注' } },
    { complaintId: complaintRows[11].id, action: 'resubmitted', operatorId: visitor2.id, detail: { note: '游客补充材料后重新提交', supplementInfo: '已提供现场照片' } },
    { complaintId: complaintRows[10].id, action: 'overdue_entered', operatorId: operator.id, detail: { note: '处理超时，自动进入待办池' } }
  ]);

  await db.insert(reassignmentRecords).values([
    { complaintId: complaintRows[10].id, fromAssigneeId: agent2.id, toAssigneeId: operator.id, reason: '超时未处理，升级转派', operatorId: operator.id }
  ]);

  console.log('Seed completed');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
