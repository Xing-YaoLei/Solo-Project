import { _decorator, Component, Node, Button, Label, Color, Sprite, UITransform, Layout, Widget } from 'cc';
import { ActionType, ConflictType, ArrivalStatus } from '../models/GameEnums';
import { GameManager, ActionFeedback } from '../core/GameManager';
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

    @property(Button)
    checkInBtn: Button | null = null;

    @property(Button)
    denyEntryBtn: Button | null = null;

    @property(Node)
    reschedulePanel: Node | null = null;

    @property(Node)
    rescheduleSlotList: Node | null = null;

    @property(Button)
    confirmRescheduleBtn: Button | null = null;

    @property(Button)
    cancelRescheduleBtn: Button | null = null;

    @property(Label)
    feedbackLabel: Label | null = null;

    private selectedSlotIndex: number = -1;
    private isRescheduleMode: boolean = false;
    private onFeedbackCallback: ((fb: ActionFeedback) => void) | null = null;

    onLoad() {
        this.registerEvents();
        this.updateButtonStates();
        if (this.reschedulePanel) this.reschedulePanel.active = false;
        if (this.feedbackLabel) {
            this.feedbackLabel.string = '';
            this.feedbackLabel.node.active = false;
        }
    }

    public setOnFeedbackCallback(cb: (fb: ActionFeedback) => void): void {
        this.onFeedbackCallback = cb;
    }

    private registerEvents(): void {
        if (this.approveBtn) this.approveBtn.node.on(Button.EventType.CLICK, () => this.executeAction(ActionType.APPROVE_RESERVATION), this);
        if (this.rejectBtn) this.rejectBtn.node.on(Button.EventType.CLICK, () => this.executeAction(ActionType.REJECT_RESERVATION), this);
        if (this.rescheduleBtn) this.rescheduleBtn.node.on(Button.EventType.CLICK, this.onRescheduleClick, this);
        if (this.checkInBtn) this.checkInBtn.node.on(Button.EventType.CLICK, () => this.executeAction(ActionType.CHECK_IN), this);
        if (this.denyEntryBtn) this.denyEntryBtn.node.on(Button.EventType.CLICK, () => this.executeAction(ActionType.DENY_ENTRY), this);
        if (this.confirmRescheduleBtn) this.confirmRescheduleBtn.node.on(Button.EventType.CLICK, this.onConfirmReschedule, this);
        if (this.cancelRescheduleBtn) this.cancelRescheduleBtn.node.on(Button.EventType.CLICK, this.onCancelReschedule, this);
    }

    private executeAction(action: ActionType): void {
        const gm = GameManager.instance;
        if (!gm || !gm.getSelectedReservation()) {
            ToastManager.instance?.showError('请先选择一个预约');
            return;
        }

        const fb = gm.processAction(action);
        this.showFeedback(fb);
        if (this.onFeedbackCallback) this.onFeedbackCallback(fb);
    }

    private showFeedback(fb: ActionFeedback): void {
        if (this.feedbackLabel) {
            this.feedbackLabel.string = fb.message;
            this.feedbackLabel.node.active = true;
            this.feedbackLabel.color = fb.correct ? new Color(76, 175, 80) : new Color(244, 67, 54);
        }
        if (fb.correct) {
            ToastManager.instance?.showSuccess(fb.message);
        } else {
            ToastManager.instance?.showError(fb.message);
        }
    }

    private onRescheduleClick(): void {
        const gm = GameManager.instance;
        if (!gm || !gm.getSelectedReservation()) {
            ToastManager.instance?.showError('请先选择一个预约');
            return;
        }
        this.showReschedulePanel();
    }

    private showReschedulePanel(): void {
        this.isRescheduleMode = true;
        this.selectedSlotIndex = -1;
        if (this.reschedulePanel) this.reschedulePanel.active = true;
        this.populateRescheduleSlots();
    }

    private hideReschedulePanel(): void {
        this.isRescheduleMode = false;
        if (this.reschedulePanel) this.reschedulePanel.active = false;
    }

    private populateRescheduleSlots(): void {
        if (!this.rescheduleSlotList) return;
        this.rescheduleSlotList.removeAllChildren();

        const gm = GameManager.instance;
        const reservation = gm?.getSelectedReservation();
        if (!reservation) return;

        const spot = gm?.getScenicSpot(reservation.scenicSpotId);
        if (!spot) return;

        const currentSlotIdx = spot.timeSlots.findIndex(s =>
            s.startTime === reservation.timeSlot.startTime && s.endTime === reservation.timeSlot.endTime
        );

        for (let i = 0; i < spot.timeSlots.length; i++) {
            const slot = spot.timeSlots[i];
            const isCurrent = (i === currentSlotIdx);
            const isAvailable = slot.hasCapacity(reservation.visitor.ticketCount) && !isCurrent;

            const node = new Node('SlotItem');
            const uiTransform = node.addComponent(UITransform);
            uiTransform.setContentSize(360, 40);

            const bg = node.addComponent(Sprite);
            bg.type = Sprite.Type.SIMPLE;
            bg.sizeMode = Sprite.SizeMode.CUSTOM;
            bg.color = isCurrent ? new Color(255, 235, 238) : (isAvailable ? new Color(232, 245, 233) : new Color(245, 245, 245));

            const label = node.addComponent(Label);
            const suffix = isCurrent ? ' [当前时段]' : ` (剩余${slot.getAvailableSlots()})`;
            label.string = slot.formatTime() + suffix;
            label.fontSize = 14;
            label.color = isCurrent ? new Color(244, 67, 54) : (isAvailable ? new Color(76, 175, 80) : Color.GRAY);
            label.horizontalAlign = Label.HorizontalAlign.LEFT;

            if (isAvailable) {
                const btn = node.addComponent(Button);
                const idx = i;
                node.on(Button.EventType.CLICK, () => this.selectSlot(idx), this);
            }

            this.rescheduleSlotList.addChild(node);
        }
    }

    private selectSlot(index: number): void {
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

        const gm = GameManager.instance;
        if (!gm) return;

        const fb = gm.processAction(ActionType.RESCHEDULE, this.selectedSlotIndex);
        this.hideReschedulePanel();
        this.showFeedback(fb);
        if (this.onFeedbackCallback) this.onFeedbackCallback(fb);
    }

    private onCancelReschedule(): void {
        this.hideReschedulePanel();
    }

    public updateButtonStates(): void {
        const gm = GameManager.instance;
        const reservation = gm?.getSelectedReservation();
        const hasSelection = reservation !== null;
        const isArrival = reservation?.isArrivalTask() ?? false;

        if (this.approveBtn) {
            this.approveBtn.node.active = !isArrival;
            this.approveBtn.interactable = hasSelection && !isArrival;
        }
        if (this.rejectBtn) {
            this.rejectBtn.node.active = !isArrival;
            this.rejectBtn.interactable = hasSelection && !isArrival;
        }
        if (this.rescheduleBtn) {
            this.rescheduleBtn.node.active = !isArrival;
            this.rescheduleBtn.interactable = hasSelection && !isArrival;
        }
        if (this.checkInBtn) {
            this.checkInBtn.node.active = isArrival;
            this.checkInBtn.interactable = hasSelection && isArrival;
        }
        if (this.denyEntryBtn) {
            this.denyEntryBtn.node.active = isArrival;
            this.denyEntryBtn.interactable = hasSelection && isArrival;
        }
    }

    public isInRescheduleMode(): boolean {
        return this.isRescheduleMode;
    }
}
