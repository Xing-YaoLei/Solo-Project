import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { ITrialScheduleItem } from '../core/GameInterfaces';
import { GameConstants } from '../core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('TrialScheduleUI')
export class TrialScheduleUI extends UIBase {

    @property(ScrollView)
    scheduleScrollView: ScrollView | null = null;

    @property(Prefab)
    scheduleItemPrefab: Prefab | null = null;

    @property(Node)
    scheduleContent: Node | null = null;

    @property(Label)
    caseTitleLabel: Label | null = null;

    @property(Label)
    currentDayLabel: Label | null = null;

    @property(Label)
    currentStageLabel: Label | null = null;

    private _scheduleItems: Node[] = [];

    protected onShow(): void {
        this.refreshUI();
    }

    public refreshUI(): void {
        const currentCase = GameManager.instance.getCurrentCase();
        if (!currentCase) return;

        this.setLabelText(this.caseTitleLabel, currentCase.title);
        this.setLabelText(this.currentDayLabel, `第 ${GameManager.instance.getDayCount()} 天`);
        
        const currentStage = GameManager.instance.getCurrentStage();
        if (currentStage) {
            this.setLabelText(this.currentStageLabel, 
                `当前阶段: ${GameConstants.STAGE_NAMES[currentStage.stage as GameConstants.CaseStage]}`);
        }

        this.refreshScheduleList();
    }

    private refreshScheduleList(): void {
        if (!this.scheduleContent || !this.scheduleItemPrefab) return;

        this._scheduleItems.forEach(item => item.destroy());
        this._scheduleItems = [];

        const schedule = GameManager.instance.getTrialSchedule();
        const currentStage = GameManager.instance.getCurrentStage();

        schedule.forEach((item: ITrialScheduleItem, index: number) => {
            const itemNode = instantiate(this.scheduleItemPrefab!);
            this.scheduleContent!.addChild(itemNode);
            this._scheduleItems.push(itemNode);

            this.setupScheduleItem(itemNode, item, currentStage?.stage);
        });
    }

    private setupScheduleItem(node: Node, item: ITrialScheduleItem, currentStage?: string): void {
        const dayLabel = node.getChildByName('DayLabel')?.getComponent(Label);
        const stageLabel = node.getChildByName('StageLabel')?.getComponent(Label);
        const eventLabel = node.getChildByName('EventLabel')?.getComponent(Label);
        const timeLabel = node.getChildByName('TimeLabel')?.getComponent(Label);
        const courtLabel = node.getChildByName('CourtLabel')?.getComponent(Label);
        const completedMark = node.getChildByName('CompletedMark');
        const currentMark = node.getChildByName('CurrentMark');

        this.setLabelText(dayLabel, `第${item.day}天`);
        
        const stageName = GameConstants.STAGE_NAMES[item.stage as GameConstants.CaseStage] || item.stage;
        this.setLabelText(stageLabel, stageName);
        this.setLabelText(eventLabel, item.event);
        this.setLabelText(timeLabel, `${item.durationHours}小时`);
        
        if (item.courtRoom) {
            this.setLabelText(courtLabel, item.courtRoom);
        } else {
            this.setLabelText(courtLabel, '');
        }

        const stageOrder = GameConstants.STAGE_ORDER;
        const currentIndex = stageOrder.indexOf(currentStage as GameConstants.CaseStage);
        const itemIndex = stageOrder.indexOf(item.stage);

        if (completedMark) {
            completedMark.active = itemIndex < currentIndex;
        }

        if (currentMark) {
            currentMark.active = item.stage === currentStage;
        }

        if (itemIndex < currentIndex) {
            const bg = node.getChildByName('BgSprite')?.getComponent(Sprite);
            if (bg) {
                bg.color = new Color(100, 100, 100, 100);
            }
        } else if (item.stage === currentStage) {
            const bg = node.getChildByName('BgSprite')?.getComponent(Sprite);
            if (bg) {
                bg.color = new Color(0, 150, 255, 50);
            }
        }
    }
}
