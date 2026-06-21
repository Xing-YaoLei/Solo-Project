import { _decorator, Component, Node, Label, Button, Sprite, Color, Graphics } from 'cc';
import { ReplayRecord, GameStateSnapshot, WrongStep, Order, Rider } from '../types/GameTypes';
import { StorageManager } from '../managers/StorageManager';
import { EventDispatcher } from '../utils/EventDispatcher';

const { ccclass, property } = _decorator;

@ccclass('ReplaySystem')
export class ReplaySystem extends Component {
    @property(Node)
    replayListContainer: Node | null = null;

    @property(Node)
    replayItemPrefab: Node | null = null;

    @property(Node)
    replayDetailPanel: Node | null = null;

    @property(Label)
    replayTitleLabel: Label | null = null;

    @property(Label)
    wrongStepsContainer: Node | null = null;

    @property(Node)
    wrongStepItemPrefab: Node | null = null;

    @property(Button)
    playButton: Button | null = null;

    @property(Button)
    pauseButton: Button | null = null;

    @property(Button)
    speedUpButton: Button | null = null;

    @property(Button)
    speedDownButton: Button | null = null;

    @property(Label)
    timelineLabel: Label | null = null;

    @property(Label)
    currentTimeLabel: Label | null = null;

    @property(Graphics)
    timelineGraphics: Graphics | null = null;

