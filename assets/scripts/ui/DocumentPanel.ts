import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { DocumentItem } from '../core/Types';

export class DocumentPanel extends UIBase {
  private _items: DocumentItem[] = [];
  private _selectedIndex: number = 0;
  private _changes: Record<string, { quantity: number; unitPrice: number }> = {};
  private _editMode: 'quantity' | 'unitPrice' | null = null;

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.GAME_START, this.onGameStart.bind(this));
    EventManager.instance.on(GameEvents.DOCUMENT_UPDATED, this.onDocumentUpdated.bind(this));
    EventManager.instance.on(GameEvents.MISMATCH_DETECTED, this.onMismatchDetected.bind(this));
  }

  private onGameStart(levelConfig: any): void {
    this._items = levelConfig.document?.items || [];
    this._changes = {};
    this._selectedIndex = 0;
    this._editMode = null;
    this.refresh();
  }

  private onDocumentUpdated(itemId: string, quantity: number, unitPrice: number): void {
    this._changes[itemId] = { quantity, unitPrice };
    this.refreshTotal();
  }

  private onMismatchDetected(mismatch: any): void {
    this.showMismatchWarning(mismatch);
  }

  public refresh(): void {
    this.refreshItemList();
    this.refreshDetail();
    this.refreshTotal();
  }

  private refreshItemList(): void {
    if (!this.node) return;
    const listNode = this.node.getChildByName('itemList');
    if (!listNode) return;

    const content = listNode.getChildByName('content');
    if (!content) return;

    this.clearListContent(content);

    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];
      const itemNode = this.createListItem(item, i);
      content.addChild(itemNode);
    }
  }

  private clearListContent(content: any): void {
    if (!content || !content.removeAllChildren) return;
    content.removeAllChildren();
  }

  private createListItem(item: DocumentItem, index: number): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node(`item_${item.id}`);
    node.setContentSize(300, 40);

    if (index === this._selectedIndex) {
      node.addComponent(cc.Sprite);
    }

    const nameNode = new cc.Node('name');
    nameNode.parent = node;
    nameNode.anchorX = 0;
    const nameLabel = nameNode.addComponent(cc.Label);
    nameLabel.string = item.name;
    nameLabel.fontSize = 14;
    nameNode.setPosition(-140, 0);

    const qtyNode = new cc.Node('qty');
    qtyNode.parent = node;
    const qtyLabel = qtyNode.addComponent(cc.Label);
    const change = this._changes[item.id];
    const qty = change ? change.quantity : item.quantity;
    qtyLabel.string = `${qty}${item.unit}`;
    qtyLabel.fontSize = 12;
    qtyNode.setPosition(20, 0);

    const priceNode = new cc.Node('price');
    priceNode.parent = node;
    const priceLabel = priceNode.addComponent(cc.Label);
    const price = change ? change.unitPrice : item.unitPrice;
    priceLabel.string = `¥${price}`;
    priceLabel.fontSize = 12;
    priceNode.setPosition(80, 0);

    const totalNode = new cc.Node('total');
    totalNode.parent = node;
    const totalLabel = totalNode.addComponent(cc.Label);
    const total = qty * price;
    totalLabel.string = `¥${total.toFixed(2)}`;
    totalLabel.fontSize = 12;
    totalNode.setPosition(130, 0);

    node.on(cc.Node.EventType.TOUCH_END, () => {
      this._selectedIndex = index;
      this.refreshItemList();
      this.refreshDetail();
    });

    return node;
  }

  private refreshDetail(): void {
    const item = this._items[this._selectedIndex];
    if (!item) return;

    const change = this._changes[item.id];
    const qty = change ? change.quantity : item.quantity;
    const price = change ? change.unitPrice : item.unitPrice;

    this.setLabelText('detailName', item.name);
    this.setLabelText('detailCategory', `类别：${item.category}`);
    this.setLabelText('detailUnit', `单位：${item.unit}`);
    this.setLabelText('detailQuantity', `数量：${qty}`);
    this.setLabelText('detailUnitPrice', `单价：¥${price}`);
    this.setLabelText('detailTotal', `小计：¥${(qty * price).toFixed(2)}`);

    if (item.description) {
      this.setLabelText('detailDesc', item.description);
    }
  }

  private refreshTotal(): void {
    let total = 0;
    for (const item of this._items) {
      const change = this._changes[item.id];
      const qty = change ? change.quantity : item.quantity;
      const price = change ? change.unitPrice : item.unitPrice;
      total += qty * price;
    }
    this.setLabelText('totalAmount', `总计：¥${total.toFixed(2)}`);
  }

  public onQuantityIncrease(): void {
    const item = this._items[this._selectedIndex];
    if (!item || !item.isEditable) return;

    const change = this._changes[item.id] || { quantity: item.quantity, unitPrice: item.unitPrice };
    change.quantity += 1;
    GameManager.instance.updateDocumentItem(item.id, change.quantity, change.unitPrice);
  }

  public onQuantityDecrease(): void {
    const item = this._items[this._selectedIndex];
    if (!item || !item.isEditable) return;

    const change = this._changes[item.id] || { quantity: item.quantity, unitPrice: item.unitPrice };
    change.quantity = Math.max(0, change.quantity - 1);
    GameManager.instance.updateDocumentItem(item.id, change.quantity, change.unitPrice);
  }

  public onPriceIncrease(): void {
    const item = this._items[this._selectedIndex];
    if (!item || !item.isEditable) return;

    const change = this._changes[item.id] || { quantity: item.quantity, unitPrice: item.unitPrice };
    change.unitPrice += 10;
    GameManager.instance.updateDocumentItem(item.id, change.quantity, change.unitPrice);
  }

  public onPriceDecrease(): void {
    const item = this._items[this._selectedIndex];
    if (!item || !item.isEditable) return;

    const change = this._changes[item.id] || { quantity: item.quantity, unitPrice: item.unitPrice };
    change.unitPrice = Math.max(0, change.unitPrice - 10);
    GameManager.instance.updateDocumentItem(item.id, change.quantity, change.unitPrice);
  }

  public onConfirmClick(): void {
    GameManager.instance.goToApproval();
  }

  public onBackClick(): void {
    GameManager.instance.changePhase('clue_investigation');
  }

  private showMismatchWarning(mismatch: any): void {
    console.log('Mismatch detected:', mismatch);
  }

  private setLabelText(labelName: string, text: string): void {
    if (!this.node) return;
    const label = this.node.getChildByName(labelName);
    if (label && label.getComponent) {
      const labelComp = label.getComponent(cc.Label);
      if (labelComp) {
        labelComp.string = text;
      }
    }
  }
}
