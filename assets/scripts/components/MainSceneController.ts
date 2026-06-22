import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color, Vec3, tween, UITransform, SpriteFrame, Texture2D, ImageAsset } from 'cc';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { GameConstants } from '../core/GameConstants';
import { ICase, IClue, ICaseAction } from '../core/GameInterfaces';
const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {

    @property(Node)
    missionHallPanel: Node | null = null;

    @property(Node)
    casePlayPanel: Node | null = null;

    @property(Node)
    cluePanel: Node | null = null;

    @property(Node)
    resultPanel: Node | null = null;

    @property(Label)
    loadingLabel: Node | null = null;

    @property(Node)
    loadingPanel: Node | null = null;

    private _currentState: 'loading' | 'hall' | 'playing' = 'loading';

    async onLoad() {
        console.log('[MainSceneController] Loading game...');
        this.showPanel('loading');

        try {
            await GameManager.instance.init('configs');
            console.log('[MainSceneController] Game initialized');
        } catch (e) {
            console.error('[MainSceneController] Failed to init:', e);
            this.fallbackLoad();
        }

        this.showMissionHall();
    }

    private fallbackLoad(): void {
        console.warn('[MainSceneController] Using fallback data');
        const save = SaveManager.instance.getSave();
        this.showMissionHall();
    }

    private showPanel(panelName: string): void {
        if (this.missionHallPanel) this.missionHallPanel.active = panelName === 'hall';
        if (this.casePlayPanel) this.casePlayPanel.active = panelName === 'playing';
        if (this.loadingPanel) this.loadingPanel.active = panelName === 'loading';
        if (this.cluePanel) this.cluePanel.active = false;
        if (this.resultPanel) this.resultPanel.active = false;
    }

    public showMissionHall(): void {
        this._currentState = 'hall';
        this.showPanel('hall');
        this.refreshMissionHall();
    }

    private refreshMissionHall(): void {
        const save = SaveManager.instance.getSave();
        const allCases = ConfigManager.instance.getAllCases();
        const container = this.missionHallPanel?.getChildByName('CaseList');

        console.log(`[MainSceneController] ${allCases.length} cases available, score: ${save.totalScore}`);

        allCases.forEach((c, i) => {
            console.log(`  Case ${i + 1}: ${c.title} [${c.difficulty}]`);
        });
    }

    public startCase(caseId: string): void {
        const success = GameManager.instance.startCase(caseId);
        if (!success) {
            console.error(`[MainSceneController] Failed to start case: ${caseId}`);
            return;
        }

        this._currentState = 'playing';
        this.showPanel('playing');
        this.refreshCasePlay();
    }

    private refreshCasePlay(): void {
        const caseData = GameManager.instance.getCurrentCase();
        const stage = GameManager.instance.getCurrentStage();
        const score = GameManager.instance.getScore();
        const maxScore = GameManager.instance.getMaxScore();
        const clues = GameManager.instance.getDiscoveredClues();
        const actions = GameManager.instance.getAvailableActions();

        console.log(`\n[案件进行中] ${caseData?.title}`);
        console.log(`  阶段: ${GameConstants.STAGE_NAMES[stage?.stage as GameConstants.CaseStage] || ''}`);
        console.log(`  得分: ${score}/${maxScore}`);
        console.log(`  线索: ${clues.length}条, 可用动作: ${actions.length}个`);

        clues.forEach((c, i) => {
            console.log(`    线索${i + 1}: ${c.name} [${c.type}]`);
        });

        actions.forEach((a, i) => {
            console.log(`    动作${i + 1}: ${a.name} (${a.isCorrect ? '✓正确' : '✗错误'})`);
        });
    }

    public takeAction(actionId: string): void {
        const result = GameManager.instance.takeAction(actionId);
        console.log(`\n[执行动作] ${actionId}`);
        console.log(`  结果: ${result.isCorrect ? '✓正确' : '✗错误'} 得分变化: ${result.scoreChange}`);
        console.log(`  ${result.message}`);

        if (result.nextStage) {
            console.log(`  → 进入下一阶段`);
        }

        if (GameManager.instance.isPlaying()) {
            this.refreshCasePlay();
        } else {
            this.showCaseResult();
        }
    }

    public showClues(): void {
        if (this.cluePanel) this.cluePanel.active = true;
        const clues = GameManager.instance.getDiscoveredClues();
        console.log(`\n[线索详情] 共${clues.length}条`);
        clues.forEach((c, i) => {
            const typeNames: Record<string, string> = {
                testimony: '证人证言', physical: '物证', documentary: '书证',
                digital: '电子数据', expert: '鉴定意见'
            };
            const keyMark = c.isKey ? ' ⭐关键' : '';
            const missMark = c.missingPage ? ' ⚠️缺页' : '';
            console.log(`  ${i + 1}. ${c.name}${keyMark}${missMark}`);
            console.log(`     类型: ${typeNames[c.type] || c.type} 可信度: ${c.credibility}%`);
            console.log(`     ${c.description}`);
        });
    }

    public hideClues(): void {
        if (this.cluePanel) this.cluePanel.active = false;
    }

    private showCaseResult(): void {
        if (this.resultPanel) this.resultPanel.active = true;
        const records = SaveManager.instance.getTrainingRecords();
        const last = records[records.length - 1];
        if (last) {
            console.log(`\n[案件结案]`);
            console.log(`  最终得分: ${last.score}/${last.maxScore}`);
            console.log(`  ${last.passed ? '✓已通过' : '✗未通过'} ${last.perfect ? '⭐完美通关' : ''}`);
            console.log(`  错误次数: ${last.errorRecords.length}, 材料缺页: ${last.materialMissRecords.length}`);
            last.errorRecords.forEach((e, i) => {
                const catName = GameConstants.ERROR_CATEGORY_NAMES[e.errorCategory] || e.errorCategory;
                console.log(`    错误${i + 1}: [${catName}] ${e.errorReason}`);
            });
        }
    }

    public backToHall(): void {
        if (GameManager.instance.isPlaying()) {
            GameManager.instance.endCase();
        }
        this.showMissionHall();
    }

    public retryCase(): void {
        const currentCase = GameManager.instance.getCurrentCase();
        if (currentCase) {
            this.startCase(currentCase.id);
        }
    }

    public restartGame(): void {
        SaveManager.instance.resetSave();
        this.showMissionHall();
    }
}
