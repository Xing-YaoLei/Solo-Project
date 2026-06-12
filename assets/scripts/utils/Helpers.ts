export function formatNumber(num: number, decimals: number = 0): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(decimals) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
}

export function formatCurrency(amount: number): string {
    return '¥' + amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

export function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${formatDate(timestamp)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
    if (obj instanceof Map) return new Map(Array.from(obj, ([k, v]) => [deepClone(k), deepClone(v)])) as any;
    if (obj instanceof Set) return new Set(Array.from(obj, v => deepClone(v))) as any;

    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            (cloned as any)[key] = deepClone((obj as any)[key]);
        }
    }
    return cloned;
}

export function calculateTurnoverDays(totalUsage: number, averageStock: number): number {
    if (averageStock <= 0) return 0;
    if (totalUsage <= 0) return 999;
    return (averageStock * 30) / totalUsage;
}

export function calculateAccuracy(correct: number, total: number): number {
    if (total <= 0) return 100;
    return (correct / total) * 100;
}
