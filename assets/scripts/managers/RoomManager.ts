import { _decorator, Component, JsonAsset, Node, instantiate, Prefab, Vec3 } from "cc";
import { Room, RoomStatus, RoomType, RoomSlot } from "../models/Room";
import { LevelConfig, GameSettings } from "../models/Config";

const { ccclass, property } = _decorator;

@ccclass("RoomManager")
export class RoomManager extends Component {
    private rooms: Map<string, Room> = new Map();
    private levelConfig: LevelConfig | null = null;

    public init(config: LevelConfig): void {
        this.levelConfig = config;
        this.rooms.clear();
        this.generateRooms();
    }

    private generateRooms(): void {
        if (!this.levelConfig) return;

        const typeNames: Record<RoomType, string> = {
            [RoomType.STANDARD]: "标准间",
            [RoomType.DELUXE]: "豪华间",
            [RoomType.SUITE]: "套房",
            [RoomType.FAMILY]: "家庭房"
        };

        const typePrices: Record<RoomType, number> = {
            [RoomType.STANDARD]: 200,
            [RoomType.DELUXE]: 380,
            [RoomType.SUITE]: 600,
            [RoomType.FAMILY]: 480
        };

        const typeGuests: Record<RoomType, number> = {
            [RoomType.STANDARD]: 2,
            [RoomType.DELUXE]: 2,
            [RoomType.SUITE]: 3,
            [RoomType.FAMILY]: 4
        };

        for (let i = 0; i < this.levelConfig.roomCount; i++) {
            const floor = Math.floor(i / 5) + 1;
            const roomNum = (floor * 100) + (i % 5) + 1;
            const typeIndex = i % this.levelConfig.roomTypes.length;
            const roomType = this.levelConfig.roomTypes[typeIndex];

            const slots: RoomSlot[] = [];
            for (let d = 0; d < this.levelConfig.dayCount; d++) {
                const dateStr = this.formatDate(d);
                slots.push({
                    date: dateStr,
                    status: RoomStatus.VACANT,
                    orderId: null,
                    checkIn: null,
                    checkOut: null
                });
            }

            const room: Room = {
                id: `room_${roomNum}`,
                name: `${floor}0${(i % 5) + 1}`,
                type: roomType,
                floor,
                maxGuests: typeGuests[roomType],
                basePrice: typePrices[roomType],
                slots,
                amenities: []
            };

            this.rooms.set(room.id, room);
        }
    }

    private formatDate(dayOffset: number): string {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    public getAllRooms(): Room[] {
        return Array.from(this.rooms.values());
    }

    public getRoomsByFloor(floor: number): Room[] {
        return this.getAllRooms().filter(r => r.floor === floor);
    }

    public getRoomsByType(type: RoomType): Room[] {
        return this.getAllRooms().filter(r => r.type === type);
    }

    public getSlot(roomId: string, date: string): RoomSlot | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;
        return room.slots.find(s => s.date === date);
    }

    public setSlotStatus(roomId: string, date: string, status: RoomStatus, orderId: string | null): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        const slot = room.slots.find(s => s.date === date);
        if (!slot) return false;
        slot.status = status;
        slot.orderId = orderId;
        return true;
    }

    public assignOrderToRoom(roomId: string, checkIn: string, checkOut: string, orderId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        for (const slot of room.slots) {
            if (slot.date >= checkIn && slot.date < checkOut) {
                if (slot.status !== RoomStatus.VACANT && slot.status !== RoomStatus.CLEANING) {
                    return false;
                }
            }
        }

        for (const slot of room.slots) {
            if (slot.date >= checkIn && slot.date < checkOut) {
                if (slot.date === checkIn) {
                    slot.status = RoomStatus.OCCUPIED;
                    slot.orderId = orderId;
                    slot.checkIn = checkIn;
                } else {
                    slot.status = RoomStatus.OCCUPIED;
                    slot.orderId = orderId;
                }
                if (slot.date === checkOut || this.isDateBeforeByOne(slot.date, checkOut)) {
                    slot.checkOut = checkOut;
                }
            }
        }

        return true;
    }

    private isDateBeforeByOne(date1: string, date2: string): boolean {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        return diff === 1;
    }

    public releaseRoom(roomId: string, date: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        const slot = room.slots.find(s => s.date === date);
        if (!slot) return false;
        slot.status = RoomStatus.CLEANING;
        slot.orderId = null;
        slot.checkIn = null;
        slot.checkOut = null;
        return true;
    }

    public findAvailableRooms(checkIn: string, checkOut: string, type?: RoomType): Room[] {
        const result: Room[] = [];
        for (const room of this.rooms.values()) {
            if (type && room.type !== type) continue;
            let available = true;
            for (const slot of room.slots) {
                if (slot.date >= checkIn && slot.date < checkOut) {
                    if (slot.status !== RoomStatus.VACANT && slot.status !== RoomStatus.CLEANING) {
                        available = false;
                        break;
                    }
                }
            }
            if (available) result.push(room);
        }
        return result;
    }

    public getOccupancyRate(date: string): number {
        let total = 0;
        let occupied = 0;
        for (const room of this.rooms.values()) {
            const slot = room.slots.find(s => s.date === date);
            if (slot) {
                total++;
                if (slot.status === RoomStatus.OCCUPIED) occupied++;
            }
        }
        return total > 0 ? occupied / total : 0;
    }

    public getOverallOccupancyRate(): number {
        let total = 0;
        let occupied = 0;
        for (const room of this.rooms.values()) {
            for (const slot of room.slots) {
                total++;
                if (slot.status === RoomStatus.OCCUPIED) occupied++;
            }
        }
        return total > 0 ? occupied / total : 0;
    }

    public reset(): void {
        this.rooms.clear();
        this.levelConfig = null;
    }
}
