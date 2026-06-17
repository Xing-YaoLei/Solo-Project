import { ILevelConfig, createWorker } from '../assets/scripts/types/GameTypes';

export const LEVEL_CONFIGS: ILevelConfig[] = [
    {
        id: 1,
        name: '新手入职',
        description: '学习基础派单流程，处理简单报修工单',
        difficulty: 'easy',
        orderCount: 3,
        timeLimit: 600,
        targetScore: 200,
        unlockRules: ['rule_skill_match', 'rule_workload'],
        workers: [
            createWorker('w1', '张师傅', ['electrical', 'plumbing'], [1, 1], 2),
            createWorker('w2', '李师傅', ['structure', 'other'], [1, 1], 2)
        ],
        orders: [],
        mapResource: 'map_park_residential',
        tutorialSteps: ['tutorial_1', 'tutorial_2', 'tutorial_3'],
        isUnlockable: true,
        requiredLevel: 0
    },
    {
        id: 2,
        name: '技能进阶',
        description: '学习技能等级匹配，处理更复杂的工单',
        difficulty: 'easy',
        orderCount: 4,
        timeLimit: 800,
        targetScore: 350,
        unlockRules: ['rule_skill_level', 'rule_availability'],
        workers: [
            createWorker('w1', '张师傅', ['electrical', 'plumbing'], [2, 1], 3),
            createWorker('w2', '李师傅', ['structure', 'other'], [1, 2], 3),
            createWorker('w3', '王师傅', ['equipment'], [2], 2)
        ],
        orders: [],
        mapResource: 'map_park_residential',
        isUnlockable: true,
        requiredLevel: 1
    },
    {
        id: 3,
        name: '紧急调度',
        description: '处理紧急工单，学习优先级规则',
        difficulty: 'normal',
        orderCount: 5,
        timeLimit: 900,
        targetScore: 500,
        unlockRules: ['rule_priority'],
        workers: [
            createWorker('w1', '张师傅', ['electrical'], [3], 2),
            createWorker('w2', '李师傅', ['structure', 'plumbing'], [2, 2], 3),
            createWorker('w3', '王师傅', ['equipment', 'other'], [2, 1], 3)
        ],
        orders: [],
        mapResource: 'map_park_commercial',
        isUnlockable: true,
        requiredLevel: 2
    },
    {
        id: 4,
        name: '综合调度',
        description: '综合运用所有规则，处理多类型工单',
        difficulty: 'normal',
        orderCount: 6,
        timeLimit: 1000,
        targetScore: 700,
        unlockRules: [],
        workers: [
            createWorker('w1', '张师傅', ['electrical'], [3], 2),
            createWorker('w2', '李师傅', ['structure', 'plumbing'], [3, 2], 3),
            createWorker('w3', '王师傅', ['equipment', 'other'], [2, 2], 3),
            createWorker('w4', '赵师傅', ['electrical', 'plumbing'], [1, 2], 2)
        ],
        orders: [],
        mapResource: 'map_park_complete',
        isUnlockable: true,
        requiredLevel: 3
    },
    {
        id: 5,
        name: '高效运营',
        description: '在时间压力下高效处理大量工单',
        difficulty: 'hard',
        orderCount: 8,
        timeLimit: 1200,
        targetScore: 1000,
        unlockRules: [],
        workers: [
            createWorker('w1', '张师傅', ['electrical'], [3], 3),
            createWorker('w2', '李师傅', ['structure', 'plumbing'], [3, 3], 4),
            createWorker('w3', '王师傅', ['equipment', 'other'], [3, 2], 4),
            createWorker('w4', '赵师傅', ['electrical', 'plumbing'], [2, 3], 3)
        ],
        orders: [],
        mapResource: 'map_park_complete',
        isUnlockable: true,
        requiredLevel: 4
    },
    {
        id: 6,
        name: '园区总管',
        description: '终极挑战，考验你的全部派单能力',
        difficulty: 'hard',
        orderCount: 10,
        timeLimit: 1500,
        targetScore: 1500,
        unlockRules: [],
        workers: [
            createWorker('w1', '张师傅', ['electrical'], [3], 3),
            createWorker('w2', '李师傅', ['structure', 'plumbing'], [3, 3], 4),
            createWorker('w3', '王师傅', ['equipment', 'other'], [3, 3], 4),
            createWorker('w4', '赵师傅', ['electrical', 'plumbing'], [3, 3], 3),
            createWorker('w5', '孙师傅', ['structure', 'equipment'], [2, 2], 3)
        ],
        orders: [],
        mapResource: 'map_park_complete',
        isUnlockable: true,
        requiredLevel: 5
    }
];

export function getLevelConfig(levelId: number): ILevelConfig | undefined {
    return LEVEL_CONFIGS.find(l => l.id === levelId);
}

export function getAllLevelConfigs(): ILevelConfig[] {
    return [...LEVEL_CONFIGS];
}

export function getUnlockedLevelConfigs(unlockedLevels: number[]): ILevelConfig[] {
    return LEVEL_CONFIGS.filter(l => unlockedLevels.includes(l.id));
}
