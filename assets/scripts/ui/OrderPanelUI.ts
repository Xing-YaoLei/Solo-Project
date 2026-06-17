import { _decorator, Component, Node, Label, Sprite, Color, Button, Prefab, instantiate, ScrollView, Layout, Vec3, UIOpacity, UITransform, Layers, Graphics } from 'cc';
import { game } from '../Game';
import { OrderManager } from '../game/OrderManager';
import { DispatchRuleManager } from '../game/DispatchRuleManager';
import { IActiveOrder, IClue, IChoice, IChoiceResult, IWorker, getCategoryText, getPriorityColor, getStatusText } from '../types/GameTypes';
import { EventManager, GameEventType } from '../core/EventManager';
import { Logger } from '../core/Logger';
import { findGameScene } from '../scenes/GameScene';
const { ccclass, property } = _decorator;

@ccclass('OrderPanelUI')
export class OrderPanelUI extends Component {
    @property(Node)
    titleBar: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    priorityLabel: Label | null = null;

    @property(Label)
    locationLabel: Label | null = null;

    @property(Label)
    reporterLabel: Label | null = null;

    @property(Label)
    descriptionLabel: Label | null = null;

    @property(Label)
    categoryLabel: Label | null = null;

    @property(Node)
    stagesContainer: Node | null = null;

    @property(Node)
    cluesContainer: Node | null = null;

    @property(Node)
    choicesContainer: Node | null = null;

    @property(Node)
    workersContainer: Node | null = null;

    @property(Node)
    feedbackArea: Node | null = null;

    @property(Label)
    feedbackLabel: Label | null = null;

    @property(Button)
    closeButton: Button | null = null;

    private orderManager: OrderManager;
    private dispatchManager: DispatchRuleManager;
    private eventManager: EventManager;
    private currentOrderId: string | null = null;
    private lastFeedbackTimeout: any = null;

