import { _decorator, Component, Node, Label, Prefab, instantiate, ScrollView, Color, UITransform } from "cc";
import { Customer, ArrivalStatus } from "../appointment/Customer";
import { AppointmentSystem } from "../appointment/AppointmentSystem";

const { ccclass, property } = _decorator;

export interface ReminderEntry {
    customerId: string;
    customerName: string;
    serviceId: string;
    preferredTime: string;
    status: ArrivalStatus;
    isUrgent: boolean;
}

@ccclass("ReminderList")
export class ReminderList extends Component {
    @property(ScrollView)
    scrollView: ScrollView | null = null;

    @property(Prefab)
    entryPrefab: Prefab | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Node)
    entryContainer: Node | null = null;

    private _entries: ReminderEntry[] = [];
    private _onEntryClick: ((entry: ReminderEntry) => void)[] = [];
    private _appointmentSystem: AppointmentSystem | null = null;
    private _entryNodes: Map<string, Node> = new Map();

    onEntryClick(callback: (entry: ReminderEntry) => void): void {
        this._onEntryClick.push(callback);
    }

    bindAppointmentSystem(system: AppointmentSystem): void {
        this._appointmentSystem = system;
        this.refresh();
    }

    refresh(): void {
        if (!this._appointmentSystem) return;

        this._entries = this._buildEntries();
        this._renderEntries();

        if (this.countLabel) {
            const pending = this._entries.filter(e => e.status === ArrivalStatus.PENDING).length;
            const urgent = this._entries.filter(e => e.isUrgent).length;
            this.countLabel.string = `待确认: ${pending} | 紧急: ${urgent}`;
        }
    }

    private _buildEntries(): ReminderEntry[] {
        if (!this._appointmentSystem) return [];

        const entries: ReminderEntry[] = [];
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const [, customer] of this._appointmentSystem.customers) {
            if (customer.isCancelled()) continue;
            if (customer.assignedStation >= 0) continue;

            const preferredMin = this._timeToMinutes(customer.preferredTime);
            const isUrgent = customer.arrivalStatus === ArrivalStatus.PENDING &&
                Math.abs(preferredMin - currentMinutes) < 30;

            entries.push({
                customerId: customer.id,
                customerName: customer.name,
                serviceId: customer.serviceId,
                preferredTime: customer.preferredTime,
                status: customer.arrivalStatus,
                isUrgent
            });
        }

        return entries.sort((a, b) => {
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;
            return this._timeToMinutes(a.preferredTime) - this._timeToMinutes(b.preferredTime);
        });
    }

    private _renderEntries(): void {
        const container = this.entryContainer || this.node;
        this._clearEntries();

        for (const entry of this._entries) {
            const node = this._createEntryNode(entry);
            container.addChild(node);
            this._entryNodes.set(entry.customerId, node);
        }
    }

    private _createEntryNode(entry: ReminderEntry): Node {
        let node: Node;
        if (this.entryPrefab) {
            node = instantiate(this.entryPrefab);
        } else {
            node = new Node(`reminder_${entry.customerId}`);
            node.addComponent(UITransform);
            const transform = node.getComponent(UITransform);
            if (transform) {
                transform.contentSize.set(360, 30);
            }
            const labelNode = new Node("Label");
            node.addChild(labelNode);
            labelNode.addComponent(Label);
        }

        const label = node.getComponentInChildren(Label);
        if (label) {
            const statusText = this._statusToText(entry.status);
            label.string = `${entry.customerName} | ${entry.preferredTime} | ${statusText}`;
            label.color = entry.isUrgent ? Color.RED : Color.BLACK;
            label.fontSize = 14;
        }

        node.on(Node.EventType.TOUCH_END, () => {
            for (const cb of this._onEntryClick) {
                cb(entry);
            }
        });

        return node;
    }

    private _clearEntries(): void {
        for (const [, node] of this._entryNodes) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        this._entryNodes.clear();
    }

    private _statusToText(status: ArrivalStatus): string {
        switch (status) {
            case ArrivalStatus.ARRIVED: return "已到场";
            case ArrivalStatus.LATE: return "迟到";
            case ArrivalStatus.NO_SHOW: return "未到";
            case ArrivalStatus.CANCELLED: return "已取消";
            case ArrivalStatus.WALK_IN: return "临时到店";
            case ArrivalStatus.PENDING: return "待确认";
            default: return "未知";
        }
    }

    private _timeToMinutes(time: string): number {
        if (!time) return 0;
        const parts = time.split(":");
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
}
