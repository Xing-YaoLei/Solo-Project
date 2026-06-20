import { _decorator, Component, Node } from 'cc';
import {
    Order,
    OrderItem,
    OrderStatus,
    TicketType,
    LevelConfig,
    TicketRule,
    Seat
} from '../core/GameTypes';
import { SeatMapManager } from './SeatMapManager';
import { validateTicketSelection } from '../core/TicketRules';
const { ccclass } = _decorator;

export interface OrderProcessingResult {
    orderId: string;
    success: boolean;
    errors: string[];
    processedItems: number;
    correctRejection: boolean;
    validationDetails: {
        ruleChecks: Array<{
            ruleId: string;
            passed: boolean;
            message?: string;
        }>;
        seatChecks: Array<{
            seatId: string;
            valid: boolean;
            message?: string;
        }>;
    };
}

export interface OrderSuggestion {
    suggestedSeats: Seat[];
    valid: boolean;
    reasons: string[];
}

@ccclass('OrderProcessor')
export class OrderProcessor extends Component {
    private levelConfig: LevelConfig | null = null;
    private seatMapManager: SeatMapManager | null = null;
    private currentOrder: Order | null = null;

    init(config: LevelConfig, seatManager: SeatMapManager): void {
        this.levelConfig = config;
        this.seatMapManager = seatManager;
    }

    generateOrder(): Order {
        if (!this.levelConfig) {
            throw new Error('OrderProcessor未初始化');
        }

        const rules = this.levelConfig.ticketRules;
        const isComplex = Math.random() < this.levelConfig.complexOrdersChance;

        const customerNames = [
            '张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十',
            'Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry'
        ];

        const paymentMethods = ['微信支付', '支付宝', '信用卡', '借记卡', '现金'];

        const rule = this.selectRandomRule(rules, isComplex);
        const quantity = this.calculateQuantity(rule, isComplex);
        const availableSeats = this.seatMapManager?.getAvailableSeats(rule.ticketType) || [];

        const hasId = Math.random() > 0.15;
        const hasStudentId = rule.ticketType === TicketType.STUDENT ? Math.random() > 0.2 : Math.random() > 0.7;
        const groupSize = rule.ticketType === TicketType.GROUP ? quantity : Math.floor(Math.random() * 15) + 1;
        const customerAge = Math.floor(Math.random() * 50) + 12;

        const items: OrderItem[] = [];
        let totalPrice = 0;

        for (let i = 0; i < quantity; i++) {
            if (availableSeats.length > i) {
                const seat = availableSeats[i];
                const itemValid = this.validateItem(rule, seat, hasId, hasStudentId, groupSize, customerAge);
                items.push({
                    seatId: seat.id,
                    ticketType: rule.ticketType,
                    price: seat.price,
                    valid: itemValid.valid
                });
                totalPrice += seat.price;
            }
        }

        if (isComplex && Math.random() > 0.5) {
            const extraRule = this.selectRandomRule(rules.filter(r => r.ticketType !== rule.ticketType), false);
            const extraSeats = this.seatMapManager?.getAvailableSeats(extraRule.ticketType) || [];
            const extraQty = Math.min(Math.ceil(quantity / 2), extraSeats.length, extraRule.maxPerOrder);

            for (let i = 0; i < extraQty; i++) {
                if (extraSeats.length > i) {
                    const seat = extraSeats[i];
                    const itemValid = this.validateItem(extraRule, seat, hasId, hasStudentId, groupSize, customerAge);
                    items.push({
                        seatId: seat.id,
                        ticketType: extraRule.ticketType,
                        price: seat.price,
                        valid: itemValid.valid
                    });
                    totalPrice += seat.price;
                }
            }
        }

        const isDiscounted = Math.random() > 0.8;
        if (isDiscounted) {
            totalPrice *= 0.9;
        }

        const order: Order = {
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
            items,
            totalPrice: Math.round(totalPrice),
            createdAt: Date.now(),
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            status: OrderStatus.PENDING,
            requirements: {
                hasId,
                hasStudentId,
                groupSize,
                customerAge
            },
            isDiscounted
        };

        return order;
    }

