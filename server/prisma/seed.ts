import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }),
});

async function main() {
  await prisma.user.createMany({
    data: [
      { id: 'u1', username: 'admin', password: 'hashed_admin', name: '张主管', role: 'SUPERVISOR' },
      { id: 'u2', username: 'caregiver1', password: 'hashed_care1', name: '李护理', role: 'CAREGIVER' },
      { id: 'u3', username: 'caregiver2', password: 'hashed_care2', name: '王护理', role: 'CAREGIVER' },
      { id: 'u4', username: 'manager1', password: 'hashed_mgr1', name: '赵经理', role: 'MANAGER' },
    ],
    skipDuplicates: true,
  });

  await prisma.elder.createMany({
    data: [
      { id: 'e1', name: '陈秀英', age: 82, gender: 'FEMALE', careLevel: 'LEVEL_5', fallRiskLevel: 'HIGH', roomNumber: 'A-101', allergies: ['青霉素', '磺胺类'], emergencyContact: '陈建国', emergencyPhone: '13800001111', admissionDate: new Date('2024-03-15') },
      { id: 'e2', name: '王德福', age: 78, gender: 'MALE', careLevel: 'LEVEL_4', fallRiskLevel: 'MEDIUM', roomNumber: 'A-102', allergies: [], emergencyContact: '王丽华', emergencyPhone: '13800002222', admissionDate: new Date('2024-05-20') },
      { id: 'e3', name: '刘桂兰', age: 85, gender: 'FEMALE', careLevel: 'LEVEL_3', fallRiskLevel: 'LOW', roomNumber: 'B-201', allergies: ['阿司匹林'], emergencyContact: '刘志强', emergencyPhone: '13800003333', admissionDate: new Date('2024-01-10') },
      { id: 'e4', name: '张福生', age: 76, gender: 'MALE', careLevel: 'LEVEL_2', fallRiskLevel: 'LOW', roomNumber: 'B-202', allergies: [], emergencyContact: '张晓明', emergencyPhone: '13800004444', admissionDate: new Date('2024-08-01') },
      { id: 'e5', name: '孙玉兰', age: 90, gender: 'FEMALE', careLevel: 'LEVEL_5', fallRiskLevel: 'HIGH', roomNumber: 'A-103', allergies: ['头孢类', '碘造影剂'], emergencyContact: '孙伟', emergencyPhone: '13800005555', admissionDate: new Date('2023-12-01') },
      { id: 'e6', name: '赵国强', age: 73, gender: 'MALE', careLevel: 'LEVEL_1', fallRiskLevel: 'LOW', roomNumber: 'C-301', allergies: [], emergencyContact: '赵丽', emergencyPhone: '13800006666', admissionDate: new Date('2025-02-14') },
    ],
    skipDuplicates: true,
  });

  const today = new Date();
  const todayStr = (d: number, h: number, m: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  await prisma.medicationReminder.createMany({
    data: [
      { id: 'r1', elderId: 'e1', medicationName: '氨氯地平', dosage: '5mg', frequency: '每日一次', scheduledTime: todayStr(0, 7, 0), status: 'PENDING', shift: 'MORNING' },
      { id: 'r2', elderId: 'e1', medicationName: '二甲双胍', dosage: '500mg', frequency: '每日两次', scheduledTime: todayStr(0, 7, 30), status: 'PENDING', shift: 'MORNING' },
      { id: 'r3', elderId: 'e2', medicationName: '硝苯地平', dosage: '30mg', frequency: '每日一次', scheduledTime: todayStr(0, 8, 0), status: 'IN_PROGRESS', shift: 'MORNING' },
      { id: 'r4', elderId: 'e3', medicationName: '阿托伐他汀', dosage: '20mg', frequency: '每晚一次', scheduledTime: todayStr(0, 13, 0), status: 'PENDING', shift: 'AFTERNOON' },
      { id: 'r5', elderId: 'e4', medicationName: '奥美拉唑', dosage: '20mg', frequency: '每日一次', scheduledTime: todayStr(0, 7, 0), status: 'COMPLETED', shift: 'MORNING', administeredBy: 'u2', administeredAt: todayStr(0, 7, 15) },
      { id: 'r6', elderId: 'e5', medicationName: '华法林', dosage: '2.5mg', frequency: '每日一次', scheduledTime: todayStr(0, 18, 0), status: 'PENDING', shift: 'EVENING' },
      { id: 'r7', elderId: 'e5', medicationName: '地高辛', dosage: '0.125mg', frequency: '每日一次', scheduledTime: todayStr(0, 18, 30), status: 'PENDING', shift: 'EVENING' },
      { id: 'r8', elderId: 'e6', medicationName: '维生素D', dosage: '400IU', frequency: '每日一次', scheduledTime: todayStr(0, 8, 0), status: 'COMPLETED', shift: 'MORNING', administeredBy: 'u3', administeredAt: todayStr(0, 8, 10) },
      { id: 'r9', elderId: 'e2', medicationName: '美托洛尔', dosage: '25mg', frequency: '每日两次', scheduledTime: todayStr(0, 13, 30), status: 'PENDING', shift: 'AFTERNOON' },
      { id: 'r10', elderId: 'e3', medicationName: '钙尔奇D', dosage: '600mg', frequency: '每日一次', scheduledTime: todayStr(0, 18, 0), status: 'PENDING', shift: 'EVENING' },
    ],
    skipDuplicates: true,
  });

  await prisma.fallIncident.createMany({
    data: [
      { id: 'f1', elderId: 'e1', reportedBy: 'u2', riskLevel: 'HIGH', incidentTime: todayStr(-2, 9, 30), location: 'A栋走廊', description: '如厕途中在走廊滑倒，右髋着地', status: 'IN_REVIEW' },
      { id: 'f2', elderId: 'e2', reportedBy: 'u3', riskLevel: 'MEDIUM', incidentTime: todayStr(-5, 14, 0), location: '活动室', description: '起身时头晕失去平衡，左手撑地', status: 'REVIEWED' },
      { id: 'f3', elderId: 'e5', reportedBy: 'u2', riskLevel: 'HIGH', incidentTime: todayStr(-1, 20, 15), location: 'A-103房间', description: '夜间如厕时跌倒，额头有擦伤', status: 'REPORTED' },
    ],
    skipDuplicates: true,
  });

  await prisma.communication.createMany({
    data: [
      { id: 'c1', incidentId: 'f1', authorId: 'u2', authorName: '李护理', content: '已现场评估，老人意识清醒，右髋疼痛明显', type: 'NOTE' },
      { id: 'c2', incidentId: 'f1', authorId: 'u1', authorName: '张主管', content: '已通知家属，家属要求送院检查', type: 'FAMILY_NOTIFICATION' },
      { id: 'c3', incidentId: 'f2', authorId: 'u3', authorName: '王护理', content: '老人血压偏低，建议调整降压药方案', type: 'NOTE' },
      { id: 'c4', incidentId: 'f3', authorId: 'u2', authorName: '李护理', content: '已做简单伤口处理，需医生进一步评估', type: 'NOTE' },
      { id: 'c5', incidentId: 'f3', authorId: 'u1', authorName: '张主管', content: '已致电家属告知情况，家属明早来院', type: 'PHONE_CALL' },
    ],
    skipDuplicates: true,
  });

  await prisma.reviewConclusion.createMany({
    data: [
      { id: 'rc1', incidentId: 'f2', reviewerId: 'u1', reviewerName: '张主管', conclusion: '因低血压导致头晕跌倒，需调整用药', actionPlan: '1. 联系医生调整降压药剂量 2. 增加体位变化协助 3. 每日监测血压', followUpDate: new Date(today.getTime() + 7 * 86400000) },
    ],
    skipDuplicates: true,
  });

  await prisma.visitRecord.createMany({
    data: [
      { id: 'v1', elderId: 'e1', visitorName: '陈建国', relationship: '儿子', visitTime: todayStr(-1, 10, 0), duration: 90, notes: '商谈转院事宜' },
      { id: 'v2', elderId: 'e3', visitorName: '刘志强', relationship: '儿子', visitTime: todayStr(-3, 14, 30), duration: 60, notes: '' },
      { id: 'v3', elderId: 'e5', visitorName: '孙伟', relationship: '儿子', visitTime: todayStr(-2, 9, 0), duration: 120, notes: '带来换洗衣物和营养品' },
      { id: 'v4', elderId: 'e4', visitorName: '张晓明', relationship: '女儿', visitTime: todayStr(0, 15, 0), duration: 45, notes: '' },
    ],
    skipDuplicates: true,
  });

  await prisma.activityCheckIn.createMany({
    data: [
      { id: 'a1', elderId: 'e1', activityName: '晨间操', activityDate: todayStr(0, 0, 0), checkedIn: false },
      { id: 'a2', elderId: 'e2', activityName: '晨间操', activityDate: todayStr(0, 0, 0), checkedIn: true, checkInTime: todayStr(0, 8, 30) },
      { id: 'a3', elderId: 'e3', activityName: '晨间操', activityDate: todayStr(0, 0, 0), checkedIn: true, checkInTime: todayStr(0, 8, 35) },
      { id: 'a4', elderId: 'e4', activityName: '晨间操', activityDate: todayStr(0, 0, 0), checkedIn: true, checkInTime: todayStr(0, 8, 40) },
      { id: 'a5', elderId: 'e5', activityName: '晨间操', activityDate: todayStr(0, 0, 0), checkedIn: false },
      { id: 'a6', elderId: 'e6', activityName: '晨间操', activityDate: todayStr(0, 0, 0), checkedIn: true, checkInTime: todayStr(0, 8, 20) },
      { id: 'a7', elderId: 'e1', activityName: '手工活动', activityDate: todayStr(0, 0, 0), checkedIn: false },
      { id: 'a8', elderId: 'e2', activityName: '手工活动', activityDate: todayStr(0, 0, 0), checkedIn: false },
      { id: 'a9', elderId: 'e3', activityName: '手工活动', activityDate: todayStr(0, 0, 0), checkedIn: true, checkInTime: todayStr(0, 14, 10) },
      { id: 'a10', elderId: 'e5', activityName: '手工活动', activityDate: todayStr(0, 0, 0), checkedIn: false },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
