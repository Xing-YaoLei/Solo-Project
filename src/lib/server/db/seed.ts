import { db } from './index';
import { users, pharmacies, members, drugs, drugBatches, prescriptions, prescriptionItems, insuranceRecords, replenishmentOrders, replenishmentOrderItems, followupRecords, communicationNotes } from './schema';
import { Argon2id } from 'oslo/password';
import { generateId } from 'lucia';

async function main() {
  console.log('🌱 开始初始化数据库...');

  const adminUserId = generateId(15);
  const managerUserId = generateId(15);
  const pharmacistUserId = generateId(15);
  const staffUserId1 = generateId(15);
  const staffUserId2 = generateId(15);

  const adminHash = await new Argon2id().hash('admin123');
  const managerHash = await new Argon2id().hash('manager123');
  const pharmacistHash = await new Argon2id().hash('pharma123');
  const staffHash = await new Argon2id().hash('staff123');

  const pharmacyId1 = '11111111-1111-1111-1111-111111111111';
  const pharmacyId2 = '22222222-2222-2222-2222-222222222222';

  const memberId1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const memberId2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const memberId3 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const drugId1 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const drugId2 = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const drugId3 = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  const batchId1 = '11111111-2222-3333-4444-555555555555';
  const batchId2 = '66666666-7777-8888-9999-000000000000';
  const batchId3 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  const prescriptionId1 = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
  const prescriptionId2 = 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq';

  const insuranceId1 = 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii';

  const orderId1 = 'oooooooo-oooo-oooo-oooo-oooooooooooo';

  const followupId1 = 'ffffffff-1111-2222-3333-444444444444';
  const followupId2 = 'gggggggg-5555-6666-7777-888888888888';
  const followupId3 = 'hhhhhhhh-9999-0000-aaaa-bbbbbbbbbbbb';

  console.log('🏥 插入门店数据...');
  await db.insert(pharmacies).values([
    {
      id: pharmacyId1,
      name: '仁康大药房（总店）',
      address: '北京市朝阳区健康路88号',
      phone: '010-88888888'
    },
    {
      id: pharmacyId2,
      name: '仁康大药房（分店）',
      address: '北京市海淀区医药路66号',
      phone: '010-66666666'
    }
  ]).onConflictDoNothing();

  console.log('👤 插入用户数据...');
  await db.insert(users).values([
    {
      id: adminUserId,
      username: 'admin',
      name: '系统管理员',
      passwordHash: adminHash,
      role: 'admin',
      pharmacyId: pharmacyId1
    },
    {
      id: managerUserId,
      username: 'manager',
      name: '张经理',
      passwordHash: managerHash,
      role: 'manager',
      pharmacyId: pharmacyId1
    },
    {
      id: pharmacistUserId,
      username: 'pharmacist',
      name: '李药师',
      passwordHash: pharmacistHash,
      role: 'pharmacist',
      pharmacyId: pharmacyId1
    },
    {
      id: staffUserId1,
      username: 'staff1',
      name: '王员工',
      passwordHash: staffHash,
      role: 'staff',
      pharmacyId: pharmacyId1
    },
    {
      id: staffUserId2,
      username: 'staff2',
      name: '赵员工',
      passwordHash: staffHash,
      role: 'staff',
      pharmacyId: pharmacyId1
    }
  ]).onConflictDoNothing();

  console.log('👥 插入会员数据...');
  await db.insert(members).values([
    {
      id: memberId1,
      memberNo: 'M20240001',
      name: '张明华',
      phone: '13800138001',
      idCard: '110101197501011234',
      gender: '男',
      birthday: '1975-01-01',
      address: '北京市朝阳区幸福小区1号楼',
      allergyHistory: '青霉素过敏',
      medicalHistory: '高血压、糖尿病',
      insuranceCardNo: 'BJ123456789',
      pharmacyId: pharmacyId1
    },
    {
      id: memberId2,
      memberNo: 'M20240002',
      name: '李桂芳',
      phone: '13800138002',
      idCard: '110101198002025678',
      gender: '女',
      birthday: '1980-02-15',
      address: '北京市海淀区阳光花园3号楼',
      allergyHistory: '无',
      medicalHistory: '心脏病',
      insuranceCardNo: 'BJ987654321',
      pharmacyId: pharmacyId1
    },
    {
      id: memberId3,
      memberNo: 'M20240003',
      name: '王建国',
      phone: '13800138003',
      idCard: '110101196503109012',
      gender: '男',
      birthday: '1965-03-10',
      address: '北京市西城区和平里小区5号楼',
      allergyHistory: '磺胺类过敏',
      medicalHistory: '高血压、高血脂',
      insuranceCardNo: 'BJ112233445',
      pharmacyId: pharmacyId1
    }
  ]).onConflictDoNothing();

  console.log('💊 插入药品数据...');
  await db.insert(drugs).values([
    {
      id: drugId1,
      drugCode: 'DRG001',
      name: '苯磺酸氨氯地平片',
      genericName: '苯磺酸氨氯地平',
      specification: '5mg*7片',
      manufacturer: '辉瑞制药有限公司',
      unit: '盒',
      category: '心血管系统',
      usage: '口服，每日1次，每次1片',
      caution: '可能引起头晕，避免突然站起'
    },
    {
      id: drugId2,
      drugCode: 'DRG002',
      name: '盐酸二甲双胍缓释片',
      genericName: '盐酸二甲双胍',
      specification: '0.5g*30片',
      manufacturer: '施贵宝制药',
      unit: '盒',
      category: '糖尿病用药',
      usage: '口服，每日2次，每次1片，饭后服用',
      caution: '避免饮酒，定期检查肾功能'
    },
    {
      id: drugId3,
      drugCode: 'DRG003',
      name: '阿托伐他汀钙片',
      genericName: '阿托伐他汀钙',
      specification: '20mg*7片',
      manufacturer: '辉瑞制药有限公司',
      unit: '盒',
      category: '血脂调节药',
      usage: '口服，每日1次，每次1片，睡前服用',
      caution: '定期检查肝功能，出现肌肉疼痛立即停药'
    }
  ]).onConflictDoNothing();

  console.log('📦 插入药品批号数据...');
  await db.insert(drugBatches).values([
    {
      id: batchId1,
      drugId: drugId1,
      batchNo: 'B2401001',
      productionDate: '2024-01-15',
      expiryDate: '2026-01-14',
      quantity: 150,
      pharmacyId: pharmacyId1
    },
    {
      id: batchId2,
      drugId: drugId2,
      batchNo: 'B2402005',
      productionDate: '2024-02-20',
      expiryDate: '2025-08-19',
      quantity: 200,
      pharmacyId: pharmacyId1
    },
    {
      id: batchId3,
      drugId: drugId3,
      batchNo: 'B2403010',
      productionDate: '2024-03-10',
      expiryDate: '2026-03-09',
      quantity: 100,
      pharmacyId: pharmacyId1
    }
  ]).onConflictDoNothing();

  console.log('📝 插入处方数据...');
  await db.insert(prescriptions).values([
    {
      id: prescriptionId1,
      memberId: memberId1,
      prescriptionNo: 'RX202406001',
      hospital: '北京协和医院',
      doctor: '王主任',
      issueDate: '2024-06-01',
      status: 'clear',
      riskLevel: 'medium',
      photoUrl: 'https://example.com/prescriptions/rx001.jpg',
      notes: '高血压用药，需定期监测血压'
    },
    {
      id: prescriptionId2,
      memberId: memberId1,
      prescriptionNo: 'RX202406002',
      hospital: '北京协和医院',
      doctor: '李主任',
      issueDate: '2024-06-05',
      status: 'unclear',
      riskLevel: 'high',
      photoUrl: 'https://example.com/prescriptions/rx002.jpg',
      notes: '处方字迹模糊，需要联系医院确认'
    }
  ]).onConflictDoNothing();

  console.log('📋 插入处方明细...');
  await db.insert(prescriptionItems).values([
    {
      id: generateId(15),
      prescriptionId: prescriptionId1,
      drugId: drugId1,
      drugName: '苯磺酸氨氯地平片',
      specification: '5mg*7片',
      dosage: '每次5mg',
      frequency: '每日1次',
      duration: '30天',
      quantity: 4
    },
    {
      id: generateId(15),
      prescriptionId: prescriptionId1,
      drugId: drugId3,
      drugName: '阿托伐他汀钙片',
      specification: '20mg*7片',
      dosage: '每次20mg',
      frequency: '每晚1次',
      duration: '30天',
      quantity: 4
    },
    {
      id: generateId(15),
      prescriptionId: prescriptionId2,
      drugId: drugId2,
      drugName: '盐酸二甲双胍缓释片',
      specification: '0.5g*30片',
      dosage: '每次0.5g',
      frequency: '每日2次',
      duration: '30天',
      quantity: 2
    }
  ]).onConflictDoNothing();

  console.log('🏥 插入医保流水...');
  await db.insert(insuranceRecords).values([
    {
      id: insuranceId1,
      recordNo: 'INS20240615001',
      memberId: memberId1,
      prescriptionId: prescriptionId1,
      transactionDate: new Date('2024-06-15T09:30:00'),
      totalAmount: 58000,
      insuranceAmount: 40600,
      selfPayAmount: 17400,
      pharmacyId: pharmacyId1
    }
  ]).onConflictDoNothing();

  console.log('📦 插入补货单...');
  await db.insert(replenishmentOrders).values([
    {
      id: orderId1,
      orderNo: 'RB20240615001',
      memberId: memberId1,
      pharmacyId: pharmacyId1,
      status: 'completed',
      totalAmount: 58000,
      createdBy: staffUserId1
    }
  ]).onConflictDoNothing();

  console.log('📦 插入补货单明细...');
  await db.insert(replenishmentOrderItems).values([
    {
      id: generateId(15),
      orderId: orderId1,
      drugId: drugId1,
      batchId: batchId1,
      quantity: 4,
      unitPrice: 4500,
      subtotal: 18000
    },
    {
      id: generateId(15),
      orderId: orderId1,
      drugId: drugId3,
      batchId: batchId3,
      quantity: 4,
      unitPrice: 10000,
      subtotal: 40000
    }
  ]).onConflictDoNothing();

  console.log('📋 插入回访记录...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(followupRecords).values([
    {
      id: followupId1,
      memberId: memberId1,
      prescriptionId: prescriptionId1,
      replenishmentOrderId: orderId1,
      insuranceRecordId: insuranceId1,
      status: 'in_progress',
      riskLevel: 'medium',
      assignedTo: staffUserId1,
      pharmacyId: pharmacyId1,
      followupDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      nextFollowupDate: nextWeek,
      medicationAdherence: true,
      adverseReaction: false,
      symptomImprovement: 'good',
      reviewOpinion: null,
      createdBy: staffUserId1
    },
    {
      id: followupId2,
      memberId: memberId2,
      prescriptionId: null,
      replenishmentOrderId: null,
      insuranceRecordId: null,
      status: 'pending',
      riskLevel: 'critical',
      assignedTo: staffUserId1,
      pharmacyId: pharmacyId1,
      followupDate: null,
      nextFollowupDate: tomorrow,
      medicationAdherence: null,
      adverseReaction: null,
      symptomImprovement: null,
      reviewOpinion: null,
      createdBy: pharmacistUserId
    },
    {
      id: followupId3,
      memberId: memberId3,
      prescriptionId: null,
      replenishmentOrderId: null,
      insuranceRecordId: null,
      status: 'pending',
      riskLevel: 'low',
      assignedTo: staffUserId2,
      pharmacyId: pharmacyId1,
      followupDate: null,
      nextFollowupDate: nextWeek,
      medicationAdherence: null,
      adverseReaction: null,
      symptomImprovement: null,
      reviewOpinion: null,
      createdBy: staffUserId2
    }
  ]).onConflictDoNothing();

  console.log('💬 插入沟通备注...');
  await db.insert(communicationNotes).values([
    {
      id: generateId(15),
      followupRecordId: followupId1,
      content: '患者血压控制良好，近期测量值在130/85左右。用药规律，每天早上准时服药。',
      isReview: false,
      createdBy: staffUserId1,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: generateId(15),
      followupRecordId: followupId1,
      content: '患者偶尔会出现轻微头晕，建议在服药后避免剧烈运动。已提醒注意监测。',
      isReview: false,
      createdBy: staffUserId1,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: generateId(15),
      followupRecordId: followupId1,
      content: '该患者用药依从性良好，头晕症状与血压波动有关。建议调整服药时间为睡前，如症状持续应及时复诊。',
      isReview: true,
      createdBy: pharmacistUserId,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    }
  ]).onConflictDoNothing();

  console.log('');
  console.log('✅ 数据库初始化完成！');
  console.log('');
  console.log('📋 测试账号：');
  console.log('  管理员: admin / admin123  (系统管理员)');
  console.log('  经理:   manager / manager123  (门店经理)');
  console.log('  药师:   pharmacist / pharma123  (执业药师)');
  console.log('  员工1:  staff1 / staff123  (一线员工)');
  console.log('  员工2:  staff2 / staff123  (一线员工)');
  console.log('');
  console.log('📊 已插入测试数据：');
  console.log('  🏥 门店: 2家');
  console.log('  👤 用户: 5个（各角色）');
  console.log('  👥 会员: 3个');
  console.log('  💊 药品: 3种');
  console.log('  📦 药品批号: 3个');
  console.log('  📝 处方: 2个');
  console.log('  🏥 医保流水: 1条');
  console.log('  📦 补货单: 1个');
  console.log('  📋 回访记录: 3个（不同状态和负责人）');
  console.log('  💬 沟通备注: 3条（含复核意见）');
  console.log('');
  console.log('🔐 密码使用 Argon2id 加密存储');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ 初始化失败:', err);
  process.exit(1);
});
