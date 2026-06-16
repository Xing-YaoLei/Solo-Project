export class ExpressionParser {
    private static _instance: ExpressionParser | null = null;

    public static get instance(): ExpressionParser {
        if (!ExpressionParser._instance) {
            ExpressionParser._instance = new ExpressionParser();
        }
        return ExpressionParser._instance;
    }

    public evaluate(expression: string, context: Record<string, any>): boolean {
        try {
            const safeContext = this.sanitizeContext(context);
            const func = this.createSafeFunction(expression);
            return func(safeContext);
        } catch (error) {
            console.error(`Error evaluating expression "${expression}":`, error);
            return false;
        }
    }

    public evaluateString(expression: string, context: Record<string, any>): string {
        try {
            const templateRegex = /\{\{([^}]+)\}\}/g;
            return expression.replace(templateRegex, (match, key) => {
                const value = this.getNestedValue(context, key.trim());
                return value !== undefined ? String(value) : match;
            });
        } catch (error) {
            console.error(`Error evaluating string template "${expression}":`, error);
            return expression;
        }
    }

    private createSafeFunction(expression: string): (context: Record<string, any>) => boolean {
        const safeExpression = this.sanitizeExpression(expression);
        return new Function('ctx', `
            "use strict";
            with(ctx) {
                return (${safeExpression});
            }
        `) as (context: Record<string, any>) => boolean;
    }

    private sanitizeExpression(expr: string): string {
        return expr
            .replace(/__proto__|constructor|prototype/g, '')
            .replace(/eval\(/g, '')
            .replace(/Function\(/g, '')
            .replace(/window|document|global/g, '');
    }

    private sanitizeContext(context: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const key in context) {
            if (context.hasOwnProperty(key) && key !== '__proto__' && key !== 'constructor') {
                const value = context[key];
                if (typeof value === 'object' && value !== null) {
                    result[key] = this.sanitizeContext(value);
                } else {
                    result[key] = value;
                }
            }
        }
        return result;
    }

    private getNestedValue(obj: Record<string, any>, path: string): any {
        return path.split('.').reduce((current, key) => {
            if (current && typeof current === 'object' && key in current) {
                return current[key];
            }
            return undefined;
        }, obj);
    }
}
