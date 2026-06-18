const { ccclass, property } = (typeof cc !== 'undefined' ? cc : { ccclass: () => (c: any) => c, property: () => () => {} });

@ccclass('UIBase')
export class UIBase {
  public node: any = null;
  public isVisible: boolean = true;

  constructor(node?: any) {
    this.node = node || null;
  }

  public show(): void {
    this.isVisible = true;
    if (this.node && this.node.active !== undefined) {
      this.node.active = true;
    }
  }

  public hide(): void {
    this.isVisible = false;
    if (this.node && this.node.active !== undefined) {
      this.node.active = false;
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public destroy(): void {
    if (this.node && this.node.destroy) {
      this.node.destroy();
    }
    this.node = null;
  }
}
