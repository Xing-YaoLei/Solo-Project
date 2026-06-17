import { _decorator, Component, Node, Label, Sprite, Color, Button, Prefab, instantiate, Vec3, Layers, UITransform, Graphics, Layout, ScrollView, ProgressBar } from 'cc';
import { game } from '../Game';
import { ReviewManager, IReviewItem, IErrorStats, ERROR_TYPE_DESCRIPTIONS } from '../game/LeaderboardManager';
import { EventManager, GameEventType } from '../core/EventManager';
import { SaveManager } from '../core/SaveManager';
import { Logger } from '../core/Logger';
const { ccclass, property } = _decorator;

@ccclass('ReviewPanelUI')
export class ReviewPanelUI extends Component {
    @property(Node)
    summaryArea: Node | null = null;

    @property(Node)
    errorsArea: Node | null = null;

    @property(Node)
    recordsArea: Node | null = null;

    @property(Node)
    firstSolveArea: Node | null = null;

    @property(Label)
    summaryTitle: Label | null = null;

    @property(Label)
    totalAttemptsLabel: Label | null = null;

    @property(Label)
    passedLabel: Label | null = null;

    @property(Label)
    failedLabel: Label | null = null;

    @property(Label)
    firstSolveRateLabel: Label | null = null;

    @property(Label)
    avgScoreLabel: Label | null = null;

    @property(Label)
    avgTimeLabel: Label | null = null;

    @property(ProgressBar)
    firstSolveProgress: ProgressBar | null = null;

    @property(Button)
    closeButton: Button | null = null;

    @property(Button)
    exportButton: Button | null = null;

    @property(ScrollView)
    errorsScroll: ScrollView | null = null;

    @property(ScrollView)
    recordsScroll: ScrollView | null = null;

    private reviewManager: ReviewManager;
    private saveManager: SaveManager;
    private eventManager: EventManager;

