import { _decorator, Component, Node, Label, Button, Color, Prefab, instantiate } from "cc";
import { ScoreRecord, ErrorCause } from "../game/ScoreManager";
import { AppointmentSystem } from "../appointment/AppointmentSystem";
import { FailedFragment, FailedFragmentStore } from "../replay/FailedFragment";
import { ReplaySession } from "../replay/ReplayTypes";

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

    onRetry(callback: () => void): void { this._onRetry.push(callback); }
    onNextLevel(callback: () => void): void { this._onNextLevel.push(callback); }
    onReplay(callback: () => void): void { this._onReplay.push(callback); }
    onStatistics(callback: () => void): void { this._onStatistics.push(callback); }

    show(record: ScoreRecord, fragmentStore: FailedFragmentStore): void {
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

        this._renderErrorDetails(record.errorCauses);
        this._renderCapacityErrors(record.errorCauses);
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
        capacitySection.addChild(header);

        for (const err of capacityErrors) {
            const detail = new Node("capacity_error");
            const detailLabel = detail.addComponent(Label);
            const categoryText = this._categoryToText(err.category);
            detailLabel.string = `[${categoryText}] ${err.description} (规则: ${err.relatedRule})`;
            detailLabel.color = new Color(200, 50, 50);
            capacitySection.addChild(detail);
        }

        if (this.errorDetailContainer) {
            this.errorDetailContainer.addChild(capacitySection);
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
        if (this.retryButton) {
            this.retryButton.node.on(Node.EventType.TOUCH_END, () => {
                for (const cb of this._onRetry) cb();
            });
        }

        if (this.nextLevelButton) {
            this.nextLevelButton.node.active = record.passed;
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
