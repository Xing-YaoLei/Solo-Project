import { _decorator, Component, Node, Label, Button, Sprite, Color, TiledMap, director, ScrollView, UITransform, Layout, Prefab, instantiate, Vec3, find, input, Input, KeyCode, EventKeyboard, UIOpacity } from 'cc';
import { getLevelById } from '../core/LevelData';
import { GameManager } from '../core/GameManager';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
import { AudioManager, SfxType } from '../core/AudioManager';
import { LevelConfig, Order, TicketType, OrderStatus, TICKET_TYPE_NAMES, TICKET_TYPE_COLORS, Seat } from '../core/GameTypes';
import { SeatMapManager } from '../managers/SeatMapManager';
import { OrderProcessor, OrderProcessingResult } from '../managers/OrderProcessor';
import { GameEngine } from '../managers/GameEngine';
import { HUDController } from '../ui/HUDController';
const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
    @property(Node)
    gameRoot: Node | null = null;

    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property(Node)
    seatsContainer: Node | null = null;

    @property(Node)
    orderPanel: Node | null = null;

    @property(Label)
    orderTitleLabel: Label | null = null;

    @property(Label)
    customerNameLabel: Label | null = null;

    @property(Label)
    orderItemsLabel: Label | null = null;

    @property(Label)
    orderRequirementsLabel: Label | null = null;

    @property(Label)
    totalPriceLabel: Label | null = null;

    @property(Label)
    orderHintLabel: Label | null = null;

    @property(Node)
    rulesPanel: Node | null = null;

    @property(Node)
    rulesContent: Node | null = null;

    @property(Prefab)
    ruleItemPrefab: Prefab | null = null;

    @property(Button)
    confirmButton: Button | null = null;

    @property(Button)
    rejectButton: Button | null = null;

    @property(Button)
    suggestButton: Button | null = null;

    @property(Button)
    clearSelectionButton: Button | null = null;

    @property(Button)
    pauseButton: Node | null = null;

    @property(Button)
    backToMenuButton: Button | null = null;

    @property(Node)
    pausePanel: Node | null = null;

    @property(Button)
    resumeButton: Button | null = null;

    @property(Button)
    restartButton: Button | null = null;

    @property(Node)
    legendPanel: Node | null = null;

    private seatManager: SeatMapManager | null = null;
    private orderProcessor: OrderProcessor | null = null;
    private gameEngine: GameEngine | null = null;
    private hud: HUDController | null = null;
    private levelConfig: LevelConfig | null = null;

    private orderSpawnTimer: number = 0;

    onLoad() {
        const levelId = GameManager.instance.currentLevelId;
        this.levelConfig = getLevelById(levelId);

        if (!this.levelConfig) {
            director.loadScene('main-menu');
            return;
        }

        this.initializeComponents();
        this.setupButtonListeners();
        this.setupKeyboardShortcuts();
        this.renderRules();
        this.renderLegend();
        this.startLevel();
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.gameEngine?.destroy();
    }

    private initializeComponents(): void {
        const seatNode = new Node('SeatMapManager');
        this.seatManager = seatNode.addComponent(SeatMapManager);
        this.seatManager.tiledMap = this.tiledMap;
        this.seatManager.seatsContainer = this.seatsContainer;
        this.gameRoot?.addChild(seatNode);

        const opNode = new Node('OrderProcessor');
        this.orderProcessor = opNode.addComponent(OrderProcessor);
        this.gameRoot?.addChild(opNode);

        const engineNode = new Node('GameEngine');
        this.gameEngine = engineNode.addComponent(GameEngine);
        this.gameRoot?.addChild(engineNode);

        const hudNode = find('Canvas/HUD');
        if (hudNode) {
            this.hud = hudNode.getComponent(HUDController) || hudNode.addComponent(HUDController);
        }

        this.seatManager.onSeatClicked = () => {
            this.updateOrderHint();
            AudioManager.instance.playSfx(SfxType.SEAT_SELECT);
        };
    }

    private setupButtonListeners(): void {
        this.confirmButton?.node.on(Button.EventType.CLICK, this.onConfirmOrder, this);
        this.rejectButton?.node.on(Button.EventType.CLICK, this.onRejectOrder, this);
        this.suggestButton?.node.on(Button.EventType.CLICK, this.onSuggestSeats, this);
        this.clearSelectionButton?.node.on(Button.EventType.CLICK, this.onClearSelection, this);
        this.pauseButton?.on(Button.EventType.CLICK, this.onPause, this);
        this.backToMenuButton?.node.on(Button.EventType.CLICK, this.onBackToMenu, this);
        this.resumeButton?.node.on(Button.EventType.CLICK, this.onResume, this);
        this.restartButton?.node.on(Button.EventType.CLICK, this.onRestart, this);
    }

    private setupKeyboardShortcuts(): void {
        if (!GameManager.instance.settings.keyboardShortcuts) return;
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.SPACE:
                event.propagationStopped = true;
                this.onConfirmOrder();
                break;
            case KeyCode.KEY_R:
                this.onRejectOrder();
                break;
            case KeyCode.KEY_S:
                this.onSuggestSeats();
                break;
            case KeyCode.KEY_C:
                this.onClearSelection();
                break;
            case KeyCode.ESCAPE:
                this.onPause();
                break;
            case KeyCode.DIGIT_1:
            case KeyCode.DIGIT_2:
            case KeyCode.DIGIT_3:
            case KeyCode.DIGIT_4:
            case KeyCode.DIGIT_5:
            case KeyCode.DIGIT_6:
            case KeyCode.DIGIT_7:
            case KeyCode.DIGIT_8:
            case KeyCode.DIGIT_9:
                this.quickSelectByType(event.keyCode - KeyCode.DIGIT_1);
                break;
        }
    }

    private quickSelectByType(index: number): void {
        if (!this.gameEngine || !this.levelConfig) return;

        const order = this.gameEngine.getCurrentOrder();
        if (!order || index >= order.items.length) return;

        const targetItem = order.items[index];
        if (!targetItem || !this.seatManager) return;

        const available = this.seatManager.getAvailableSeats(targetItem.ticketType);
        for (const seat of available) {
            const selected = this.seatManager.getSelectedSeats();
            const alreadySelected = selected.some(s =>
                s.ticketType === targetItem.ticketType
            );
            const typeCount = selected.filter(s => s.ticketType === targetItem.ticketType).length;
            const targetCount = order.items.filter(i => i.ticketType === targetItem.ticketType).length;

            if (typeCount < targetCount) {
                this.seatManager.selectSeat(seat.id);
            }
        }
        this.updateOrderHint();
    }

    private renderRules(): void {
        if (!this.rulesContent || !this.levelConfig) return;

        this.rulesContent.removeAllChildren();

        for (let i = 0; i < this.levelConfig.ticketRules.length; i++) {
            const rule = this.levelConfig.ticketRules[i];

            let itemNode: Node;
            if (this.ruleItemPrefab) {
                itemNode = instantiate(this.ruleItemPrefab);
            } else {
                itemNode = new Node(`Rule_${rule.id}`);
                itemNode.addComponent(UITransform).setContentSize(280, 70);

                const bg = itemNode.addComponent(Sprite);
                bg.color = new Color().fromHEX(TICKET_TYPE_COLORS[rule.ticketType] + '80');

                const nameNode = new Node('Name');
                nameNode.addComponent(UITransform).setContentSize(260, 24);
                nameNode.setPosition(-130, 18);
                const nameLabel = nameNode.addComponent(Label);
                nameLabel.string = `[${i + 1}] ${rule.name} ¥${rule.basePrice}`;
                nameLabel.fontSize = 16;
                nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                itemNode.addChild(nameNode);

                const descNode = new Node('Desc');
                descNode.addComponent(UITransform).setContentSize(260, 36);
                descNode.setPosition(-130, -12);
                const descLabel = descNode.addComponent(Label);
                descLabel.string = rule.description;
                descLabel.fontSize = 11;
                descLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                descLabel.overflow = Label.Overflow.CLAMP;
                itemNode.addChild(descNode);

                const layout = itemNode.getComponent(Layout) || itemNode.addComponent(Layout);
                layout.type = Layout.Type.VERTICAL;
                layout.spacingY = 4;
            }

            this.rulesContent.addChild(itemNode);
        }

        if (this.rulesContent.parent) {
            const scroll = this.rulesContent.parent.getComponent(ScrollView);
            if (scroll) {
                scroll.scrollToTop(0);
            }
        }
    }

    private renderLegend(): void {
        if (!this.legendPanel || !this.levelConfig) return;

        this.legendPanel.removeAllChildren();

        const title = new Node('Title');
        title.addComponent(UITransform).setContentSize(200, 24);
        const titleLabel = title.addComponent(Label);
        titleLabel.string = '座位图例';
        titleLabel.fontSize = 14;
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.legendPanel.addChild(title);

        let y = -20;
        const types = new Set(this.levelConfig.ticketRules.map(r => r.ticketType));

        for (const type of types) {
            const row = new Node(`Legend_${type}`);
            row.addComponent(UITransform).setContentSize(180, 24);
            row.setPosition(0, y);

            const colorBox = new Node('Color');
            colorBox.addComponent(UITransform).setContentSize(16, 16);
            colorBox.setPosition(-80, 0);
            const sprite = colorBox.addComponent(Sprite);
            sprite.color = new Color().fromHEX(TICKET_TYPE_COLORS[type]);
            row.addChild(colorBox);

            const labelNode = new Node('Name');
            labelNode.addComponent(UITransform).setContentSize(140, 20);
            labelNode.setPosition(10, 0);
            const label = labelNode.addComponent(Label);
            label.string = TICKET_TYPE_NAMES[type];
            label.fontSize = 12;
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            row.addChild(labelNode);

            this.legendPanel.addChild(row);
            y -= 28;
        }
    }

    private async startLevel(): Promise<void> {
        if (!this.levelConfig || !this.seatManager || !this.gameEngine || !this.orderProcessor) return;

        this.orderProcessor.init(this.levelConfig, this.seatManager);
        this.gameEngine.init(this.levelConfig, this.seatManager);

        this.setupEngineCallbacks();

        await this.seatManager.initFromTiled(this.levelConfig.seatMapTiled);
        this.gameEngine.startGame();
    }

    private setupEngineCallbacks(): void {
        if (!this.gameEngine) return;

        this.gameEngine.onCountdownUpdated = (num) => {
            this.hud?.showCountdown(num);
            AudioManager.instance.playCountdownTick();
        };

        this.gameEngine.onGameStart = () => {
            if (this.hud && this.levelConfig) {
                this.hud.updateOrderProgress(0, this.levelConfig.targetOrders);
            }
            AudioManager.instance.playSfx(SfxType.SUCCESS);
            this.spawnNewOrder();
        };

        this.gameEngine.onOrderSpawned = (order) => {
            this.displayOrder(order);
        };

        this.gameEngine.onOrderProcessed = (result) => {
            this.handleOrderProcessed(result);
        };

        this.gameEngine.onTimeUpdated = (remaining, elapsed) => {
            if (this.hud && this.levelConfig) {
                this.hud.updateTimer(remaining, this.levelConfig.duration);
            }
        };

        this.gameEngine.onErrorOccurred = () => {
            this.hud?.showErrorFeedback();
            AudioManager.instance.playSfx(SfxType.ERROR);
            FeedbackManager.instance.vibrate(VibrationType.ERROR);

            if (this.gameEngine && this.levelConfig) {
                this.hud?.updateErrorCount(this.gameEngine.getState()!.stats.errors, this.levelConfig.maxErrors);
            }
        };

        this.gameEngine.onCorrectAction = (combo) => {
            this.hud?.showCorrectFeedback();
            this.hud?.updateCombo(combo);
            AudioManager.instance.playSfx(SfxType.ORDER_COMPLETE);
            FeedbackManager.instance.vibrate(VibrationType.SUCCESS);
        };

        this.gameEngine.onGameEnd = (result) => {
            this.handleGameEnd(result);
        };
    }

    private spawnNewOrder(): void {
        if (!this.gameEngine || !this.orderProcessor) return;
        const order = this.orderProcessor.generateOrder();
        this.gameEngine.setCurrentOrder(order);
    }

    private displayOrder(order: Order): void {
        if (this.customerNameLabel) {
            this.customerNameLabel.string = `👤 ${order.customerName}`;
        }

        if (this.orderItemsLabel) {
            let itemsText = '';
            const typeCounts = new Map<TicketType, number>();
            for (const item of order.items) {
                const c = typeCounts.get(item.ticketType) || 0;
                typeCounts.set(item.ticketType, c + 1);
            }

            for (const [type, count] of typeCounts) {
                const rule = this.levelConfig?.ticketRules.find(r => r.ticketType === type);
                itemsText += `🎫 ${TICKET_TYPE_NAMES[type]} x ${count} (¥${rule?.basePrice || 0}张)\n`;
            }
            this.orderItemsLabel.string = itemsText.trim();
        }

        if (this.orderRequirementsLabel) {
            let reqText = '';
            reqText += order.requirements.hasId ? '✅ 已出示身份证' : '❌ 未出示身份证';
            reqText += '\n';
            if (order.requirements.hasStudentId !== undefined) {
                reqText += order.requirements.hasStudentId ? '✅ 已出示学生证' : '❌ 未出示学生证';
                reqText += '\n';
            }
            if (order.requirements.groupSize !== undefined) {
                reqText += `👥 同行人数: ${order.requirements.groupSize}\n`;
            }
            if (order.requirements.customerAge !== undefined) {
                reqText += `🎂 年龄: ${order.requirements.customerAge}岁\n`;
            }
            reqText += `💳 支付方式: ${order.paymentMethod}`;
            if (order.isDiscounted) {
                reqText += '\n🏷️ 已使用折扣码';
            }
            this.orderRequirementsLabel.string = reqText;
        }

        if (this.totalPriceLabel) {
            this.totalPriceLabel.string = `总计: ¥${order.totalPrice}`;
        }

        this.seatManager?.clearSelection();
        this.updateOrderHint();

        if (this.orderPanel && FeedbackManager.instance.shouldAnimate()) {
            this.orderPanel.setScale(0.95, 0.95, 1);
            import('cc').then(({ tween }) => {
                tween(this.orderPanel)
                    .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .start();
            });
        }
    }

    private updateOrderHint(): void {
        if (!this.orderHintLabel || !this.gameEngine) return;

        const order = this.gameEngine.getCurrentOrder();
        const selected = this.seatManager?.getSelectedSeats() || [];

        if (!order) {
            this.orderHintLabel.string = '';
            return;
        }

        const needCount = order.items.length;
        const selectedCount = selected.length;

        if (selectedCount === 0) {
            this.orderHintLabel.string = `💡 请选择 ${needCount} 个座位，或按 [R] 拒绝订单`;
            this.orderHintLabel.color = new Color(155, 155, 155, 255);
        } else if (selectedCount === needCount) {
            this.orderHintLabel.string = `✅ 已选择 ${selectedCount}/${needCount} 个座位，按 [空格] 确认`;
            this.orderHintLabel.color = new Color(46, 204, 113, 255);
        } else if (selectedCount < needCount) {
            this.orderHintLabel.string = `📍 已选择 ${selectedCount}/${needCount} 个座位，继续选择...`;
            this.orderHintLabel.color = new Color(241, 196, 15, 255);
        } else {
            this.orderHintLabel.string = `⚠️ 已选 ${selectedCount} 个，超过需要的 ${needCount} 个`;
            this.orderHintLabel.color = new Color(231, 76, 60, 255);
        }
    }

    private onConfirmOrder(): void {
        if (!this.gameEngine || !this.orderProcessor) return;

        const order = this.gameEngine.getCurrentOrder();
        if (!order) return;

        const selectedSeats = this.seatManager?.getSelectedSeats() || [];
        const result = this.orderProcessor.processOrder(order, selectedSeats.map(s => s.id));
        this.gameEngine.processCurrentOrder(result);
    }

    private onRejectOrder(): void {
        if (!this.gameEngine) return;
        this.gameEngine.rejectCurrentOrder();
    }

    private onSuggestSeats(): void {
        if (!this.gameEngine || !this.orderProcessor || !this.seatManager) return;

        const order = this.gameEngine.getCurrentOrder();
        if (!order) return;

        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);

        this.seatManager.clearSelection();
        const suggestion = this.orderProcessor.suggestSeatsForOrder(order);

        if (suggestion.valid) {
            for (const seat of suggestion.suggestedSeats) {
                this.seatManager.selectSeat(seat.id);
            }
            this.updateOrderHint();
        } else {
            if (this.orderHintLabel) {
                this.orderHintLabel.string = '⚠️ ' + suggestion.reasons.join(' ');
                this.orderHintLabel.color = new Color(231, 76, 60, 255);
            }
        }
    }

    private onClearSelection(): void {
        this.seatManager?.clearSelection();
        this.updateOrderHint();
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private handleOrderProcessed(result: OrderProcessingResult): void {
        if (!this.gameEngine || !this.levelConfig) return;

        const state = this.gameEngine.getState();
        if (!state) return;

        this.hud?.updateOrderProgress(state.stats.ordersProcessed, this.levelConfig.targetOrders);

        if (!result.success && result.errors.length > 0) {
            this.showProcessingErrors(result.errors);
        }

        this.scheduleOnce(() => {
            if (this.gameEngine && this.gameEngine.getState()?.phase === 'playing') {
                this.spawnNewOrder();
            }
        }, 0.5);
    }

    private showProcessingErrors(errors: string[]): void {
        if (!this.orderPanel) return;

        let errorNode = this.orderPanel.getChildByName('ErrorMsg');
        if (!errorNode) {
            errorNode = new Node('ErrorMsg');
            errorNode.addComponent(UITransform).setContentSize(400, 60);
            const label = errorNode.addComponent(Label);
            label.fontSize = 14;
            label.color = new Color(231, 76, 60, 255);
            label.overflow = Label.Overflow.CLAMP;
            errorNode.setPosition(0, -150);
            this.orderPanel.addChild(errorNode);
        }

        const label = errorNode.getComponent(Label);
        if (label) {
            label.string = '❌ ' + errors.slice(0, 3).join('\n');
        }

        errorNode.active = true;
        const op = errorNode.getComponent(UIOpacity) || errorNode.addComponent(UIOpacity);
        op.opacity = 255;

        this.scheduleOnce(() => {
            if (errorNode && errorNode.isValid) {
                import('cc').then(({ tween }) => {
                    tween(op)
                        .to(0.5, { opacity: 0 })
                        .call(() => { errorNode!.active = false; })
                        .start();
                });
            }
        }, 2.5);
    }

    private onPause(): void {
        if (!this.gameEngine) return;

        const state = this.gameEngine.getState();
        if (!state) return;

        if (state.phase === 'playing') {
            this.gameEngine.pauseGame();
            if (this.pausePanel) this.pausePanel.active = true;
            AudioManager.instance.playSfx(SfxType.CLICK);
        } else if (state.phase === 'paused') {
            this.onResume();
        }
    }

    private onResume(): void {
        this.gameEngine?.resumeGame();
        if (this.pausePanel) this.pausePanel.active = false;
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onRestart(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.MEDIUM);
        director.loadScene('game-scene');
    }

    private onBackToMenu(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('main-menu');
    }

    private handleGameEnd(result: any): void {
        GameManager.instance.recordLevelResult(result);
        AudioManager.instance.playSfx(result.passed ? SfxType.LEVEL_PASS : SfxType.LEVEL_FAIL);
        FeedbackManager.instance.vibrate(result.passed ? VibrationType.SUCCESS : VibrationType.ERROR);
        director.loadScene('result-scene');
    }
}
