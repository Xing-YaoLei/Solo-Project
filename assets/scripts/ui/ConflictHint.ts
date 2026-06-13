import { _decorator, Component, Node, Label, Color, Tween, tween, UIOpacity } from "cc";
import { ConflictInfo, ConflictType } from "../appointment/ConflictDetector";

const { ccclass, property } = _decorator;

const HINT_DISPLAY_DURATION = 3.0;
const HINT_FADE_DURATION = 0.5;

@ccclass("ConflictHint")
export class ConflictHint extends Component {
    @property(Label)
    hintLabel: Label | null = null;

    @property(Node)
    hintContainer: Node | null = null;

    private _activeHints: Map<string, { node: Node; conflict: ConflictInfo; remaining: number }> = new Map();
    private _onHintAcknowledge: ((conflict: ConflictInfo) => void)[] = [];

    onHintAcknowledge(callback: (conflict: ConflictInfo) => void): void {
        this._onHintAcknowledge.push(callback);
    }

    showConflictHint(conflict: ConflictInfo): void {
        const key = `${conflict.stationIndex}_${conflict.time}_${conflict.type}`;

        if (this._activeHints.has(key)) {
            const existing = this._activeHints.get(key)!;
            existing.remaining = HINT_DISPLAY_DURATION;
            return;
        }

        const node = this._createHintNode(conflict);
        if (this.hintContainer) {
            this.hintContainer.addChild(node);
        } else {
            this.node.addChild(node);
        }

        this._activeHints.set(key, {
            node,
            conflict,
            remaining: HINT_DISPLAY_DURATION
        });
    }

    showAdvanceWarning(stationIndex: number, time: string, advanceSeconds: number): void {
        const node = this._createWarningNode(stationIndex, time, advanceSeconds);
        if (this.hintContainer) {
            this.hintContainer.addChild(node);
        } else {
            this.node.addChild(node);
        }

        const key = `warning_${stationIndex}_${time}`;
        this._activeHints.set(key, {
            node,
            conflict: {
                type: ConflictType.NONE,
                stationIndex,
                time,
                existingCustomerId: "",
                newCustomerId: "",
                severity: "warning",
                message: `时段冲突预警：${time} 即将出现冲突`
            },
            remaining: advanceSeconds
        });
    }

    update(dt: number): void {
        const expired: string[] = [];

        for (const [key, hint] of this._activeHints) {
            hint.remaining -= dt;

            if (hint.remaining <= HINT_FADE_DURATION && hint.remaining > 0) {
                const opacity = hint.node.getComponent(UIOpacity) || hint.node.addComponent(UIOpacity);
                const targetOpacity = (hint.remaining / HINT_FADE_DURATION) * 255;
                opacity.opacity = targetOpacity;
            }

            if (hint.remaining <= 0) {
                expired.push(key);
            }
        }

        for (const key of expired) {
            const hint = this._activeHints.get(key)!;
            hint.node.destroy();
            this._activeHints.delete(key);
        }
    }

    clearAll(): void {
        for (const [, hint] of this._activeHints) {
            hint.node.destroy();
        }
        this._activeHints.clear();
    }

    hasActiveHints(): boolean {
        return this._activeHints.size > 0;
    }

    getActiveHintCount(): number {
        return this._activeHints.size;
    }

    private _createHintNode(conflict: ConflictInfo): Node {
        const node = new Node(`hint_${conflict.type}`);
        const label = node.addComponent(Label);

        const icon = conflict.severity === "error" ? "🔴" : "🟡";
        const typeText = this._conflictTypeToText(conflict.type);
        label.string = `${icon} [${typeText}] ${conflict.message}`;
        label.color = conflict.severity === "error" ? Color.RED : Color.YELLOW;

        node.on(Node.EventType.TOUCH_END, () => {
            for (const cb of this._onHintAcknowledge) {
                cb(conflict);
            }
        });

        return node;
    }

    private _createWarningNode(stationIndex: number, time: string, advanceSeconds: number): Node {
        const node = new Node(`warning_${stationIndex}_${time}`);
        const label = node.addComponent(Label);
        label.string = `⚠ 预警：工位${stationIndex + 1} ${time}时段 ${advanceSeconds}秒后可能出现冲突`;
        label.color = Color.YELLOW;

        return node;
    }

    private _conflictTypeToText(type: ConflictType): string {
        switch (type) {
            case ConflictType.STATION_OVERLAP: return "工位冲突";
            case ConflictType.CAPACITY_EXCEEDED: return "容量超限";
            case ConflictType.BUFFER_VIOLATION: return "缓冲违规";
            case ConflictType.DOUBLE_BOOK: return "重复预约";
            default: return "提示";
        }
    }
}
