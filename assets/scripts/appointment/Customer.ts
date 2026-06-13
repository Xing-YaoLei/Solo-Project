export enum ArrivalStatus {
    PENDING = "pending",
    ARRIVED = "arrived",
    LATE = "late",
    NO_SHOW = "no_show",
    CANCELLED = "cancelled",
    WALK_IN = "walk_in"
}

export interface CustomerData {
    id: string;
    name: string;
    phone: string;
    serviceId: string;
    preferredTime: string;
    arrivalStatus: ArrivalStatus;
    vip: boolean;
    lateMinutes?: number;
}

export class Customer {
    id: string = "";
    name: string = "";
    phone: string = "";
    serviceId: string = "";
    preferredTime: string = "";
    arrivalStatus: ArrivalStatus = ArrivalStatus.PENDING;
    vip: boolean = false;
    lateMinutes: number = 0;
    actualArrivalTime: string = "";
    assignedStation: number = -1;
    assignedTimeSlot: string = "";

    static fromData(data: CustomerData): Customer {
        const c = new Customer();
        c.id = data.id;
        c.name = data.name;
        c.phone = data.phone;
        c.serviceId = data.serviceId;
        c.preferredTime = data.preferredTime;
        c.arrivalStatus = data.arrivalStatus;
        c.vip = data.vip;
        c.lateMinutes = data.lateMinutes || 0;
        return c;
    }

    isArrived(): boolean {
        return this.arrivalStatus === ArrivalStatus.ARRIVED || this.arrivalStatus === ArrivalStatus.WALK_IN;
    }

    isLate(): boolean {
        return this.arrivalStatus === ArrivalStatus.LATE;
    }

    isNoShow(): boolean {
        return this.arrivalStatus === ArrivalStatus.NO_SHOW;
    }

    isCancelled(): boolean {
        return this.arrivalStatus === ArrivalStatus.CANCELLED;
    }

    isActive(): boolean {
        return !this.isCancelled() && !this.isNoShow();
    }
}
