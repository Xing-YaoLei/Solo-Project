import { _decorator, Component, Node, Label, Button, Sprite, Color, Graphics, UITransform } from 'cc';
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
    private onWrongStepHighlightCallback: ((wrongStep: WrongStep, index: number) => void) | null = null;

    onLoad() {
        this.loadReplayRecords();
        this.renderReplayList();
    }

    private loadReplayRecords() {
        this.replayRecords = this.storageManager.getReplayRecords();
    }

    private renderReplayList() {
        const container = this.replayListContainer || this.node.getChildByName('ReplayInfo');
        if (!container) return;
        container.removeAllChildren();

        if (this.replayRecords.length === 0) {
            this.makeChildLabel(container, '暂无回放记录，完成一次训练后自动保存', 16, new Color(150, 150, 150));
            return;
        }

        this.replayRecords.forEach((record, index) => {
            const date = new Date(record.timestamp);
            const text = `关卡${record.levelId} | ${record.isVictory ? '胜利' : '失败'} | 分数${record.score} | 赔付${record.totalCompensation} | ${date.toLocaleString()}`;
            const label = this.makeChildLabel(container, text, 15, record.isVictory ? new Color(0, 255, 100) : new Color(255, 100, 100));
            label.node.on(Node.EventType.TOUCH_END, () => {
                this.selectReplay(index);
            }, this);
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

        this.node.active = true;
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
        if (!this.currentReplay) return;

        const container = this.wrongStepsContainer || this.node.getChildByName('ReplayInfo');
        if (!container) return;

        if (this.currentReplay.wrongSteps.length === 0) {
            this.makeChildLabel(container, '本局无操作失误', 14, new Color(0, 255, 100));
            return;
        }

        const typeNames: Record<string, string> = {
            address: '地址',
            rider: '骑手',
            subsidy: '补贴',
            timing: '时间',
        };

        this.currentReplay.wrongSteps.forEach((wrongStep, index) => {
            const text = `[${typeNames[wrongStep.type] || wrongStep.type}] ${wrongStep.description} → 正确: ${wrongStep.correctAction} (¥${wrongStep.impact.cost})`;
            const label = this.makeChildLabel(container, text, 13, new Color(255, 180, 100));
            label.node.on(Node.EventType.TOUCH_END, () => {
                this.highlightWrongStep(index);
            }, this);
        });
    }

    private highlightWrongStep(index: number) {
        if (!this.currentReplay) return;

        const wrongStep = this.currentReplay.wrongSteps[index];
        if (!wrongStep) return;

        const snapshotIndex = this.findSnapshotForWrongStep(wrongStep);
        if (snapshotIndex >= 0) {
            this.currentSnapshotIndex = snapshotIndex;
            this.currentPlaybackTime = this.currentReplay.gameStateSnapshots[snapshotIndex].time;

            if (this.onWrongStepHighlightCallback) {
                this.onWrongStepHighlightCallback(wrongStep, index);
            }

            this.jumpToSnapshot(snapshotIndex);

            this.renderSnapshotDetail(snapshotIndex, wrongStep);

            this.eventDispatcher.emit('replay-jump-snapshot', {
                snapshot: this.currentReplay.gameStateSnapshots[snapshotIndex],
                wrongStep,
                snapshotIndex,
            });
        }
    }

    private renderSnapshotDetail(snapshotIndex: number, wrongStep: WrongStep) {
        if (!this.currentReplay) return;

        const snapshot = this.currentReplay.gameStateSnapshots[snapshotIndex];
        const container = this.wrongStepsContainer || this.node.getChildByName('ReplayInfo');
        if (!container || !snapshot) return;

        this.setLabelOnNode(this.node, 'ReplayTitle',
            `复盘: 关卡${this.currentReplay.levelId} — 快照@${Math.floor(snapshot.time)}s — 错步[${wrongStep.type}]`,
            new Color(255, 100, 100), 22);

        const lastChild = container.children[container.children.length - 1];
        if (lastChild) {
            const lbl = lastChild.getComponent(Label);
            if (lbl && lbl.string === wrongStep.description) {
                lbl.color = new Color(255, 50, 50);
                lbl.fontSize = 16;
            }
        }

        const ordersActive = snapshot.orders.filter(o => o.status === 'assigned' || o.status === 'picked').length;
        const ridersBusy = snapshot.riders.filter(r => r.status === 'busy').length;
        this.makeChildLabel(container,
            `--- 快照 ${snapshotIndex + 1}/${this.currentReplay.gameStateSnapshots.length} @${Math.floor(snapshot.time)}s | 分数${snapshot.score} 赔付¥${snapshot.totalCompensation} | 配送${ordersActive}单 忙骑手${ridersBusy} ---`,
            12, new Color(180, 220, 255));
    }

    private setLabelOnNode(root: Node, name: string, text: string, color: Color, fontSize: number) {
        const child = root.getChildByName(name);
        if (!child) return;
        const label = child.getComponent(Label);
        if (!label) return;
        label.string = text;
        label.color = color;
        label.fontSize = fontSize;
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
        if (this.isPlaying && this.currentReplay) {
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
        if (this.currentReplay && index >= 0 && index < this.currentReplay.gameStateSnapshots.length) {
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
        this.node.active = true;
    }

    closeReplay() {
        this.isPlaying = false;
        this.currentReplay = null;
        this.node.active = false;
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

    private makeChildLabel(parent: Node, text: string, fontSize: number, color: Color): Label {
        const n = new Node(`Item_${parent.children.length}`);
        n.addComponent(UITransform).setContentSize(850, fontSize + 8);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color;
        label.overflow = Label.Overflow.CLAMP;
        parent.addChild(n);
        return label;
    }
}
