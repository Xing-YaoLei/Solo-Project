import { _decorator, Component, Node, Label, Button, Color, Prefab, instantiate, UITransform, Layout } from "cc";
import { ScoreRecord, ErrorCause } from "../game/ScoreManager";
import { AppointmentSystem } from "../appointment/AppointmentSystem";
import { FailedFragment, FailedFragmentStore } from "../replay/FailedFragment";
import { ReplaySession, ReplayAction, ReplayActionType } from "../replay/ReplayTypes";

const { ccclass, property } = _decorator;

@ccclass("SettlementPage")
export class SettlementPage extends Component {
    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    passLabel: Label | null = null;

    @property(Label)
    arrivalRateLabel: Label | null = null;

    @property(Label)
    conflictCountLabel: Label | null = null;

    @property(Label)
    errorSummaryLabel: Label | null = null;

    @property(Node)
    errorDetailContainer: Node | null = null;

    @property(Prefab)
    errorDetailPrefab: Prefab | null = null;

    @property(Node)
    failedFragmentsContainer: Node | null = null;

    @property(Prefab)
    failedFragmentPrefab: Prefab | null = null;

    @property(Button)
    retryButton: Button | null = null;

    @property(Button)
    nextLevelButton: Button | null = null;

    @property(Button)
    replayButton: Button | null = null;

    @property(Button)
    statisticsButton: Button | null = null;

    private _onRetry: (() => void)[] = [];
    private _onNextLevel: (() => void)[] = [];
    private _onReplay: (() => void)[] = [];
    private _onStatistics: (() => void)[] = [];
    private _buttonsBound: boolean = false;

    onRetry(callback: () => void): void { this._onRetry.push(callback); }
    onNextLevel(callback: () => void): void { this._onNextLevel.push(callback); }
    onReplay(callback: () => void): void { this._onReplay.push(callback); }
    onStatistics(callback: () => void): void { this._onStatistics.push(callback); }

    show(record: ScoreRecord, fragmentStore: FailedFragmentStore, session: ReplaySession | null = null): void {
        this.node.active = true;

        if (this.titleLabel) {
            this.titleLabel.string = `关卡 ${record.levelId} 结算`;
        }

        if (this.passLabel) {
            this.passLabel.string = record.passed ? "通过" : "未通过";
            this.passLabel.color = record.passed ? Color.GREEN : Color.RED;
        }

        if (this.arrivalRateLabel) {
            this.arrivalRateLabel.string = `到场率: ${(record.arrivalRate * 100).toFixed(1)}%`;
        }

        if (this.conflictCountLabel) {
            this.conflictCountLabel.string = `冲突次数: ${record.conflictCount}`;
        }

        if (this.nextLevelButton) {
            this.nextLevelButton.node.active = record.passed;
        }

        this._renderErrorDetails(record.errorCauses);
        this._renderCapacityErrors(record.errorCauses);
        this._renderGameProcess(record.errorCauses, session);
        this._renderFailedFragments(record.levelId, fragmentStore);
        this._setupButtons(record);
    }

    hide(): void {
        this.node.active = false;
    }

    private _renderErrorDetails(causes: ErrorCause[]): void {
        if (!this.errorDetailContainer) return;
        this.errorDetailContainer.removeAllChildren();

        if (causes.length === 0) {
            const label = new Node("no_error");
            const lbl = label.addComponent(Label);
            lbl.string = "无错误";
            lbl.color = Color.GREEN;
            this.errorDetailContainer.addChild(label);
            return;
        }

        for (const cause of causes) {
            const node = this._createErrorDetailNode(cause);
            this.errorDetailContainer.addChild(node);
        }

        if (this.errorSummaryLabel) {
            const capacityErrors = causes.filter(c =>
                c.category === "capacity_exceeded" ||
                c.category === "station_overlap" ||
                c.category === "buffer_violation" ||
                c.category === "overbook_violation"
            );
            const arrivalErrors = causes.filter(c => c.category === "arrival_misjudge");
            const timeoutErrors = causes.filter(c => c.category === "timeout");

            const parts: string[] = [];
            if (capacityErrors.length > 0) parts.push(`容量规则相关${capacityErrors.length}项`);
            if (arrivalErrors.length > 0) parts.push(`到场误判${arrivalErrors.length}项`);
            if (timeoutErrors.length > 0) parts.push(`超时${timeoutErrors.length}项`);

            this.errorSummaryLabel.string = `错因统计: ${parts.join("；")}`;
        }
    }

