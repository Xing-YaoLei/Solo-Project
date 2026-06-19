import { _decorator, Component, Node, UITransform, Vec3, EventTouch, Color, Sprite, Label, math } from "cc";
import { Room, RoomStatus, RoomSlot } from "../models/Room";
import { GameManager } from "../managers/GameManager";

const { ccclass, property } = _decorator;

const STATUS_COLORS: Record<RoomStatus, Color> = {
    [RoomStatus.VACANT]: new Color(76, 175, 80, 255),
    [RoomStatus.OCCUPIED]: new Color(244, 67, 54, 255),
    [RoomStatus.CHECKING_OUT]: new Color(255, 152, 0, 255),
    [RoomStatus.CLEANING]: new Color(33, 150, 243, 255),
    [RoomStatus.MAINTENANCE]: new Color(158, 158, 158, 255),
    [RoomStatus.BLOCKED]: new Color(96, 96, 96, 255),
    [RoomStatus.CONFLICT]: new Color(156, 39, 176, 255)
};

@ccclass("RoomCalendarCell")
export class RoomCalendarCell extends Component {
    private slotData: RoomSlot | null = null;
    private roomId: string = "";
    private bgSprite: Sprite | null = null;
    private statusLabel: Label | null = null;
    private isDragging: boolean = false;
    private dragStartPos: Vec3 = new Vec3();
    private onCellClicked: ((roomId: string, date: string) => void) | null = null;
    private onOrderDropped: ((orderId: string, roomId: string, date: string) => void) | null = null;

    public init(roomId: string, slot: RoomSlot): void {
        this.roomId = roomId;
        this.slotData = slot;
        this.updateVisual();
    }

    private updateVisual(): void {
        if (!this.slotData) return;

        const bgNode = this.node.getChildByName("bg");
        if (bgNode) {
            this.bgSprite = bgNode.getComponent(Sprite);
            if (this.bgSprite) {
                this.bgSprite.color = STATUS_COLORS[this.slotData.status] || Color.WHITE;
            }
        }

        const labelNode = this.node.getChildByName("label");
        if (labelNode) {
            this.statusLabel = labelNode.getComponent(Label);
            if (this.statusLabel) {
                this.statusLabel.string = this.getStatusText(this.slotData.status);
            }
        }
    }

    private getStatusText(status: RoomStatus): string {
        const texts: Record<RoomStatus, string> = {
            [RoomStatus.VACANT]: "空房",
            [RoomStatus.OCCUPIED]: "已住",
            [RoomStatus.CHECKING_OUT]: "退房",
            [RoomStatus.CLEANING]: "保洁",
            [RoomStatus.MAINTENANCE]: "维修",
            [RoomStatus.BLOCKED]: "封锁",
            [RoomStatus.CONFLICT]: "冲突"
        };
        return texts[status] || "未知";
    }

    public updateSlot(slot: RoomSlot): void {
        this.slotData = slot;
        this.updateVisual();
    }

    public getRoomId(): string {
        return this.roomId;
    }

    public getSlotData(): RoomSlot | null {
        return this.slotData;
    }

    public setOnCellClicked(cb: (roomId: string, date: string) => void): void {
        this.onCellClicked = cb;
    }

    public setOnOrderDropped(cb: (orderId: string, roomId: string, date: string) => void): void {
        this.onOrderDropped = cb;
    }

    onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(event: EventTouch): void {
        this.isDragging = false;
        this.dragStartPos.set(event.getUILocation().x, event.getUILocation().y, 0);
    }

    private onTouchMove(event: EventTouch): void {
        const currentPos = new Vec3(event.getUILocation().x, event.getUILocation().y, 0);
        const distance = Vec3.distance(currentPos, this.dragStartPos);

        if (distance > 10) {
            this.isDragging = true;
        }
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.isDragging && this.slotData) {
            if (this.onCellClicked) {
                this.onCellClicked(this.roomId, this.slotData.date);
            }
        }
    }

    private onTouchCancel(event: EventTouch): void {
        this.isDragging = false;
    }
}

@ccclass("RoomCalendarRow")
export class RoomCalendarRow extends Component {
    private room: Room | null = null;
    private cells: RoomCalendarCell[] = [];

