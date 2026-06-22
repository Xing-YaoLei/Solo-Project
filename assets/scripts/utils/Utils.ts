export function formatNumber(num: number, decimals: number = 0): string {
    return num.toFixed(decimals);
}

export function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}小时${remainingMinutes}分${remainingSeconds}秒`;
    } else if (minutes > 0) {
        return `${minutes}分${remainingSeconds}秒`;
    } else {
        return `${remainingSeconds}秒`;
    }
}

export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

export function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
}

export function getGradeByScore(score: number, maxScore: number): string {
    const percentage = calculatePercentage(score, maxScore);
    if (percentage >= 90) return 'S';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'D';
}

export function getGradeColor(grade: string): string {
    switch (grade) {
        case 'S': return '#FFD700';
        case 'A': return '#00FF00';
        case 'B': return '#00BFFF';
        case 'C': return '#FFA500';
        default: return '#FF6347';
    }
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return function (this: any, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return function (this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

export function storageSet(key: string, value: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to set storage item:', key, e);
    }
}

export function storageGet<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
    } catch (e) {
        console.error('Failed to get storage item:', key, e);
        return defaultValue;
    }
}

export function storageRemove(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Failed to remove storage item:', key, e);
    }
}
