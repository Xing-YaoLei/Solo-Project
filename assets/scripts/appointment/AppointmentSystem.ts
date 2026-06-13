import { _decorator, Component } from "cc";
import { Customer, CustomerData, ArrivalStatus } from "./Customer";
import { TimeSlot, SlotStatus, ServiceData } from "./TimeSlot";
import { CapacityRule, CapacityRuleData } from "./CapacityRule";
import { ConflictDetector, ConflictInfo, ConflictType } from "./ConflictDetector";

const { ccclass, property } = _decorator;

export interface AppointmentResult {
    success: boolean;
    conflicts: ConflictInfo[];
    assignedSlot: TimeSlot | null;
}

export interface ArrivalCheckResult {
    customerId: string;
    previousStatus: ArrivalStatus;
    newStatus: ArrivalStatus;
    isCorrect: boolean;
    timestamp: number;
}

@ccclass("AppointmentSystem")
export class AppointmentSystem extends Component {
    private _customers: Map<string, Customer> = new Map();
    private _slots: TimeSlot[] = [];
    private _services: Map<string, ServiceData> = new Map();
    private _rule: CapacityRule | null = null;
    private _conflictDetector: ConflictDetector = new ConflictDetector();
    private _arrivalChecks: ArrivalCheckResult[] = [];
    private _stationCount: number = 0;
    private _slotInterval: number = 30;
    private _timeRangeStart: string = "09:00";
    private _timeRangeEnd: string = "18:00";

    get customers(): Map<string, Customer> { return this._customers; }
    get slots(): TimeSlot[] { return this._slots; }
    get services(): Map<string, ServiceData> { return this._services; }
    get rule(): CapacityRule | null { return this._rule; }
    get arrivalChecks(): ArrivalCheckResult[] { return this._arrivalChecks; }
    get conflictDetector(): ConflictDetector { return this._conflictDetector; }

    initialize(
        customerDataList: CustomerData[],
        serviceDataList: ServiceData[],
        ruleData: CapacityRuleData,
        stationCount: number,
        timeStart: string,
        timeEnd: string,
        slotInterval: number
    ): void {
        this._customers.clear();
        this._services.clear();
        this._slots = [];
        this._arrivalChecks = [];

        for (const cd of customerDataList) {
            this._customers.set(cd.id, Customer.fromData(cd));
        }
        for (const sd of serviceDataList) {
            this._services.set(sd.id, sd);
        }

        this._rule = CapacityRule.fromData(ruleData);
        this._stationCount = stationCount;
        this._timeRangeStart = timeStart;
        this._timeRangeEnd = timeEnd;
        this._slotInterval = slotInterval;

        this._conflictDetector.setRule(this._rule);
        this._generateSlots();
    }

    private _generateSlots(): void {
        const startMin = TimeSlot.timeToMinutes(this._timeRangeStart);
        const endMin = TimeSlot.timeToMinutes(this._timeRangeEnd);

        for (let st = 0; st < this._stationCount; st++) {
            let current = startMin;
            while (current < endMin) {
                const slot = new TimeSlot();
                slot.stationIndex = st;
                slot.time = TimeSlot.minutesToTime(current);
                slot.endTime = TimeSlot.minutesToTime(current + this._slotInterval);
                slot.durationMinutes = this._slotInterval;
                slot.status = SlotStatus.AVAILABLE;
                this._slots.push(slot);
                current += this._slotInterval;
            }
        }

        this._conflictDetector.setSlots(this._slots);
    }

    assignCustomer(customerId: string, stationIndex: number, time: string): AppointmentResult {
        const customer = this._customers.get(customerId);
        if (!customer) {
            return { success: false, conflicts: [], assignedSlot: null };
        }

        if (customer.isCancelled() || customer.isNoShow()) {
            return { success: false, conflicts: [], assignedSlot: null };
        }

        const service = this._services.get(customer.serviceId);
        const duration = service ? service.durationMinutes : (this._rule?.defaultDurationMinutes ?? 60);

        const conflicts = this._conflictDetector.checkAssignment(
            stationIndex, time, customer, customer.serviceId, duration
        );

        if (this._conflictDetector.hasHardConflict(conflicts)) {
            return { success: false, conflicts, assignedSlot: null };
        }

        const occupiedSlots = this._markSlotsOccupied(stationIndex, time, duration, customerId, customer.serviceId);
        customer.assignedStation = stationIndex;
        customer.assignedTimeSlot = time;

        this._conflictDetector.setSlots(this._slots);

        return {
            success: true,
            conflicts,
            assignedSlot: occupiedSlots.length > 0 ? occupiedSlots[0] : null
        };
    }

    private _markSlotsOccupied(stationIndex: number, time: string, duration: number, customerId: string, serviceId: string): TimeSlot[] {
        const occupied: TimeSlot[] = [];
        const startMin = TimeSlot.timeToMinutes(time);
        const endMin = startMin + duration;
        const bufferMin = this._rule?.bufferMinutes ?? 0;

        for (const slot of this._slots) {
            if (slot.stationIndex !== stationIndex) continue;
            const slotStart = TimeSlot.timeToMinutes(slot.time);
            const slotEnd = slotStart + slot.durationMinutes;

            if (slotStart >= startMin - bufferMin && slotEnd <= endMin + bufferMin) {
                if (slotStart >= startMin && slotEnd <= endMin) {
                    slot.status = SlotStatus.OCCUPIED;
                    slot.customerId = customerId;
                    slot.serviceId = serviceId;
                    slot.durationMinutes = duration;
                    occupied.push(slot);
                } else {
                    slot.status = SlotStatus.BUFFER;
                }
            }
        }

        return occupied;
    }

