import {
    IWorker,
    IDispatchRule,
    IDispatchContext,
    IDispatchRuleResult,
    IDispatchRecommendation,
    ITimeLimitConfig,
    calculateOrderTimeLimit,
    DEFAULT_TIME_LIMIT_CONFIG,
    TIME_PENALTIES
} from './DispatchTypes';
import { IRepairOrder, RepairCategory, OrderPriority } from './OrderTypes';
import { EventManager, GameEventType } from '../core/EventManager';
import { SaveManager } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export class DispatchRuleManager {
    private static instance: DispatchRuleManager;
    private workers: Map<string, IWorker> = new Map();
    private rules: Map<string, IDispatchRule> = new Map();
    private timeLimitConfig: ITimeLimitConfig;
    private eventManager: EventManager;
    private saveManager: SaveManager;

    private constructor() {
        this.eventManager = EventManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.timeLimitConfig = { ...DEFAULT_TIME_LIMIT_CONFIG };
        this.initializeDefaultRules();
    }

    public static getInstance(): DispatchRuleManager {
        if (!DispatchRuleManager.instance) {
            DispatchRuleManager.instance = new DispatchRuleManager();
        }
        return DispatchRuleManager.instance;
    }

    private initializeDefaultRules(): void {
        const skillMatchRule: IDispatchRule = {
            id: 'rule_skill_match',
            name: '技能匹配规则',
            description: '维修人员必须具备处理该类工单的技能',
            isActive: true,
            isUnlocked: true,
            unlockLevel: 1,
            priority: 100,
            checkRule: (order: IRepairOrder, worker: IWorker): IDispatchRuleResult => {
                const hasSkill = worker.skills.includes(order.category);
                return {
                    isValid: hasSkill,
                    score: hasSkill ? 30 : 0,
                    reason: hasSkill ? '技能匹配' : '缺少必要技能',
                    penalty: hasSkill ? 0 : 50
                };
            }
        };

        const loadRule: IDispatchRule = {
            id: 'rule_workload',
            name: '工作量规则',
            description: '优先派单给工作量较低的维修人员',
            isActive: true,
            isUnlocked: true,
            unlockLevel: 1,
            priority: 80,
            checkRule: (order: IRepairOrder, worker: IWorker): IDispatchRuleResult => {
                const loadRatio = worker.currentLoad / worker.maxLoad;
                const isValid = worker.currentLoad < worker.maxLoad;
                const score = isValid ? Math.floor((1 - loadRatio) * 25) : 0;
                return {
                    isValid,
                    score,
                    reason: isValid ? `工作量合适 (${worker.currentLoad}/${worker.maxLoad})` : '维修人员已满负荷',
                    penalty: isValid ? 0 : 30
                };
            }
        };

        const skillLevelRule: IDispatchRule = {
            id: 'rule_skill_level',
            name: '技能等级规则',
            description: '优先派单给技能等级更高的维修人员',
            isActive: true,
            isUnlocked: false,
            unlockLevel: 2,
            priority: 70,
            checkRule: (order: IRepairOrder, worker: IWorker): IDispatchRuleResult => {
                const level = worker.skillLevel.get(order.category) || 0;
                return {
                    isValid: level > 0,
                    score: level * 10,
                    reason: `技能等级: ${level}`,
                    penalty: 0
                };
            }
        };

        const priorityRule: IDispatchRule = {
            id: 'rule_priority',
            name: '优先级规则',
            description: '紧急工单必须派给资深维修人员',
            isActive: true,
            isUnlocked: false,
            unlockLevel: 3,
            priority: 90,
            checkRule: (order: IRepairOrder, worker: IWorker): IDispatchRuleResult => {
                if (order.priority === 'urgent' || order.priority === 'high') {
                    const level = worker.skillLevel.get(order.category) || 0;
                    const isValid = level >= 2;
                    return {
                        isValid,
                        score: isValid ? 20 : 0,
                        reason: isValid ? '高优先级工单派给资深人员' : '高优先级工单需资深人员处理',
                        penalty: isValid ? 0 : 40
                    };
                }
                return { isValid: true, score: 5, reason: '普通优先级', penalty: 0 };
            }
        };

        const availabilityRule: IDispatchRule = {
            id: 'rule_availability',
            name: '可用性规则',
            description: '必须派单给当前可用的维修人员',
            isActive: true,
            isUnlocked: false,
            unlockLevel: 2,
            priority: 95,
            checkRule: (order: IRepairOrder, worker: IWorker): IDispatchRuleResult => {
                return {
                    isValid: worker.isAvailable,
                    score: worker.isAvailable ? 15 : 0,
                    reason: worker.isAvailable ? '维修人员可用' : '维修人员不可用',
                    penalty: worker.isAvailable ? 0 : 60
                };
            }
        };

        this.rules.set(skillMatchRule.id, skillMatchRule);
        this.rules.set(loadRule.id, loadRule);
        this.rules.set(skillLevelRule.id, skillLevelRule);
        this.rules.set(priorityRule.id, priorityRule);
        this.rules.set(availabilityRule.id, availabilityRule);
    }

    public addWorker(worker: IWorker): void {
        this.workers.set(worker.id, worker);
    }

    public removeWorker(workerId: string): boolean {
        return this.workers.delete(workerId);
    }

    public getWorker(workerId: string): IWorker | undefined {
        return this.workers.get(workerId);
    }

    public getAllWorkers(): IWorker[] {
        return Array.from(this.workers.values());
    }

    public getAvailableWorkers(category?: RepairCategory): IWorker[] {
        let workers = Array.from(this.workers.values()).filter(w => w.isAvailable);
        if (category) {
            workers = workers.filter(w => w.skills.includes(category));
        }
        return workers;
    }

    public getRule(ruleId: string): IDispatchRule | undefined {
        return this.rules.get(ruleId);
    }

    public getAllRules(): IDispatchRule[] {
        return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
    }

    public getActiveRules(): IDispatchRule[] {
        return this.getAllRules().filter(r => r.isActive && r.isUnlocked);
    }

    public getUnlockedRules(): IDispatchRule[] {
        return this.getAllRules().filter(r => r.isUnlocked);
    }

    public unlockRule(ruleId: string): boolean {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            Logger.warn(`规则不存在: ${ruleId}`);
            return false;
        }
        if (rule.isUnlocked) {
            return true;
        }
        rule.isUnlocked = true;
        this.saveManager.unlockRule(ruleId);
        this.eventManager.emit(GameEventType.RULE_UNLOCKED, { ruleId, rule });
        Logger.info(`规则已解锁: ${rule.name}`);
        return true;
    }

    public activateRule(ruleId: string, isActive: boolean = true): boolean {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.isUnlocked) {
            return false;
        }
        rule.isActive = isActive;
        return true;
    }

    public checkUnlocksForLevel(levelId: number): string[] {
        const newlyUnlocked: string[] = [];
        this.rules.forEach(rule => {
            if (!rule.isUnlocked && rule.unlockLevel <= levelId) {
                if (this.unlockRule(rule.id)) {
                    newlyUnlocked.push(rule.id);
                }
            }
        });
        return newlyUnlocked;
    }

    public evaluateWorker(
        order: IRepairOrder,
        worker: IWorker,
        context: IDispatchContext
    ): { totalScore: number; violations: string[]; rules: IDispatchRuleResult[] } {
        let totalScore = 0;
        const violations: string[] = [];
        const ruleResults: IDispatchRuleResult[] = [];

        for (const rule of this.getActiveRules()) {
            const result = rule.checkRule(order, worker, context);
            ruleResults.push(result);
            
            if (!result.isValid) {
                violations.push(rule.name + ': ' + (result.reason || '不满足条件'));
            }
            
            totalScore += result.score;
        }

        return { totalScore, violations, rules: ruleResults };
    }

    public getDispatchRecommendations(order: IRepairOrder): IDispatchRecommendation[] {
        const context: IDispatchContext = {
            availableWorkers: this.getAllWorkers(),
            activeOrders: [],
            currentTime: Date.now(),
            activeRuleIds: this.getActiveRules().map(r => r.id)
        };

        const recommendations: IDispatchRecommendation[] = [];
        let maxScore = 0;

        this.getAllWorkers().forEach(worker => {
            const evaluation = this.evaluateWorker(order, worker, context);
            const isRecommended = evaluation.violations.length === 0;
            
            recommendations.push({
                workerId: worker.id,
                workerName: worker.name,
                matchScore: evaluation.totalScore,
                ruleViolations: evaluation.violations,
                isRecommended,
                estimatedTime: this.estimateCompletionTime(order, worker)
            });

            if (evaluation.totalScore > maxScore) {
                maxScore = evaluation.totalScore;
            }
        });

        recommendations.forEach(rec => {
            if (maxScore > 0) {
                rec.matchScore = Math.round((rec.matchScore / maxScore) * 100);
            }
        });

        return recommendations.sort((a, b) => {
            if (a.isRecommended !== b.isRecommended) {
                return a.isRecommended ? -1 : 1;
            }
            return b.matchScore - a.matchScore;
        });
    }

    public validateDispatch(
        orderId: string,
        order: IRepairOrder,
        workerId: string
    ): { isValid: boolean; violations: string[]; penalty: number } {
        const worker = this.workers.get(workerId);
        if (!worker) {
            return { isValid: false, violations: ['维修人员不存在'], penalty: 100 };
        }

        const context: IDispatchContext = {
            availableWorkers: this.getAllWorkers(),
            activeOrders: [],
            currentTime: Date.now(),
            activeRuleIds: this.getActiveRules().map(r => r.id)
        };

        const evaluation = this.evaluateWorker(order, worker, context);
        let totalPenalty = 0;

        for (const rule of this.getActiveRules()) {
            const result = rule.checkRule(order, worker, context);
            if (!result.isValid && result.penalty) {
                totalPenalty += result.penalty;
            }
        }

        if (evaluation.violations.length > 0) {
            this.eventManager.emit(GameEventType.REVIEW_FAILED, {
                orderId,
                errorType: 'DISPATCH_VIOLATION',
                description: evaluation.violations.join('; ')
            });
        }

        return {
            isValid: evaluation.violations.length === 0,
            violations: evaluation.violations,
            penalty: totalPenalty
        };
    }

    private estimateCompletionTime(order: IRepairOrder, worker: IWorker): number {
        const baseTime = order.timeLimit;
        const skillLevel = worker.skillLevel.get(order.category) || 1;
        const efficiency = worker.efficiency;
        const loadFactor = 1 + (worker.currentLoad / worker.maxLoad) * 0.3;
        return Math.floor((baseTime / skillLevel / efficiency) * loadFactor);
    }

    public assignWorker(orderId: string, workerId: string): boolean {
        const worker = this.workers.get(workerId);
        if (!worker) return false;
        
        worker.currentLoad++;
        worker.currentOrderId = orderId;
        if (worker.currentLoad >= worker.maxLoad) {
            worker.isAvailable = false;
        }
        return true;
    }

    public releaseWorker(workerId: string): boolean {
        const worker = this.workers.get(workerId);
        if (!worker) return false;
        
        worker.currentLoad = Math.max(0, worker.currentLoad - 1);
        worker.currentOrderId = undefined;
        if (worker.currentLoad < worker.maxLoad) {
            worker.isAvailable = true;
        }
        return true;
    }

    public calculateTimeLimit(order: IRepairOrder): number {
        return calculateOrderTimeLimit(order, this.timeLimitConfig);
    }

    public setTimeLimitConfig(config: Partial<ITimeLimitConfig>): void {
        this.timeLimitConfig = { ...this.timeLimitConfig, ...config };
    }

    public getTimeLimitConfig(): ITimeLimitConfig {
        return { ...this.timeLimitConfig };
    }

    public checkTimePenalties(order: IRepairOrder, elapsedTime: number) {
        return TIME_PENALTIES.find(p => elapsedTime / order.timeLimit >= p.threshold) || null;
    }

    public resetWorkers(): void {
        this.workers.forEach(worker => {
            worker.currentLoad = 0;
            worker.currentOrderId = undefined;
            worker.isAvailable = true;
        });
    }

    public clearAll(): void {
        this.workers.clear();
    }
}
