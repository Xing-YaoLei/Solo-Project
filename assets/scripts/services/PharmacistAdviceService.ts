import { ExpressionParser } from '../core/ExpressionParser';
import type { AdviceConfig } from '../data/LevelConfig';
import type { TaskConfig } from '../data/LevelConfig';

export interface EvaluatedAdvice {
    id: string;
    content: string;
    type: 'hint' | 'warning' | 'info';
    priority: number;
}

export class PharmacistAdviceService {
    private static _instance: PharmacistAdviceService | null = null;

    public static get instance(): PharmacistAdviceService {
        if (!PharmacistAdviceService._instance) {
            PharmacistAdviceService._instance = new PharmacistAdviceService();
        }
        return PharmacistAdviceService._instance;
    }

    public getAdviceForTask(task: TaskConfig, allAdvice: AdviceConfig[]): EvaluatedAdvice[] {
        const context = this.buildContext(task);
        const evaluated: EvaluatedAdvice[] = [];

        for (const advice of allAdvice) {
            try {
                const isMatch = ExpressionParser.instance.evaluate(advice.condition, context);
                if (isMatch) {
                    const content = ExpressionParser.instance.evaluateString(advice.content, context);
                    evaluated.push({
                        id: advice.id,
                        content,
                        type: advice.type,
                        priority: advice.priority
                    });
                }
            } catch (error) {
                console.error(`Error evaluating advice ${advice.id}:`, error);
            }
        }

        return evaluated.sort((a, b) => b.priority - a.priority);
    }

    private buildContext(task: TaskConfig): Record<string, any> {
        return {
            task: {
                id: task.id,
                description: task.description,
                prescription: { ...task.prescription },
                replenishmentOrder: { ...task.replenishmentOrder },
                insuranceRecord: { ...task.insuranceRecord },
                score: task.score,
                knowledgePoint: task.knowledgePoint
            },
            prescription: task.prescription,
            replenishment: task.replenishmentOrder,
            insurance: task.insuranceRecord
        };
    }

    public getAdviceTypeColor(type: 'hint' | 'warning' | 'info'): string {
        switch (type) {
            case 'warning': return '#FF9800';
            case 'hint': return '#4CAF50';
            case 'info': return '#2196F3';
            default: return '#999999';
        }
    }

    public getAdviceTypeIcon(type: 'hint' | 'warning' | 'info'): string {
        switch (type) {
            case 'warning': return '⚠️';
            case 'hint': return '💡';
            case 'info': return 'ℹ️';
            default: return '📝';
        }
    }
}
