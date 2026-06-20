import { ArrivalStatus } from './GameEnums';

export class Visitor {
    public id: string;
    public name: string;
    public idCard: string;
    public phone: string;
    public ticketCount: number;
    public hasBlacklist: boolean;
    public arrivalTime: number | null;
    public arrivalStatus: ArrivalStatus;
    public portraitSprite: string;
    public notes: string;

    constructor(data: Partial<Visitor> = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.idCard = data.idCard || '';
        this.phone = data.phone || '';
        this.ticketCount = data.ticketCount || 1;
        this.hasBlacklist = data.hasBlacklist || false;
        this.arrivalTime = data.arrivalTime ?? null;
        this.arrivalStatus = data.arrivalStatus || ArrivalStatus.NOT_ARRIVED;
        this.portraitSprite = data.portraitSprite || 'portrait_default';
        this.notes = data.notes || '';
    }

    private generateId(): string {
        return 'v_' + Math.random().toString(36).substr(2, 9);
    }

    public isArrived(): boolean {
        return this.arrivalStatus !== ArrivalStatus.NOT_ARRIVED;
    }

    public maskIdCard(): string {
        if (this.idCard.length >= 15) {
            return this.idCard.substring(0, 6) + '********' + this.idCard.substring(14);
        }
        return '***';
    }

    public maskPhone(): string {
        if (this.phone.length >= 11) {
            return this.phone.substring(0, 3) + '****' + this.phone.substring(7);
        }
        return '***';
    }
}