    private _renderCapacityErrors(causes: ErrorCause[]): void {
        const capacityErrors = causes.filter(c =>
            c.category === "capacity_exceeded" ||
            c.category === "station_overlap" ||
            c.category === "buffer_violation" ||
            c.category === "overbook_violation"
        );

        if (capacityErrors.length === 0) return;

        const capacitySection = new Node("capacity_errors_section");
        const header = new Node("header");
        const headerLabel = header.addComponent(Label);
        headerLabel.string = "=== 容量规则相关错因 ===";
        headerLabel.color = Color.RED;
        headerLabel.fontSize = 16;
        capacitySection.addChild(header);

        for (const err of capacityErrors) {
            const detail = new Node("capacity_error");
            const detailTransform = detail.addComponent(UITransform);
            detailTransform.contentSize.set(380, 25);
            const detailLabel = detail.addComponent(Label);
            const categoryText = this._categoryToText(err.category);
            detailLabel.string = `[${categoryText}] ${err.description} (规则: ${err.relatedRule})`;
            detailLabel.color = new Color(200, 50, 50);
            detailLabel.fontSize = 12;
            detailLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            capacitySection.addChild(detail);
        }

        if (this.errorDetailContainer) {
            this.errorDetailContainer.addChild(capacitySection);
        }
    }

    private _renderGameProcess(causes: ErrorCause[], session: ReplaySession | null): void {
        if (!this.errorDetailContainer) return;

        const processSection = new Node("game_process_section");
        const header = new Node("header");
        const headerLabel = header.addComponent(Label);
        headerLabel.string = "=== 本局错误过程 ===";
        headerLabel.color = Color.ORANGE;
        headerLabel.fontSize = 16;
        processSection.addChild(header);

        let hasContent = false;

        if (session && session.actions) {
            const arrivalMisjudges = session.actions.filter(
                a => a.type === ReplayActionType.ARRIVAL_CHECK && a.isCorrect === false
            );
            const conflicts = session.actions.filter(
                a => a.type === ReplayActionType.CONFLICT_OCCURRED
            );

            if (arrivalMisjudges.length > 0) {
                hasContent = true;
                const subHeader = new Node("arrival_header");
                const subLabel = subHeader.addComponent(Label);
                subLabel.string = `到场误判 (${arrivalMisjudges.length}项):`;
                subLabel.color = new Color(255, 200, 0);
                subLabel.fontSize = 14;
                subLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                processSection.addChild(subHeader);

                for (const action of arrivalMisjudges) {
                    const detail = new Node("misjudge");
                    const detailTransform = detail.addComponent(UITransform);
                    detailTransform.contentSize.set(380, 22);
                    const detailLabel = detail.addComponent(Label);
                    const customerName = this._getCustomerName(action.customerId, session);
                    detailLabel.string = `  × ${customerName}: 判定为「${this._statusText(action.newStatus || "")}」，正确应为「${this._statusText(action.previousStatus || "")}」`;
                    detailLabel.color = new Color(255, 150, 0);
                    detailLabel.fontSize = 12;
                    detailLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                    processSection.addChild(detail);
                }
            }

            if (conflicts.length > 0) {
                hasContent = true;
                const subHeader = new Node("conflict_header");
                const subLabel = subHeader.addComponent(Label);
                subLabel.string = `时段冲突 (${conflicts.length}项):`;
                subLabel.color = new Color(255, 100, 0);
                subLabel.fontSize = 14;
                subLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                processSection.addChild(subHeader);

                for (const action of conflicts) {
                    const detail = new Node("conflict");
                    const detailTransform = detail.addComponent(UITransform);
                    detailTransform.contentSize.set(380, 22);
                    const detailLabel = detail.addComponent(Label);
                    const customerName = this._getCustomerName(action.customerId, session);
                    detailLabel.string = `  × ${customerName} → 工位${(action.stationIndex ?? -1) + 1} ${action.time}: ${action.conflictMessage}`;
                    detailLabel.color = new Color(255, 100, 0);
                    detailLabel.fontSize = 12;
                    detailLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                    processSection.addChild(detail);
                }
            }
        }

        if (!hasContent) {
            const noError = new Node("no_error");
            const noErrorLabel = noError.addComponent(Label);
            noErrorLabel.string = "本局无错误过程";
            noErrorLabel.color = Color.GREEN;
            noErrorLabel.fontSize = 14;
            processSection.addChild(noError);
        }

        this.errorDetailContainer.addChild(processSection);
    }

