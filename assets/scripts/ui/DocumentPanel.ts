import { _decorator, Label, Node, Sprite, Color, Button, EventTouch, Vec3, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('DocumentPanel')
export class DocumentPanel extends UIBase {
    @property(Node)
    itemList: Node | null = null;

    @property(Node)
    itemTemplate: Node | null = null;

    @property(Label)
    totalLabel: Label | null = null;

    @property(Label)
    documentTitleLabel: Label | null = null;

    @property(Node)
    submitButton: Node | null = null;

    private _items: any[] = [];
    private _selectedIndex: number = -1;
    private _editMode: 'none' | 'quantity' | 'unitPrice' = 'none';
    private _itemNodes: Map<string, Node> = new Map();

    onInit(): void {
        if (this.itemTemplate) {
            this.itemTemplate.active = false;
        }
    }

    onStart(): void {
        this.on(GameEvents.DOCUMENT_UPDATED, this.onDocumentUpdated.bind(this));
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));

        this.registerInput('up', this.onInputUp.bind(this));
        this.registerInput('down', this.onInputDown.bind(this));
        this.registerInput('left', this.onInputLeft.bind(this));
        this.registerInput('right', this.onInputRight.bind(this));
        this.registerInput('confirm', this.onInputConfirm.bind(this));
        this.registerInput('cancel', this.onInputCancel.bind(this));
        this.registerInput('select_1', () => this.onSelectNumber(1));
        this.registerInput('select_2', () => this.onSelectNumber(2));
        this.registerInput('select_3', () => this.onSelectNumber(3));
        this.registerInput('select_4', () => this.onSelectNumber(4));
        this.registerInput('page_up', () => this.onPageUp());
        this.registerInput('page_down', () => this.onPageDown());

        this.bindButtonClick(this.submitButton, this.onSubmitClicked.bind(this));
    }

    onShow(): void {
        this.refreshItems();
        if (this._items.length > 0 && this._selectedIndex < 0) {
            this.selectItem(0);
        }
        this.playShowAnimation();
    }

    onHide(): void {
    }

    public setDocument(items: any[], title?: string): void {
        this._items = items;
        if (title && this.documentTitleLabel) {
            this.documentTitleLabel.string = title;
        }
        this.refreshItems();
        this.updateTotal();
    }

    private refreshItems(): void {
        if (!this.itemList || !this.itemTemplate) return;

        for (const [, node] of this._itemNodes) {
            node.off(Node.EventType.TOUCH_END);
            node.destroy();
        }
        this._itemNodes.clear();

        this._items.forEach((item, index) => {
            const itemNode = instantiate(this.itemTemplate!);
            itemNode.active = true;
            itemNode.setPosition(0, -index * 60, 0);
            itemNode.name = `item_${item.id}`;

            const nameLabel = itemNode.getChildByName('nameLabel')?.getComponent(Label);
            const quantityLabel = itemNode.getChildByName('quantityLabel')?.getComponent(Label);
            const unitPriceLabel = itemNode.getChildByName('unitPriceLabel')?.getComponent(Label);
            const amountLabel = itemNode.getChildByName('amountLabel')?.getComponent(Label);

            if (nameLabel) nameLabel.string = item.name;
            if (quantityLabel) quantityLabel.string = item.quantity.toString();
            if (unitPriceLabel) unitPriceLabel.string = `¥${item.unitPrice}`;
            if (amountLabel) amountLabel.string = `¥${(item.quantity * item.unitPrice).toFixed(2)}`;

            itemNode.on(Node.EventType.TOUCH_END, () => {
                this.onItemTapped(index);
            }, this);

            this.itemList!.addChild(itemNode);
            this._itemNodes.set(item.id, itemNode);
        });

        this._selectedIndex = -1;
    }

    private onItemTapped(index: number): void {
        if (index === this._selectedIndex) {
            if (this._editMode === 'none') {
                this._editMode = 'quantity';
            } else if (this._editMode === 'quantity') {
                this._editMode = 'unitPrice';
            } else {
                this._editMode = 'none';
            }
            this.updateSelectionVisual();
        } else {
            this.selectItem(index);
        }
        AudioManager.instance.playClick();
    }

    private selectItem(index: number): void {
        if (index < 0 || index >= this._items.length) return;
        this._selectedIndex = index;
        this._editMode = 'none';
        this.updateSelectionVisual();
    }

    private updateSelectionVisual(): void {
        this._items.forEach((item, index) => {
            const node = this._itemNodes.get(item.id);
            if (!node) return;

            const bg = node.getChildByName('bg')?.getComponent(Sprite);
            const quantityLabel = node.getChildByName('quantityLabel')?.getComponent(Label);
            const unitPriceLabel = node.getChildByName('unitPriceLabel')?.getComponent(Label);

            if (bg) {
                if (index === this._selectedIndex) {
                    bg.color = new Color(100, 180, 255, 255);
                } else {
                    bg.color = new Color(255, 255, 255, 255);
                }
            }

            if (quantityLabel) {
                quantityLabel.color = (index === this._selectedIndex && this._editMode === 'quantity')
                    ? new Color(255, 200, 0, 255)
                    : new Color(50, 50, 50, 255);
            }

            if (unitPriceLabel) {
                unitPriceLabel.color = (index === this._selectedIndex && this._editMode === 'unitPrice')
                    ? new Color(255, 200, 0, 255)
                    : new Color(50, 50, 50, 255);
            }
        });
    }

    private onInputUp(source: string): void {
        if (this._editMode !== 'none') return;
        if (this._selectedIndex > 0) {
            this.selectItem(this._selectedIndex - 1);
            AudioManager.instance.playClick();
        }
    }

    private onInputDown(source: string): void {
        if (this._editMode !== 'none') return;
        if (this._selectedIndex < this._items.length - 1) {
            this.selectItem(this._selectedIndex + 1);
            AudioManager.instance.playClick();
        }
    }

    private onInputLeft(source: string): void {
        if (this._selectedIndex < 0) return;
        const item = this._items[this._selectedIndex];

        if (this._editMode === 'quantity') {
            const newQty = Math.max(0, item.quantity - 1);
            this.updateItemValue(item.id, newQty, item.unitPrice);
        } else if (this._editMode === 'unitPrice') {
            const newPrice = Math.max(0, item.unitPrice - 10);
            this.updateItemValue(item.id, item.quantity, newPrice);
        } else {
            this._editMode = 'unitPrice';
            this.updateSelectionVisual();
        }
        AudioManager.instance.playClick();
    }

    private onInputRight(source: string): void {
        if (this._selectedIndex < 0) return;
        const item = this._items[this._selectedIndex];

        if (this._editMode === 'quantity') {
            const newQty = item.quantity + 1;
            this.updateItemValue(item.id, newQty, item.unitPrice);
        } else if (this._editMode === 'unitPrice') {
            const newPrice = item.unitPrice + 10;
            this.updateItemValue(item.id, item.quantity, newPrice);
        } else {
            this._editMode = 'quantity';
            this.updateSelectionVisual();
        }
        AudioManager.instance.playClick();
    }

    private onInputConfirm(source: string): void {
        if (this._selectedIndex < 0) return;

        if (this._editMode === 'none') {
            this._editMode = 'quantity';
            this.updateSelectionVisual();
        } else if (this._editMode === 'quantity') {
            this._editMode = 'unitPrice';
            this.updateSelectionVisual();
        } else {
            this._editMode = 'none';
            this.updateSelectionVisual();
        }
        AudioManager.instance.playConfirm();
    }

    private onInputCancel(source: string): void {
        if (this._editMode !== 'none') {
            this._editMode = 'none';
            this.updateSelectionVisual();
            AudioManager.instance.playClick();
        }
    }

    private onSelectNumber(num: number): void {
        if (this._selectedIndex < 0) return;
        const item = this._items[this._selectedIndex];

        if (this._editMode === 'quantity') {
            this.updateItemValue(item.id, num, item.unitPrice);
            AudioManager.instance.playClick();
        }
    }

    private onPageUp(): void {
        if (this._editMode === 'none') {
            this.selectItem(Math.max(0, this._selectedIndex - 3));
        }
    }

    private onPageDown(): void {
        if (this._editMode === 'none') {
            this.selectItem(Math.min(this._items.length - 1, this._selectedIndex + 3));
        }
    }

    private updateItemValue(itemId: string, quantity: number, unitPrice: number): void {
        const item = this._items.find(i => i.id === itemId);
        if (!item) return;

        item.quantity = quantity;
        item.unitPrice = unitPrice;

        const itemNode = this._itemNodes.get(itemId);
        if (itemNode) {
            const quantityLabel = itemNode.getChildByName('quantityLabel')?.getComponent(Label);
            const unitPriceLabel = itemNode.getChildByName('unitPriceLabel')?.getComponent(Label);
            const amountLabel = itemNode.getChildByName('amountLabel')?.getComponent(Label);

            if (quantityLabel) quantityLabel.string = quantity.toString();
            if (unitPriceLabel) unitPriceLabel.string = `¥${unitPrice}`;
            if (amountLabel) amountLabel.string = `¥${(quantity * unitPrice).toFixed(2)}`;
        }

        this.updateTotal();
        GameManager.instance.updateDocumentItem(itemId, quantity, unitPrice);
    }

    private updateTotal(): void {
        if (!this.totalLabel) return;
        const total = this._items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        this.totalLabel.string = `合计: ¥${total.toFixed(2)}`;
    }

    private onDocumentUpdated(itemId: string, quantity: number, unitPrice: number): void {
        const item = this._items.find(i => i.id === itemId);
        if (!item) return;

        item.quantity = quantity;
        item.unitPrice = unitPrice;

        const itemNode = this._itemNodes.get(itemId);
        if (itemNode) {
            const amountLabel = itemNode.getChildByName('amountLabel')?.getComponent(Label);
            if (amountLabel) amountLabel.string = `¥${(quantity * unitPrice).toFixed(2)}`;
        }

        this.updateTotal();
    }

    private onPhaseChanged(phase: string): void {
        if (phase === 'document_editing') {
            const items = GameManager.instance.getDocumentItems();
            const level = GameManager.instance.currentLevel;
            const title = level ? `${level.name} - 报价单` : '报价单';
            this.setDocument(items, title);
            this.show();
        } else {
            this.hide();
        }
    }

    public onSubmitClicked(): void {
        AudioManager.instance.playConfirm();
        GameManager.instance.goToApproval();
    }
}
