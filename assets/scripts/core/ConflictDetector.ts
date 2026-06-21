import { ConflictType, ActionType, ArrivalStatus } from '../models/GameEnums';
import { Reservation, ScenicSpot, Visitor, TimeSlot } from '../models';

export class ConflictDetector {
    public static detectAllConflicts(
        reservation: Reservation,
        scenicSpot: ScenicSpot,
        allReservations: Reservation[]
    ): ConflictType[] {
        const conflicts: ConflictType[] = [];

        if (this.checkCapacityConflict(reservation, scenicSpot)) {
            conflicts.push(ConflictType.CAPACITY_EXCEEDED);
        }

        if (this.checkTimeSlotOverlap(reservation, allReservations)) {
            conflicts.push(ConflictType.TIME_SLOT_OVERLAP);
        }

        if (this.checkSamePersonMultiBooking(reservation, allReservations)) {
            conflicts.push(ConflictType.SAME_PERSON_MULTI_BOOKING);
        }

        if (this.checkBlacklist(reservation.visitor)) {
            conflicts.push(ConflictType.BLACKLIST);
        }

        if (this.checkInvalidTime(reservation.timeSlot, scenicSpot)) {
            conflicts.push(ConflictType.INVALID_TIME);
        }

        if (conflicts.length === 0) {
            conflicts.push(ConflictType.NONE);
        }

        return conflicts;
    }

    public static checkCapacityConflict(reservation: Reservation, scenicSpot: ScenicSpot): boolean {
        const slot = scenicSpot.timeSlots.find(s => 
            s.startTime === reservation.timeSlot.startTime && 
            s.endTime === reservation.timeSlot.endTime
        );
        if (!slot) return true;
        return !slot.hasCapacity(reservation.visitor.ticketCount);
    }

    public static checkTimeSlotOverlap(reservation: Reservation, allReservations: Reservation[]): boolean {
        const visitorReservations = allReservations.filter(r => 
            r.visitor.idCard === reservation.visitor.idCard &&
            r.id !== reservation.id &&
            r.status !== 'cancelled'
        );

        for (const r of visitorReservations) {
            if (r.scenicSpotId === reservation.scenicSpotId &&
                reservation.timeSlot.overlapsWith(r.timeSlot)) {
                return true;
            }
        }
        return false;
    }

    public static checkSamePersonMultiBooking(reservation: Reservation, allReservations: Reservation[]): boolean {
        const sameDayBookings = allReservations.filter(r => 
            r.visitor.idCard === reservation.visitor.idCard &&
            r.id !== reservation.id &&
            r.status !== 'cancelled' &&
            r.scenicSpotId === reservation.scenicSpotId
        );
        return sameDayBookings.length >= 2;
    }

    public static checkBlacklist(visitor: Visitor): boolean {
        return visitor.hasBlacklist;
    }

    public static checkInvalidTime(timeSlot: TimeSlot, scenicSpot: ScenicSpot): boolean {
        return !scenicSpot.timeSlots.some(s => 
            s.startTime === timeSlot.startTime && s.endTime === timeSlot.endTime
        );
    }

    public static getConflictDescription(type: ConflictType): string {
        const descriptions: Record<ConflictType, string> = {
            [ConflictType.NONE]: '无冲突',
            [ConflictType.TIME_SLOT_OVERLAP]: '时段重叠：该游客已预约同一时段的其他门票',
            [ConflictType.CAPACITY_EXCEEDED]: '容量超限：该时段预约人数已达上限',
            [ConflictType.SAME_PERSON_MULTI_BOOKING]: '重复预约：同一身份证多次预约同一景区',
            [ConflictType.BLACKLIST]: '黑名单游客：该游客在景区黑名单中',
            [ConflictType.INVALID_TIME]: '无效时段：预约时段不在开放时间内',
            [ConflictType.ARRIVAL_LATE]: '迟到到场：游客超过预约时段到达',
            [ConflictType.ARRIVAL_NO_SHOW]: '未到场：游客未在预约时段到场',
            [ConflictType.ARRIVAL_EARLY]: '提前到场：游客早于预约时段到达'
        };
        return descriptions[type] || '未知冲突';
    }

    public static getRecommendedAction(conflicts: ConflictType[]): ActionType {
        if (conflicts.length === 0 || conflicts.includes(ConflictType.NONE)) {
            return ActionType.APPROVE_RESERVATION;
        }

        if (conflicts.includes(ConflictType.ARRIVAL_LATE) || conflicts.includes(ConflictType.ARRIVAL_NO_SHOW)) {
            return ActionType.DENY_ENTRY;
        }

        if (conflicts.includes(ConflictType.ARRIVAL_EARLY)) {
            return ActionType.CHECK_IN;
        }

        if (conflicts.includes(ConflictType.BLACKLIST)) {
            return ActionType.REJECT_RESERVATION;
        }

        if (conflicts.includes(ConflictType.CAPACITY_EXCEEDED) ||
            conflicts.includes(ConflictType.TIME_SLOT_OVERLAP)) {
            return ActionType.RESCHEDULE;
        }

        if (conflicts.includes(ConflictType.SAME_PERSON_MULTI_BOOKING)) {
            return ActionType.REJECT_RESERVATION;
        }

        return ActionType.REJECT_RESERVATION;
    }

    public static findBestRescheduleSlot(
        reservation: Reservation,
        scenicSpot: ScenicSpot
    ): TimeSlot | null {
        const availableSlots = scenicSpot.getAvailableTimeSlots(reservation.visitor.ticketCount);
        if (availableSlots.length === 0) return null;

        const currentStart = reservation.timeSlot.startTime;
        availableSlots.sort((a, b) => {
            const diffA = Math.abs(a.startTime - currentStart);
            const diffB = Math.abs(b.startTime - currentStart);
            return diffA - diffB;
        });

        return availableSlots[0];
    }
}
