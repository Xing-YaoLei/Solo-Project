import { MedicineItem, VisitRecord, ActivityItem, ElderlyProfile } from './ElderlyData';

export interface LevelConfig {
    id: number;
    name: string;
    description: string;
    difficulty: 1 | 2 | 3;
    timeLimit: number;
    targetScore: number;
    threeStarScore: number;
    twoStarScore: number;
    taskTypes: Array<'medicine' | 'visit' | 'activity'>;
    elderlyCount: number;
    medicineCount: number;
    visitCount: number;
    activityCount: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
    {
        id: 1,
        name: '初来乍到',
        description: '熟悉入住评估的基本流程，从用药清单开始',
        difficulty: 1,
        timeLimit: 120,
        targetScore: 600,
        threeStarScore: 900,
        twoStarScore: 750,
        taskTypes: ['medicine'],
        elderlyCount: 2,
        medicineCount: 4,
        visitCount: 0,
        activityCount: 0,
    },
    {
        id: 2,
        name: '渐入佳境',
        description: '增加用药清单难度，并加入探访记录',
        difficulty: 1,
        timeLimit: 150,
        targetScore: 800,
        threeStarScore: 1200,
        twoStarScore: 1000,
        taskTypes: ['medicine', 'visit'],
        elderlyCount: 3,
        medicineCount: 5,
        visitCount: 3,
        activityCount: 0,
    },
    {
        id: 3,
        name: '有条不紊',
        description: '三项任务同时进行，考验你的管理能力',
        difficulty: 2,
        timeLimit: 180,
        targetScore: 1200,
        threeStarScore: 1800,
        twoStarScore: 1500,
        taskTypes: ['medicine', 'visit', 'activity'],
        elderlyCount: 4,
        medicineCount: 6,
        visitCount: 4,
        activityCount: 4,
    },
    {
        id: 4,
        name: '高效运营',
        description: '时间更紧，任务更多',
        difficulty: 2,
        timeLimit: 150,
        targetScore: 1500,
        threeStarScore: 2200,
        twoStarScore: 1800,
        taskTypes: ['medicine', 'visit', 'activity'],
        elderlyCount: 5,
        medicineCount: 8,
        visitCount: 5,
        activityCount: 5,
    },
    {
        id: 5,
        name: '护理专家',
        description: '最高难度，你是真正的护理专家吗？',
        difficulty: 3,
        timeLimit: 200,
        targetScore: 2000,
        threeStarScore: 3000,
        twoStarScore: 2500,
        taskTypes: ['medicine', 'visit', 'activity'],
        elderlyCount: 6,
        medicineCount: 10,
        visitCount: 7,
        activityCount: 7,
    },
];

const ELDERLY_NAMES_MALE = ['张爷爷', '李爷爷', '王爷爷', '赵爷爷', '刘爷爷', '陈爷爷'];
const ELDERLY_NAMES_FEMALE = ['张奶奶', '李奶奶', '王奶奶', '赵奶奶', '刘奶奶', '陈奶奶'];

const MEDICINE_NAMES = [
    '降压片', '维生素D', '钙片', '阿司匹林', '二甲双胍',
    '奥美拉唑', '辛伐他汀', '氯吡格雷', '美托洛尔', '左氧氟沙星',
    '阿莫西林', '布洛芬', '甲硝唑', '氟康唑', '雷贝拉唑',
];

const MEDICINE_TIMES = ['早餐后', '午餐后', '晚餐后', '睡前', '早晨空腹'];

const VISITOR_RELATIONS = ['儿子', '女儿', '孙子', '孙女', '老伴', '侄子', '侄女', '老朋友'];

const VISITOR_NAMES = ['张伟', '李芳', '王明', '赵丽', '刘强', '陈静', '周杰', '吴敏'];

const ACTIVITY_NAMES = ['晨间操', '书法课', '手工制作', '合唱练习', '茶话会', '康复训练', '电影欣赏', '棋牌活动'];

const ACTIVITY_LOCATIONS = ['活动室', '康复室', '多功能厅', '花园', '阅览室', '餐厅'];

export function generateElderlyProfiles(count: number): ElderlyProfile[] {
    const profiles: ElderlyProfile[] = [];
    for (let i = 0; i < count; i++) {
        const isMale = Math.random() > 0.5;
        const names = isMale ? ELDERLY_NAMES_MALE : ELDERLY_NAMES_FEMALE;
        profiles.push({
            id: `elder_${i}`,
            name: names[i % names.length],
            age: 70 + Math.floor(Math.random() * 20),
            gender: isMale ? 'male' : 'female',
            roomNumber: `${Math.floor(Math.random() * 3) + 1}0${i + 1}`,
            avatar: '',
            healthLevel: 1 + Math.floor(Math.random() * 3),
        });
    }
    return profiles;
}

export function generateMedicineTasks(count: number, difficulty: number): MedicineItem[] {
    const tasks: MedicineItem[] = [];
    const correctCount = Math.ceil(count * (0.6 + Math.random() * 0.2));
    
    for (let i = 0; i < count; i++) {
        const isCorrect = i < correctCount;
        tasks.push({
            id: `med_${i}`,
            name: MEDICINE_NAMES[i % MEDICINE_NAMES.length],
            dosage: `${1 + Math.floor(Math.random() * 3)}${['片', '粒', 'ml'][Math.floor(Math.random() * 3)]}`,
            time: MEDICINE_TIMES[Math.floor(Math.random() * MEDICINE_TIMES.length)],
            isCorrect: isCorrect,
        });
    }
    
    for (let i = tasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    }
    
    return tasks;
}

export function generateVisitTasks(count: number): VisitRecord[] {
    const tasks: VisitRecord[] = [];
    const correctCount = Math.ceil(count * (0.5 + Math.random() * 0.3));
    
    for (let i = 0; i < count; i++) {
        const isCorrect = i < correctCount;
        const hour = 9 + Math.floor(Math.random() * 10);
        const minute = Math.floor(Math.random() * 60);
        tasks.push({
            id: `visit_${i}`,
            visitorName: VISITOR_NAMES[i % VISITOR_NAMES.length],
            visitorRelation: VISITOR_RELATIONS[Math.floor(Math.random() * VISITOR_RELATIONS.length)],
            visitTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            isCorrect: isCorrect,
        });
    }
    
    for (let i = tasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    }
    
    return tasks;
}

export function generateActivityTasks(count: number): ActivityItem[] {
    const tasks: ActivityItem[] = [];
    const correctCount = Math.ceil(count * (0.5 + Math.random() * 0.3));
    
    for (let i = 0; i < count; i++) {
        const isCorrect = i < correctCount;
        const hour = 8 + Math.floor(Math.random() * 10);
        tasks.push({
            id: `act_${i}`,
            name: ACTIVITY_NAMES[i % ACTIVITY_NAMES.length],
            time: `${hour.toString().padStart(2, '0')}:00`,
            location: ACTIVITY_LOCATIONS[Math.floor(Math.random() * ACTIVITY_LOCATIONS.length)],
            isCorrect: isCorrect,
        });
    }
    
    for (let i = tasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    }
    
    return tasks;
}
