export class TimeSlot {
    public startTime: number;
    public endTime: number;
    public capacity: number;
    public bookedCount: number;

    constructor(startTime: number, endTime: number, capacity: number) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.capacity = capacity;
        this.bookedCount = 0;
    }

    public getAvailableSlots(): number {
        return this.capacity - this.bookedCount;
    }

    public hasCapacity(count: number = 1): boolean {
        return this.bookedCount + count <= this.capacity;
    }

    public overlapsWith(other: TimeSlot): boolean {
        return this.startTime < other.endTime && this.endTime > other.startTime;
    }

    public containsTime(time: number): boolean {
        return time >= this.startTime && time < this.endTime;
    }

    public formatTime(): string {
        const format = (t: number) => {
            const hours = Math.floor(t / 60);
            const minutes = t % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };
        return `${format(this.startTime)} - ${format(this.endTime)}`;
    }
}
