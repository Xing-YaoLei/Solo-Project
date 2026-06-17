import { IRepairOrder, OrderPriority, RepairCategory, IClue, IOrderStage } from '../assets/scripts/game/OrderTypes';
import { calculateOrderTimeLimit } from '../assets/scripts/game/DispatchTypes';

function createBaseOrder(
    id: string,
    title: string,
    description: string,
    priority: OrderPriority,
    category: RepairCategory,
    building: string,
    floor: string,
    room: string,
    reporter: string,
    baseReward: number
): IRepairOrder {
    const order: IRepairOrder = {
        id,
        type: 'repair',
        priority,
        category,
        title,
        description,
        location: {
            building,
            floor,
            room,
            description: `${building} ${floor} ${room}`
        },
        reporter,
        timeLimit: 0,
        baseReward,
        stages: [],
        initialClues: [],
        correctPath: [],
        commonErrors: [],
        createdAt: Date.now(),
        deadline: 0
    };
    order.timeLimit = calculateOrderTimeLimit(order);
    order.deadline = Date.now() + order.timeLimit * 1000;
    return order;
}

const lightBulbOrder: IRepairOrder = (() => {
    const order = createBaseOrder(
        'order_001',
        '楼道灯不亮',
        '业主反映3号楼2层楼道灯不亮，晚上回家不方便。',
        'low',
        'electrical',
        '3号楼',
        '2层',
        '公共楼道',
        '王先生',
        50
    );

    order.initialClues = [
        {
            id: 'clue_001_1',
            title: '报修位置',
            description: '3号楼2层公共楼道',
            category: 'location',
            isHidden: false,
            importance: 1
        },
        {
            id: 'clue_001_2',
            title: '问题描述',
            description: '楼道灯不亮，晚上回家不方便',
            category: 'description',
            isHidden: false,
            importance: 2
        },
        {
            id: 'clue_001_3',
            title: '隐藏线索-灯具型号',
            description: '经检查是LED感应灯，型号为XX-2023',
            category: 'detail',
            isHidden: true,
            importance: 3
        }
    ];

    order.stages = [
        {
            id: 'stage_001_1',
            name: '初步诊断',
            description: '根据报修信息判断问题类型',
            choices: [
                {
                    id: 'choice_001_1_a',
                    text: '判断为电力故障，派电工处理',
                    result: {
                        isCorrect: true,
                        nextState: 'stage_001_2',
                        feedback: '正确！这确实是电力问题。',
                        unlockedClues: ['clue_001_3']
                    }
                },
                {
                    id: 'choice_001_1_b',
                    text: '判断为设备损坏，派设备维修工',
                    result: {
                        isCorrect: false,
                        nextState: 'stage_001_1',
                        feedback: '错误！这是电力问题，需要电工。',
                        penalty: {
                            scoreDeduction: 20,
                            errorType: 'WRONG_CATEGORY',
                            description: '错误判断工单类型',
                            requiresReview: true
                        }
                    }
                },
                {
                    id: 'choice_001_1_c',
                    text: '先查看线索，了解更多信息',
                    result: {
                        isCorrect: true,
                        nextState: 'stage_001_1',
                        feedback: '好的，请仔细阅读线索。'
                    }
                }
            ]
        },
        {
            id: 'stage_001_2',
            name: '派单选择',
            description: '选择合适的维修人员',
            choices: [
                {
                    id: 'choice_001_2_a',
                    text: '派给张师傅（电工，技能等级高）',
                    result: {
                        isCorrect: true,
                        nextState: '',
                        feedback: '完美！张师傅是电工，最适合处理这个问题。',
                        reward: { score: 80 },
                        endOrder: true
                    }
                },
                {
                    id: 'choice_001_2_b',
                    text: '派给李师傅（木工）',
                    result: {
                        isCorrect: false,
                        nextState: 'stage_001_2',
                        feedback: '错误！李师傅是木工，不会修电路。',
                        penalty: {
                            scoreDeduction: 30,
                            errorType: 'SKILL_MISMATCH',
                            description: '派单人员技能不匹配',
                            requiresReview: true
                        }
                    }
                },
                {
                    id: 'choice_001_2_c',
                    text: '派给王师傅（设备工，比较空闲）',
                    requiredClues: ['clue_001_3'],
                    result: {
                        isCorrect: false,
                        nextState: 'stage_001_2',
                        feedback: '错误！虽然空闲，但需要电工技能。',
                        penalty: {
                            scoreDeduction: 15,
                            errorType: 'SKILL_MISMATCH',
                            description: '派单人员技能不匹配',
                            requiresReview: false
                        }
                    }
                }
            ],
            autoDiscoverClues: ['clue_001_3']
        }
    ];

    order.correctPath = ['choice_001_1_a', 'choice_001_2_a'];

    order.commonErrors = [
        {
            scoreDeduction: 30,
            errorType: 'SKILL_MISMATCH',
            description: '派单技能不匹配',
            requiresReview: true
        },
        {
            scoreDeduction: 20,
            errorType: 'WRONG_CATEGORY',
            description: '错误判断工单类型',
            requiresReview: true
        }
    ];

    return order;
})();