    processOrder(order: Order, selectedSeatIds: string[]): OrderProcessingResult {
        const result: OrderProcessingResult = {
            orderId: order.id,
            success: false,
            errors: [],
            processedItems: 0,
            correctRejection: false,
            validationDetails: {
                ruleChecks: [],
                seatChecks: []
            }
        };

        if (!this.levelConfig || !this.seatMapManager) {
            result.errors.push('系统未初始化');
            return result;
        }

        const ruleMap = new Map<string, TicketRule>();
        for (const rule of this.levelConfig.ticketRules) {
            ruleMap.set(rule.ticketType, rule);
        }

        const selectedSeats = selectedSeatIds.map(id => this.seatMapManager!.getSeat(id)).filter(Boolean) as Seat[];

        if (order.items.length === 0) {
            result.errors.push('订单为空');
            return result;
        }

        if (selectedSeats.length !== order.items.length) {
            result.errors.push(`选择的座位数量(${selectedSeats.length})与订单要求(${order.items.length})不匹配`);
            return result;
        }

        let allItemsValid = true;
        let hasInvalidItem = false;

        for (let i = 0; i < order.items.length; i++) {
            const orderItem = order.items[i];
            const seat = selectedSeats[i];
            const rule = ruleMap.get(orderItem.ticketType);

            if (!rule) {
                allItemsValid = false;
                hasInvalidItem = true;
                result.validationDetails.ruleChecks.push({
                    ruleId: orderItem.ticketType,
                    passed: false,
                    message: '找不到对应票种规则'
                });
                continue;
            }

            const validation = validateTicketSelection(
                rule,
                1,
                order.requirements.hasId,
                order.requirements.hasStudentId || false,
                order.requirements.groupSize || 0,
                order.requirements.customerAge || 0
            );

            result.validationDetails.ruleChecks.push({
                ruleId: rule.id,
                passed: validation.valid,
                message: validation.reason
            });

            if (!validation.valid) {
                allItemsValid = false;
                hasInvalidItem = true;
                result.errors.push(validation.reason!);
            }

            if (seat) {
                if (seat.ticketType !== orderItem.ticketType) {
                    allItemsValid = false;
                    hasInvalidItem = true;
                    result.validationDetails.seatChecks.push({
                        seatId: seat.id,
                        valid: false,
                        message: `座位${seat.id}票种不匹配，期望${orderItem.ticketType}，实际${seat.ticketType}`
                    });
                    result.errors.push(`座位${seat.row + 1}排${seat.col + 1}座票种不符`);
                } else {
                    result.validationDetails.seatChecks.push({
                        seatId: seat.id,
                        valid: true
                    });
                }
            }
        }

        const shouldAccept = allItemsValid;
        const playerAccepted = selectedSeats.length > 0;

        if (shouldAccept && playerAccepted) {
            result.success = true;
            result.processedItems = order.items.length;
            order.status = OrderStatus.CONFIRMED;
            this.seatMapManager.markSeatsAsSold(selectedSeatIds);
        } else if (!shouldAccept && !playerAccepted) {
            result.success = true;
            result.correctRejection = true;
            order.status = OrderStatus.REJECTED;
        } else if (shouldAccept && !playerAccepted) {
            result.success = false;
            result.errors.push('有效订单被错误拒绝');
            order.status = OrderStatus.REJECTED;
        } else {
            result.success = false;
            if (!hasInvalidItem) {
                result.errors.push('订单验证失败，请检查规则');
            }
            order.status = OrderStatus.REJECTED;
        }

        return result;
    }

    suggestSeatsForOrder(order: Order): OrderSuggestion {
        const suggestion: OrderSuggestion = {
            suggestedSeats: [],
            valid: false,
            reasons: []
        };

        if (!this.seatMapManager || !this.levelConfig) {
            suggestion.reasons.push('系统未初始化');
            return suggestion;
        }

        const ticketTypeCounts = new Map<TicketType, number>();
        for (const item of order.items) {
            const count = ticketTypeCounts.get(item.ticketType) || 0;
            ticketTypeCounts.set(item.ticketType, count + 1);
        }

        let totalRequested = 0;
        let canFulfill = true;

        for (const [ticketType, count] of ticketTypeCounts) {
            totalRequested += count;
            const available = this.seatMapManager.getAvailableSeats(ticketType);

            if (available.length < count) {
                canFulfill = false;
                suggestion.reasons.push(`${this.getTicketTypeName(ticketType)}座位不足，需要${count}个，仅剩${available.length}个`);
                continue;
            }

            const selected = this.selectBestSeats(available, count);
            suggestion.suggestedSeats.push(...selected);
        }

        suggestion.valid = canFulfill;
        return suggestion;
    }

    private selectBestSeats(available: Seat[], count: number): Seat[] {
        const sorted = [...available].sort((a, b) => {
            const aScore = -a.row;
            const bScore = -b.row;
            if (aScore !== bScore) return aScore - bScore;
            return Math.abs(a.col - 7.5) - Math.abs(b.col - 7.5);
        });

        return sorted.slice(0, count);
    }

    private selectRandomRule(rules: TicketRule[], preferComplex: boolean): TicketRule {
        if (rules.length === 0) {
            return this.levelConfig!.ticketRules[0];
        }

        if (preferComplex) {
            const complex = rules.filter(r =>
                r.ticketType === TicketType.VIP ||
                r.ticketType === TicketType.STUDENT ||
                r.ticketType === TicketType.GROUP
            );
            if (complex.length > 0) {
                return complex[Math.floor(Math.random() * complex.length)];
            }
        }

        return rules[Math.floor(Math.random() * rules.length)];
    }

    private calculateQuantity(rule: TicketRule, isComplex: boolean): number {
        const max = Math.min(rule.maxPerOrder, isComplex ? 6 : 4);
        const min = rule.requirements.groupSizeMinimum || 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private validateItem(
        rule: TicketRule,
        seat: Seat,
        hasId: boolean,
        hasStudentId: boolean,
        groupSize: number,
        customerAge: number
    ): { valid: boolean; reason?: string } {
        if (seat.ticketType !== rule.ticketType) {
            return { valid: false, reason: '座位票种不匹配' };
        }
        return validateTicketSelection(rule, 1, hasId, hasStudentId, groupSize, customerAge);
    }

    private getTicketTypeName(type: TicketType): string {
        const names: Record<TicketType, string> = {
            [TicketType.VIP]: 'VIP票',
            [TicketType.PREMIUM]: '高级票',
            [TicketType.STANDARD]: '标准票',
            [TicketType.STUDENT]: '学生票',
            [TicketType.GROUP]: '团体票'
        };
        return names[type];
    }
}
