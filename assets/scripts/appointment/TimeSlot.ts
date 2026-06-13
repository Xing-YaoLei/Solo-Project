export interface ServiceData {
    id: string;
    name: string;
    durationMinutes: number;
    category: string;
}

export enum SlotStatus {
    AVAILABLE = "available",
    OCCUPIED = "occupied",
    CONFLICT = "conflict",
    BUFFER = "buffer",
    RESERVED = "reserved"
}

export class TimeSlot {
    stationIndex: number = 0;
    time: string = "";
    endTime: string = "";
    status: SlotStatus = SlotStatus.AVAILABLE;
    customerId: string = "";
    serviceId: string = "";
    durationMinutes: number = 60;
    conflictHintShown: boolean = false;

    get key(): string {
        return `${this.stationIndex}_${this.time}`;
    }

    static timeToMinutes(time: string): number {
        const parts = time.split(":");
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    static minutesToTime(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }

    overlaps(other: TimeSlot): boolean {
        const thisStart = TimeSlot.timeToMinutes(this.time);
        const thisEnd = thisStart + this.durationMinutes;
        const otherStart = TimeSlot.timeToMinutes(other.time);
        const otherEnd = otherStart + other.durationMinutes;
        return thisStart < otherEnd && otherStart < thisEnd;
    }

    isAvailable(): boolean {
        return this.status === SlotStatus.AVAILABLE;
    }

    clone(): TimeSlot {
        const s = new TimeSlot();
        s.stationIndex = this.stationIndex;
        s.time = this.time;
        s.endTime = this.endTime;
        s.status = this.status;
        s.customerId = this.customerId;
        s.serviceId = this.serviceId;
        s.durationMinutes = this.durationMinutes;
        s.conflictHintShown = this.conflictHintShown;
        return s;
    }
}