const waterLeakOrder: IRepairOrder = (() => {
    const order = createBaseOrder(
        'order_002',
        '卫生间漏水',
        '业主反映卫生间天花板漏水，影响正常使用。',
        'high',
        'plumbing',
        '5号楼',
        '3层',
        '301室',
        '李女士',
        80
    );

    order.initialClues = [
        {
            id: 'clue_002_1',
            title: '报修位置',
            description: '5号楼3层301室卫生间',
            category: 'location',
            isHidden: false,
            importance: 1
        },
        {
            id: 'clue_002_2',
            title: '问题描述',
            description: '卫生间天花板漏水',
            category: 'description',
            isHidden: false,
            importance: 2
        },
        {
            id: 'clue_002_3',
            title: '紧急程度',
            description: '已影响正常使用，需要尽快处理',
            category: 'urgency',
            isHidden: false,
            importance: 2
        },
        {
            id: 'clue_002_4',
            title: '隐藏线索-漏水来源',
            description: '初步判断是楼上401室水管问题',
            category: 'detail',
            isHidden: true,
            importance: 3
        }
    ];

    order.stages = [
        {
            id: 'stage_002_1',
            name: '问题分析',
            description: '分析漏水问题的性质',
            choices: [
                {
                    id: 'choice_002_1_a',
                    text: '判断为水暖问题，派水暖工',
                    result: {
                        isCorrect: true,
                        nextState: 'stage_002_2',
                        feedback: '正确！漏水通常是水暖问题。',
                        unlockedClues: ['clue_002_4']
                    }
                },
                {
                    id: 'choice_002_1_b',
                    text: '判断为土建问题，派木工',
                    result: {
                        isCorrect: false,
                        nextState: 'stage_002_1',
                        feedback: '错误！漏水是水暖问题。',
                        penalty: {
                            scoreDeduction: 25,
                            errorType: 'WRONG_CATEGORY',
                            description: '错误判断工单类型',
                            requiresReview: true
                        }
                    }
                }
            ]
        },
        {
            id: 'stage_002_2',
            name: '派单决策',
            description: '选择最合适的维修人员',
            choices: [
                {
                    id: 'choice_002_2_a',
                    text: '派给李师傅（水暖工，技能等级高）',
                    result: {
                        isCorrect: true,
                        nextState: '',
                        feedback: '完美！李师傅是资深水暖工。',
                        reward: { score: 120, unlockRule: 'rule_skill_level' },
                        endOrder: true
                    }
                },
                {
                    id: 'choice_002_2_b',
                    text: '派给张师傅（电工）',
                    result: {
                        isCorrect: false,
                        nextState: 'stage_002_2',
                        feedback: '错误！张师傅是电工。',
                        penalty: {
                            scoreDeduction: 35,
                            errorType: 'SKILL_MISMATCH',
                            description: '派单人员技能不匹配',
                            requiresReview: true
                        }
                    }
                },
                {
                    id: 'choice_002_2_c',
                    text: '派给王师傅（水暖工，但正在处理其他工单）',
                    condition: (context) => {
                        return true;
                    },
                    result: {
                        isCorrect: false,
                        nextState: 'stage_002_2',
                        feedback: '错误！王师傅工作负荷已满。',
                        penalty: {
                            scoreDeduction: 20,
                            errorType: 'WORKLOAD_EXCEEDED',
                            description: '派单人员工作量超载',
                            requiresReview: false
                        }
                    }
                }
            ],
            autoDiscoverClues: ['clue_002_4']
        }
    ];

    order.correctPath = ['choice_002_1_a', 'choice_002_2_a'];

    order.commonErrors = [
        {
            scoreDeduction: 35,
            errorType: 'SKILL_MISMATCH',
            description: '派单技能不匹配',
            requiresReview: true
        },
        {
            scoreDeduction: 25,
            errorType: 'WRONG_CATEGORY',
            description: '错误判断工单类型',
            requiresReview: true
        }
    ];

    return order;
})();

