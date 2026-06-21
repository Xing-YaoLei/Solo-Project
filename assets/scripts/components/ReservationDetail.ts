import { _decorator, Component, Node, Label, Sprite, Color } from 'cc';
import { Reservation, ArrivalStatus } from '../models';
import { ConflictType } from '../models/GameEnums';
import { ConflictDetector } from '../core/ConflictDetector';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass('ReservationDetail')
export class ReservationDetail extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    idCardLabel: Label | null = null;

    @property(Label)
    phoneLabel: Label | null = null;

    @property(Label)
    spotNameLabel: Label | null = null;

    @property(Label)
    timeSlotLabel: Label | null = null;

    @property(Label)
    ticketCountLabel: Label | null = null;

    @property(Label)
    rescheduleCountLabel: Label | null = null;

    @property(Node)
    conflictListNode: Node | null = null;

    @property(Label)
    notesLabel: Label | null = null;

    @property(Label)
    arrivalStatusLabel: Label | null = null;

    @property(Label)
    arrivalTimeLabel: Label | null = null;

    @property(Node)
    noSelectionHint: Node | null = null;

    @property(Node)
    detailContent: Node | null = null;

    private reservation: Reservation | null = null;

    public setReservation(reservation: Reservation | null): void {
        this.reservation = reservation;

        if (!reservation) {
            this.showNoSelection();
            return;
        }

        this.showDetail();
        this.updateContent();
    }

    private showNoSelection(): void {
        if (this.noSelectionHint) {
            this.noSelectionHint.active = true;
        }
        if (this.detailContent) {
            this.detailContent.active = false;
        }
    }

    private showDetail(): void {
        if (this.noSelectionHint) {
            this.noSelectionHint.active = false;
        }
        if (this.detailContent) {
            this.detailContent.active = true;
        }
    }

    private updateContent(): void {
        if (!this.reservation) return;

        const visitor = this.reservation.visitor;
        const gameManager = GameManager.instance;
        const spot = gameManager?.getScenicSpot(this.reservation.scenicSpotId);

        if (this.nameLabel) {
            this.nameLabel.string = visitor.name;
        }
        if (this.idCardLabel) {
            this.idCardLabel.string = visitor.maskIdCard();
        }
        if (this.phoneLabel) {
            this.phoneLabel.string = visitor.maskPhone();
        }
        if (this.spotNameLabel) {
            this.spotNameLabel.string = spot?.name || '未知景点';
        }
        if (this.timeSlotLabel) {
            this.timeSlotLabel.string = this.reservation.timeSlot.formatTime();
        }
        if (this.ticketCountLabel) {
            this.ticketCountLabel.string = `${visitor.ticketCount}张`;
        }
        if (this.rescheduleCountLabel) {
            const count = this.reservation.getRescheduleCount();
            this.rescheduleCountLabel.string = `${count}次`;
            this.rescheduleCountLabel.color = count > 0 ? new Color(255, 152, 0) : Color.GRAY;
        }
        if (this.notesLabel) {
            this.notesLabel.string = visitor.notes || '无';
        }

        if (visitor.isArrived()) {
            if (this.arrivalStatusLabel) {
                const statusMap: Record<string, { text: string; color: Color }> = {
                    [ArrivalStatus.ARRIVED_ON_TIME]: { text: '已到场', color: new Color(76, 175, 80) },
                    [ArrivalStatus.ARRIVED_LATE]: { text: '迟到到场', color: new Color(255, 152, 0) },
                    [ArrivalStatus.ARRIVED_EARLY]: { text: '提前到场', color: new Color(76, 175, 80) },
                };
                const info = statusMap[visitor.arrivalStatus];
                if (info) {
                    this.arrivalStatusLabel.string = info.text;
                    this.arrivalStatusLabel.color = info.color;
                }
                this.arrivalStatusLabel.node.active = true;
            }
            if (this.arrivalTimeLabel) {
                if (visitor.arrivalTime !== null) {
                    const hours = Math.floor(visitor.arrivalTime / 60);
                    const minutes = visitor.arrivalTime % 60;
                    this.arrivalTimeLabel.string = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
                this.arrivalTimeLabel.node.active = true;
            }
        } else {
            if (this.arrivalStatusLabel) {
                this.arrivalStatusLabel.string = '未到场';
                this.arrivalStatusLabel.color = Color.GRAY;
                this.arrivalStatusLabel.node.active = true;
            }
            if (this.arrivalTimeLabel) {
                this.arrivalTimeLabel.node.active = false;
            }
        }

        this.updateConflictList();
    }

    private updateConflictList(): void {
        if (!this.reservation || !this.conflictListNode) return;

        this.conflictListNode.removeAllChildren();

        const conflicts = this.reservation.conflicts;

        if (conflicts.length === 0 || (conflicts.length === 1 && conflicts[0] === ConflictType.NONE)) {
            const node = new Node('NoConflict');
            const label = node.addComponent(Label);
            label.string = '无冲突';
            label.color = new Color(76, 175, 80);
            label.fontSize = 14;
            this.conflictListNode.addChild(node);
            return;
        }

        for (const conflict of conflicts) {
            if (conflict === ConflictType.NONE) continue;

            const node = new Node('ConflictItem');
            const label = node.addComponent(Label);
            label.string = ConflictDetector.getConflictDescription(conflict);
            label.color = new Color(244, 67, 54);
            label.fontSize = 12;
            label.lineHeight = 18;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
            this.conflictListNode.addChild(node);
        }
    }

    public getReservation(): Reservation | null {
        return this.reservation;
    }
}
