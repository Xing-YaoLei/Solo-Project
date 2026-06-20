import { TicketType, TicketRule } from './GameTypes';

export const TICKET_RULES_BASIC: TicketRule[] = [
    {
        id: 'rule_vip',
        ticketType: TicketType.VIP,
        name: 'VIP票',
        description: 'VIP专属区域，包含专属通道和纪念品',
        basePrice: 1280,
        maxPerOrder: 2,
        sections: ['VIP_A', 'VIP_B'],
        requirements: {
            idRequired: true
        },
        refundPolicy: {
            refundable: true,
            deadlineHours: 72,
            feePercentage: 10
        },
        exchangeAllowed: true
    },
    {
        id: 'rule_premium',
        ticketType: TicketType.PREMIUM,
        name: '高级票',
        description: '视野较好的中间区域',
        basePrice: 680,
        maxPerOrder: 4,
        sections: ['PREMIUM_A', 'PREMIUM_B', 'PREMIUM_C'],
        requirements: {
            idRequired: true
        },
        refundPolicy: {
            refundable: true,
            deadlineHours: 48,
            feePercentage: 15
        },
        exchangeAllowed: false
    },
    {
        id: 'rule_standard',
        ticketType: TicketType.STANDARD,
        name: '标准票',
        description: '普通观看区域',
        basePrice: 280,
        maxPerOrder: 6,
        sections: ['STANDARD_A', 'STANDARD_B', 'STANDARD_C', 'STANDARD_D'],
        requirements: {
            idRequired: false
        },
        refundPolicy: {
            refundable: false,
            deadlineHours: 0,
            feePercentage: 0
        },
        exchangeAllowed: false
    },
    {
        id: 'rule_student',
        ticketType: TicketType.STUDENT,
        name: '学生票',
        description: '凭有效学生证购买，价格优惠',
        basePrice: 180,
        maxPerOrder: 1,
        sections: ['STANDARD_A', 'STANDARD_B'],
        requirements: {
            idRequired: true,
            studentIdRequired: true,
            ageLimit: { min: 12, max: 26 }
        },
        refundPolicy: {
            refundable: true,
            deadlineHours: 24,
            feePercentage: 20
        },
        exchangeAllowed: false
    },
    {
        id: 'rule_group',
        ticketType: TicketType.GROUP,
        name: '团体票',
        description: '10人及以上团体票，享受折扣',
        basePrice: 220,
        maxPerOrder: 30,
        sections: ['STANDARD_C', 'STANDARD_D'],
        requirements: {
            idRequired: true,
            groupSizeMinimum: 10
        },
        refundPolicy: {
            refundable: true,
            deadlineHours: 168,
            feePercentage: 5
        },
        exchangeAllowed: true
    }
];

export function validateTicketSelection(
    rule: TicketRule,
    quantity: number,
    hasId: boolean,
    hasStudentId: boolean = false,
    groupSize: number = 0,
    customerAge: number = 0
): { valid: boolean; reason?: string } {
    if (quantity > rule.maxPerOrder) {
        return {
            valid: false,
            reason: `${rule.name}每个订单最多购买${rule.maxPerOrder}张`
        };
    }

    if (rule.requirements.idRequired && !hasId) {
        return {
            valid: false,
            reason: `${rule.name}需要出示身份证件`
        };
    }

    if (rule.requirements.studentIdRequired && !hasStudentId) {
        return {
            valid: false,
            reason: `学生票需要出示有效学生证`
        };
    }

    if (rule.requirements.ageLimit) {
        if (customerAge < rule.requirements.ageLimit.min ||
            customerAge > rule.requirements.ageLimit.max) {
            return {
                valid: false,
                reason: `${rule.name}年龄限制：${rule.requirements.ageLimit.min}-${rule.requirements.ageLimit.max}岁`
            };
        }
    }

    if (rule.requirements.groupSizeMinimum) {
        if (groupSize < rule.requirements.groupSizeMinimum) {
            return {
                valid: false,
                reason: `团体票最少需要${rule.requirements.groupSizeMinimum}人`
            };
        }
    }

    return { valid: true };
}
