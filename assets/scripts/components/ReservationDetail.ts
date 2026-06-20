import { _decorator, Component, Node, Label, Sprite, Color } from 'cc';
import { Reservation } from '../models';
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

    @property(Prefab)
    conflictItemPrefab: any = null;

    @property(Label)
    notesLabel: Label | null = null;

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
