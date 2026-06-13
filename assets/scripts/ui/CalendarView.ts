import { _decorator, Component, Node, Label, Color, Prefab, instantiate, ScrollView } from "cc";
import { TimeSlot, SlotStatus } from "../appointment/TimeSlot";
import { AppointmentSystem } from "../appointment/AppointmentSystem";
import { ConflictInfo } from "../appointment/ConflictDetector";
import { Customer } from "../appointment/Customer";

const { ccclass, property } = _decorator;

export interface CalendarSlotClickEvent {
    stationIndex: number;
    time: string;
    slot: TimeSlot;
}

@ccclass("CalendarView")
export class CalendarView extends Component {
    @property(ScrollView)
    scrollView: ScrollView | null = null;

    @property(Prefab)
    slotPrefab: Prefab | null = null;

    @property(Label)
    stationHeaderPrefab: Label | null = null;

    private _slotNodes: Map<string, Node> = new Map();
    private _onSlotClick: ((event: CalendarSlotClickEvent) => void)[] = [];
    private _onSlotHover: ((event: CalendarSlotClickEvent) => void)[] = [];
    private _appointmentSystem: AppointmentSystem | null = null;
    private _conflictHints: Map<string, ConflictInfo[]> = new Map();

    onSlotClick(callback: (event: CalendarSlotClickEvent) => void): void {
        this._onSlotClick.push(callback);
    }

    onSlotHover(callback: (event: CalendarSlotClickEvent) => void): void {
        this._onSlotHover.push(callback);
    }

    bindAppointmentSystem(system: AppointmentSystem): void {
        this._appointmentSystem = system;
        this._refreshView();
    }

    registerSlotNode(stationIndex: number, time: string, node: Node): void {
        const key = `${stationIndex}_${time}`;
        this._slotNodes.set(key, node);
    }

    refresh(): void {
        this._refreshView();
    }

    private _configureSlotNode(node: Node, slot: TimeSlot): void {
        const label = node.getComponentInChildren(Label);
        if (!label) {
            const labelNode = new Node("Label");
            node.addChild(labelNode);
            const labelComp = labelNode.addComponent(Label);
            labelComp.string = slot.time;
            labelComp.fontSize = 14;
        }

        node.on(Node.EventType.TOUCH_END, () => {
            this._handleSlotClick(slot.stationIndex, slot.time);
        });
        node.on(Node.EventType.TOUCH_START, () => {
            this._handleSlotHover(slot.stationIndex, slot.time);
        });
    }

    private _refreshView(): void {
        if (!this._appointmentSystem) return;

        for (const slot of this._appointmentSystem.slots) {
            const key = slot.key;
            let node = this._slotNodes.get(key);
            if (!node) {
                if (this.slotPrefab) {
                    node = instantiate(this.slotPrefab);
                } else {
                    node = new Node(`slot_${key}`);
                }
                this.node.addChild(node);
                this._slotNodes.set(key, node);
                this._configureSlotNode(node, slot);
            }
            this._applySlotStyle(node, slot);
        }
    }

    private _getOrCreateSlotNode(slot: TimeSlot): Node {
        const key = slot.key;
        let node = this._slotNodes.get(key);
        if (!node) {
            if (this.slotPrefab) {
                node = instantiate(this.slotPrefab);
            } else {
                node = new Node(`slot_${key}`);
            }
            this.node.addChild(node);
            this._slotNodes.set(key, node);
        }
        return node;
    }

    private _applySlotStyle(node: Node, slot: TimeSlot): void {
        const label = node.getComponentInChildren(Label);
        if (!label) return;

        let displayText = slot.time;
        if (slot.status === SlotStatus.OCCUPIED) {
            const customer = this._appointmentSystem?.customers.get(slot.customerId);
            displayText = customer ? `${slot.time}\n${customer.name}` : slot.time;
            label.color = Color.WHITE;
        } else if (slot.status === SlotStatus.CONFLICT) {
            displayText = `${slot.time}\n⚠冲突`;
            label.color = Color.RED;
        } else if (slot.status === SlotStatus.BUFFER) {
            displayText = `${slot.time}\n缓冲`;
            label.color = new Color(200, 200, 200);
        } else {
            label.color = Color.BLACK;
        }

        label.string = displayText;

        const hintKey = `${slot.stationIndex}_${slot.time}`;
        const hints = this._conflictHints.get(hintKey);
        if (hints && hints.length > 0) {
            label.color = Color.YELLOW;
        }
    }

    showConflictHint(stationIndex: number, time: string, conflicts: ConflictInfo[]): void {
        const key = `${stationIndex}_${time}`;
        this._conflictHints.set(key, conflicts);

        const slotKey = `${stationIndex}_${time}`;
        const node = this._slotNodes.get(slotKey);
        if (node) {
            const label = node.getComponentInChildren(Label);
            if (label) {
                label.color = Color.YELLOW;
                label.string = `${time}\n⚠${conflicts.length}项预警`;
            }
        }
    }

    clearConflictHint(stationIndex: number, time: string): void {
        const key = `${stationIndex}_${time}`;
        this._conflictHints.delete(key);
    }

    highlightSlot(stationIndex: number, time: string, color: Color): void {
        const key = `${stationIndex}_${time}`;
        const node = this._slotNodes.get(key);
        if (node) {
            const label = node.getComponentInChildren(Label);
            if (label) {
                label.color = color;
            }
        }
    }

    private _handleSlotClick(stationIndex: number, time: string): void {
        if (!this._appointmentSystem) return;

        const slot = this._appointmentSystem.slots.find(
            s => s.stationIndex === stationIndex && s.time === time
        );
        if (slot) {
            for (const cb of this._onSlotClick) {
                cb({ stationIndex, time, slot });
            }
        }
    }

    private _handleSlotHover(stationIndex: number, time: string): void {
        if (!this._appointmentSystem) return;

        const slot = this._appointmentSystem.slots.find(
            s => s.stationIndex === stationIndex && s.time === time
        );
        if (slot) {
            for (const cb of this._onSlotHover) {
                cb({ stationIndex, time, slot });
            }
        }
    }

    private _clearSlotNodes(): void {
        for (const [, node] of this._slotNodes) {
            node.destroy();
        }
        this._slotNodes.clear();
    }
}