    private storageManager: StorageManager = StorageManager.getInstance();
    private eventDispatcher: EventDispatcher = EventDispatcher.getInstance();
    private replayRecords: ReplayRecord[] = [];
    private currentReplay: ReplayRecord | null = null;
    private isPlaying: boolean = false;
    private replaySpeed: number = 1;
    private currentPlaybackTime: number = 0;
    private currentSnapshotIndex: number = 0;
    private onReplayLoadedCallback: ((snapshot: GameStateSnapshot) => void) | null = null;
    private onWrongStepHighlightCallback: ((wrongStep: WrongStep, index: number) => void = null;

    onLoad() {
        this.loadReplayRecords();
        this.renderReplayList();
    }

    private loadReplayRecords() {
        this.replayRecords = this.storageManager.getReplayRecords();
    }

    private renderReplayList() {
        if (!this.replayListContainer || !this.replayItemPrefab) return;

        this.replayListContainer.removeAllChildren();

        this.replayRecords.forEach((record, index) => {
            const item = this.replayItemPrefab!.clone();
            item.name = `Replay_${record.id}`;

            const titleLabel = item.getChildByName('Title')?.getComponent(Label);
            const resultLabel = item.getChildByName('Result')?.getComponent(Label);
            const scoreLabel = item.getChildByName('Score')?.getComponent(Label);
            const compLabel = item.getChildByName('Compensation')?.getComponent(Label);
            const dateLabel = item.getChildByName('Date')?.getComponent(Label);

            if (titleLabel) {
                titleLabel.string = `关卡 ${record.levelId}`;
            }
            if (resultLabel) {
                resultLabel.string = record.isVictory ? '✓ 胜利' : '✗ 失败';
                resultLabel.color = record.isVictory ? new Color(0, 255, 0) : new Color(255, 0, 1);
            }
            if (scoreLabel) {
                scoreLabel.string = `分数: ${record.score}`;
            }
            if (compLabel) {
                compLabel.string = `赔付: ${record.totalCompensation}`;
            }
            if (dateLabel) {
                const date = new Date(record.timestamp);
                dateLabel.string = date.toLocaleString();
            }

            const button = item.getComponent(Button);
            if (button) {
                button.node.on(Button.EventType.CLICK, () => {
                    this.selectReplay(index);
                }, this);
            }

            this.replayListContainer!.addChild(item);
        });
    }

    selectReplay(index: number): boolean {
        if (index < 0 || index >= this.replayRecords.length) return false;

        this.currentReplay = this.replayRecords[index];
        this.currentPlaybackTime = 0;
        this.currentSnapshotIndex = 0;
        this.isPlaying = false;

        this.showReplayDetail();
        this.renderWrongSteps();

        if (this.replayDetailPanel) {
            this.replayDetailPanel.active = true;
        }

        this.eventDispatcher.emit('replay-selected', { replay: this.currentReplay });

        return true;
    }

    private showReplayDetail() {
        if (this.currentReplay && this.replayTitleLabel) {
            this.replayTitleLabel.string =
                `复盘: 关卡 ${this.currentReplay.levelId} - ${this.currentReplay.isVictory ? '胜利' : '失败'}`;
        }

        this.updateTimeline();
    }

    private renderWrongSteps() {
        if (!this.currentReplay || !this.wrongStepsContainer || !this.wrongStepItemPrefab) return;

        this.wrongStepsContainer.removeAllChildren();

        this.currentReplay.wrongSteps.forEach((wrongStep, index) => {
            const item = this.wrongStepItemPrefab!.clone();
            item.name = `WrongStep_${index}`;

            const typeLabel = item.getChildByName('Type')?.getComponent(Label);
            const descLabel = item.getChildByName('Description')?.getComponent(Label);
            const correctLabel = item.getChildByName('CorrectAction')?.getComponent(Label);
            const impactLabel = item.getChildByName('Impact')?.getComponent(Label);

            const typeNames: Record<string, string> = {
                address: '地址',
                rider: '骑手',
                subsidy: '补贴',
                timing: '时间',
            };

            if (typeLabel) {
                typeLabel.string = typeNames[wrongStep.type] || wrongStep.type;
                const colors: Record<string, Color> = {
                    address: new Color(255, 100, 100),
                    rider: new Color(255, 200, 0),
                    subsidy: new Color(100, 200, 255),
                    timing: new Color(200, 100, 255),
                };
                typeLabel.color = colors[wrongStep.type] || new Color(255, 255, 255);
            }

            if (descLabel) {
                descLabel.string = wrongStep.description;
            }

            if (correctLabel) {
                correctLabel.string = `正确做法: ${wrongStep.correctAction}`;
            }

            if (impactLabel) {
                impactLabel.string = `影响: 成本${wrongStep.impact.cost}元 / 延迟${wrongStep.impact.delay}秒 / 满意度${wrongStep.impact.satisfaction}`;
            }

            const button = item.getComponent(Button);
            if (button) {
                button.node.on(Button.EventType.CLICK, () => {
                    this.highlightWrongStep(index);
                }, this);
            }

            this.wrongStepsContainer!.addChild(item);
        });
    }

    private highlightWrongStep(index: number) {
        if (this.currentReplay) {
            const wrongStep = this.currentReplay.wrongSteps[index];
            if (wrongStep && this.onWrongStepHighlightCallback) {
                const snapshotIndex = this.findSnapshotForWrongStep(wrongStep);
                if (snapshotIndex >= 0) {
                    this.currentSnapshotIndex = snapshotIndex;
                    this.currentPlaybackTime = this.currentReplay.gameStateSnapshots[snapshotIndex].time;
                    this.onWrongStepHighlightCallback(wrongStep, index);
                    this.jumpToSnapshot(snapshotIndex);
                }
            }
        }
    }

    private findSnapshotForWrongStep(wrongStep: WrongStep): number {
        if (!this.currentReplay) return -1;

        for (let i = 0; i < this.currentReplay.gameStateSnapshots.length; i++) {
            const snapshot = this.currentReplay.gameStateSnapshots[i];
            const snapshotTime = snapshot.time * 1000;
            if (snapshotTime >= wrongStep.time) {
                return Math.max(0, i - 1);
            }
        }

        return 0;
    }

    startPlayback() {
        if (!this.currentReplay) return;
        this.isPlaying = true;
        this.eventDispatcher.emit('replay-play', { replay: this.currentReplay });
    }

    pausePlayback() {
        this.isPlaying = false;
        this.eventDispatcher.emit('replay-pause', {});
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.pausePlayback();
        } else {
            this.startPlayback();
        }
    }

    setPlaybackSpeed(speed: number) {
        this.replaySpeed = Math.max(0.5, Math.min(4, speed));
    }

    adjustSpeed(delta: number) {
        this.setPlaybackSpeed(this.replaySpeed + delta);
    }

    update(deltaTime: number) {
        if (!this.isPlaying && this.currentReplay) {
            const adjustedDelta = deltaTime * this.replaySpeed;
            this.currentPlaybackTime += adjustedDelta;

            const snapshots = this.currentReplay.gameStateSnapshots;
            while (
                this.currentSnapshotIndex < snapshots.length - 1 &&
                snapshots[this.currentSnapshotIndex + 1].time <= this.currentPlaybackTime
            ) {
                this.currentSnapshotIndex++;
                this.emitSnapshot();
            }

            this.updateTimeline();

            if (this.currentSnapshotIndex >= snapshots.length - 1) {
                this.isPlaying = false;
                this.eventDispatcher.emit('replay-finished', { replay: this.currentReplay });
            }
        }
    }

