import { _decorator, Component } from "cc";
import {
    ConflictType, ConflictEvent, ConflictOption, ConflictOutcome,
    LevelConfig, BottleneckRecord
} from "../models/Config";
import { RoomStatus } from "../models/Room";
import { Order } from "../models/Order";
import { GameManager, GameState } from "./GameManager";

const { ccclass } = _decorator;

@ccclass("ConflictManager")
export class ConflictManager extends Component {
    private activeConflicts: Map<string, ConflictEvent> = new Map();
    private conflictIdCounter: number = 0;
    private resolvedCount: number = 0;
    private totalConflictCount: number = 0;
    private consecutiveResolved: number = 0;
    private onConflictAppeared: ((conflict: ConflictEvent) => void) | null = null;
    private onConflictResolved: ((conflict: ConflictEvent, option: ConflictOption) => void) | null = null;

    public init(): void {
        this.activeConflicts.clear();
        this.conflictIdCounter = 0;
        this.resolvedCount = 0;
        this.totalConflictCount = 0;
        this.consecutiveResolved = 0;
    }

    public checkForConflicts(): ConflictEvent | null {
        const gm = GameManager.instance;
        if (!gm) return null;

        const levelConfig = gm.getCurrentLevel();
        if (!levelConfig) return null;

        if (Math.random() > levelConfig.conflictProbability) return null;

        const roomMgr = gm.getRoomManager();
        const orderMgr = gm.getOrderManager();
        if (!roomMgr || !orderMgr) return null;

        const rooms = roomMgr.getAllRooms();
        const occupiedRooms = rooms.filter(r =>
            r.slots.some(s => s.status === RoomStatus.OCCUPIED)
        );

        if (occupiedRooms.length === 0) return null;

        const conflictTypes = this.getApplicableConflictTypes(levelConfig);
        if (conflictTypes.length === 0) return null;

        const type = conflictTypes[Math.floor(Math.random() * conflictTypes.length)];
        const room = occupiedRooms[Math.floor(Math.random() * occupiedRooms.length)];

        return this.createConflict(type, room.id, roomMgr, orderMgr);
    }

    private getApplicableConflictTypes(config: LevelConfig): ConflictType[] {
        const types: ConflictType[] = [ConflictType.DOUBLE_BOOKING, ConflictType.OVERLAP_STAY];

        if (config.dayCount > 3) {
            types.push(ConflictType.EARLY_CHECKIN, ConflictType.LATE_CHECKOUT);
        }
        if (config.taskTypes.includes("maintenance")) {
            types.push(ConflictType.MAINTENANCE_CLASH);
        }
        types.push(ConflictType.ROOM_UNAVAILABLE);

        return types;
    }

    private createConflict(type: ConflictType, roomId: string, roomMgr: any, orderMgr: any): ConflictEvent {
        const id = `conflict_${++this.conflictIdCounter}`;
        this.totalConflictCount++;

        const options = this.generateConflictOptions(type, roomId);

        const conflict: ConflictEvent = {
            id,
            type,
            roomId,
            conflictingOrderIds: [],
            description: this.getConflictDescription(type, roomId),
            options,
            timeLimit: 30,
            appearedAt: Date.now()
        };

        this.activeConflicts.set(id, conflict);

        const gm = GameManager.instance;
        if (gm) {
            gm.recordBottleneck("conflict_appeared", 0, conflict.description);
            gm.setState(GameState.CONFLICT);
        }

        if (this.onConflictAppeared) {
            this.onConflictAppeared(conflict);
        }

        return conflict;
    }

