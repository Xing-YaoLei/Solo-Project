export enum RoomStatus {
    VACANT = "vacant",
    OCCUPIED = "occupied",
    CHECKING_OUT = "checking_out",
    CLEANING = "cleaning",
    MAINTENANCE = "maintenance",
    BLOCKED = "blocked",
    CONFLICT = "conflict"
}

export enum RoomType {
    STANDARD = "standard",
    DELUXE = "deluxe",
    SUITE = "suite",
    FAMILY = "family"
}

export interface RoomSlot {
    date: string;
    status: RoomStatus;
    orderId: string | null;
    checkIn: string | null;
    checkOut: string | null;
}

export interface Room {
    id: string;
    name: string;
    type: RoomType;
    floor: number;
    maxGuests: number;
    basePrice: number;
    slots: RoomSlot[];
    amenities: string[];
}