    onLoad() {
        this.reviewManager = ReviewManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.eventManager = EventManager.getInstance();

        this.buildDefaultUI();

        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, () => this.node.destroy(), this);
        }
        if (this.exportButton) {
            this.exportButton.node.on(Button.EventType.CLICK, () => this.exportData(), this);
        }

        this.render();
    }

    private buildDefaultUI() {
        const root = this.node;
        const rootUi = root.getComponent(UITransform) || root.addComponent(UITransform);
        if (rootUi.contentSize.width < 100) rootUi.setContentSize(900, 650);

        if (!this.summaryArea) {
            const bg = root.getComponent(Sprite) || root.addComponent(Sprite);
            bg.color = new Color(252, 252, 255);
            bg.type = Sprite.Type.SLICED;
            root.setPosition(new Vec3(0, 0, 100));

            this.summaryArea = this.createPanelSection('SummaryArea', 860, 150, new Vec3(0, 240, 0));
            root.addChild(this.summaryArea);
            this.buildSummarySection();

            this.errorsArea = this.createPanelSection('ErrorsArea', 420, 320, new Vec3(-220, 20, 0));
            root.addChild(this.errorsArea);
            this.buildErrorsSection();

            this.recordsArea = this.createPanelSection('RecordsArea', 420, 320, new Vec3(220, 20, 0));
            root.addChild(this.recordsArea);
            this.buildRecordsSection();

            this.firstSolveArea = this.createPanelSection('FirstSolveArea', 860, 80, new Vec3(0, -190, 0));
            root.addChild(this.firstSolveArea);
            this.buildFirstSolveSection();

            const closeBtn = new Node('CloseButton');
            closeBtn.layer = Layers.Enum.UI_2D;
            const cUi = closeBtn.addComponent(UITransform);
            cUi.setContentSize(120, 44);
            const cBg = closeBtn.addComponent(Sprite);
            cBg.color = new Color(220, 220, 220);
            cBg.type = Sprite.Type.SLICED;
            const cBtn = closeBtn.addComponent(Button);
            cBtn.transition = Button.Transition.COLOR;
            cBtn.normalColor = cBg.color;
            cBtn.hoverColor = new Color(240, 240, 240);
            cBtn.pressedColor = new Color(200, 200, 200);
            const cLbl = closeBtn.addComponent(Label);
            cLbl.string = '关闭';
            cLbl.fontSize = 15;
            cLbl.color = new Color(80, 80, 80);
            closeBtn.setPosition(new Vec3(0, -300, 0));
            root.addChild(closeBtn);
            this.closeButton = cBtn;

            const exportBtn = new Node('ExportButton');
            exportBtn.layer = Layers.Enum.UI_2D;
            const eUi = exportBtn.addComponent(UITransform);
            eUi.setContentSize(120, 44);
            const eBg = exportBtn.addComponent(Sprite);
            eBg.color = new Color(80, 150, 220);
            eBg.type = Sprite.Type.SLICED;
            const eBtn = exportBtn.addComponent(Button);
            eBtn.transition = Button.Transition.COLOR;
            eBtn.normalColor = eBg.color;
            eBtn.hoverColor = new Color(110, 180, 250);
            eBtn.pressedColor = new Color(60, 130, 200);
            const eLbl = exportBtn.addComponent(Label);
            eLbl.string = '📥 导出数据';
            eLbl.fontSize = 14;
            eLbl.color = new Color(255, 255, 255);
            exportBtn.setPosition(new Vec3(150, -300, 0));
            root.addChild(exportBtn);
            this.exportButton = eBtn;

            const titleNode = new Node('Title');
            titleNode.layer = Layers.Enum.UI_2D;
            const tUi = titleNode.addComponent(UITransform);
            tUi.setContentSize(500, 36);
            tUi.anchorY = 1;
            const tLbl = titleNode.addComponent(Label);
            tLbl.string = '📊 训练复盘报告';
            tLbl.fontSize = 22;
            tLbl.color = new Color(40, 60, 120);
            titleNode.setPosition(new Vec3(0, 320, 0));
            root.addChild(titleNode);
        }
    }

    private createPanelSection(name: string, w: number, h: number, pos: Vec3): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(w, h);
        const bg = node.addComponent(Sprite);
        bg.color = new Color(255, 255, 255);
        bg.type = Sprite.Type.SLICED;
        const g = node.addComponent(Graphics);
        g.lineWidth = 1;
        g.strokeColor = new Color(220, 220, 230);
        g.roundRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 8);
        g.stroke();
        node.setPosition(pos);
        return node;
    }

    private buildSummarySection() {
        if (!this.summaryArea) return;
        const items = [
            { key: 'total', label: '总尝试次数', key2: 'totalAttemptsLabel' },
            { key: 'passed', label: '通过次数', key2: 'passedLabel' },
            { key: 'failed', label: '失败次数', key2: 'failedLabel' },
            { key: 'fsr', label: '首次解决率', key2: 'firstSolveRateLabel' },
            { key: 'avg_score', label: '平均得分', key2: 'avgScoreLabel' },
            { key: 'avg_time', label: '平均用时(秒)', key2: 'avgTimeLabel' }
        ];

        const sw = this.summaryArea.getComponent(UITransform)!.contentSize.width;
        const cellW = sw / items.length;

        items.forEach((item, i) => {
            const cell = new Node(`Cell_${item.key}`);
            cell.layer = Layers.Enum.UI_2D;
            const cUi = cell.addComponent(UITransform);
            cUi.setContentSize(cellW - 16, 120);
            cUi.anchorY = 1;
            const cBg = cell.addComponent(Sprite);
            cBg.color = new Color(248, 248, 252);
            cBg.type = Sprite.Type.SLICED;

            const labelNode = new Node('Label');
            labelNode.layer = Layers.Enum.UI_2D;
            const lUi = labelNode.addComponent(UITransform);
            lUi.setContentSize(cellW - 24, 24);
            lUi.anchorY = 1;
            const lLbl = labelNode.addComponent(Label);
            lLbl.string = item.label;
            lLbl.fontSize = 12;
            lLbl.color = new Color(130, 130, 150);
            labelNode.setPosition(new Vec3(0, -10, 0));
            cell.addChild(labelNode);

            const valueNode = new Node('Value');
            valueNode.layer = Layers.Enum.UI_2D;
            const vUi = valueNode.addComponent(UITransform);
            vUi.setContentSize(cellW - 24, 60);
            vUi.anchorY = 1;
            const vLbl = valueNode.addComponent(Label);
            vLbl.string = '-';
            vLbl.fontSize = 28;
            vLbl.color = new Color(50, 60, 100);
            vLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            vLbl.verticalAlign = Label.VerticalAlign.CENTER;
            valueNode.setPosition(new Vec3(0, -40, 0));
            cell.addChild(valueNode);

            cell.setPosition(new Vec3(-sw / 2 + cellW / 2 + i * cellW + 8, -8, 0));
            this.summaryArea!.addChild(cell);

            (this as any)[item.key2] = vLbl;
        });
    }

    private buildErrorsSection() {
        if (!this.errorsArea) return;
        const w = this.errorsArea.getComponent(UITransform)!.contentSize.width;
        const h = this.errorsArea.getComponent(UITransform)!.contentSize.height;

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(w - 20, 24);
        tUi.anchorY = 1;
        const tLbl = titleNode.addComponent(Label);
        tLbl.string = '❌ 错误类型统计';
        tLbl.fontSize = 15;
        tLbl.color = new Color(50, 50, 50);
        tLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        titleNode.setPosition(new Vec3(-w / 2 + 10, -12, 0));
        this.errorsArea.addChild(titleNode);

        const content = new Node('Content');
        content.layer = Layers.Enum.UI_2D;
        const cUi = content.addComponent(UITransform);
        cUi.setContentSize(w - 20, h - 40);
        cUi.anchorY = 1;
        content.setPosition(new Vec3(0, -32, 0));
        this.errorsArea.addChild(content);
        this.errorsArea = content;
    }

    private buildRecordsSection() {
        if (!this.recordsArea) return;
        const w = this.recordsArea.getComponent(UITransform)!.contentSize.width;
        const h = this.recordsArea.getComponent(UITransform)!.contentSize.height;

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(w - 20, 24);
        tUi.anchorY = 1;
        const tLbl = titleNode.addComponent(Label);
        tLbl.string = '📝 复核不通过记录';
        tLbl.fontSize = 15;
        tLbl.color = new Color(50, 50, 50);
        tLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        titleNode.setPosition(new Vec3(-w / 2 + 10, -12, 0));
        this.recordsArea.addChild(titleNode);

        const content = new Node('Content');
        content.layer = Layers.Enum.UI_2D;
        const cUi = content.addComponent(UITransform);
        cUi.setContentSize(w - 20, h - 40);
        cUi.anchorY = 1;
        content.setPosition(new Vec3(0, -32, 0));
        this.recordsArea.addChild(content);
        this.recordsArea = content;
    }

    private buildFirstSolveSection() {
        if (!this.firstSolveArea) return;
        const w = this.firstSolveArea.getComponent(UITransform)!.contentSize.width;

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(w - 20, 22);
        tUi.anchorY = 1;
        const tLbl = titleNode.addComponent(Label);
        tLbl.string = '🎯 首次解决率（复盘关键指标）';
        tLbl.fontSize = 14;
        tLbl.color = new Color(50, 50, 50);
        tLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        titleNode.setPosition(new Vec3(-w / 2 + 10, -10, 0));
        this.firstSolveArea.addChild(titleNode);

        const progBg = new Node('ProgressBg');
        progBg.layer = Layers.Enum.UI_2D;
        const pUi = progBg.addComponent(UITransform);
        pUi.setContentSize(w - 100, 22);
        pUi.anchorY = 1;
        const pBg = progBg.addComponent(Sprite);
        pBg.color = new Color(230, 230, 240);
        pBg.type = Sprite.Type.SLICED;
        progBg.setPosition(new Vec3(-40, -42, 0));
        this.firstSolveArea.addChild(progBg);

        const progBar = new Node('Progress');
        progBar.layer = Layers.Enum.UI_2D;
        const pbUi = progBar.addComponent(UITransform);
        pbUi.setContentSize(0, 22);
        pbUi.anchorX = 0;
        const pbBg = progBar.addComponent(Sprite);
        pbBg.color = new Color(80, 180, 120);
        pbBg.type = Sprite.Type.SLICED;
        progBg.addChild(progBar);

        const rateLabel = new Node('RateLabel');
        rateLabel.layer = Layers.Enum.UI_2D;
        const rUi = rateLabel.addComponent(UITransform);
        rUi.setContentSize(80, 28);
        const rLbl = rateLabel.addComponent(Label);
        rLbl.string = '0%';
        rLbl.fontSize = 16;
        rLbl.color = new Color(50, 140, 80);
        rLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        rLbl.verticalAlign = Label.VerticalAlign.CENTER;
        rateLabel.setPosition(new Vec3(w / 2 - 40, -42, 0));
        this.firstSolveArea.addChild(rateLabel);

        this.firstSolveRateLabel = rLbl;
        const proxyProgress = {
            set progress(v: number) {
                pbUi.setContentSize((w - 100) * v, 22);
            },
            get progress() { return 0; }
        };
        (this as any).firstSolveProgressRef = proxyProgress;
    }

    public render() {
        const summary = this.reviewManager.getReviewSummary();
        Logger.info('[复盘] 总尝试:', summary.totalAttempts, '首次解决率:', summary.firstSolveRate);

        if (this.totalAttemptsLabel) this.totalAttemptsLabel.string = `${summary.totalAttempts}`;
        if (this.passedLabel) this.passedLabel.string = `${summary.passedAttempts}`;
        if (this.failedLabel) this.failedLabel.string = `${summary.failedAttempts}`;
        if (this.firstSolveRateLabel) this.firstSolveRateLabel.string = `${Math.round(summary.firstSolveRate * 100)}%`;
        if (this.avgScoreLabel) this.avgScoreLabel.string = `${Math.round(summary.averageScore)}`;
        if (this.avgTimeLabel) this.avgTimeLabel.string = `${Math.round(summary.averageTime)}`;

        const progressRef = (this as any).firstSolveProgressRef;
        if (progressRef) progressRef.progress = summary.firstSolveRate;

        this.renderErrors(summary.errorStats);
        this.renderRecords(summary.reviewItems);
    }

    private renderErrors(errors: IErrorStats[]) {
        if (!this.errorsArea) return;
        this.errorsArea.removeAllChildren();
        const w = this.errorsArea.getComponent(UITransform)!.contentSize.width;

        if (errors.length === 0) {
            const node = this.createInfoRowNode('✅ 没有错误记录，表现优秀！', new Color(100, 180, 120));
            node.setPosition(new Vec3(0, -20, 0));
            this.errorsArea.addChild(node);
            return;
        }

        errors.slice(0, 10).forEach((err, i) => {
            const node = this.createErrorRow(err, i, w);
            this.errorsArea!.addChild(node);
        });
    }

    private createErrorRow(err: IErrorStats, index: number, w: number): Node {
        const node = new Node(`Error_${err.errorType}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(w, 52);
        ui.anchorY = 1;

        const rankNode = new Node('Rank');
        rankNode.layer = Layers.Enum.UI_2D;
        const rUi = rankNode.addComponent(UITransform);
        rUi.setContentSize(30, 30);
        const rBg = rankNode.addComponent(Sprite);
        rBg.color = index < 3 ? new Color(255, 180, 80) : new Color(200, 200, 210);
        rBg.type = Sprite.Type.SLICED;
        const rLbl = rankNode.addComponent(Label);
        rLbl.string = `${index + 1}`;
        rLbl.fontSize = 14;
        rLbl.color = index < 3 ? new Color(255, 255, 255) : new Color(100, 100, 100);
        rLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        rLbl.verticalAlign = Label.VerticalAlign.CENTER;
        rankNode.setPosition(new Vec3(-w / 2 + 20, -26, 0));
        node.addChild(rankNode);

        const nameNode = new Node('Name');
        nameNode.layer = Layers.Enum.UI_2D;
        const nUi = nameNode.addComponent(UITransform);
        nUi.setContentSize(280, 44);
        nUi.anchorY = 1;
        nUi.anchorX = 0;
        const nLbl = nameNode.addComponent(Label);
        nLbl.string = `❌ ${err.description}`;
        nLbl.fontSize = 13;
        nLbl.color = new Color(80, 40, 40);
        nLbl.lineHeight = 18;
        nLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        nLbl.verticalAlign = Label.VerticalAlign.CENTER;
        nameNode.setPosition(new Vec3(-w / 2 + 50, -20, 0));
        node.addChild(nameNode);

        const countNode = new Node('Count');
        countNode.layer = Layers.Enum.UI_2D;
        const cUi = countNode.addComponent(UITransform);
        cUi.setContentSize(70, 24);
        cUi.anchorX = 1;
        const cBg = countNode.addComponent(Sprite);
        cBg.color = new Color(255, 230, 230);
        cBg.type = Sprite.Type.SLICED;
        const cLbl = countNode.addComponent(Label);
        cLbl.string = `${err.count} 次`;
        cLbl.fontSize = 12;
        cLbl.color = new Color(200, 60, 60);
        cLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        cLbl.verticalAlign = Label.VerticalAlign.CENTER;
        countNode.setPosition(new Vec3(w / 2 - 10, -10, 0));
        node.addChild(countNode);

        const pctNode = new Node('Pct');
        pctNode.layer = Layers.Enum.UI_2D;
        const pUi = pctNode.addComponent(UITransform);
        pUi.setContentSize(56, 20);
        pUi.anchorX = 1;
        const pLbl = pctNode.addComponent(Label);
        pLbl.string = `${Math.round(err.percentage * 100)}%`;
        pLbl.fontSize = 11;
        pLbl.color = new Color(160, 120, 120);
        pLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;
        pLbl.verticalAlign = Label.VerticalAlign.CENTER;
        pctNode.setPosition(new Vec3(w / 2 - 10, -36, 0));
        node.addChild(pctNode);

        node.setPosition(new Vec3(0, -10 - index * 56, 0));
        return node;
    }

    private renderRecords(items: IReviewItem[]) {
        if (!this.recordsArea) return;
        this.recordsArea.removeAllChildren();
        const w = this.recordsArea.getComponent(UITransform)!.contentSize.width;

        if (items.length === 0) {
            const node = this.createInfoRowNode('✅ 没有复核不通过记录', new Color(100, 180, 120));
            node.setPosition(new Vec3(0, -20, 0));
            this.recordsArea.addChild(node);
            return;
        }

        items.slice(0, 20).forEach((item, i) => {
            const node = this.createRecordRow(item, i, w);
            this.recordsArea!.addChild(node);
        });
    }

    private createRecordRow(item: IReviewItem, index: number, w: number): Node {
        const node = new Node(`Record_${item.orderId}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(w, 62);
        ui.anchorY = 1;

        const bg = node.addComponent(Sprite);
        bg.color = item.isFirstTime ? new Color(255, 240, 240) : new Color(250, 250, 250);
        bg.type = Sprite.Type.SLICED;

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(w - 20, 22);
        tUi.anchorY = 1;
        tUi.anchorX = 0;
        const tLbl = titleNode.addComponent(Label);
        const firstTag = item.isFirstTime ? ' 🆕' : '';
        tLbl.string = `${item.orderId}${firstTag}`;
        tLbl.fontSize = 12;
        tLbl.color = new Color(80, 80, 80);
        tLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        titleNode.setPosition(new Vec3(-w / 2 + 8, -8, 0));
        node.addChild(titleNode);

        const descNode = new Node('Desc');
        descNode.layer = Layers.Enum.UI_2D;
        const dUi = descNode.addComponent(UITransform);
        dUi.setContentSize(w - 20, 36);
        dUi.anchorY = 1;
        dUi.anchorX = 0;
        const dLbl = descNode.addComponent(Label);
        dLbl.string = item.errorDescription.length > 36 ? item.errorDescription.substring(0, 36) + '...' : item.errorDescription;
        dLbl.fontSize = 12;
        dLbl.color = new Color(200, 80, 80);
        dLbl.lineHeight = 16;
        dLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        descNode.setPosition(new Vec3(-w / 2 + 8, -30, 0));
        node.addChild(descNode);

        const metaNode = new Node('Meta');
        metaNode.layer = Layers.Enum.UI_2D;
        const mUi = metaNode.addComponent(UITransform);
        mUi.setContentSize(w - 20, 18);
        mUi.anchorY = 1;
        const mLbl = metaNode.addComponent(Label);
        const date = new Date(item.timestamp);
        const timeStr = `${(date.getMonth() + 1)}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        mLbl.string = `${timeStr}  |  关卡${item.levelId}  |  用时${Math.round(item.completionTime)}s  |  ${item.score}分`;
        mLbl.fontSize = 10;
        mLbl.color = new Color(160, 160, 160);
        mLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        metaNode.setPosition(new Vec3(-w / 2 + 8, -64, 0));
        node.addChild(metaNode);

        node.setPosition(new Vec3(0, -4 - index * 66, 0));
        return node;
    }

    private createInfoRowNode(text: string, color: Color): Node {
        const node = new Node('InfoRow');
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(400, 30);
        const lbl = node.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 14;
        lbl.color = color;
        return node;
    }

    private exportData() {
        const data = this.reviewManager.exportReviewData();
        const profile = this.saveManager.getProfile();
        const full = {
            player: profile,
            review: JSON.parse(data),
            exportedAt: new Date().toISOString()
        };
        Logger.info('[复盘] 导出数据:', JSON.stringify(full, null, 2).substring(0, 200) + '...');

        const title = '📥 数据已导出';
        const msg = `总计${full.review.summary.totalAttempts}次训练，首次解决率${Math.round(full.review.summary.firstSolveRate * 100)}%`;
        const scene = this.findScene();
        if (scene) scene.showNotification(title, msg, 'success');
        else Logger.info(title + ': ' + msg);
    }

    private findScene() {
        const findModule = require('../scenes/GameScene');
        if (findModule && findModule.findGameScene) {
            return findModule.findGameScene();
        }
        return null;
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
    }
}
