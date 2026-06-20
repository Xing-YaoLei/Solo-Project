import { _decorator, Component, Node, Button, Label, Color, Sprite } from 'cc';
import { ActionType } from '../models/GameEnums';
import { GameManager } from '../core/GameManager';
import { ToastManager } from '../utils/ToastManager';
const { ccclass, property } = _decorator;

@ccclass('ActionPanel')
export class ActionPanel extends Component {
    @property(Button)
    approveBtn: Button | null = null;

    @property(Button)
    rejectBtn: Button | null = null;

    @property(Button)
    rescheduleBtn: Button | null = null;

    @property(Node)
    reschedulePanel: Node | null = null;

    @property(Node)
    rescheduleSlotList: Node | null = null;

    @property(Button)
    confirmRescheduleBtn: Button | null = null;

    @property(Button)
    cancelRescheduleBtn: Button | null = null;

    private selectedSlotIndex: number = -1;
    private isRescheduleMode: boolean = false;

    onLoad() {
        this.registerEvents();
        this.updateButtonStates();
    }

    private registerEvents(): void {
        if (this.approveBtn) {
            this.approveBtn.node.on(Button.EventType.CLICK, this.onApproveClick, this);
        }
        if (this.rejectBtn) {
            this.rejectBtn.node.on(Button.EventType.CLICK, this.onRejectClick, this);
        }
        if (this.rescheduleBtn) {
            this.rescheduleBtn.node.on(Button.EventType.CLICK, this.onRescheduleClick, this);
        }
        if (this.confirmRescheduleBtn) {
            this.confirmRescheduleBtn.node.on(Button.EventType.CLICK, this.onConfirmReschedule, this);
        }
        if (this.cancelRescheduleBtn) {
            this.cancelRescheduleBtn.node.on(Button.EventType.CLICK, this.onCancelReschedule, this);
        }
    }

    private onApproveClick(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.getSelectedReservation()) {
            ToastManager.instance?.showError('请先选择一个预约');
            return;
        }
        gameManager.processAction(ActionType.APPROVE_RESERVATION);
        this.onActionComplete();
    }

    private onRejectClick(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.getSelectedReservation()) {
            ToastManager.instance?.showError('请先选择一个预约');
            return;
        }
        gameManager.processAction(ActionType.REJECT_RESERVATION);
        this.onActionComplete();
    }

    private onRescheduleClick(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.getSelectedReservation()) {
            ToastManager.instance?.showError('请先选择一个预约');
            return;
        }
        this.showReschedulePanel();
    }

    private showReschedulePanel(): void {
        this.isRescheduleMode = true;
        this.selectedSlotIndex = -1;

        if (this.reschedulePanel) {
            this.reschedulePanel.active = true;
        }

        this.populateRescheduleSlots();
    }

    private hideReschedulePanel(): void {
        this.isRescheduleMode = false;
        if (this.reschedulePanel) {
            this.reschedulePanel.active = false;
        }
    }

    private populateRescheduleSlots(): void {
        if (!this.rescheduleSlotList) return;

        this.rescheduleSlotList.removeAllChildren();

        const gameManager = GameManager.instance;
        const reservation = gameManager?.getSelectedReservation();
        if (!reservation) return;

        const spot = gameManager?.getScenicSpot(reservation.scenicSpotId);
        if (!spot) return;

        const availableSlots = spot.getAvailableTimeSlots(reservation.visitor.ticketCount);

        for (let i = 0; i < spot.timeSlots.length; i++) {
            const slot = spot.timeSlots[i];
            const isAvailable = slot.hasCapacity(reservation.visitor.ticketCount);

            const node = new Node('SlotItem');
            node.setContentSize(200, 40);

            const bg = node.addComponent(Sprite);
            bg.type = Sprite.Type.SIMPLE;
            bg.color = isAvailable ? new Color(232, 245, 233) : new Color(245, 245, 245);

            const label = node.addComponent(Label);
            label.string = `${slot.formatTime()} (剩余${slot.getAvailableSlots()})`;
            label.fontSize = 14;
            label.color = isAvailable ? new Color(76, 175, 80) : Color.GRAY;

            const button = node.addComponent(Button);
            button.interactable = isAvailable;

            const slotIndex = i;
            node.on(Button.EventType.CLICK, () => {
                if (isAvailable) {
                    this.selectSlot(slotIndex, node);
                }
            }, this);

            this.rescheduleSlotList.addChild(node);
        }
    }

    private selectSlot(index: number, node: Node): void {
        this.selectedSlotIndex = index;

        if (this.rescheduleSlotList) {
            for (let i = 0; i < this.rescheduleSlotList.children.length; i++) {
                const child = this.rescheduleSlotList.children[i];
                const bg = child.getComponent(Sprite);
                if (bg) {
                    bg.color = i === index ? new Color(33, 150, 243) : new Color(232, 245, 233);
                }
                const label = child.getComponent(Label);
                if (label) {
                    label.color = i === index ? Color.WHITE : new Color(76, 175, 80);
                }
            }
        }
    }

    private onConfirmReschedule(): void {
        if (this.selectedSlotIndex < 0) {
            ToastManager.instance?.showError('请选择一个改约时段');
            return;
        }

        const gameManager = GameManager.instance;
        if (!gameManager) return;

        gameManager.processAction(ActionType.RESCHEDULE, this.selectedSlotIndex);
        this.hideReschedulePanel();
        this.onActionComplete();
    }

    private onCancelReschedule(): void {
        this.hideReschedulePanel();
    }

    private onActionComplete(): void {
        this.updateButtonStates();
        this.hideReschedulePanel();
    }

    public updateButtonStates(): void {
        const gameManager = GameManager.instance;
        const hasSelection = gameManager?.getSelectedReservation() !== null;

        if (this.approveBtn) {
            this.approveBtn.interactable = hasSelection;
        }
        if (this.rejectBtn) {
            this.rejectBtn.interactable = hasSelection;
        }
        if (this.rescheduleBtn) {
            this.rescheduleBtn.interactable = hasSelection;
        }
    }

    public isInRescheduleMode(): boolean {
        return this.isRescheduleMode;
    }
}
