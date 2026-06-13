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
    arrivalStatus: ArrivalStatus | string;
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
        c.arrivalStatus = Customer._parseArrivalStatus(data.arrivalStatus);
        c.vip = data.vip;
        c.lateMinutes = data.lateMinutes || 0;
        return c;
    }

    private static _parseArrivalStatus(status: ArrivalStatus | string): ArrivalStatus {
        if (typeof status === "string") {
            switch (status) {
                case "pending": return ArrivalStatus.PENDING;
                case "arrived": return ArrivalStatus.ARRIVED;
                case "late": return ArrivalStatus.LATE;
                case "no_show": return ArrivalStatus.NO_SHOW;
                case "cancelled": return ArrivalStatus.CANCELLED;
                case "walk_in": return ArrivalStatus.WALK_IN;
                default: return ArrivalStatus.PENDING;
            }
        }
        return status;
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
