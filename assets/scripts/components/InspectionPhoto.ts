import { _decorator, Component, Sprite, SpriteFrame, resources, Node, tween, UITransform, Color, UIOpacity } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('InspectionPhoto')
export class InspectionPhoto extends Component {

    @property({ type: Number })
    transitionDuration: number = 0.5;

    @property({ type: Number })
    maxPhotos: number = 5;

    private photoPaths: string[] = [];
    private currentPhotoIndex: number = 0;
    private _sprite: Sprite | null = null;
    private _photoFrames: SpriteFrame[] = [];
    private _isLoading: boolean = false;

    onLoad(): void {
        this._sprite = this.node.getComponent(Sprite);
    }

    async loadPhotos(paths: string[]): Promise<void> {
        if (this._isLoading) return;
        this._isLoading = true;

        const trimmed = paths.slice(0, this.maxPhotos);
        this.photoPaths = trimmed;
        this._photoFrames = [];
        this.currentPhotoIndex = 0;

        const loadPromises = trimmed.map((path) => {
            return new Promise<SpriteFrame | null>((resolve) => {
                resources.load(path + '/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(spriteFrame);
                });
            });
        });

        const results = await Promise.all(loadPromises);
        this._photoFrames = results.filter((frame): frame is SpriteFrame => frame !== null);

        if (this._photoFrames.length > 0 && this._sprite) {
            this._sprite.spriteFrame = this._photoFrames[0];
        }

        this._isLoading = false;
    }

    showNextPhoto(): void {
        if (this._photoFrames.length <= 1) return;
        const nextIndex = (this.currentPhotoIndex + 1) % this._photoFrames.length;
        this._transitionTo(nextIndex);
    }

    showPreviousPhoto(): void {
        if (this._photoFrames.length <= 1) return;
        const prevIndex = (this.currentPhotoIndex - 1 + this._photoFrames.length) % this._photoFrames.length;
        this._transitionTo(prevIndex);
    }

    showPhotoByIndex(index: number): void {
        if (index < 0 || index >= this._photoFrames.length) return;
        this._transitionTo(index);
    }

    getCurrentPhotoIndex(): number {
        return this.currentPhotoIndex;
    }

    getPhotoCount(): number {
        return this._photoFrames.length;
    }

    highlightDamage(area: { x: number; y: number; width: number; height: number }): void {
        const highlightNode = new Node('DamageHighlight');
        this.node.addChild(highlightNode);

        const uiTransform = highlightNode.addComponent(UITransform);
        uiTransform.setContentSize(area.width, area.height);

        const sprite = highlightNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(255, 0, 0, 128);

        highlightNode.setPosition(area.x, area.y, 0);
    }

    private _transitionTo(targetIndex: number): void {
        if (targetIndex === this.currentPhotoIndex) return;
        if (!this._sprite) return;

        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        const duration = this.transitionDuration * 0.5;

        tween(opacity)
            .to(duration, { opacity: 0 }, {
                onComplete: () => {
                    this.currentPhotoIndex = targetIndex;
                    this._sprite!.spriteFrame = this._photoFrames[targetIndex];
                    tween(opacity)
                        .to(duration, { opacity: 255 })
                        .start();
                }
            })
            .start();
    }
}