    private _getCustomerName(customerId: string, session: ReplaySession): string {
        return customerId;
    }

    private _statusText(status: string): string {
        switch (status) {
            case "arrived": return "已到场";
            case "late": return "迟到";
            case "no_show": return "未到场";
            case "cancelled": return "已取消";
            case "walk_in": return "临时到店";
            case "pending": return "待确认";
            default: return status;
        }
    }

    private _renderFailedFragments(levelId: string, fragmentStore: FailedFragmentStore): void {
        if (!this.failedFragmentsContainer) return;
        this.failedFragmentsContainer.removeAllChildren();

        const fragments = fragmentStore.getFragments(levelId);
        if (fragments.length === 0) return;

        const header = new Node("fragments_header");
        const headerLabel = header.addComponent(Label);
        headerLabel.string = `最近失败片段 (保留${fragments.length}次)`;
        headerLabel.color = Color.ORANGE;
        this.failedFragmentsContainer.addChild(header);

        for (let i = 0; i < fragments.length; i++) {
            const frag = fragments[i];
            const node = new Node(`fragment_${i}`);
            const label = node.addComponent(Label);
            const timeStr = new Date(frag.timestamp).toLocaleTimeString();
            label.string = `[${timeStr}] 到场率: ${(frag.arrivalRate * 100).toFixed(1)}% | ${frag.errorSummary}`;
            label.color = Color.YELLOW;
            this.failedFragmentsContainer.addChild(node);
        }
    }

    private _setupButtons(record: ScoreRecord): void {
        if (this._buttonsBound) return;

        if (this.retryButton) {
            this.retryButton.node.on(Node.EventType.TOUCH_END, () => {
                for (const cb of this._onRetry) cb();
            });
        }

        if (this.nextLevelButton) {
            this.nextLevelButton.node.on(Node.EventType.TOUCH_END, () => {
                for (const cb of this._onNextLevel) cb();
            });
        }

        if (this.replayButton) {
            this.replayButton.node.on(Node.EventType.TOUCH_END, () => {
                for (const cb of this._onReplay) cb();
            });
        }

        if (this.statisticsButton) {
            this.statisticsButton.node.on(Node.EventType.TOUCH_END, () => {
                for (const cb of this._onStatistics) cb();
            });
        }

        this._buttonsBound = true;
    }

    private _createErrorDetailNode(cause: ErrorCause): Node {
        const node = this.errorDetailPrefab
            ? instantiate(this.errorDetailPrefab)
            : new Node("error_detail");

        const label = node.getComponentInChildren(Label) || node.addComponent(Label);
        const categoryText = this._categoryToText(cause.category);
        label.string = `[${categoryText}] ${cause.description}`;
        label.color = cause.category === "timeout" ? Color.ORANGE : Color.RED;

        return node;
    }

    private _categoryToText(category: ErrorCause["category"]): string {
        switch (category) {
            case "capacity_exceeded": return "容量超限";
            case "station_overlap": return "工位冲突";
            case "buffer_violation": return "缓冲违规";
            case "arrival_misjudge": return "到场误判";
            case "timeout": return "超时";
            case "overbook_violation": return "超售违规";
            default: return "未知";
        }
    }
}
