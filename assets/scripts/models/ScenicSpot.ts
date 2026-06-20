import { TimeSlot } from './TimeSlot';
import { Reservation } from './Reservation';

export class ScenicSpot {
    public id: string;
    public name: string;
    public description: string;
    public icon: string;
    public mapPosition: { x: number; y: number };
    public timeSlots: TimeSlot[];
    public dailyCapacity: number;
    public reservations: Reservation[];
    public color: string;

    constructor(
        id: string,
        name: string,
        description: string,
        icon: string,
        mapPosX: number,
        mapPosY: number,
        dailyCapacity: number,
        color: string = '#4A90D9'
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.mapPosition = { x: mapPosX, y: mapPosY };
        this.timeSlots = [];
        this.dailyCapacity = dailyCapacity;
        this.reservations = [];
        this.color = color;
    }

    public addTimeSlot(startTime: number, endTime: number, capacity: number): TimeSlot {
        const slot = new TimeSlot(startTime, endTime, capacity);
        this.timeSlots.push(slot);
        return slot;
    }

    public getTimeSlotByTime(time: number): TimeSlot | null {
        for (const slot of this.timeSlots) {
            if (slot.containsTime(time)) {
                return slot;
            }
        }
        return null;
    }

    public getAvailableTimeSlots(ticketCount: number = 1): TimeSlot[] {
        return this.timeSlots.filter(slot => slot.hasCapacity(ticketCount));
    }

    public getTotalBookedCount(): number {
        return this.timeSlots.reduce((sum, slot) => sum + slot.bookedCount, 0);
    }

    public getTodayReservations(): Reservation[] {
        return this.reservations.filter(r => r.status !== 'cancelled');
    }

    public getPendingReservations(): Reservation[] {
        return this.reservations.filter(r => r.status === 'pending');
    }
}
