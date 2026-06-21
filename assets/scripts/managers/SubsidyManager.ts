import { _decorator, Component } from 'cc';
import { Order, SubsidyRule, WrongStep } from '../types/GameTypes';
import { SUBSIDY_RULES, COMPENSATION_RULES } from '../config/GameConfig';

const { ccclass } = _decorator;

@ccclass('SubsidyManager')
export class SubsidyManager extends Component {
    private activeSubsidies: Map<string, SubsidyRule> = new Map();
    private subsidyHistory: Array<{
        orderId: string;
        subsidyId: string;
        amount: number;
        time: number;
    }> = [];

    onLoad() {
        this.loadDefaultSubsidies();
    }

    private loadDefaultSubsidies() {
        SUBSIDY_RULES.forEach(rule => {
            if (rule.active) {
                this.activeSubsidies.set(rule.id, rule);
            }
        });
    }

    setActiveSubsidies(subsidyIds: string[]) {
        this.activeSubsidies.clear();
        subsidyIds.forEach(id => {
            const rule = SUBSIDY_RULES.find(r => r.id === id);
            if (rule) {
                this.activeSubsidies.set(id, rule);
            }
        });
    }

    toggleSubsidy(subsidyId: string): boolean {
        const rule = SUBSIDY_RULES.find(r => r.id === subsidyId);
        if (!rule) return false;

        if (this.activeSubsidies.has(subsidyId)) {
            this.activeSubsidies.delete(subsidyId);
            return false;
        } else {
            this.activeSubsidies.set(subsidyId, rule);
            return true;
        }
    }

    calculateSubsidy(order: Order, currentTime: number, weather: string): number {
        let totalSubsidy = 0;
        const currentMinute = (currentTime % 86400) / 60;

        this.activeSubsidies.forEach(rule => {
            if (!this.checkCondition(rule, order, currentMinute, weather)) return;

            let amount = 0;
            switch (rule.subsidyType) {
                case 'per_order':
                    amount = rule.value;
                    break;
                case 'distance_multiplier':
                    amount = Math.floor(order.distance * rule.value / 1000);
                    break;
                case 'time_bonus':
                    amount = rule.value;
                    break;
            }

            totalSubsidy += amount;
            this.subsidyHistory.push({
                orderId: order.id,
                subsidyId: rule.id,
                amount,
                time: Date.now(),
            });
        });

        return totalSubsidy;
    }

    private checkCondition(
        rule: SubsidyRule,
        order: Order,
        currentMinute: number,
        weather: string
    ): boolean {
        const cond = rule.condition;

        if (cond.timeRange) {
            const [start, end] = cond.timeRange;
            if (currentMinute < start || currentMinute > end) return false;
        }

        if (cond.minDistance !== undefined && order.distance < cond.minDistance) {
            return false;
        }

        if (cond.maxDistance !== undefined && order.distance > cond.maxDistance) {
            return false;
        }

        if (cond.priority && order.priority !== cond.priority) {
            return false;
        }

        if (cond.weather && weather !== cond.weather) {
            return false;
        }

        return true;
    }

    calculateCompensation(
        order: Order,
        wrongSteps: WrongStep[],
        actualDeliveryTime?: number
    ): {
        total: number;
        breakdown: Array<{ type: string; amount: number; reason: string }>;
    } {
        const breakdown: Array<{ type: string; amount: number; reason: string }> = [];
        let total = 0;

        if (actualDeliveryTime && actualDeliveryTime > order.expectedTime) {
            const lateMinutes = Math.ceil((actualDeliveryTime - order.expectedTime) / 60);
            const rule = COMPENSATION_RULES.late_delivery;
            const amount = Math.min(rule.max, rule.base + lateMinutes * rule.perMinute);
            breakdown.push({
                type: 'late_delivery',
                amount,
                reason: `超时 ${lateMinutes} 分钟`,
            });
            total += amount;
        }

        wrongSteps.forEach(step => {
            if (step.type === 'address') {
                const rule = COMPENSATION_RULES.wrong_address;
                breakdown.push({
                    type: 'wrong_address',
                    amount: rule.base,
                    reason: step.description,
                });
                total += rule.base;
            } else if (step.type === 'rider') {
                const rule = COMPENSATION_RULES.rider_rejection;
                breakdown.push({
                    type: 'rider_rejection',
                    amount: rule.base,
                    reason: step.description,
                });
                total += rule.base;
            }
        });

        if (order.status === 'failed' || order.status === 'rejected') {
            const rule = COMPENSATION_RULES.order_cancel;
            breakdown.push({
                type: 'order_cancel',
                amount: rule.base,
                reason: order.failedReason || '订单取消',
            });
            total += rule.base;
        }

        return { total, breakdown };
    }

    checkSubsidyMisuse(
        order: Order,
        appliedSubsidyId: string,
        currentTime: number,
        weather: string
    ): WrongStep | null {
        const rule = this.activeSubsidies.get(appliedSubsidyId);
        if (!rule) {
            return {
                time: Date.now(),
                type: 'subsidy',
                description: `补贴 ${appliedSubsidyId} 未激活`,
                correctAction: '使用已激活的补贴规则',
                impact: { cost: 0, delay: 0, satisfaction: -5 },
            };
        }

        const currentMinute = (currentTime % 86400) / 60;
        if (!this.checkCondition(rule, order, currentMinute, weather)) {
            return {
                time: Date.now(),
                type: 'subsidy',
                description: `补贴 ${rule.name} 不满足使用条件`,
                correctAction: `检查订单是否满足: ${rule.description}`,
                impact: { cost: 5, delay: 0, satisfaction: -3 },
            };
        }

        return null;
    }

    getActiveSubsidies(): SubsidyRule[] {
        return Array.from(this.activeSubsidies.values());
    }

    getAllSubsidyRules(): SubsidyRule[] {
        return [...SUBSIDY_RULES];
    }

    getSubsidyStats(): Record<string, { used: number; saved: number }> {
        const stats: Record<string, { used: number; saved: number }> = {};

        this.subsidyHistory.forEach(record => {
            if (!stats[record.subsidyId]) {
                stats[record.subsidyId] = { used: 0, saved: 0 };
            }
            stats[record.subsidyId].used++;
            stats[record.subsidyId].saved += record.amount;
        });

        return stats;
    }

    clearHistory() {
        this.subsidyHistory = [];
    }
}
