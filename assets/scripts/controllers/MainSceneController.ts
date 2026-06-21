import { _decorator, Component, Node, Label, Button, Color, UITransform, Graphics, Size, game, Game } from 'cc';
import { GameController } from './GameController';
import { SettlementPanel } from './SettlementPanel';
import { StatisticsPanel } from './StatisticsPanel';
import { ReplaySystem } from './ReplaySystem';
import { AddressInputController } from './AddressInputController';
import { TrajectoryRenderer } from './TrajectoryRenderer';
import { RiderWarningSystem } from './RiderWarningSystem';
import { EventDispatcher } from '../utils/EventDispatcher';
import { LEVELS } from '../config/GameConfig';
import { Position, Order, WrongStep } from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {
    private eventDispatcher: EventDispatcher = EventDispatcher.getInstance();
    private currentLevelId: number = 1;
    private isLoading: boolean = false;

    private root: Node | null = null;
    private levelSelectPanel: Node | null = null;
    private gameUIPanel: Node | null = null;
    private mapArea: Node | null = null;
    private addressListNode: Node | null = null;
    private pickupModeLabel: Label | null = null;
    private deliveryModeLabel: Label | null = null;

    private gameController: GameController | null = null;
    private addressInputController: AddressInputController | null = null;
    private trajectoryRenderer: TrajectoryRenderer | null = null;
    private riderWarningSystem: RiderWarningSystem | null = null;
    private settlementPanel: SettlementPanel | null = null;
    private statisticsPanel: StatisticsPanel | null = null;
    private replaySystem: ReplaySystem | null = null;

    private scoreLabel: Label | null = null;
    private timeLabel: Label | null = null;
    private levelLabel: Label | null = null;
    private weatherLabel: Label | null = null;
    private compensationLabel: Label | null = null;
    private warningLabel: Label | null = null;
    private orderInfoLabel: Label | null = null;
    private riderInfoLabel: Label | null = null;
    private subsidyInfoLabel: Label | null = null;
    private addressInfoLabel: Label | null = null;
    private trajectoryGraphics: Graphics | null = null;

    onLoad() {
        console.log('[MainSceneController] onLoad 开始构建 UI');
        this.buildEntireUI();
        this.initEventListeners();
        this.showLevelSelect();

        game.on(Game.EVENT_HIDE, this.onGameHide.bind(this));
        game.on(Game.EVENT_SHOW, this.onGameShow.bind(this));
    }

    private makeNode(name: string, parent: Node, x = 0, y = 0): Node {
        const n = new Node(name);
        const t = n.addComponent(UITransform);
        parent.addChild(n);
        n.setPosition(x, y, 0);
        return n;
    }

    private makeLabel(name: string, parent: Node, text: string, fontSize = 20, color: Color = Color.WHITE, x = 0, y = 0): Label {
        const n = this.makeNode(name, parent, x, y);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = color;
        label.overflow = Label.Overflow.CLAMP;
        const t = n.getComponent(UITransform)!;
        t.setContentSize(400, fontSize + 10);
        return label;
    }

    private makeButton(name: string, parent: Node, text: string, fontSize = 22, x = 0, y = 0, w = 200, h = 50): { node: Node; label: Label } {
        const n = this.makeNode(name, parent, x, y);
        const t = n.getComponent(UITransform)!;
        t.setContentSize(w, h);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = Color.WHITE;
        label.overflow = Label.Overflow.CLAMP;
        n.addComponent(Button);
        const g = n.addComponent(Graphics);
        g.fillColor = new Color(60, 120, 200, 220);
        g.roundRect(-w / 2, -h / 2, w, h, 8);
        g.fill();
        return { node: n, label };
    }

    private makePanel(name: string, parent: Node, x = 0, y = 0, w = 1200, h = 650, color: Color = new Color(30, 30, 50, 230)): Node {
        const n = this.makeNode(name, parent, x, y);
        const t = n.getComponent(UITransform)!;
        t.setContentSize(w, h);
        const g = n.addComponent(Graphics);
        g.fillColor = color;
        g.roundRect(-w / 2, -h / 2, w, h, 12);
        g.fill();
        g.strokeColor = new Color(100, 160, 255, 180);
        g.lineWidth = 2;
        g.roundRect(-w / 2, -h / 2, w, h, 12);
        g.stroke();
        n.active = false;
        return n;
    }

    private buildEntireUI() {
        this.root = this.makeNode('Root', this.node);
        this.gameController = this.makeNode('GameController', this.root).addComponent(GameController);

        this.buildLevelSelectPanel();
        this.buildGameUIPanel();
        this.buildSettlementPanel();
        this.buildStatisticsPanel();
        this.buildReplayPanel();

        this.setupAddressInput();
        this.setupTrajectoryRenderer();
        this.setupRiderWarning();
    }

    private setupAddressInput() {
        const ctrl = this.gameController?.node.getComponentInChildren(AddressInputController);
        if (ctrl) this.addressInputController = ctrl;
        if (!this.addressInputController) {
            this.addressInputController = this.makeNode('AddressInputCtrl', this.root!).addComponent(AddressInputController);
        }
        this.gameController?.setAddressInputController(this.addressInputController);

        if (this.mapArea) this.addressInputController.setMapContainer(this.mapArea);
        if (this.addressListNode) this.addressInputController.setAddressList(this.addressListNode);
        if (this.pickupModeLabel) this.addressInputController.setPickupLabel(this.pickupModeLabel);
        if (this.deliveryModeLabel) this.addressInputController.setDeliveryLabel(this.deliveryModeLabel);

        this.addressInputController.setCallbacks(
            (address: Position, type: 'pickup' | 'delivery') => this.onAddressSelected(address, type),
            (ws: Omit<WrongStep, 'time'>) => this.onWrongStep(ws)
        );
    }

    private setupTrajectoryRenderer() {
        const ctrl = this.gameController?.node.getComponentInChildren(TrajectoryRenderer);
        if (ctrl) this.trajectoryRenderer = ctrl;
        if (!this.trajectoryRenderer) {
            this.trajectoryRenderer = this.makeNode('TrajectoryRender', this.root!).addComponent(TrajectoryRenderer);
        }
        this.gameController?.setTrajectoryRenderer(this.trajectoryRenderer);
        if (this.trajectoryGraphics) {
            this.trajectoryRenderer.setGraphics(this.trajectoryGraphics);
        }
    }

    private setupRiderWarning() {
        const ctrl = this.gameController?.node.getComponentInChildren(RiderWarningSystem);
        if (ctrl) this.riderWarningSystem = ctrl;
        if (!this.riderWarningSystem) {
            this.riderWarningSystem = this.makeNode('RiderWarningSys', this.root!).addComponent(RiderWarningSystem);
        }
        this.gameController?.setRiderWarningSystem(this.riderWarningSystem);
    }

    private buildLevelSelectPanel() {
        this.levelSelectPanel = this.makePanel('LevelSelectPanel', this.root!, 0, 0, 1000, 600, new Color(20, 25, 45, 240));
        this.levelSelectPanel.active = true;

        this.makeLabel('Title', this.levelSelectPanel, '本地跑腿即时下单 — 经营模拟训练', 32, new Color(100, 200, 255), 0, 250);
        this.makeLabel('SubTitle', this.levelSelectPanel, '选择关卡开始训练', 20, new Color(180, 180, 200), 0, 210);

        LEVELS.forEach((level, idx) => {
            const yPos = 120 - idx * 100;
            const btn = this.makeButton(`Level_${level.id}`, this.levelSelectPanel!, `${level.id}. ${level.name}  (${level.difficulty})`, 24, 0, yPos, 400, 60);
            btn.label.color = new Color(255, 255, 255);
            this.makeLabel(`LevelDesc_${level.id}`, this.levelSelectPanel!, `${level.description} | 目标${level.targetScore}分 | 赔付≤${level.maxCompensation} | ${level.weather === 'sunny' ? '晴天' : level.weather === 'rainy' ? '雨天' : level.weather}`, 14, new Color(160, 160, 180), 0, yPos - 40);

            btn.node.on(Button.EventType.CLICK, () => {
                this.startLevel(level.id);
            }, this);
        });

        const statsBtn = this.makeButton('StatsBtn', this.levelSelectPanel!, '统计', 18, -200, -230, 120, 40);
        statsBtn.node.on(Button.EventType.CLICK, () => this.showStatistics(), this);

        const replayBtn = this.makeButton('ReplayBtn', this.levelSelectPanel!, '回放', 18, -50, -230, 120, 40);
        replayBtn.node.on(Button.EventType.CLICK, () => this.showReplays(), this);
    }

    private buildGameUIPanel() {
        this.gameUIPanel = this.makePanel('GameUIPanel', this.root!, 0, 0, 1260, 700, new Color(15, 18, 35, 245));
        this.gameUIPanel.active = false;

        this.scoreLabel = this.makeLabel('Score', this.gameUIPanel, '分数: 0', 20, new Color(255, 220, 100), -550, 320);
        this.timeLabel = this.makeLabel('Time', this.gameUIPanel, '时间: 0:00', 20, new Color(200, 200, 255), -550, 290);
        this.levelLabel = this.makeLabel('Level', this.gameUIPanel, '关卡 1', 20, new Color(150, 220, 255), -550, 260);
        this.weatherLabel = this.makeLabel('Weather', this.gameUIPanel, '天气: 晴天', 20, new Color(255, 255, 200), -550, 230);
        this.compensationLabel = this.makeLabel('Compensation', this.gameUIPanel, '赔付: 0/100', 20, new Color(255, 120, 120), -550, 200);

        this.mapArea = this.makeNode('MapArea', this.gameUIPanel!, -80, 40);
        const mapTransform = this.mapArea.getComponent(UITransform)!;
        mapTransform.setContentSize(800, 500);
        const mapBg = this.mapArea.addComponent(Graphics);
        mapBg.fillColor = new Color(40, 50, 70, 200);
        mapBg.roundRect(-400, -250, 800, 500, 8);
        mapBg.fill();

        this.trajectoryGraphics = this.makeNode('TrajectoryGfx', this.mapArea).addComponent(Graphics);

        this.addressListNode = this.makeNode('AddressList', this.gameUIPanel!, 350, -150);
        const listTransform = this.addressListNode.getComponent(UITransform)!;
        listTransform.setContentSize(380, 280);
        this.makeLabel('AddressListTitle', this.addressListNode, '地址列表 (1-9/↑↓/输入搜索/Enter确认/Tab切换)', 13, new Color(150, 220, 150), 0, 140);

        this.pickupModeLabel = this.makeLabel('PickupMode', this.gameUIPanel, '[取货地址]', 16, new Color(0, 255, 180), 0, -310);
        this.deliveryModeLabel = this.makeLabel('DeliveryMode', this.gameUIPanel, '[送货地址]', 16, new Color(255, 180, 80), 0, -310);
        this.deliveryModeLabel.node.active = false;

        this.addressInfoLabel = this.makeLabel('AddressInfo', this.gameUIPanel!, '[地址处理] 点击地图标记/键盘↑↓选择地址，Tab切换取货/送货', 14, new Color(150, 220, 150), 0, -340);
        this.riderInfoLabel = this.makeLabel('RiderInfo', this.gameUIPanel!, '[骑手调度] 数字键1-5分配骑手，注意⚠预警标识', 14, new Color(255, 200, 100), 0, -365);
        this.subsidyInfoLabel = this.makeLabel('SubsidyInfo', this.gameUIPanel!, '[补贴规则] Q/W/E/R切换补贴开关', 14, new Color(100, 200, 255), 0, -390);
        this.warningLabel = this.makeLabel('Warning', this.gameUIPanel!, '', 22, new Color(255, 80, 80), 0, 310);

        this.orderInfoLabel = this.makeLabel('OrderInfo', this.gameUIPanel!, '', 16, new Color(220, 220, 240), 350, 100);
        const orderTransform = this.orderInfoLabel.node.getComponent(UITransform)!;
        orderTransform.setContentSize(350, 300);

        const subsidyPanel = this.makeNode('SubsidyPanel', this.gameUIPanel!, 350, -50);
        this.makeLabel('SubsidyTitle', subsidyPanel, '补贴规则 (Q/W/E/R)', 16, new Color(100, 200, 255), 0, 40);

        const pauseBtn = this.makeButton('PauseBtn', this.gameUIPanel!, '暂停(P)', 16, 500, 320, 90, 35);
        pauseBtn.node.on(Button.EventType.CLICK, () => {
            if (this.gameController) this.gameController.togglePause();
        }, this);

        const restartBtn = this.makeButton('RestartBtn', this.gameUIPanel!, '重开(Ctrl+R)', 16, 500, 275, 110, 35);
        restartBtn.node.on(Button.EventType.CLICK, () => this.onRestart(), this);

        const menuBtn = this.makeButton('MenuBtn', this.gameUIPanel!, '返回', 16, 500, 230, 90, 35);
        menuBtn.node.on(Button.EventType.CLICK, () => this.goToMainMenu(), this);
    }

    private buildSettlementPanel() {
        const panel = this.makePanel('SettlementPanel', this.root!, 0, 0, 1100, 650, new Color(20, 20, 40, 245));
        this.settlementPanel = panel.addComponent(SettlementPanel);

        this.makeLabel('SettlementTitle', panel, '训练结算', 28, new Color(255, 220, 100), 0, 290);
        this.makeLabel('ResultTitle', panel, '', 24, Color.WHITE, 0, 250);
        this.makeLabel('ScoreInfo', panel, '', 18, Color.WHITE, -400, 210);
        this.makeLabel('CompInfo', panel, '', 18, Color.WHITE, -400, 180);
        this.makeLabel('RevenueInfo', panel, '', 18, Color.WHITE, -400, 150);
        this.makeLabel('ProfitInfo', panel, '', 18, Color.WHITE, -400, 120);

        this.makeLabel('WrongStepsTitle', panel, '操作失误 & 申诉证据', 20, new Color(255, 150, 100), 0, 80);
        this.makeLabel('WrongStepsInfo', panel, '', 14, Color.WHITE, 0, 40);
        const wsTransform = panel.getChildByName('WrongStepsInfo')!.getComponent(UITransform)!;
        wsTransform.setContentSize(1000, 120);

        this.makeLabel('AppealInfo', panel, '', 14, new Color(200, 200, 255), 0, -100);
        const apTransform = panel.getChildByName('AppealInfo')!.getComponent(UITransform)!;
        apTransform.setContentSize(1000, 100);

        const restartBtn = this.makeButton('SettleRestart', panel, '重新训练', 18, -250, -280, 160, 45);
        const reviewBtn = this.makeButton('SettleReview', panel, '查看回放', 18, -60, -280, 160, 45);
        const nextBtn = this.makeButton('SettleNext', panel, '下一关', 18, 130, -280, 160, 45);
        const menuBtn = this.makeButton('SettleMenu', panel, '返回菜单', 18, 300, -280, 140, 45);

        restartBtn.node.on(Button.EventType.CLICK, () => { this.onRestart(); this.settlementPanel!.hide(); }, this);
        reviewBtn.node.on(Button.EventType.CLICK, () => { this.showReplays(); }, this);
        nextBtn.node.on(Button.EventType.CLICK, () => { this.onNextLevel(); this.settlementPanel!.hide(); }, this);
        menuBtn.node.on(Button.EventType.CLICK, () => { this.goToMainMenu(); this.settlementPanel!.hide(); }, this);

        this.settlementPanel.setGameController(this.gameController!);
        this.settlementPanel.setCallbacks(
            () => this.onRestart(),
            () => this.showReplays(),
            () => this.onNextLevel(),
            (evidence) => this.onAppeal(evidence)
        );
    }

    private buildStatisticsPanel() {
        const panel = this.makePanel('StatisticsPanel', this.root!, 0, 0, 1000, 600, new Color(15, 20, 40, 245));
        this.statisticsPanel = panel.addComponent(StatisticsPanel);

        this.makeLabel('StatsTitle', panel, '训练统计 — 赔付成本分析', 26, new Color(255, 200, 100), 0, 260);
        this.makeLabel('StatsInfo', panel, '', 16, Color.WHITE, 0, 0);
        const sTransform = panel.getChildByName('StatsInfo')!.getComponent(UITransform)!;
        sTransform.setContentSize(900, 450);

        const closeBtn = this.makeButton('StatsClose', panel, '关闭', 18, 0, -260, 120, 40);
        closeBtn.node.on(Button.EventType.CLICK, () => this.statisticsPanel!.hide(), this);
    }

    private buildReplayPanel() {
        const panel = this.makePanel('ReplayPanel', this.root!, 0, 0, 1000, 600, new Color(15, 20, 40, 245));
        this.replaySystem = panel.addComponent(ReplaySystem);

        this.makeLabel('ReplayTitle', panel, '失败回放 & 复盘', 26, new Color(255, 200, 100), 0, 260);
        this.makeLabel('ReplayInfo', panel, '', 16, Color.WHITE, 0, 0);
        const rTransform = panel.getChildByName('ReplayInfo')!.getComponent(UITransform)!;
        rTransform.setContentSize(900, 450);

        const closeBtn = this.makeButton('ReplayClose', panel, '关闭', 18, 0, -260, 120, 40);
        closeBtn.node.on(Button.EventType.CLICK, () => this.replaySystem!.closeReplay(), this);
    }

    private initEventListeners() {
        this.eventDispatcher.on('game-over', this.onGameOver.bind(this), this);
        this.eventDispatcher.on('level-started', this.onLevelStarted.bind(this), this);
        this.eventDispatcher.on('order-generated', this.onOrderGenerated.bind(this), this);
        this.eventDispatcher.on('rider-rejection', this.onRiderRejection.bind(this), this);
        this.eventDispatcher.on('order-assigned', this.onOrderAssigned.bind(this), this);
        this.eventDispatcher.on('order-completed', this.onOrderCompleted.bind(this), this);
    }

    private onLevelStarted(event: any) {
        this.updateHUD();
    }

    private onOrderGenerated(event: any) {
        const order: Order = event.order;
        if (this.addressInputController && !this.addressInputController.isWaitingForInput()) {
            this.addressInputController.startAddressInput(order, 'pickup');
            if (this.addressInfoLabel) {
                this.addressInfoLabel.string = `[地址处理] 请选择取货地址: ${order.pickup.name} (${order.pickup.address})`;
            }
        }
        this.updateOrderInfo();
        this.updateHUD();
    }

    private onOrderAssigned(event: any) {
        if (this.addressInputController?.isWaitingForInput()) {
            return;
        }
        this.updateOrderInfo();
        this.updateRiderInfo();
        this.updateHUD();
    }

    private onOrderCompleted(event: any) {
        this.updateOrderInfo();
        this.updateRiderInfo();
        this.updateHUD();

        const gs = this.gameController?.getGameState();
        if (gs) {
            const pending = gs.orders.filter(o => o.status === 'pending');
            if (pending.length > 0 && this.addressInputController && !this.addressInputController.isWaitingForInput()) {
                this.addressInputController.startAddressInput(pending[0], 'pickup');
                if (this.addressInfoLabel) {
                    this.addressInfoLabel.string = `[地址处理] 请选择取货地址: ${pending[0].pickup.name}`;
                }
            }
        }
    }

    private onRiderRejection(event: any) {
        if (this.warningLabel) {
            this.warningLabel.string = `⚠ ${event.rider.name} 拒单！赔付¥${event.compensation}`;
            this.warningLabel.color = new Color(255, 80, 80);
        }
        this.updateRiderInfo();
        this.updateHUD();
    }

    private onAddressSelected(address: Position, type: 'pickup' | 'delivery') {
        if (this.addressInfoLabel) {
            if (type === 'pickup') {
                this.addressInfoLabel.string = `[地址处理] 取货地址已选: ${address.name} → 请选择送货地址 (Tab切换)`;
            } else {
                this.addressInfoLabel.string = `[地址处理] 送货地址已选: ${address.name} → 用数字键1-5分配骑手`;
                setTimeout(() => {
                    const gs = this.gameController?.getGameState();
                    if (gs) {
                        const pending = gs.orders.filter(o => o.status === 'pending');
                        if (pending.length > 0 && this.addressInputController && !this.addressInputController.isWaitingForInput()) {
                            this.addressInputController.startAddressInput(pending[0], 'pickup');
                        }
                    }
                }, 500);
            }
        }
    }

    private onWrongStep(ws: Omit<WrongStep, 'time'>) {
        const gs = this.gameController?.getGameState();
        if (gs) {
            gs.wrongSteps.push({ ...ws, time: Date.now() });
            if (this.warningLabel) {
                this.warningLabel.string = `⚠ 操作错误: ${ws.description}`;
                this.warningLabel.color = new Color(255, 120, 120);
            }
        }
        this.eventDispatcher.emit('wrong-step', { ...ws, time: Date.now() });
    }

    private updateHUD() {
        if (!this.gameController) return;
        const gs = this.gameController.getGameState();
        const lv = this.gameController.getCurrentLevel();
        if (!gs || !lv) return;

        if (this.scoreLabel) this.scoreLabel.string = `分数: ${gs.score}/${lv.targetScore}`;
        const remaining = Math.max(0, lv.duration - this.gameController.getGameTime());
        if (this.timeLabel) this.timeLabel.string = `时间: ${Math.floor(remaining / 60)}:${Math.floor(remaining % 60).toString().padStart(2, '0')}`;
        if (this.levelLabel) this.levelLabel.string = `关卡 ${lv.id}: ${lv.name}`;
        if (this.compensationLabel) this.compensationLabel.string = `赔付: ${gs.totalCompensation}/${lv.maxCompensation}`;

        const weatherNames: Record<string, string> = { sunny: '晴天', rainy: '雨天', snowy: '雪天', hot: '高温' };
        if (this.weatherLabel) this.weatherLabel.string = `天气: ${weatherNames[gs.weather] || gs.weather}`;
    }

    private updateOrderInfo() {
        if (!this.orderInfoLabel || !this.gameController) return;
        const gs = this.gameController.getGameState();
        if (!gs) return;
        const pending = gs.orders.filter(o => o.status === 'pending');
        const active = gs.orders.filter(o => o.status === 'assigned' || o.status === 'picked');
        let text = `待处理订单: ${pending.length}\n配送中: ${active.length}\n`;
        if (pending.length > 0) {
            const o = pending[0];
            text += `\n--- 最新订单 ---\n取货: ${o.pickup.name} (${o.pickup.address})\n送货: ${o.delivery.name} (${o.delivery.address})\n优先: ${o.priority} | 距离: ${Math.floor(o.distance)}m\n限时: ${o.expectedTime}s | 基价: ¥${o.basePrice}`;
        }
        this.orderInfoLabel.string = text;
    }

    private updateRiderInfo() {
        if (!this.riderInfoLabel || !this.gameController) return;
        const gs = this.gameController.getGameState();
        if (!gs) return;
        const idle = gs.riders.filter(r => r.status === 'idle');
        const busy = gs.riders.filter(r => r.status === 'busy');
        let text = `[骑手] 空闲:${idle.length} 配送中:${busy.length}`;
        idle.forEach((r, i) => {
            const warn = r.rejectWarningLevel > 0 ? ` ⚠${'!'.repeat(r.rejectWarningLevel)}` : '';
            text += `\n  ${i + 1}. ${r.name} (效率${(r.efficiency * 100).toFixed(0)}%)${warn}`;
        });
        this.riderInfoLabel.string = text;
    }

    startLevel(levelId: number): void {
        if (this.isLoading || !LEVELS.find(l => l.id === levelId)) return;

        this.isLoading = true;
        this.currentLevelId = levelId;

        setTimeout(() => {
            this.performLevelStart(levelId);
        }, 50);
    }

    private performLevelStart(levelId: number): void {
        if (!this.gameController) return;

        this.hideLevelSelect();

        const success = this.gameController.startLevel(levelId);

        if (success) {
            this.showGameUI();

            if (this.trajectoryGraphics && this.trajectoryRenderer) {
                this.trajectoryRenderer.setGraphics(this.trajectoryGraphics);
                this.trajectoryRenderer.clearAllTrajectories();
            }

            if (this.warningLabel) {
                this.warningLabel.string = '';
            }

            this.updateOrderInfo();
            this.updateRiderInfo();
            this.updateHUD();
        } else {
            this.showLevelSelect();
        }

        this.isLoading = false;
    }

    private onGameOver(event: any): void {
        if (this.addressInputController) {
            const ctrl = this.addressInputController as any;
            if (ctrl.currentOrder) ctrl.currentOrder = null;
        }
        if (this.settlementPanel && this.gameController) {
            const gs = this.gameController.getGameState();
            const lv = this.gameController.getCurrentLevel();
            const snapshots = this.gameController.getStateSnapshots();

            const wrongSteps = gs?.wrongSteps || event.wrongSteps || [];
            const score = gs?.score ?? event.score ?? 0;
            const totalComp = gs?.totalCompensation ?? event.totalCompensation ?? 0;
            const revenue = gs?.totalRevenue ?? 0;
            const cost = gs?.totalCost ?? 0;
            const isVictory = event.isVictory ?? gs?.isVictory ?? false;
            const reason = event.reason || (isVictory ? '训练完成' : '训练失败');

            this.settlementPanel.showWithData(
                isVictory,
                reason,
                score,
                totalComp,
                revenue,
                cost,
                wrongSteps,
                snapshots,
                lv?.name || ''
            );
        }
    }

    private onRestart(): void {
        if (this.isLoading) return;
        this.startLevel(this.currentLevelId);
    }

    private onNextLevel(): void {
        if (this.isLoading) return;
        const nextLevelId = this.currentLevelId + 1;
        if (LEVELS.find(l => l.id === nextLevelId)) {
            this.startLevel(nextLevelId);
        } else {
            this.showLevelSelect();
        }
    }

    private onAppeal(evidence: any): void {
        if (this.gameController) {
            const gameState = this.gameController.getGameState();
            if (gameState) {
                gameState.totalCompensation = Math.max(0, gameState.totalCompensation - evidence.compensationAmount);
                gameState.totalCost = Math.max(0, gameState.totalCost - evidence.compensationAmount);
                gameState.score += evidence.compensationAmount;
            }
        }
    }

    showLevelSelect(): void {
        if (this.levelSelectPanel) this.levelSelectPanel.active = true;
        if (this.gameUIPanel) this.gameUIPanel.active = false;
    }

    hideLevelSelect(): void {
        if (this.levelSelectPanel) this.levelSelectPanel.active = false;
    }

    showGameUI(): void {
        if (this.gameUIPanel) this.gameUIPanel.active = true;
        if (this.levelSelectPanel) this.levelSelectPanel.active = false;
    }

    hideGameUI(): void {
        if (this.gameUIPanel) this.gameUIPanel.active = false;
    }

    showStatistics(): void {
        if (this.statisticsPanel) this.statisticsPanel.show();
    }

    showReplays(): void {
        if (this.replaySystem) this.replaySystem.refreshReplayList();
    }

    goToMainMenu(): void {
        if (this.gameController) this.gameController.togglePause();
        this.showLevelSelect();
        this.hideGameUI();
        if (this.settlementPanel) this.settlementPanel.hide();
    }

    private onGameHide(): void {
        if (this.gameController && this.gameController.getGameState()) {
            this.gameController.togglePause();
        }
    }

    private onGameShow(): void {
    }

    update(dt: number) {
        if (this.gameUIPanel && this.gameUIPanel.active) {
            this.updateHUD();
        }
    }

    onDestroy(): void {
        this.eventDispatcher.off('game-over', this.onGameOver.bind(this), this);
        this.eventDispatcher.off('level-started', this.onLevelStarted.bind(this), this);
        this.eventDispatcher.off('order-generated', this.onOrderGenerated.bind(this), this);
        this.eventDispatcher.off('rider-rejection', this.onRiderRejection.bind(this), this);
        this.eventDispatcher.off('order-assigned', this.onOrderAssigned.bind(this), this);
        this.eventDispatcher.off('order-completed', this.onOrderCompleted.bind(this), this);
        game.off(Game.EVENT_HIDE, this.onGameHide.bind(this));
        game.off(Game.EVENT_SHOW, this.onGameShow.bind(this));
    }
}