    onLoad() {
        this.orderManager = game.getOrderManager();
        this.dispatchManager = game.getDispatchRuleManager();
        this.eventManager = EventManager.getInstance();

        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, () => {
                this.node.destroy();
            }, this);
        }

        this.setupEventListeners();
        this.findCurrentOrder();
        this.render();
    }

    private setupEventListeners() {
        this.eventManager.on(GameEventType.CHOICE_MADE, (event) => {
            if (event.data?.orderId === this.currentOrderId) {
                this.scheduleOnce(() => this.render(), 0.1);
                this.showFeedback(event.data.result?.feedback, event.data.result?.isCorrect);
            }
        });

        this.eventManager.on(GameEventType.CLUE_DISCOVERED, (event) => {
            if (event.data?.orderId === this.currentOrderId) {
                this.scheduleOnce(() => this.render(), 0.1);
            }
        });

        this.eventManager.on(GameEventType.ORDER_ASSIGNED, (event) => {
            if (event.data?.orderId === this.currentOrderId) {
                this.scheduleOnce(() => this.render(), 0.1);
            }
        });

        this.eventManager.on(GameEventType.ORDER_COMPLETED, (event) => {
            if (event.data?.orderId === this.currentOrderId) {
                this.scheduleOnce(() => {
                    this.showFeedback(`工单处理完成！+${event.data?.score || 0} 分`, true);
                    this.render();
                }, 0.1);
                this.scheduleOnce(() => this.node.destroy(), 2.0);
            }
        });

        this.eventManager.on(GameEventType.ORDER_FAILED, (event) => {
            if (event.data?.orderId === this.currentOrderId) {
                this.scheduleOnce(() => {
                    const desc = event.data?.penalty?.description || '处理失败';
                    const deduct = event.data?.scoreDeduction || 0;
                    this.showFeedback(`${desc} -${deduct} 分`, false);
                    this.render();
                }, 0.1);
                this.scheduleOnce(() => this.node.destroy(), 2.5);
            }
        });
    }

    private findCurrentOrder() {
        const orders = this.orderManager.getAllActiveOrders();
        if (orders.length > 0) {
            const accepted = orders.find(o => o.status !== 'pending') || orders[0];
            this.currentOrderId = accepted.id;
            if (accepted.status === 'pending') {
                this.orderManager.acceptOrder(accepted.id);
            }
        }
    }

    public render() {
        if (!this.currentOrderId) return;
        const order = this.orderManager.getActiveOrder(this.currentOrderId);
        if (!order) {
            this.node.destroy();
            return;
        }
        this.renderHeader(order);
        this.renderDescription(order);
        this.renderCurrentStage(order);
        this.renderClues(order);
        this.renderChoices(order);
        this.renderWorkers(order);
    }

    private renderHeader(order: IActiveOrder) {
        const priIcons: Record<string, string> = { urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
        const priNames: Record<string, string> = { urgent: '紧急', high: '高', medium: '中', low: '低' };

        if (this.titleLabel) {
            this.titleLabel.string = `${priIcons[order.priority]} ${order.title}`;
            this.titleLabel.color = new Color(40, 40, 40);
        }
        if (this.priorityLabel) {
            this.priorityLabel.string = `优先级: ${priNames[order.priority]}  |  状态: ${getStatusText(order.status)}`;
            this.priorityLabel.color = new Color(getPriorityColor(order.priority));
        }
        if (this.locationLabel) {
            this.locationLabel.string = `📍 ${order.location.description}`;
        }
        if (this.reporterLabel) {
            this.reporterLabel.string = `👤 报修人：${order.reporter}${order.reporterPhone ? ' ' + order.reporterPhone : ''}`;
        }
        if (this.categoryLabel) {
            this.categoryLabel.string = `🏷️ ${getCategoryText(order.category)}`;
        }

        const titleBar = this.titleBar || this.node;
        const barSprite = titleBar.getComponent(Sprite) || titleBar.getComponentInChildren(Sprite);
        if (barSprite) {
            const colors: Record<string, Color> = {
                urgent: new Color(255, 230, 230),
                high: new Color(255, 243, 230),
                medium: new Color(255, 252, 230),
                low: new Color(230, 250, 230)
            };
            barSprite.color = colors[order.priority] || new Color(245, 245, 245);
        }
    }

    private renderDescription(order: IActiveOrder) {
        if (!this.descriptionLabel) return;
        this.descriptionLabel.string = `📝 报修详情：\n${order.description}`;
    }

    private renderCurrentStage(order: IActiveOrder) {
        if (!this.stagesContainer) return;
        this.stagesContainer.removeAllChildren();

        const stage = this.orderManager.getCurrentStage(order);
        if (!stage) return;

        const stageNode = new Node('CurrentStage');
        stageNode.layer = Layers.Enum.UI_2D;
        stageNode.addComponent(UITransform).setContentSize(560, 70);
        const bg = stageNode.addComponent(Sprite);
        bg.color = new Color(240, 245, 255);
        bg.type = Sprite.Type.SLICED;

        const titleNode = new Node('StageTitle');
        titleNode.layer = Layers.Enum.UI_2D;
        const titleUi = titleNode.addComponent(UITransform);
        titleUi.setContentSize(540, 28);
        titleUi.anchorY = 1;
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.string = `🎯 当前步骤：${stage.name}`;
        titleLbl.fontSize = 16;
        titleLbl.color = new Color(40, 80, 180);
        titleNode.setPosition(new Vec3(10, -12, 0));
        stageNode.addChild(titleNode);

        const descNode = new Node('StageDesc');
        descNode.layer = Layers.Enum.UI_2D;
        const descUi = descNode.addComponent(UITransform);
        descUi.setContentSize(540, 30);
        descUi.anchorY = 1;
        const descLbl = descNode.addComponent(Label);
        descLbl.string = stage.description;
        descLbl.fontSize = 13;
        descLbl.color = new Color(80, 80, 80);
        descNode.setPosition(new Vec3(10, -42, 0));
        stageNode.addChild(descNode);

        this.stagesContainer.addChild(stageNode);
    }

    private renderClues(order: IActiveOrder) {
        if (!this.cluesContainer) return;
        this.cluesContainer.removeAllChildren();

        const titleNode = new Node('CluesTitle');
        titleNode.layer = Layers.Enum.UI_2D;
        const titleUi = titleNode.addComponent(UITransform);
        titleUi.setContentSize(560, 28);
        titleUi.anchorY = 1;
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.string = '🔍 线索发现';
        titleLbl.fontSize = 15;
        titleLbl.color = new Color(60, 60, 60);
        titleLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.cluesContainer.addChild(titleNode);

        const discovered = this.orderManager.getDiscoveredClues(order);
        if (discovered.length === 0) {
            const emptyNode = this.createInfoRow('（暂无线索，请通过选择推进）', new Color(180, 180, 180), 13);
            emptyNode.setPosition(new Vec3(0, -32, 0));
            this.cluesContainer.addChild(emptyNode);
            return;
        }

        discovered.forEach((clue, i) => {
            const row = this.createClueRow(clue, i);
            this.cluesContainer.addChild(row);
        });
    }

    private createClueRow(clue: IClue, index: number): Node {
        const node = new Node(`Clue_${clue.id}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(560, 50);
        ui.anchorY = 1;

        const bg = node.addComponent(Sprite);
        bg.color = new Color(255, 252, 235);
        bg.type = Sprite.Type.SLICED;

        const iconLabels = new Node('Icon');
        iconLabels.layer = Layers.Enum.UI_2D;
        const iUi = iconLabels.addComponent(UITransform);
        iUi.setContentSize(30, 30);
        iUi.anchorY = 1;
        const iLbl = iconLabels.addComponent(Label);
        iLbl.string = this.getClueIcon(clue.category);
        iLbl.fontSize = 18;
        iconLabels.setPosition(new Vec3(10, -25, 0));
        node.addChild(iconLabels);

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(500, 20);
        tUi.anchorY = 1;
        const tLbl = titleNode.addComponent(Label);
        tLbl.string = clue.title;
        tLbl.fontSize = 13;
        tLbl.color = new Color(80, 60, 20);
        tLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        titleNode.setPosition(new Vec3(40, -15, 0));
        node.addChild(titleNode);

        const descNode = new Node('Desc');
        descNode.layer = Layers.Enum.UI_2D;
        const dUi = descNode.addComponent(UITransform);
        dUi.setContentSize(500, 20);
        dUi.anchorY = 1;
        const dLbl = descNode.addComponent(Label);
        dLbl.string = clue.description;
        dLbl.fontSize = 12;
        dLbl.color = new Color(120, 100, 60);
        dLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        descNode.setPosition(new Vec3(40, -35, 0));
        node.addChild(descNode);

        const offsetY = -30 - index * 55;
        node.setPosition(new Vec3(0, offsetY, 0));
        return node;
    }

    private getClueIcon(category: string): string {
        const map: Record<string, string> = {
            location: '📍',
            description: '📝',
            urgency: '⚡',
            detail: '🔎',
            default: '💡'
        };
        return map[category] || map.default;
    }

    private createInfoRow(text: string, color: Color, fontSize: number = 13): Node {
        const node = new Node('InfoRow');
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(560, 24);
        ui.anchorY = 1;
        const lbl = node.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = fontSize;
        lbl.color = color;
        lbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        return node;
    }

    private renderChoices(order: IActiveOrder) {
        if (!this.choicesContainer) return;
        this.choicesContainer.removeAllChildren();

        const title = this.createInfoRow('🤔 请选择处理方式', new Color(40, 40, 40), 15);
        this.choicesContainer.addChild(title);

        const choices = this.orderManager.getAvailableChoices(order.id);
        if (choices.length === 0) {
            const empty = this.createInfoRow('（没有可选项，已进入派工阶段）', new Color(180, 180, 180), 12);
            empty.setPosition(new Vec3(0, -32, 0));
            this.choicesContainer.addChild(empty);
            return;
        }

        choices.forEach((choice, i) => {
            const btnNode = this.createChoiceButton(choice, i, order);
            this.choicesContainer.addChild(btnNode);
        });
    }

    private createChoiceButton(choice: IChoice, index: number, order: IActiveOrder): Node {
        const node = new Node(`Choice_${choice.id}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(560, 56);
        ui.anchorY = 1;

        const bg = node.addComponent(Sprite);
        bg.type = Sprite.Type.SLICED;
        bg.color = new Color(255, 255, 255);

        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.COLOR;
        btn.normalColor = new Color(255, 255, 255);
        btn.hoverColor = new Color(240, 248, 255);
        btn.pressedColor = new Color(220, 238, 255);
        btn.disabledColor = new Color(240, 240, 240);

        btn.node.on(Button.EventType.CLICK, () => {
            Logger.info(`[选择] ${choice.text}`);
            const result = this.orderManager.makeChoice(order.id, choice.id);
            this.processChoiceResult(order, choice, result);
        }, this);

        const labelNode = new Node('Text');
        labelNode.layer = Layers.Enum.UI_2D;
        const lUi = labelNode.addComponent(UITransform);
        lUi.setContentSize(530, 48);
        const lbl = labelNode.addComponent(Label);
        lbl.string = `${index + 1}. ${choice.text}`;
        lbl.fontSize = 14;
        lbl.lineHeight = 20;
        lbl.color = new Color(50, 50, 50);
        lbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;
        labelNode.setPosition(new Vec3(15, 0, 0));
        node.addChild(labelNode);

        if (choice.requiredClues && choice.requiredClues.length > 0) {
            const lockNode = new Node('Lock');
            lockNode.layer = Layers.Enum.UI_2D;
            const lockUi = lockNode.addComponent(UITransform);
            lockUi.setContentSize(50, 20);
            const lockLbl = lockNode.addComponent(Label);
            lockLbl.string = '🔒 需线索';
            lockLbl.fontSize = 11;
            lockLbl.color = new Color(180, 120, 40);
            lockNode.setPosition(new Vec3(240, 0, 0));
            node.addChild(lockNode);
        }

        node.setPosition(new Vec3(0, -32 - index * 64, 0));
        return node;
    }

    private processChoiceResult(order: IActiveOrder, choice: IChoice, result: IChoiceResult | null) {
        if (!result) return;

        if (result.reward?.unlockRule) {
            const ruleId = result.reward.unlockRule;
            this.dispatchManager.unlockRule(ruleId);
            this.eventManager.emit(GameEventType.RULE_UNLOCKED, { ruleId });
        }

        const scene = findGameScene();
        if (result.endOrder) {
            const assignedWorker = result.changeAssignedWorker;
            if (assignedWorker && this.currentOrderId) {
                const valid = this.dispatchManager.validateDispatch(this.currentOrderId, order, assignedWorker);
                if (!valid.isValid && valid.penalty > 0) {
                    game.getGameManager().deductScore(valid.penalty, 'DISPATCH_VALIDATION');
                    if (scene) {
                        scene.showNotification('⚠️ 派单复核不通过', valid.violations.join('；'), 'warning');
                    }
                }
                this.dispatchManager.assignWorker(this.currentOrderId, assignedWorker);
            }
            this.scheduleOnce(() => {
                if (scene) {
                    scene.spawnReviewPanel();
                    scene.spawnDispatchPanel();
                }
            }, 1.2);
        }
    }

    private renderWorkers(order: IActiveOrder) {
        if (!this.workersContainer) return;
        this.workersContainer.removeAllChildren();

        const stage = this.orderManager.getCurrentStage(order);
        const needsDispatch = !stage || stage.id === order.stages[order.stages.length - 1]?.id;
        if (!needsDispatch) return;

        const title = this.createInfoRow('👷 可选派工（点击选择）', new Color(40, 40, 40), 15);
        this.workersContainer.addChild(title);

        const recommendations = this.dispatchManager.getDispatchRecommendations(order);
        if (recommendations.length === 0) {
            const empty = this.createInfoRow('（暂无可用维修人员）', new Color(180, 180, 180), 12);
            empty.setPosition(new Vec3(0, -32, 0));
            this.workersContainer.addChild(empty);
            return;
        }

        recommendations.forEach((rec, i) => {
            const worker = this.dispatchManager.getWorker(rec.workerId);
            if (!worker) return;
            const btnNode = this.createWorkerButton(worker, rec, i, order);
            this.workersContainer.addChild(btnNode);
        });
    }

    private createWorkerButton(worker: IWorker, rec: any, index: number, order: IActiveOrder): Node {
        const node = new Node(`Worker_${worker.id}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(560, 66);
        ui.anchorY = 1;

        const bg = node.addComponent(Sprite);
        bg.type = Sprite.Type.SLICED;
        bg.color = rec.isRecommended ? new Color(235, 250, 240) : new Color(255, 245, 240);

        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.COLOR;
        btn.normalColor = bg.color;
        btn.hoverColor = new Color(245, 248, 255);
        btn.pressedColor = new Color(225, 235, 255);

        btn.node.on(Button.EventType.CLICK, () => {
            Logger.info(`[派工] ${order.id} -> ${worker.name}`);
            const valid = this.dispatchManager.validateDispatch(order.id, order, worker.id);
            if (!valid.isValid) {
                valid.violations.forEach(v => {
                    this.showFeedback(`⚠️ ${v}`, false);
                });
            }
            const lastStage = order.stages[order.stages.length - 1];
            if (lastStage) {
                const correct = lastStage.choices.find(c => c.result.isCorrect);
                if (correct) {
                    correct.result.changeAssignedWorker = worker.id;
                    const result = this.orderManager.makeChoice(order.id, correct.id);
                    this.processChoiceResult(order, correct, result);
                } else {
                    this.dispatchManager.assignWorker(order.id, worker.id);
                    this.orderManager.assignOrder(order.id, worker.id);
                    this.render();
                }
            } else {
                this.dispatchManager.assignWorker(order.id, worker.id);
                this.orderManager.assignOrder(order.id, worker.id);
                this.render();
            }
            const scene = findGameScene();
            if (scene) {
                scene.showNotification('📨 派单成功', `${order.title} → ${worker.name}`, 'success');
            }
        }, this);

        const nameNode = new Node('Name');
        nameNode.layer = Layers.Enum.UI_2D;
        const nUi = nameNode.addComponent(UITransform);
        nUi.setContentSize(200, 24);
        nUi.anchorY = 1;
        const nLbl = nameNode.addComponent(Label);
        nLbl.string = `${rec.isRecommended ? '✅ ' : '❓ '}${worker.name}`;
        nLbl.fontSize = 14;
        nLbl.color = new Color(50, 50, 50);
        nLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        nameNode.setPosition(new Vec3(10, -18, 0));
        node.addChild(nameNode);

        const skillStr = worker.skills.map(s => getCategoryText(s) + ` Lv.${worker.skillLevel.get(s) || 1}`).join('、');
        const infoNode = new Node('Info');
        infoNode.layer = Layers.Enum.UI_2D;
        const iUi = infoNode.addComponent(UITransform);
        iUi.setContentSize(460, 20);
        iUi.anchorY = 1;
        const iLbl = infoNode.addComponent(Label);
        iLbl.string = `技能：${skillStr}  |  工作量：${worker.currentLoad}/${worker.maxLoad}  |  匹配度：${rec.matchScore}%`;
        iLbl.fontSize = 11;
        iLbl.color = new Color(100, 100, 100);
        iLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        infoNode.setPosition(new Vec3(10, -42, 0));
        node.addChild(infoNode);

        if (rec.ruleViolations && rec.ruleViolations.length > 0) {
            const warnNode = new Node('Warning');
            warnNode.layer = Layers.Enum.UI_2D;
            const wUi = warnNode.addComponent(UITransform);
            wUi.setContentSize(460, 18);
            wUi.anchorY = 1;
            const wLbl = warnNode.addComponent(Label);
            wLbl.string = '⚠️ ' + rec.ruleViolations.slice(0, 2).join('；');
            wLbl.fontSize = 10;
            wLbl.color = new Color(200, 80, 40);
            wLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
            warnNode.setPosition(new Vec3(10, -60, 0));
            node.addChild(warnNode);
        }

        node.setPosition(new Vec3(0, -32 - index * 72, 0));
        return node;
    }

    private showFeedback(message: string, isCorrect: boolean) {
        if (!this.feedbackArea || !this.feedbackLabel) return;

        this.feedbackArea.active = true;
        this.feedbackLabel.string = message;
        this.feedbackLabel.color = isCorrect ? new Color(60, 170, 90) : new Color(220, 80, 70);

        const bg = this.feedbackArea.getComponent(Sprite) || this.feedbackArea.getComponentInChildren(Sprite);
        if (bg) {
            bg.color = isCorrect ? new Color(230, 250, 235, 240) : new Color(255, 235, 235, 240);
        }

        const opacity = this.feedbackArea.getComponent(UIOpacity) || this.feedbackArea.addComponent(UIOpacity);
        opacity.opacity = 0;
        let t = 0;
        const scheduler = this.scheduler;
        if (this.lastFeedbackTimeout) scheduler.unschedule(this.lastFeedbackTimeout, this);
        const cb = () => {
            t += 1 / 30;
            if (t < 0.2) {
                opacity.opacity = Math.round((t / 0.2) * 255);
            } else if (t < 2.2) {
                opacity.opacity = 255;
            } else if (t < 2.8) {
                const ft = (t - 2.2) / 0.6;
                opacity.opacity = Math.round((1 - ft) * 255);
            } else {
                opacity.opacity = 0;
                this.feedbackArea!.active = false;
                scheduler.unschedule(cb, this);
                return;
            }
        };
        this.lastFeedbackTimeout = cb;
        scheduler.schedule(cb, this, 1 / 30, false);
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
    }
}
