import { ReservationStatus, ConflictType, ActionType } from './GameEnums';
import { Visitor } from './Visitor';
import { TimeSlot } from './TimeSlot';

export class RescheduleRecord {
    public id: string;
    public originalTimeSlot: TimeSlot;
    public newTimeSlot: TimeSlot | null;
    public reason: string;
    public operator: string;
    public timestamp: number;

    constructor(originalSlot: TimeSlot, reason: string, operator: string = 'system') {
        this.id = 'rs_' + Math.random().toString(36).substr(2, 9);
        this.originalTimeSlot = originalSlot;
        this.newTimeSlot = null;
        this.reason = reason;
        this.operator = operator;
        this.timestamp = Date.now();
    }
}

export class Reservation {
    public id: string;
    public visitor: Visitor;
    public timeSlot: TimeSlot;
    public scenicSpotId: string;
    public status: ReservationStatus;
    public conflicts: ConflictType[];
    public rescheduleRecords: RescheduleRecord[];
    public createdAt: number;
    public processedAt: number | null;
    public processedBy: string | null;
    public feedback: string;
    public priority: number;
    public correctAction: ActionType;
    public correctRescheduleSlotId: string | null;
    public isTask: boolean;

    constructor(visitor: Visitor, timeSlot: TimeSlot, scenicSpotId: string) {
        this.id = 'r_' + Math.random().toString(36).substr(2, 9);
        this.visitor = visitor;
        this.timeSlot = timeSlot;
        this.scenicSpotId = scenicSpotId;
        this.status = ReservationStatus.PENDING;
        this.conflicts = [];
        this.rescheduleRecords = [];
        this.createdAt = Date.now();
        this.processedAt = null;
        this.processedBy = null;
        this.feedback = '';
        this.priority = 0;
        this.correctAction = ActionType.APPROVE_RESERVATION;
        this.correctRescheduleSlotId = null;
        this.isTask = false;
    }

    public hasConflict(): boolean {
        return this.conflicts.length > 0 && !this.conflicts.includes(ConflictType.NONE);
    }

    public addConflict(type: ConflictType): void {
        if (!this.conflicts.includes(type)) {
            this.conflicts.push(type);
        }
    }

    public clearConflicts(): void {
        this.conflicts = [ConflictType.NONE];
    }

    public reschedule(newSlot: TimeSlot, reason: string, operator: string): void {
        const record = new RescheduleRecord(this.timeSlot, reason, operator);
        record.newTimeSlot = newSlot;
        this.rescheduleRecords.push(record);
        this.timeSlot = newSlot;
        this.status = ReservationStatus.RESCHEDULED;
    }

    public getRescheduleCount(): number {
        return this.rescheduleRecords.length;
    }

    public isNew(): boolean {
        return this.status === ReservationStatus.PENDING;
    }

    public isProcessed(): boolean {
        return this.status !== ReservationStatus.PENDING;
    }
}
