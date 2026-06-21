export class ObjectPool<T> {
    private pool: T[] = [];
    private maxSize: number;
    private createFn: () => T;
    private resetFn: (obj: T) => void;

    constructor(
        createFn: () => T,
        resetFn: (obj: T) => void,
        initialSize: number = 10,
        maxSize: number = 50
    ) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }

    release(obj: T): void {
        this.resetFn(obj);
        if (this.pool.length < this.maxSize) {
            this.pool.push(obj);
        }
    }

    size(): number {
        return this.pool.length;
    }

    clear(): void {
        this.pool = [];
    }

    preallocate(count: number): void {
        const needed = Math.max(0, count - this.pool.length);
        for (let i = 0; i < needed; i++) {
            this.pool.push(this.createFn());
        }
    }
}

export class FastResetManager {
    private static instance: FastResetManager;
    private resetQueue: Array<() => void> = [];
    private isResetting: boolean = false;

    static getInstance(): FastResetManager {
        if (!FastResetManager.instance) {
            FastResetManager.instance = new FastResetManager();
        }
        return FastResetManager.instance;
    }

    registerResetHandler(handler: () => void): void {
        this.resetQueue.push(handler);
    }

    performFastReset(): Promise<void> {
        if (this.isResetting) return Promise.resolve();
        this.isResetting = true;

        return new Promise((resolve) => {
            setTimeout(() => {
                this.resetQueue.forEach(handler => {
                    try {
                        handler();
                    } catch (e) {
                        console.error('Reset handler error:', e);
                    }
                });

                this.isResetting = false;
                resolve();
            }, 0);
        });
    }

    getIsResetting(): boolean {
        return this.isResetting;
    }

    clearHandlers(): void {
        this.resetQueue = [];
    }
}

export class PerformanceMonitor {
    private frameTimes: number[] = [];
    private lastFrameTime: number = 0;
    private fps: number = 0;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;

    beginFrame(): void {
        const now = performance.now();
        this.lastFrameTime = now;
    }

    endFrame(): void {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.frameTimes.push(delta);

        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }

        this.frameCount++;
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount * 1000 / (now - this.lastFpsUpdate);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    getFPS(): number {
        return Math.round(this.fps);
    }

    getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    reset(): void {
        this.frameTimes = [];
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
    }
}