const elevatorOrder: IRepairOrder = (() => {
    const order = createBaseOrder(
        'order_003',
        '电梯故障停运',
        '业主反映2号楼电梯突然停运，已有多人被困。',
        'urgent',
        'equipment',
        '2号楼',
        '全楼',
        '电梯间',
        '紧急报修',
        150
    );

    order.initialClues = [
        {
            id: 'clue_003_1',
            title: '报修位置',
            description: '2号楼电梯',
            category: 'location',
            isHidden: false,
            importance: 1
        },
        {
            id: 'clue_003_2',
            title: '问题描述',
            description: '电梯突然停运，多人被困',
            category: 'description',
            isHidden: false,
            importance: 3
        },
        {
            id: 'clue_003_3',
            title: '紧急程度',
            description: '有人员被困，属于紧急事件',
            category: 'urgency',
            isHidden: false,
            importance: 3
        }
    ];

    order.stages = [
        {
            id: 'stage_003_1',
            name: '应急响应',
            description: '处理紧急电梯故障',
            choices: [
                {
                    id: 'choice_003_1_a',
                    text: '立即派资深设备维修工处理',
                    result: {
                        isCorrect: true,
                        nextState: '',
                        feedback: '正确！紧急情况需要资深人员快速处理。',
                        reward: { score: 200, unlockRule: 'rule_priority' },
                        endOrder: true
                    }
                },
                {
                    id: 'choice_003_1_b',
                    text: '派普通电工去看看',
                    result: {
                        isCorrect: false,
                        nextState: 'stage_003_1',
                        feedback: '错误！这是设备问题，且紧急情况需要资深人员。',
                        penalty: {
                            scoreDeduction: 50,
                            errorType: 'PRIORITY_VIOLATION',
                            description: '紧急工单处理不当',
                            requiresReview: true
                        }
                    }
                },
                {
                    id: 'choice_003_1_c',
                    text: '先确认情况再决定',
                    result: {
                        isCorrect: false,
                        nextState: 'stage_003_1',
                        feedback: '错误！紧急情况需要立即处理，不能拖延。',
                        penalty: {
                            scoreDeduction: 40,
                            errorType: 'DELAYED_RESPONSE',
                            description: '紧急工单响应延迟',
                            requiresReview: true
                        }
                    }
                }
            ]
        }
    ];

    order.correctPath = ['choice_003_1_a'];

    order.commonErrors = [
        {
            scoreDeduction: 50,
            errorType: 'PRIORITY_VIOLATION',
            description: '紧急工单处理不当',
            requiresReview: true
        },
        {
            scoreDeduction: 40,
            errorType: 'DELAYED_RESPONSE',
            description: '紧急工单响应延迟',
            requiresReview: true
        }
    ];

    return order;
})();

export const SAMPLE_ORDERS: IRepairOrder[] = [lightBulbOrder, waterLeakOrder, elevatorOrder];

export function getOrderById(id: string): IRepairOrder | undefined {
    return SAMPLE_ORDERS.find(o => o.id === id);
}

export function getOrdersForLevel(levelId: number): IRepairOrder[] {
    switch (levelId) {
        case 1:
            return [lightBulbOrder];
        case 2:
            return [lightBulbOrder, waterLeakOrder];
        case 3:
            return [lightBulbOrder, waterLeakOrder, elevatorOrder];
        default:
            return SAMPLE_ORDERS;
    }
}
