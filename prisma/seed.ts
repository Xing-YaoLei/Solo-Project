import { PrismaClient, ApplicationStatus, MaterialStatus, ReviewStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.dataVersion.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.utilizationRecord.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.quota.deleteMany();
  await prisma.reviewResult.deleteMany();
  await prisma.material.deleteMany();
  await prisma.application.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.student.deleteMany();
  await prisma.supervisor.deleteMany();

  // Create supervisors
  const supervisors = await Promise.all([
    prisma.supervisor.create({
      data: { name: '张教授', department: '计算机学院', title: '教授' },
    }),
    prisma.supervisor.create({
      data: { name: '李教授', department: '计算机学院', title: '副教授' },
    }),
    prisma.supervisor.create({
      data: { name: '王教授', department: '数学学院', title: '教授' },
    }),
    prisma.supervisor.create({
      data: { name: '刘教授', department: '物理学院', title: '副教授' },
    }),
  ]);

  // Create quotas
  const terms = ['2023-2024-1', '2023-2024-2', '2024-2025-1'];
  for (const term of terms) {
    await Promise.all(
      supervisors.map((supervisor, idx) =>
        prisma.quota.create({
          data: {
            supervisorId: supervisor.id,
            term,
            totalQuota: 20 + idx * 5,
            usedQuota: 15 + idx * 5,
          },
        })
      )
    );
  }

  // Create data sources
  const dataSources = await Promise.all([
    prisma.dataSource.create({
      data: { sourceName: '学生申请表', sourceType: 'application', description: '学生提交的成绩复核申请表' },
    }),
    prisma.dataSource.create({
      data: { sourceName: '一卡通版本', sourceType: 'campus_card', description: '校园一卡通系统数据版本' },
    }),
    prisma.dataSource.create({
      data: { sourceName: '教务库口径', sourceType: 'academic_system', description: '教务管理系统官方数据' },
    }),
  ]);

  // Create students
  const colleges = ['计算机学院', '数学学院', '物理学院', '外语学院', '经济学院'];
  const majors = {
    '计算机学院': ['计算机科学与技术', '软件工程', '人工智能'],
    '数学学院': ['数学与应用数学', '信息与计算科学'],
    '物理学院': ['物理学', '应用物理学'],
    '外语学院': ['英语', '日语'],
    '经济学院': ['经济学', '金融学'],
  };
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '冯二', '陈三', '楚四'];

  const students = [];
  for (let i = 0; i < 50; i++) {
    const college = colleges[i % colleges.length];
    const majorList = majors[college as keyof typeof majors];
    const student = await prisma.student.create({
      data: {
        studentNo: `2021${String(i + 1).padStart(6, '0')}`,
        name: names[i % names.length],
        college,
        major: majorList[i % majorList.length],
        grade: 2021 + (i % 3),
      },
    });
    students.push(student);
  }

  // Create applications for each student
  const courses = ['CS101', 'CS201', 'MATH101', 'PHY101', 'ENG101', 'ECON101'];
  const statuses = [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.MATERIALS_MISSING, ApplicationStatus.PENDING];
  const materialTypes = ['成绩单', '申请表', '身份证明', '复核理由书'];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const numApplications = 1 + (i % 3);

    for (let j = 0; j < numApplications; j++) {
      const applyDate = new Date(2024, 0 + (i % 12), 1 + (j * 7));
      const application = await prisma.application.create({
        data: {
          studentId: student.id,
          courseCode: courses[(i + j) % courses.length],
          applicationScore: new Prisma.Decimal(75 + (i * 0.5) % 20),
          status: statuses[(i + j) % statuses.length],
          applyTime: applyDate,
          sourceType: 'online',
          supervisorId: supervisors[i % supervisors.length].id,
        },
      });

      // Create materials
      for (let k = 0; k < materialTypes.length; k++) {
        const matStatus = k < 3 ? MaterialStatus.SUBMITTED : (i % 3 === 0 ? MaterialStatus.MISSING : MaterialStatus.VERIFIED);
        await prisma.material.create({
          data: {
            applicationId: application.id,
            studentId: student.id,
            materialType: materialTypes[k],
            status: matStatus,
            uploadTime: matStatus !== MaterialStatus.MISSING ? new Date(applyDate.getTime() + k * 3600000) : null,
          },
        });
      }

      // Create review result for approved/rejected
      if (application.status === ApplicationStatus.APPROVED || application.status === ApplicationStatus.REJECTED) {
        await prisma.reviewResult.create({
          data: {
            applicationId: application.id,
            result: application.status === ApplicationStatus.APPROVED ? ReviewStatus.PASSED : ReviewStatus.FAILED,
            reviewer: supervisors[i % supervisors.length].name,
            reviewTime: new Date(applyDate.getTime() + 86400000 * 3),
            comments: application.status === ApplicationStatus.APPROVED ? '复核通过，成绩有误' : '复核不通过，成绩无误',
          },
        });
      }

      // Create transcript
      await prisma.transcript.create({
        data: {
          studentId: student.id,
          courseCode: application.courseCode,
          officialScore: new Prisma.Decimal(70 + (i * 0.3) % 25),
          term: '2024-2025-1',
        },
      });

      // Create data versions (some inconsistent)
      for (const source of dataSources) {
        const baseScore = application.applicationScore.toNumber();
        const sourceValue = source.sourceType === 'campus_card' && i % 5 === 0
          ? String(baseScore + 5)
          : source.sourceType === 'academic_system' && i % 7 === 0
          ? String(baseScore - 3)
          : String(baseScore);

        await prisma.dataVersion.create({
          data: {
            dataSourceId: source.id,
            recordId: application.id,
            fieldName: 'score',
            sourceValue,
            canonicalValue: String(baseScore),
            isConsistent: sourceValue === String(baseScore),
            checkTime: new Date(),
          },
        });
      }
    }
  }

  // Create classrooms
  const classrooms = await Promise.all([
    prisma.classroom.create({ data: { building: '教学楼A', roomNo: '101', capacity: 120, type: '多媒体教室' } }),
    prisma.classroom.create({ data: { building: '教学楼A', roomNo: '102', capacity: 80, type: '普通教室' } }),
    prisma.classroom.create({ data: { building: '教学楼A', roomNo: '201', capacity: 60, type: '实验室' } }),
    prisma.classroom.create({ data: { building: '教学楼B', roomNo: '101', capacity: 150, type: '阶梯教室' } }),
    prisma.classroom.create({ data: { building: '教学楼B', roomNo: '202', capacity: 100, type: '多媒体教室' } }),
    prisma.classroom.create({ data: { building: '实验楼', roomNo: '301', capacity: 40, type: '实验室' } }),
  ]);

  // Create utilization records for multiple semesters
  const utilizationSemesters = ['2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1'];
  const baseRates = [0.55, 0.58, 0.62, 0.68];

  for (let s = 0; s < utilizationSemesters.length; s++) {
    const semester = utilizationSemesters[s];
    const baseRate = baseRates[s];

    for (let w = 1; w <= 16; w++) {
      for (let c = 0; c < classrooms.length; c++) {
        const classroom = classrooms[c];
        const variation = (c * 0.05) + (w % 4) * 0.02 - 0.04;
        const rate = Math.min(0.95, Math.max(0.3, baseRate + variation));

        await prisma.utilizationRecord.create({
          data: {
            classroomId: classroom.id,
            recordDate: new Date(2023 + s, 8 + (w - 1) / 8, 1 + (w - 1) % 8 * 7),
            utilizationRate: new Prisma.Decimal(rate),
            semester,
            week: String(w),
          },
        });
      }
    }
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