    private emitSnapshot() {
        if (!this.currentReplay || !this.onReplayLoadedCallback) return;

        const snapshot = this.currentReplay.gameStateSnapshots[this.currentSnapshotIndex];
        this.onReplayLoadedCallback(snapshot);
    }

    jumpToSnapshot(index: number) {
        if (!this.currentReplay && index >= 0 && index < this.currentReplay.gameStateSnapshots.length) {
            this.currentSnapshotIndex = index;
            this.currentPlaybackTime = this.currentReplay.gameStateSnapshots[index].time;
            this.emitSnapshot();
            this.updateTimeline();
        }
    }

    private updateTimeline() {
        if (!this.currentReplay || !this.timelineLabel || !this.currentTimeLabel || !this.timelineGraphics) return;

        const snapshots = this.currentReplay.gameStateSnapshots;
        const totalDuration = this.currentReplay.duration;
        const progress = Math.min(1, this.currentPlaybackTime / totalDuration);

        this.timelineLabel.string = `${Math.floor(this.currentPlaybackTime)}s / ${Math.floor(totalDuration)}s`;
        this.currentTimeLabel.string = `当前时间: ${Math.floor(this.currentPlaybackTime)}秒`;

        this.timelineGraphics.clear();

        const timelineWidth = 400;
        const timelineHeight = 10;
        const timelineX = -timelineWidth / 2;
        const timelineY = 0;

        this.timelineGraphics.fillColor = new Color(50, 50, 50);
        this.timelineGraphics.roundRect(timelineX, timelineY, timelineWidth, timelineHeight, 5);
        this.timelineGraphics.fill();

        this.timelineGraphics.fillColor = new Color(0, 200, 255);
        this.timelineGraphics.roundRect(timelineX, timelineY, timelineWidth * progress, timelineHeight, 5);
        this.timelineGraphics.fill();

        this.currentReplay.wrongSteps.forEach(wrongStep => {
            const wrongStepProgress = (wrongStep.time / 1000) / totalDuration;
            if (wrongStepProgress >= 0 && wrongStepProgress <= 1) {
                const markerX = timelineX + timelineWidth * wrongStepProgress;
                this.timelineGraphics.fillColor = new Color(255, 0, 0);
                this.timelineGraphics.circle(markerX, timelineY + timelineHeight / 2, 6);
                this.timelineGraphics.fill();
            }
        });

        const playheadX = timelineX + timelineWidth * progress;
        this.timelineGraphics.fillColor = new Color(255, 255, 255);
        this.timelineGraphics.circle(playheadX, timelineY + timelineHeight / 2, 8);
        this.timelineGraphics.fill();
    }

    setCallbacks(
        onReplayLoaded: (snapshot: GameStateSnapshot) => void,
        onWrongStepHighlight: (wrongStep: WrongStep, index: number) => void
    ) {
        this.onReplayLoadedCallback = onReplayLoaded;
        this.onWrongStepHighlightCallback = onWrongStepHighlight;
    }

    getRecentFailures(limit: number = 5): ReplayRecord[] {
        return this.storageManager.getRecentFailures(limit);
    }

    refreshReplayList() {
        this.loadReplayRecords();
        this.renderReplayList();
    }

    closeReplay() {
        this.isPlaying = false;
        this.currentReplay = null;
        if (this.replayDetailPanel) {
            this.replayDetailPanel.active = false;
        }
        this.eventDispatcher.emit('replay-closed', {});
    }

    deleteCurrentReplay(): boolean {
        if (!this.currentReplay) return false;

        const success = this.storageManager.deleteReplayRecord(this.currentReplay.id);
        if (success) {
            this.closeReplay();
            this.refreshReplayList();
        }
        return success;
    }

    getCurrentReplay(): ReplayRecord | null {
        return this.currentReplay;
    }

    getPlaybackProgress(): number {
        return this.currentPlaybackTime;
    }

    getPlaybackSpeed(): number {
        return this.replaySpeed;
    }

    isReplayPlaying(): boolean {
        return this.isPlaying;
    }
}
