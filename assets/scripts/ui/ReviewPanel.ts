import { _decorator, Label, Node, Button, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { ScoreManager } from '../managers/ScoreManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('ReviewPanel')
export class ReviewPanel extends UIBase {
    @property(Node)
    errorList: Node | null = null;

    @property(Node)
    mismatchList: Node | null = null;

    @property(Label)
    summaryLabel: Label | null = null;

    @property(Label)
    improvementLabel: Label | null = null;

    @property(Node)
    backButton: Node | null = null;

    private _errorNodes: Node[] = [];
    private _mismatchNodes: Node[] = [];

    onStart(): void {
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
        this.bindButtonClick(this.backButton, this.onBackClicked.bind(this));
    }

    private onPhaseChanged(phase: string): void {
        if (phase === 'review') {
            this.show();
            this.refreshReview();
        } else {
            this.hide();
        }
    }

    private refreshReview(): void {
        const errors = ScoreManager.instance.currentErrors;
        const mismatches = ScoreManager.instance.currentMismatches;

        this.refreshErrorList(errors);
        this.refreshMismatchList(mismatches);
        this.updateSummary(errors.length, mismatches.length);
        this.updateImprovements(errors, mismatches);
    }

    private refreshErrorList(errors: any[]): void {
        if (!this.errorList) return;

        for (const node of this._errorNodes) {
            node.destroy();
        }
        this._errorNodes = [];

        errors.forEach((error, index) => {
            const errorNode = new Node(`error_${index}`);
            errorNode.setPosition(0, -index * 60, 0);

            const bgNode = new Node('bg');
            const bg = bgNode.addComponent(Sprite);
            bg.color = new Color(255, 240, 240, 255);
            bgNode.setContentSize(500, 50);
            errorNode.addChild(bgNode);

            const typeNode = new Node('type');
            const typeLabel = typeNode.addComponent(Label);
            typeLabel.string = `[${this.getErrorTypeName(error.errorType)}]`;
            typeLabel.fontSize = 12;
            typeLabel.color = new Color(200, 50, 50, 255);
            typeNode.setPosition(-230, 10, 0);
            errorNode.addChild(typeNode);

            const descNode = new Node('desc');
            const descLabel = descNode.addComponent(Label);
            descLabel.string = error.description || '';
            descLabel.fontSize = 12;
            descLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
            descLabel.node.setContentSize(460, 30);
            descNode.setPosition(-230, -10, 0);
            errorNode.addChild(descNode);

            this.errorList!.addChild(errorNode);
            this._errorNodes.push(errorNode);
        });
    }

    private refreshMismatchList(mismatches: any[]): void {
        if (!this.mismatchList) return;

        for (const node of this._mismatchNodes) {
            node.destroy();
        }
        this._mismatchNodes = [];

        mismatches.forEach((mismatch, index) => {
            const node = new Node(`mismatch_${index}`);
            node.setPosition(0, -index * 50, 0);

            const bgNode = new Node('bg');
            const bg = bgNode.addComponent(Sprite);
            bg.color = new Color(255, 250, 230, 255);
            bgNode.setContentSize(500, 40);
            node.addChild(bgNode);

            const textNode = new Node('text');
            const textLabel = textNode.addComponent(Label);
            const diffStr = mismatch.difference >= 0 ? `+${mismatch.difference}` : `${mismatch.difference}`;
            textLabel.string = `${mismatch.itemName}: 预期¥${mismatch.expectedAmount} 实际¥${mismatch.actualAmount} (${diffStr})`;
            textLabel.fontSize = 12;
            textNode.setPosition(-240, 0, 0);
            node.addChild(textNode);

            this.mismatchList!.addChild(node);
            this._mismatchNodes.push(node);
        });
    }

    private getErrorTypeName(type: string): string {
        const names: Record<string, string> = {
            'wrong_choice': '选择错误',
            'time_out': '超时',
            'process_error': '流程错误',
            'document_error': '单据错误',
        };
        return names[type] || type;
    }

    private updateSummary(errorCount: number, mismatchCount: number): void {
        if (this.summaryLabel) {
            this.summaryLabel.string = `错误：${errorCount}处 | 金额不一致：${mismatchCount}处`;
        }
    }

    private updateImprovements(errors: any[], mismatches: any[]): void {
        const suggestions = ScoreManager.instance.getImprovementSuggestions();
        if (this.improvementLabel) {
            this.improvementLabel.string = suggestions.join('\n\n');
        }
    }

    public onBackClicked(): void {
        AudioManager.instance.playClick();
        this.emit(GameEvents.UI_SHOW_RESULT);
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
