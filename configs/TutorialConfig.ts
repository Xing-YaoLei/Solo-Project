export interface ITutorialStep {
    id: string;
    title: string;
    description: string;
    highlightElement?: string;
    position?: {
        x: string;
        y: string;
    };
    arrow?: 'up' | 'down' | 'left' | 'right';
    actionType: 'click' | 'observe' | 'read' | 'select';
    targetElement?: string;
    canSkip: boolean;
    autoAdvance: boolean;
    autoAdvanceDelay?: number;
    nextButtonText?: string;
    previousButtonText?: string;
    ruleToExplain?: string;
    showExample?: boolean;
    exampleContent?: string;
}

export interface ITutorial {
    id: string;
    name: string;
    description: string;
    steps: ITutorialStep[];
    isMandatory: boolean;
    targetLevel?: number;
    relatedRules: string[];
}

export const TUTORIAL_DISPATCH_BASICS: ITutorial = {
    id: 'tutorial_dispatch_basics',
    name: '派单基础教程',
    description: '学习如何接收和处理报修工单',
    isMandatory: true,
    targetLevel: 1,
    relatedRules: ['rule_skill_match', 'rule_workload'],
    steps: [
        {
            id: 'tut_1_1',
            title: '欢迎来到物业维修中心！',
            description: '你将扮演一名物业调度员，负责接收业主的报修工单，并派给合适的维修人员。让我们开始吧！',
            actionType: 'read',
            canSkip: true,
            autoAdvance: false,
            nextButtonText: '开始学习'
        },
        {
            id: 'tut_1_2',
            title: '查看工单',
            description: '当有新的报修时，工单会出现在左侧列表中。点击工单可以查看详细信息。',
            highlightElement: 'order-list',
            position: { x: 'left', y: 'center' },
            arrow: 'right',
            actionType: 'observe',
            canSkip: true,
            autoAdvance: true,
            autoAdvanceDelay: 3000
        },
        {
            id: 'tut_1_3',
            title: '工单信息',
            description: '每个工单包含：问题类型、优先级、位置、业主描述等信息。注意看优先级，紧急工单需要优先处理！',
            highlightElement: 'order-detail',
            position: { x: 'center', y: 'top' },
            actionType: 'read',
            canSkip: true,
            autoAdvance: false,
            nextButtonText: '明白了',
            ruleToExplain: 'rule_priority'
        },
        {
            id: 'tut_1_4',
            title: '第一条规则：技能匹配',
            description: '维修人员各有所长。电工处理电力问题，水暖工处理水管问题。派单时要选择技能匹配的人员！',
            highlightElement: 'worker-panel',
            position: { x: 'right', y: 'center' },
            arrow: 'left',
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '了解技能匹配',
            ruleToExplain: 'rule_skill_match',
            showExample: true,
            exampleContent: '例如：灯泡不亮 → 电工；水管漏水 → 水暖工'
        },
        {
            id: 'tut_1_5',
            title: '第二条规则：工作量',
            description: '注意查看维修人员的工作量，已排满的人员就不要继续派单了，要合理分配工作！',
            highlightElement: 'workload-indicator',
            position: { x: 'right', y: 'center' },
            arrow: 'left',
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '了解工作量',
            ruleToExplain: 'rule_workload',
            showExample: true,
            exampleContent: '工作量显示：2/3 表示当前已接2单，最多接3单'
        },
        {
            id: 'tut_1_6',
            title: '线索系统',
            description: '查看工单时可以发现隐藏线索。线索能帮助你做出更好的决策！',
            highlightElement: 'clue-panel',
            position: { x: 'center', y: 'bottom' },
            arrow: 'up',
            actionType: 'read',
            canSkip: true,
            autoAdvance: false,
            nextButtonText: '了解线索'
        },
        {
            id: 'tut_1_7',
            title: '做出选择',
            description: '在处理工单过程中，你需要做出选择。正确的选择会获得奖励，错误的选择会被扣分。',
            highlightElement: 'choice-panel',
            position: { x: 'center', y: 'center' },
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '开始实践！'
        },
        {
            id: 'tut_1_8',
            title: '时间限制',
            description: '每个工单都有时间限制，超时会被扣分。注意查看右上角的倒计时！',
            highlightElement: 'timer-display',
            position: { x: 'right', y: 'top' },
            arrow: 'down',
            actionType: 'read',
            canSkip: true,
            autoAdvance: false,
            nextButtonText: '准备好了！'
        }
    ]
};

export const TUTORIAL_ADVANCED_RULES: ITutorial = {
    id: 'tutorial_advanced_rules',
    name: '进阶派单规则',
    description: '学习技能等级和优先级规则',
    isMandatory: false,
    targetLevel: 2,
    relatedRules: ['rule_skill_level', 'rule_priority', 'rule_availability'],
    steps: [
        {
            id: 'tut_2_1',
            title: '进阶规则解锁！',
            description: '恭喜你完成了基础训练！现在解锁更多派单规则。',
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '学习新规则'
        },
        {
            id: 'tut_2_2',
            title: '技能等级',
            description: '同类型的维修人员也有等级之分。资深人员(等级2-3)处理问题更快更好，适合处理高难度工单。',
            highlightElement: 'skill-level',
            position: { x: 'right', y: 'center' },
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '了解技能等级',
            ruleToExplain: 'rule_skill_level',
            showExample: true,
            exampleContent: '⭐ 等级1：新手 | ⭐⭐ 等级2：熟练 | ⭐⭐⭐ 等级3：资深'
        },
        {
            id: 'tut_2_3',
            title: '优先级规则',
            description: '高优先级或紧急工单必须派给资深维修人员(等级2以上)。普通工单可以派给新手积累经验。',
            highlightElement: 'priority-badge',
            position: { x: 'left', y: 'center' },
            arrow: 'right',
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '了解优先级',
            ruleToExplain: 'rule_priority',
            showExample: true,
            exampleContent: '🔴 紧急/🟠 高 → 资深人员 | 🟡 中/🟢 低 → 任意人员'
        },
        {
            id: 'tut_2_4',
            title: '可用性检查',
            description: '派单前确认维修人员当前是否可用。处理其他工单的人员暂时不可接新单。',
            highlightElement: 'availability-status',
            position: { x: 'right', y: 'center' },
            actionType: 'read',
            canSkip: false,
            autoAdvance: false,
            nextButtonText: '开始挑战！',
            ruleToExplain: 'rule_availability'
        }
    ]
};

export const ALL_TUTORIALS: ITutorial[] = [
    TUTORIAL_DISPATCH_BASICS,
    TUTORIAL_ADVANCED_RULES
];

export function getTutorialById(id: string): ITutorial | undefined {
    return ALL_TUTORIALS.find(t => t.id === id);
}

export function getTutorialsForLevel(levelId: number): ITutorial[] {
    return ALL_TUTORIALS.filter(t => !t.targetLevel || t.targetLevel <= levelId);
}
