import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const departments = [
  { name: '计算机科学学院', code: 'CS' },
  { name: '数学与统计学院', code: 'MATH' },
  { name: '经济管理学院', code: 'ECON' },
  { name: '外国语学院', code: 'FOREIGN' },
]

const advisors = [
  { name: '孙明辉', departmentCode: 'CS', quotaLimit: 15 },
  { name: '周建国', departmentCode: 'MATH', quotaLimit: 12 },
  { name: '吴晓燕', departmentCode: 'ECON', quotaLimit: 10 },
  { name: '郑伟', departmentCode: 'FOREIGN', quotaLimit: 8 },
]

const students = [
  { name: '张伟', studentNo: '2022010001', departmentCode: 'CS', advisorIdx: 0 },
  { name: '李娜', studentNo: '2022010002', departmentCode: 'CS', advisorIdx: 0 },
  { name: '王强', studentNo: '2022010003', departmentCode: 'MATH', advisorIdx: 1 },
  { name: '赵敏', studentNo: '2022010004', departmentCode: 'ECON', advisorIdx: 2 },
  { name: '陈思', studentNo: '2022010005', departmentCode: 'FOREIGN', advisorIdx: 3 },
  { name: '刘洋', studentNo: '2022010006', departmentCode: 'FOREIGN', advisorIdx: 3 },
  { name: '钱磊', studentNo: '2022010007', departmentCode: 'CS', advisorIdx: 0 },
  { name: '周婷', studentNo: '2022010008', departmentCode: 'MATH', advisorIdx: 1 },
  { name: '吴涛', studentNo: '2022010009', departmentCode: 'ECON', advisorIdx: 2 },
  { name: '郑丽', studentNo: '2022010010', departmentCode: 'CS', advisorIdx: 0 },
  { name: '孙明', studentNo: '2022010011', departmentCode: 'MATH', advisorIdx: 1 },
  { name: '马红', studentNo: '2022010012', departmentCode: 'ECON', advisorIdx: 2 },
]

const semesters = ['2022-2023-1', '2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1']

const grades = ['A', 'B', 'C', 'D', 'F']

const materialTypes = ['成绩单原件', '身份证复印件', '申请表']

const statuses = ['pending', 'approved', 'missing', 'rejected']

const locations = [
  '图书馆一楼大厅',
  '第三教学楼自习室',
  '学生食堂二楼',
  '体育馆入口',
  '行政楼打印室',
  '第一教学楼305',
  '计算机学院实验室',
]

async function main() {
  console.log('开始播种数据...')

  const createdDepts = await Promise.all(
    departments.map(d => prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    }))
  )

  const deptMap: Record<string, string> = {}
  createdDepts.forEach(d => { deptMap[d.code] = d.id })

  const createdAdvisors = await Promise.all(
    advisors.map(a => prisma.advisor.upsert({
      where: { id: crypto.randomUUID() },
      update: {},
      create: {
        name: a.name,
        departmentId: deptMap[a.departmentCode],
        quotaLimit: a.quotaLimit,
      },
    }))
  )

  const createdStudents = await Promise.all(
    students.map(s => prisma.student.upsert({
      where: { studentNo: s.studentNo },
      update: {},
      create: {
        name: s.name,
        studentNo: s.studentNo,
        departmentId: deptMap[s.departmentCode],
        advisorId: createdAdvisors[s.advisorIdx].id,
      },
    }))
  )

  const studentMap: Record<string, string> = {}
  createdStudents.forEach(s => { studentMap[s.studentNo] = s.id })

  for (let i = 0; i < 60; i++) {
    const studentIdx = i % createdStudents.length
    const semesterIdx = Math.floor(Math.random() * semesters.length)
    const gradeIdx = Math.floor(Math.random() * grades.length)
    const reviewIdx = Math.floor(Math.random() * grades.length)
    await prisma.gradeReview.create({
      data: {
        studentId: createdStudents[studentIdx].id,
        semester: semesters[semesterIdx],
        originalGrade: grades[gradeIdx],
        reviewedGrade: Math.random() > 0.5 ? grades[reviewIdx] : null,
        reviewedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      },
    })
  }

  const createdApplications = []
  for (let i = 0; i < 20; i++) {
    const studentIdx = i % createdStudents.length
    const app = await prisma.application.create({
      data: {
        studentId: createdStudents[studentIdx].id,
        semester: semesters[4],
        materialType: materialTypes[i % materialTypes.length],
        status: statuses[i % statuses.length],
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
    createdApplications.push(app)
  }

  for (let i = 0; i < 40; i++) {
    const studentIdx = i % createdStudents.length
    const appIdx = i % createdApplications.length
    await prisma.campusCardRecord.create({
      data: {
        studentId: createdStudents[studentIdx].id,
        applicationId: Math.random() > 0.5 ? createdApplications[appIdx].id : null,
        transactionTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        location: locations[i % locations.length],
        amount: Math.round(Math.random() * 50 * 100) / 100,
      },
    })
  }

  console.log('播种完成！')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