    checkArrival(customerId: string, judgedStatus: ArrivalStatus): ArrivalCheckResult {
        const customer = this._customers.get(customerId);
        if (!customer) {
            return {
                customerId,
                previousStatus: ArrivalStatus.PENDING,
                newStatus: judgedStatus,
                isCorrect: false,
                timestamp: Date.now()
            };
        }

        const previousStatus = customer.arrivalStatus;
        const isCorrect = this._evaluateArrivalJudgment(customer, judgedStatus);

        if (!isCorrect) {
            customer.arrivalStatus = judgedStatus;
        }

        const result: ArrivalCheckResult = {
            customerId,
            previousStatus,
            newStatus: customer.arrivalStatus,
            isCorrect,
            timestamp: Date.now()
        };
        this._arrivalChecks.push(result);
        return result;
    }

    private _evaluateArrivalJudgment(customer: Customer, judgedStatus: ArrivalStatus): boolean {
        if (customer.arrivalStatus === ArrivalStatus.ARRIVED) {
            return judgedStatus === ArrivalStatus.ARRIVED;
        }
        if (customer.arrivalStatus === ArrivalStatus.WALK_IN) {
            return judgedStatus === ArrivalStatus.WALK_IN || judgedStatus === ArrivalStatus.ARRIVED;
        }
        if (customer.arrivalStatus === ArrivalStatus.LATE) {
            return judgedStatus === ArrivalStatus.LATE || judgedStatus === ArrivalStatus.ARRIVED;
        }
        if (customer.arrivalStatus === ArrivalStatus.CANCELLED) {
            return judgedStatus === ArrivalStatus.CANCELLED;
        }
        if (customer.arrivalStatus === ArrivalStatus.PENDING) {
            return judgedStatus === ArrivalStatus.PENDING || judgedStatus === ArrivalStatus.ARRIVED;
        }
        return judgedStatus === customer.arrivalStatus;
    }

    getAvailableSlots(stationIndex: number, serviceId: string): TimeSlot[] {
        const duration = this._getServiceDuration(serviceId);
        const available: TimeSlot[] = [];

        for (const slot of this._slots) {
            if (slot.stationIndex !== stationIndex) continue;
            if (slot.status !== SlotStatus.AVAILABLE) continue;

            const slotStart = TimeSlot.timeToMinutes(slot.time);
            const neededEnd = slotStart + duration;
            const dayEnd = TimeSlot.timeToMinutes(this._timeRangeEnd);
            if (neededEnd > dayEnd) continue;

            let canFit = true;
            for (const s of this._slots) {
                if (s.stationIndex !== stationIndex) continue;
                if (s.status === SlotStatus.AVAILABLE) continue;
                const sStart = TimeSlot.timeToMinutes(s.time);
                const sEnd = sStart + s.durationMinutes;
                if (slotStart < sEnd && sStart < neededEnd) {
                    canFit = false;
                    break;
                }
            }

            if (canFit) {
                available.push(slot);
            }
        }

        return available;
    }

    predictConflictsForSlot(stationIndex: number, time: string, serviceId: string): ConflictInfo[] {
        const duration = this._getServiceDuration(serviceId);
        return this._conflictDetector.predictConflicts(stationIndex, time, serviceId, duration);
    }

    removeAssignment(customerId: string): boolean {
        const customer = this._customers.get(customerId);
        if (!customer || customer.assignedStation < 0) return false;

        for (const slot of this._slots) {
            if (slot.customerId === customerId) {
                slot.status = SlotStatus.AVAILABLE;
                slot.customerId = "";
                slot.serviceId = "";
                slot.durationMinutes = this._slotInterval;
            } else if (slot.status === SlotStatus.BUFFER && slot.stationIndex === customer.assignedStation) {
                const nearbyOccupied = this._slots.some(s =>
                    s.stationIndex === slot.stationIndex &&
                    s.status === SlotStatus.OCCUPIED &&
                    Math.abs(TimeSlot.timeToMinutes(s.time) - TimeSlot.timeToMinutes(slot.time)) < (this._rule?.defaultDurationMinutes ?? 60)
                );
                if (!nearbyOccupied) {
                    slot.status = SlotStatus.AVAILABLE;
                }
            }
        }

        customer.assignedStation = -1;
        customer.assignedTimeSlot = "";
        this._conflictDetector.setSlots(this._slots);
        return true;
    }

    calculateArrivalRate(): number {
        let total = 0;
        let arrived = 0;
        for (const [, c] of this._customers) {
            if (c.isCancelled()) continue;
            total++;
            if (c.isArrived()) arrived++;
        }
        return total > 0 ? arrived / total : 0;
    }

    getUnassignedCustomers(): Customer[] {
        const result: Customer[] = [];
        for (const [, c] of this._customers) {
            if (c.isActive() && c.assignedStation < 0) {
                result.push(c);
            }
        }
        return result;
    }

    getAssignedCustomers(): Customer[] {
        const result: Customer[] = [];
        for (const [, c] of this._customers) {
            if (c.assignedStation >= 0) {
                result.push(c);
            }
        }
        return result;
    }

    private _getServiceDuration(serviceId: string): number {
        const service = this._services.get(serviceId);
        if (service) return service.durationMinutes;
        return this._rule?.defaultDurationMinutes ?? 60;
    }
}
