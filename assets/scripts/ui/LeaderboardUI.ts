import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { LeaderboardManager } from '../core/LeaderboardManager';
import { SaveManager } from '../core/SaveManager';
import { ILeaderboardEntry } from '../core/GameInterfaces';
const { ccclass, property } = _decorator;

@ccclass('LeaderboardUI')
export class LeaderboardUI extends UIBase {

    @property(ScrollView)
    leaderboardScrollView: ScrollView | null = null;

    @property(Prefab)
    rankItemPrefab: Prefab | null = null;

    @property(Node)
    rankContent: Node | null = null;

    @property(Label)
    myRankLabel: Label | null = null;

    @property(Label)
    myScoreLabel: Label | null = null;

    @property(Label)
    totalPlayersLabel: Label | null = null;

    @property(Button)
    refreshButton: Button | null = null;

    private _rankItems: Node[] = [];

    onLoad() {
        super.onLoad();

        if (this.refreshButton) {
            this.refreshButton.node.on(Button.EventType.CLICK, this.onRefreshClick, this);
        }
    }

    protected onShow(): void {
        this.submitMyScore();
        this.refreshUI();
    }

    private submitMyScore(): void {
        const save = SaveManager.instance.getSave();
        const perfectCount = save.trainingRecords.filter(r => r.perfect).length;
        
        LeaderboardManager.instance.submitScore(
            'local_player',
            save.playerName,
            save.totalScore,
            save.completedCaseIds.length,
            perfectCount
        );
    }

    public refreshUI(): void {
        const totalPlayers = LeaderboardManager.instance.getTotalPlayers();
        this.setLabelText(this.totalPlayersLabel, `总玩家数: ${totalPlayers}`);

        const myEntry = LeaderboardManager.instance.getPlayerRank('local_player');
        if (myEntry) {
            this.setLabelText(this.myRankLabel, `我的排名: 第${myEntry.rank}名`);
            this.setLabelText(this.myScoreLabel, `得分: ${myEntry.totalScore}`);
        } else {
            this.setLabelText(this.myRankLabel, '我的排名: 未上榜');
            this.setLabelText(this.myScoreLabel, '得分: 0');
        }

        this.refreshRankList();
    }

    private refreshRankList(): void {
        if (!this.rankContent || !this.rankItemPrefab) return;

        this._rankItems.forEach(item => item.destroy());
        this._rankItems = [];

        const entries = LeaderboardManager.instance.getTopEntries(20);

        entries.forEach((entry, index) => {
            const itemNode = instantiate(this.rankItemPrefab!);
            this.rankContent!.addChild(itemNode);
            this._rankItems.push(itemNode);

            this.setupRankItem(itemNode, entry, index + 1);
        });
    }

    private setupRankItem(node: Node, entry: ILeaderboardEntry, rank: number): void {
        const rankLabel = node.getChildByName('RankLabel')?.getComponent(Label);
        const nameLabel = node.getChildByName('NameLabel')?.getComponent(Label);
        const scoreLabel = node.getChildByName('ScoreLabel')?.getComponent(Label);
        const casesLabel = node.getChildByName('CasesLabel')?.getComponent(Label);
        const medalSprite = node.getChildByName('MedalSprite')?.getComponent(Sprite);
        const bgNode = node.getChildByName('BgNode');

        this.setLabelText(rankLabel, rank.toString());
        this.setLabelText(nameLabel, entry.playerName);
        this.setLabelText(scoreLabel, `${entry.totalScore}分`);
        this.setLabelText(casesLabel, `完成${entry.casesCompleted}案`);

        if (rank <= 3) {
            if (bgNode) {
                const rankColors = [
                    new Color(255, 215, 0, 50),
                    new Color(192, 192, 192, 50),
                    new Color(205, 127, 50, 50)
                ];
                const sprite = bgNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = rankColors[rank - 1];
                }
            }
            if (medalSprite) {
                medalSprite.node.active = true;
            }
        } else {
            if (medalSprite) {
                medalSprite.node.active = false;
            }
        }

        if (entry.playerId === 'local_player') {
            if (bgNode) {
                const sprite = bgNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(0, 150, 255, 30);
                }
            }
        }
    }

    private onRefreshClick(): void {
        this.submitMyScore();
        this.refreshUI();
    }
}
