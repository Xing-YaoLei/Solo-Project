import { LevelConfig, TicketType } from './GameTypes';
import { TICKET_RULES_BASIC } from './TicketRules';

export const LEVELS: LevelConfig[] = [
    {
        id: 1,
        name: '新手入门',
        description: '简单演唱会，只有标准票和高级票，订单节奏慢',
        difficulty: 'easy',
        duration: 120,
        venueName: '小型剧场',
        eventName: '民谣之夜演唱会',
        targetOrders: 15,
        maxErrors: 5,
        ticketRules: TICKET_RULES_BASIC.filter(r =>
            r.ticketType === TicketType.STANDARD || r.ticketType === TicketType.PREMIUM
        ),
        seatMapTiled: 'theater_small',
        orderSpawnRate: 8,
        complexOrdersChance: 0.1,
        rewardMultiplier: 1.0
    },
    {
        id: 2,
        name: '渐入佳境',
        description: '增加VIP票和学生票，订单复杂度增加',
        difficulty: 'easy',
        duration: 150,
        venueName: '中型体育馆',
        eventName: '摇滚音乐节',
        targetOrders: 25,
        maxErrors: 6,
        ticketRules: TICKET_RULES_BASIC.filter(r =>
            r.ticketType !== TicketType.GROUP
        ),
        seatMapTiled: 'stadium_medium',
        orderSpawnRate: 6,
        complexOrdersChance: 0.25,
        rewardMultiplier: 1.2
    },
    {
        id: 3,
        name: '票房热卖',
        description: '全票种开放，热门演唱会高峰时段',
        difficulty: 'normal',
        duration: 180,
        venueName: '大型体育场',
        eventName: '巨星巡回演唱会',
        targetOrders: 40,
        maxErrors: 7,
        ticketRules: [...TICKET_RULES_BASIC],
        seatMapTiled: 'stadium_large',
        orderSpawnRate: 5,
        complexOrdersChance: 0.4,
        rewardMultiplier: 1.5
    },
    {
        id: 4,
        name: '销售达人',
        description: '订单节奏加快，需要熟练掌握各种规则',
        difficulty: 'normal',
        duration: 180,
        venueName: '会展中心',
        eventName: '游戏动漫展',
        targetOrders: 55,
        maxErrors: 6,
        ticketRules: [...TICKET_RULES_BASIC],
        seatMapTiled: 'exhibition_center',
        orderSpawnRate: 4,
        complexOrdersChance: 0.5,
        rewardMultiplier: 1.8
    },
    {
        id: 5,
        name: '火爆预售',
        description: '预售首日，订单量巨大，考验判断力',
        difficulty: 'hard',
        duration: 200,
        venueName: '国家大剧院',
        eventName: '经典音乐剧首演',
        targetOrders: 70,
        maxErrors: 5,
        ticketRules: [...TICKET_RULES_BASIC],
        seatMapTiled: 'opera_house',
        orderSpawnRate: 3,
        complexOrdersChance: 0.6,
        rewardMultiplier: 2.2
    },
    {
        id: 6,
        name: '终极挑战',
        description: '最高难度，考验专业水平的终极关卡',
        difficulty: 'expert',
        duration: 240,
        venueName: '奥林匹克体育场',
        eventName: '世界杯开幕式',
        targetOrders: 100,
        maxErrors: 5,
        ticketRules: [...TICKET_RULES_BASIC],
        seatMapTiled: 'olympic_stadium',
        orderSpawnRate: 2.5,
        complexOrdersChance: 0.75,
        rewardMultiplier: 3.0
    }
];

export function getLevelById(id: number): LevelConfig | undefined {
    return LEVELS.find(l => l.id === id);
}

export function getLevelsByDifficulty(difficulty: string): LevelConfig[] {
    return LEVELS.filter(l => l.difficulty === difficulty);
}

export function getUnlockedLevels(completedLevels: number[]): LevelConfig[] {
    const sorted = [...LEVELS].sort((a, b) => a.id - b.id);
    const unlocked: LevelConfig[] = [];

    for (const level of sorted) {
        if (level.id === 1 || completedLevels.includes(level.id - 1)) {
            unlocked.push(level);
        }
    }

    return unlocked;
}
