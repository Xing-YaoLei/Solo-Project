import type { Level, Student, Transcript, StudentMaterials, ApplicationMaterial } from '../types';

const students: Student[] = [
  {
    id: 's1',
    name: '张明远',
    studentId: '2024001001',
    major: '计算机科学与技术',
    grade: '大三',
    avatar: '👨‍🎓',
    seatNumber: 1,
    hasApplied: true,
    seatPosition: { x: -3, z: 2 },
  },
  {
    id: 's2',
    name: '李思琪',
    studentId: '2024001002',
    major: '软件工程',
    grade: '大三',
    avatar: '👩‍🎓',
    seatNumber: 2,
    hasApplied: true,
    seatPosition: { x: -1, z: 2 },
  },
  {
    id: 's3',
    name: '王浩然',
    studentId: '2024001003',
    major: '数据科学',
    grade: '大二',
    avatar: '👨‍🎓',
    seatNumber: 3,
    hasApplied: false,
    seatPosition: { x: 1, z: 2 },
  },
  {
    id: 's4',
    name: '陈雨萱',
    studentId: '2024001004',
    major: '人工智能',
    grade: '大三',
    avatar: '👩‍🎓',
    seatNumber: 4,
    hasApplied: true,
    seatPosition: { x: 3, z: 2 },
  },
  {
    id: 's5',
    name: '刘子轩',
    studentId: '2024001005',
    major: '网络安全',
    grade: '大二',
    avatar: '👨‍🎓',
    seatNumber: 5,
    hasApplied: true,
    seatPosition: { x: -3, z: 0 },
  },
  {
    id: 's6',
    name: '赵梦婷',
    studentId: '2024001006',
    major: '计算机科学与技术',
    grade: '大一',
    avatar: '👩‍🎓',
    seatNumber: 6,
    hasApplied: false,
    seatPosition: { x: -1, z: 0 },
  },
  {
    id: 's7',
    name: '孙伟峰',
    studentId: '2024001007',
    major: '软件工程',
    grade: '大四',
    avatar: '👨‍🎓',
    seatNumber: 7,
    hasApplied: true,
    seatPosition: { x: 1, z: 0 },
  },
  {
    id: 's8',
    name: '周晓彤',
    studentId: '2024001008',
    major: '数据科学',
    grade: '大三',
    avatar: '👩‍🎓',
    seatNumber: 8,
    hasApplied: true,
    seatPosition: { x: 3, z: 0 },
  },
];

const transcripts: Transcript[] = [
  {
    studentId: 's1',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 92, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 88, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 95, credits: 4 },
      { courseName: '数据结构', courseId: 'CS201', score: 87, credits: 4 },
    ],
    gpa: 3.85,
    rank: 5,
  },
  {
    studentId: 's2',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 96, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 94, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 91, credits: 4 },
      { courseName: '数据结构', courseId: 'CS201', score: 93, credits: 4 },
    ],
    gpa: 3.92,
    rank: 2,
  },
  {
    studentId: 's3',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 78, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 82, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 85, credits: 4 },
    ],
    gpa: 3.1,
    rank: 28,
  },
  {
    studentId: 's4',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 89, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 91, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 88, credits: 4 },
      { courseName: '数据结构', courseId: 'CS201', score: 90, credits: 4 },
      { courseName: '机器学习', courseId: 'AI301', score: 92, credits: 3 },
    ],
    gpa: 3.78,
    rank: 8,
  },
  {
    studentId: 's5',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 85, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 83, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 90, credits: 4 },
      { courseName: '数据结构', courseId: 'CS201', score: 88, credits: 4 },
    ],
    gpa: 3.45,
    rank: 15,
  },
  {
    studentId: 's6',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 95, credits: 4 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 89, credits: 4 },
    ],
    gpa: 3.7,
    rank: 12,
  },
  {
    studentId: 's7',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 88, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 86, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 92, credits: 4 },
      { courseName: '数据结构', courseId: 'CS201', score: 89, credits: 4 },
      { courseName: '软件工程', courseId: 'SE301', score: 91, credits: 3 },
    ],
    gpa: 3.6,
    rank: 11,
  },
  {
    studentId: 's8',
    courses: [
      { courseName: '高等数学', courseId: 'MATH101', score: 93, credits: 4 },
      { courseName: '线性代数', courseId: 'MATH102', score: 90, credits: 3 },
      { courseName: '程序设计基础', courseId: 'CS101', score: 94, credits: 4 },
      { courseName: '数据结构', courseId: 'CS201', score: 91, credits: 4 },
      { courseName: '概率论', courseId: 'MATH201', score: 87, credits: 3 },
    ],
    gpa: 3.82,
    rank: 6,
  },
];

