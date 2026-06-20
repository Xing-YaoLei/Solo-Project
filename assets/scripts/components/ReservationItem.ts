import { _decorator, Component, Node, Label, Sprite, Color } from 'cc';
import { Reservation } from '../models';
import { ReservationStatus, ConflictType } from '../models/GameEnums';
const { ccclass, property } = _decorator;

@ccclass('ReservationItem')
export class ReservationItem extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    spotLabel: Label | null = null;

    @property(Label)
    ticketCountLabel: Label | null = null;

    @property(Sprite)
    statusIndicator: Sprite | null = null;

    @property(Node)
    conflictFlag: Node | null = null;

    @property(Sprite)
    background: Sprite | null = null;

    @property(Node)
    selectedBorder: Node | null = null;

    private reservation: Reservation | null = null;
    private isSelected: boolean = false;

    public setData(reservation: Reservation, spotName: string): void {
        this.reservation = reservation;

        if (this.nameLabel) {
            this.nameLabel.string = reservation.visitor.name;
        }
        if (this.timeLabel) {
            this.timeLabel.string = reservation.timeSlot.formatTime();
        }
        if (this.spotLabel) {
            this.spotLabel.string = spotName;
        }
        if (this.ticketCountLabel) {
            this.ticketCountLabel.string = `x${reservation.visitor.ticketCount}`;
        }

        this.updateStatus();
        this.updateConflictFlag();
        this.setSelected(false);
    }

    private updateStatus(): void {
        if (!this.reservation || !this.statusIndicator) return;

        let color = Color.GRAY;
        switch (this.reservation.status) {
            case ReservationStatus.PENDING:
                color = new Color(255, 193, 7);
                break;
            case ReservationStatus.CONFIRMED:
                color = new Color(76, 175, 80);
                break;
            case ReservationStatus.CANCELLED:
                color = new Color(158, 158, 158);
                break;
            case ReservationStatus.RESCHEDULED:
                color = new Color(33, 150, 243);
                break;
            default:
                color = Color.GRAY;
                break;
        }
        this.statusIndicator.color = color;
    }

    private updateConflictFlag(): void {
        if (!this.reservation || !this.conflictFlag) return;

        const hasConflict = this.reservation.hasConflict();
        this.conflictFlag.active = hasConflict;

        if (hasConflict && this.background) {
            this.background.color = new Color(255, 235, 238);
        } else if (this.background) {
            this.background.color = Color.WHITE;
        }
    }

    public setSelected(selected: boolean): void {
        this.isSelected = selected;
        if (this.selectedBorder) {
            this.selectedBorder.active = selected;
        }
    }

    public getReservation(): Reservation | null {
        return this.reservation;
    }

    public isPending(): boolean {
        return this.reservation?.status === ReservationStatus.PENDING;
    }
}
