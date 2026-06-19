import { _decorator, Component, Node, Color, Sprite, UITransform } from 'cc';

const { ccclass, property } = _decorator;

const HIGHLIGHT_COLOR = new Color(100, 255, 100, 200);

@ccclass('QuoteDropZone')
export class QuoteDropZone extends Component {

    @property({ type: String })
    zoneId: string = '';

    @property({ type: [String] })
    acceptedQuoteIds: string[] = [];

    private _sprite: Sprite | null = null;
    private _originalColor: Color = new Color();

    onLoad(): void {
        this._sprite = this.node.getComponent(Sprite);
        if (this._sprite) {
            this._originalColor.set(this._sprite.color);
        }
    }

    canAccept(quoteId: string): boolean {
        if (this.acceptedQuoteIds.length === 0) return true;
        return this.acceptedQuoteIds.indexOf(quoteId) !== -1;
    }

    highlight(active: boolean): void {
        if (!this._sprite) return;
        this._sprite.color = active ? HIGHLIGHT_COLOR : this._originalColor;
    }
}