    private generateConflictOptions(type: ConflictType, roomId: string): ConflictOption[] {
        const options: ConflictOption[] = [];

        switch (type) {
            case ConflictType.DOUBLE_BOOKING:
                options.push({
                    id: "opt_reassign",
                    label: "调换房间",
                    description: "为新订单调换一间同等房型",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [roomId],
                        penalty: 0,
                        reputationChange: 0,
                        roomStatusOverride: {}
                    }
                });
                options.push({
                    id: "opt_upgrade",
                    label: "免费升级",
                    description: "为客人升级到更高房型，无额外收费",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [roomId],
                        penalty: 100,
                        reputationChange: 5,
                        roomStatusOverride: {}
                    }
                });
                options.push({
                    id: "opt_cancel",
                    label: "取消订单",
                    description: "取消冲突的订单，支付违约金",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [],
                        penalty: 200,
                        reputationChange: -10,
                        roomStatusOverride: {}
                    }
                });
                break;

            case ConflictType.LATE_CHECKOUT:
                options.push({
                    id: "opt_extend",
                    label: "延迟退房",
                    description: "允许客人延迟退房，调整后续安排",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [roomId],
                        penalty: 50,
                        reputationChange: 5,
                        roomStatusOverride: { [roomId]: RoomStatus.CHECKING_OUT }
                    }
                });
                options.push({
                    id: "opt_enforce",
                    label: "按时退房",
                    description: "要求客人按时退房",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [],
                        penalty: 0,
                        reputationChange: -5,
                        roomStatusOverride: {}
                    }
                });
                break;

            case ConflictType.EARLY_CHECKIN:
                options.push({
                    id: "opt_allow_early",
                    label: "提前入住",
                    description: "允许客人提前入住，需要加急保洁",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [roomId],
                        penalty: 30,
                        reputationChange: 5,
                        roomStatusOverride: {}
                    }
                });
                options.push({
                    id: "opt_wait",
                    label: "等待标准入住",
                    description: "请客人在大堂等待",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [],
                        penalty: 0,
                        reputationChange: -3,
                        roomStatusOverride: {}
                    }
                });
                break;

            case ConflictType.MAINTENANCE_CLASH:
                options.push({
                    id: "opt_delay_maint",
                    label: "推迟维修",
                    description: "先安排客人入住，维修延后",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [roomId],
                        penalty: 50,
                        reputationChange: 0,
                        roomStatusOverride: {}
                    }
                });
                options.push({
                    id: "opt_relocate",
                    label: "调换房间",
                    description: "为客人安排其他房间",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [],
                        penalty: 0,
                        reputationChange: 0,
                        roomStatusOverride: {}
                    }
                });
                break;

            default:
                options.push({
                    id: "opt_negotiate",
                    label: "协商解决",
                    description: "与客人协商解决方案",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [roomId],
                        penalty: 50,
                        reputationChange: 0,
                        roomStatusOverride: {}
                    }
                });
                options.push({
                    id: "opt_compensate",
                    label: "赔偿解决",
                    description: "支付赔偿金解决问题",
                    outcome: {
                        resolvedOrderIds: [],
                        affectedRoomIds: [],
                        penalty: 150,
                        reputationChange: -5,
                        roomStatusOverride: {}
                    }
                });
                break;
        }

        return options;
    }

    private getConflictDescription(type: ConflictType, roomId: string): string {
        const descriptions: Record<ConflictType, string> = {
            [ConflictType.DOUBLE_BOOKING]: `${roomId}出现重复预订冲突！两批客人预订了同一间房`,
            [ConflictType.OVERLAP_STAY]: `${roomId}的客人入住时间重叠，需要紧急处理`,
            [ConflictType.EARLY_CHECKIN]: `${roomId}有客人要求提前入住，但房间还未准备好`,
            [ConflictType.LATE_CHECKOUT]: `${roomId}的客人要求延迟退房，影响下一位客人入住`,
            [ConflictType.ROOM_UNAVAILABLE]: `${roomId}因突发状况无法使用，需要重新安排`,
            [ConflictType.MAINTENANCE_CLASH]: `${roomId}维修期间被预订，存在冲突`
        };
        return descriptions[type] || `${roomId}出现房态冲突`;
    }

    public resolveConflict(conflictId: string, optionId: string): boolean {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) return false;

        const option = conflict.options.find(o => o.id === optionId);
        if (!option) return false;

        this.resolvedCount++;
        this.consecutiveResolved++;

        this.activeConflicts.delete(conflictId);

        const gm = GameManager.instance;
        if (gm) {
            gm.addPenalty(option.outcome.penalty);
            gm.recordBottleneck("conflict_resolved",
                (Date.now() - conflict.appearedAt) / 1000,
                `解决冲突: ${conflict.description} -> ${option.label}`);
            gm.setState(GameState.PLAYING);
        }

        if (this.onConflictResolved) {
            this.onConflictResolved(conflict, option);
        }

        return true;
    }

    public update(dt: number): void {
        const now = Date.now();
        for (const [id, conflict] of this.activeConflicts) {
            if (now - conflict.appearedAt > conflict.timeLimit * 1000) {
                this.consecutiveResolved = 0;
                this.activeConflicts.delete(id);
                const gm = GameManager.instance;
                if (gm) {
                    gm.addPenalty(200);
                    gm.recordBottleneck("conflict_timeout",
                        conflict.timeLimit,
                        `冲突超时未处理: ${conflict.description}`);
                    gm.setState(GameState.PLAYING);
                }
            }
        }
    }

    public getActiveConflicts(): ConflictEvent[] {
        return Array.from(this.activeConflicts.values());
    }

    public getConsecutiveResolved(): number {
        return this.consecutiveResolved;
    }

    public getResolvedCount(): number {
        return this.resolvedCount;
    }

    public getTotalConflictCount(): number {
        return this.totalConflictCount;
    }

    public setOnConflictAppeared(cb: (conflict: ConflictEvent) => void): void {
        this.onConflictAppeared = cb;
    }

    public setOnConflictResolved(cb: (conflict: ConflictEvent, option: ConflictOption) => void): void {
        this.onConflictResolved = cb;
    }

    public reset(): void {
        this.activeConflicts.clear();
        this.conflictIdCounter = 0;
        this.resolvedCount = 0;
        this.totalConflictCount = 0;
        this.consecutiveResolved = 0;
    }
}