const generateMaterials = (studentId: string, missingSome: boolean): ApplicationMaterial[] => {
  const baseMaterials: ApplicationMaterial[] = [
    { id: `${studentId}-transcript`, name: '成绩单', type: 'transcript', required: true, submitted: true },
    { id: `${studentId}-application`, name: '申请表', type: 'application_form', required: true, submitted: true },
    { id: `${studentId}-id`, name: '身份证复印件', type: 'id_copy', required: true, submitted: true },
    { id: `${studentId}-recommendation`, name: '推荐信', type: 'recommendation', required: false, submitted: true },
    { id: `${studentId}-certificate`, name: '获奖证书', type: 'certificate', required: false, submitted: false },
  ];

  if (missingSome) {
    const missingIndex = Math.floor(Math.random() * 3);
    baseMaterials[missingIndex].submitted = false;
  }

  return baseMaterials;
};

const studentMaterials: StudentMaterials[] = [
  { studentId: 's1', materials: generateMaterials('s1', true) },
  { studentId: 's2', materials: generateMaterials('s2', false) },
  { studentId: 's3', materials: generateMaterials('s3', false) },
  { studentId: 's4', materials: generateMaterials('s4', true) },
  { studentId: 's5', materials: generateMaterials('s5', false) },
  { studentId: 's6', materials: generateMaterials('s6', false) },
  { studentId: 's7', materials: generateMaterials('s7', true) },
  { studentId: 's8', materials: generateMaterials('s8', false) },
];

export const levels: Level[] = [
  {
    id: 'level-1',
    name: '新手训练',
    description: '熟悉成绩复核基本流程，从观察学生名单开始',
    difficulty: 'easy',
    timeLimit: 180,
    students: students.slice(0, 4),
    transcripts: transcripts.slice(0, 4),
    studentMaterials: studentMaterials.slice(0, 4),
    targetUtilization: 75,
    passingScore: 60,
  },
  {
    id: 'level-2',
    name: '正式复核',
    description: '完整的成绩复核流程，注意材料完整性',
    difficulty: 'medium',
    timeLimit: 300,
    students: students.slice(0, 6),
    transcripts: transcripts.slice(0, 6),
    studentMaterials: studentMaterials.slice(0, 6),
    targetUtilization: 80,
    passingScore: 70,
  },
  {
    id: 'level-3',
    name: '高级挑战',
    description: '全部学生的复杂复核，考验你的调度能力',
    difficulty: 'hard',
    timeLimit: 420,
    students,
    transcripts,
    studentMaterials,
    targetUtilization: 85,
    passingScore: 80,
  },
];

export const getLevelById = (id: string): Level | undefined => {
  return levels.find((level) => level.id === id);
};

export const getStudentById = (level: Level, studentId: string): Student | undefined => {
  return level.students.find((s) => s.id === studentId);
};

export const getTranscriptByStudentId = (level: Level, studentId: string): Transcript | undefined => {
  return level.transcripts.find((t) => t.studentId === studentId);
};

export const getMaterialsByStudentId = (level: Level, studentId: string): StudentMaterials | undefined => {
  return level.studentMaterials.find((m) => m.studentId === studentId);
};
