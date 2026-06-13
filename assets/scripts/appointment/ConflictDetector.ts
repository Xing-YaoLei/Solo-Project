import { TimeSlot, SlotStatus } from "./TimeSlot";
import { CapacityRule } from "./CapacityRule";
import { Customer } from "./Customer";

export enum ConflictType {
    NONE = "none",
    STATION_OVERLAP = "station_overlap",
    CAPACITY_EXCEEDED = "capacity_exceeded",
    BUFFER_VIOLATION = "buffer_violation",
    DOUBLE_BOOK = "double_book"
}

export interface ConflictInfo {
    type: ConflictType;
    stationIndex: number;
    time: string;
    existingCustomerId: string;
    newCustomerId: string;
    severity: "warning" | "error";
    message: string;
}

export class ConflictDetector {
    private _slots: TimeSlot[] = [];
    private _rule: CapacityRule | null = null;
    private _hintCallbacks: ((conflict: ConflictInfo) => void)[] = [];

    setSlots(slots: TimeSlot[]): void {
        this._slots = slots;
    }

    setRule(rule: CapacityRule): void {
        this._rule = rule;
    }

    onConflictHint(callback: (conflict: ConflictInfo) => void): void {
        this._hintCallbacks.push(callback);
    }

    checkAssignment(stationIndex: number, time: string, customer: Customer, serviceId: string, duration: number): ConflictInfo[] {
        const conflicts: ConflictInfo[] = [];
        if (!this._rule) return conflicts;

        const newSlot = new TimeSlot();
        newSlot.stationIndex = stationIndex;
        newSlot.time = time;
        newSlot.durationMinutes = duration + this._rule.bufferMinutes;
        newSlot.customerId = customer.id;
        newSlot.serviceId = serviceId;

        for (const slot of this._slots) {
            if (slot.stationIndex !== stationIndex) continue;
            if (slot.status === SlotStatus.AVAILABLE) continue;
            if (slot.customerId === customer.id) continue;

            if (newSlot.overlaps(slot)) {
                const conflict: ConflictInfo = {
                    type: slot.customerId !== "" ? ConflictType.STATION_OVERLAP : ConflictType.BUFFER_VIOLATION,
                    stationIndex,
                    time,
                    existingCustomerId: slot.customerId,
                    newCustomerId: customer.id,
                    severity: "error",
                    message: `工位${stationIndex + 1} ${time} 时段与顾客 ${slot.customerId} 冲突`
                };
                conflicts.push(conflict);
            }
        }

        const stationSlots = this._slots.filter(s => s.stationIndex === stationIndex && s.status === SlotStatus.OCCUPIED);
        const sameTimeSlots = stationSlots.filter(s => {
            const sStart = TimeSlot.timeToMinutes(s.time);
            const nStart = TimeSlot.timeToMinutes(time);
            return Math.abs(sStart - nStart) < duration;
        });

        if (sameTimeSlots.length >= this._rule.maxConcurrentPerStation) {
            const overConflict: ConflictInfo = {
                type: ConflictType.CAPACITY_EXCEEDED,
                stationIndex,
                time,
                existingCustomerId: sameTimeSlots.map(s => s.customerId).join(","),
                newCustomerId: customer.id,
                severity: this._rule.canOverbook() ? "warning" : "error",
                message: `工位${stationIndex + 1} ${time} 已达容量上限`
            };
            conflicts.push(overConflict);
        }

        if (this._rule.sharedServiceIds.includes(serviceId)) {
            const sharedSlots = this._slots.filter(s =>
                s.stationIndex !== stationIndex &&
                this._rule!.sharedServiceIds.includes(s.serviceId) &&
                newSlot.overlaps(s)
            );
            if (sharedSlots.length >= this._rule.maxStationsPerTechnician) {
                const techConflict: ConflictInfo = {
                    type: ConflictType.DOUBLE_BOOK,
                    stationIndex,
                    time,
                    existingCustomerId: sharedSlots.map(s => s.customerId).join(","),
                    newCustomerId: customer.id,
                    severity: "warning",
                    message: `技师共享冲突：${time} 时段技师已在其他工位服务`
                };
                conflicts.push(techConflict);
            }
        }

        return conflicts;
    }

    predictConflicts(stationIndex: number, time: string, serviceId: string, duration: number): ConflictInfo[] {
        if (!this._rule) return [];

        const probeSlot = new TimeSlot();
        probeSlot.stationIndex = stationIndex;
        probeSlot.time = time;
        probeSlot.durationMinutes = duration + this._rule.bufferMinutes;
        probeSlot.serviceId = serviceId;

        const predicted: ConflictInfo[] = [];

        for (const slot of this._slots) {
            if (slot.stationIndex !== stationIndex) continue;
            if (slot.status === SlotStatus.AVAILABLE) continue;
            if (probeSlot.overlaps(slot)) {
                const conflict: ConflictInfo = {
                    type: ConflictType.STATION_OVERLAP,
                    stationIndex,
                    time,
                    existingCustomerId: slot.customerId,
                    newCustomerId: "",
                    severity: "warning",
                    message: `工位${stationIndex + 1} ${time} 附近已有安排`
                };
                predicted.push(conflict);
            }
        }

        for (const c of predicted) {
            for (const cb of this._hintCallbacks) {
                cb(c);
            }
        }

        return predicted;
    }

    hasHardConflict(conflicts: ConflictInfo[]): boolean {
        return conflicts.some(c => c.severity === "error");
    }

    getConflictSummary(conflicts: ConflictInfo[]): string {
        const errors = conflicts.filter(c => c.severity === "error");
        const warnings = conflicts.filter(c => c.severity === "warning");
        let msg = "";
        if (errors.length > 0) msg += `严重冲突${errors.length}项; `;
        if (warnings.length > 0) msg += `警告${warnings.length}项; `;
        return msg || "无冲突";
    }
}
