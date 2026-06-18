import { _decorator, Label, Node, Button, Sprite, Color, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('LeaderboardUI')
export class LeaderboardUI extends UIBase {
    @property(Node)
    rankingList: Node | null = null;

    @property(Node)
    rankItemTemplate: Node | null = null;

    @property(Label)
    playerRankLabel: Label | null = null;

    @property(Label)
    playerScoreLabel: Label | null = null;

    @property(Node)
    backButton: Node | null = null;

    @property(Node)
    levelTabsContainer: Node | null = null;

    private _currentLevelId: string = '';
    private _playerName: string = '玩家';
    private _rankNodes: Node[] = [];

    onInit(): void {
        if (this.rankItemTemplate) {
            this.rankItemTemplate.active = false;
        }
    }

    onStart(): void {
        this.on(GameEvents.UI_SHOW_LEADERBOARD, this.onShowLeaderboard.bind(this));
        this.registerInput('cancel', this.onBackClicked.bind(this));
        this.bindButtonClick(this.backButton, this.onBackClicked.bind(this));
    }

    private onShowLeaderboard(): void {
        this.show();
        this.refreshLeaderboard();
    }

    public setLevel(levelId: string): void {
        this._currentLevelId = levelId;
        this.refreshLeaderboard();
    }

    private refreshLeaderboard(): void {
        if (!this.rankingList || !this.rankItemTemplate) return;

        for (const node of this._rankNodes) {
            node.destroy();
        }
        this._rankNodes = [];

        const entries = LeaderboardManager.instance.getLevelLeaderboard(this._currentLevelId, 10);

        entries.forEach((entry, index) => {
            const rankNode = instantiate(this.rankItemTemplate!);
            rankNode.active = true;
            rankNode.setPosition(0, -index * 50, 0);

            const rankLabel = rankNode.getChildByName('rankLabel')?.getComponent(Label);
            const nameLabel = rankNode.getChildByName('nameLabel')?.getComponent(Label);
            const scoreLabel = rankNode.getChildByName('scoreLabel')?.getComponent(Label);
            const bg = rankNode.getChildByName('bg')?.getComponent(Sprite);

            if (rankLabel) rankLabel.string = `${index + 1}`;
            if (nameLabel) nameLabel.string = entry.playerName;
            if (scoreLabel) scoreLabel.string = `${entry.score}分`;

            if (bg && index < 3) {
                const colors = [
                    new Color(255, 215, 0, 255),
                    new Color(192, 192, 192, 255),
                    new Color(205, 127, 50, 255),
                ];
                bg.color = colors[index];
            }

            this.rankingList!.addChild(rankNode);
            this._rankNodes.push(rankNode);
        });

        this.updatePlayerRank();
    }

    private updatePlayerRank(): void {
        const playerRank = LeaderboardManager.instance.getPlayerRank(this._playerName, this._currentLevelId);
        if (this.playerRankLabel) {
            this.playerRankLabel.string = `我的排名：${playerRank > 0 ? playerRank : '未上榜'}`;
        }
        const bestScore = LeaderboardManager.instance.getPlayerBestScore(this._playerName, this._currentLevelId);
        if (this.playerScoreLabel) {
            this.playerScoreLabel.string = `最高分：${bestScore}分`;
        }
    }

    public onBackClicked(): void {
        AudioManager.instance.playClick();
        this.hide();
        this.emit(GameEvents.UI_SHOW_MENU);
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