    public init(room: Room, cellWidth: number, cellHeight: number): void {
        this.room = room;
        this.cells = [];

        const nameLabel = this.node.getChildByName("roomName");
        if (nameLabel) {
            const label = nameLabel.getComponent(Label);
            if (label) {
                label.string = room.name;
            }
        }

        const typeLabel = this.node.getChildByName("roomType");
        if (typeLabel) {
            const label = typeLabel.getComponent(Label);
            if (label) {
                const typeNames: Record<string, string> = {
                    standard: "标", deluxe: "豪", suite: "套", family: "家"
                };
                label.string = typeNames[room.type] || "标";
            }
        }

        const cellsParent = this.node.getChildByName("cells");
        if (!cellsParent) return;

        for (let i = 0; i < room.slots.length; i++) {
            const cellNode = new Node(`cell_${i}`);
            const transform = cellNode.addComponent(UITransform);
            transform.setContentSize(cellWidth, cellHeight);

            const bgNode = new Node("bg");
            bgNode.addComponent(UITransform).setContentSize(cellWidth - 2, cellHeight - 2);
            bgNode.addComponent(Sprite);
            bgNode.parent = cellNode;

            const labelNode = new Node("label");
            labelNode.addComponent(UITransform).setContentSize(cellWidth - 4, cellHeight - 4);
            const lbl = labelNode.addComponent(Label);
            lbl.fontSize = 12;
            lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            lbl.verticalAlign = Label.VerticalAlign.CENTER;
            labelNode.parent = cellNode;

            const cell = cellNode.addComponent(RoomCalendarCell);
            cell.init(room.id, room.slots[i]);
            cell.node.parent = cellsParent;
            cell.node.setPosition(i * cellWidth, 0, 0);

            this.cells.push(cell);
        }
    }

    public updateSlots(room: Room): void {
        this.room = room;
        for (let i = 0; i < this.cells.length && i < room.slots.length; i++) {
            this.cells[i].updateSlot(room.slots[i]);
        }
    }

    public getRoomId(): string {
        return this.room?.id || "";
    }

    public setOnCellClicked(cb: (roomId: string, date: string) => void): void {
        for (const cell of this.cells) {
            cell.setOnCellClicked(cb);
        }
    }
}

@ccclass("RoomCalendar")
export class RoomCalendar extends Component {
    @property(Number)
    cellWidth: number = 80;

    @property(Number)
    cellHeight: number = 40;

    @property(Number)
    rowHeight: number = 50;

    private rows: RoomCalendarRow[] = [];
    private contentNode: Node | null = null;
    private onCellClicked: ((roomId: string, date: string) => void) | null = null;

    public init(): void {
        this.rows = [];
        const gm = GameManager.instance;
        if (!gm) return;

        const roomMgr = gm.getRoomManager();
        if (!roomMgr) return;

        this.contentNode = this.node.getChildByName("content");
        if (!this.contentNode) return;

        const rooms = roomMgr.getAllRooms();
        for (let i = 0; i < rooms.length; i++) {
            const rowNode = new Node(`row_${rooms[i].id}`);
            const transform = rowNode.addComponent(UITransform);
            transform.setContentSize(
                this.cellWidth * rooms[i].slots.length + 100,
                this.rowHeight
            );
            rowNode.parent = this.contentNode;
            rowNode.setPosition(0, -i * this.rowHeight, 0);

            const row = rowNode.addComponent(RoomCalendarRow);
            row.init(rooms[i], this.cellWidth, this.cellHeight);
            row.setOnCellClicked((roomId, date) => {
                if (this.onCellClicked) {
                    this.onCellClicked(roomId, date);
                }
            });

            this.rows.push(row);
        }
    }

    public refresh(): void {
        const gm = GameManager.instance;
        if (!gm) return;
        const roomMgr = gm.getRoomManager();
        if (!roomMgr) return;

        const rooms = roomMgr.getAllRooms();
        for (let i = 0; i < this.rows.length && i < rooms.length; i++) {
            this.rows[i].updateSlots(rooms[i]);
        }
    }

    public setOnCellClicked(cb: (roomId: string, date: string) => void): void {
        this.onCellClicked = cb;
    }

    public getRowByRoomId(roomId: string): RoomCalendarRow | undefined {
        return this.rows.find(r => r.getRoomId() === roomId);
    }
}
