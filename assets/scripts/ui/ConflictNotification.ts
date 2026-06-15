import { _decorator, Component, Node, Label, Button, tween, Vec3, UIOpacity, Color, Sprite } from 'cc';
import { ConflictEvent } from '../types';
import { EventBus, GameEvents } from '../core/EventBus';
import { SettingsManager } from '../config/SettingsManager';
import { ScheduleManager } from '../game/ScheduleManager';
const { ccclass, property } = _decorator;

@ccclass('ConflictNotification')
export class ConflictNotification extends Component {
  @property(Node)
  container: Node | null = null;

  @property(Prefab)
  conflictItemPrefab: Prefab | null = null;

  @property(Node)
  conflictList: Node | null = null;

  @property(Label)
  conflictCountLabel: Node | null = null;

  @property(Button)
  resolveAllButton: Button | null = null;

  @property(Button)
  closeButton: Button | null = null;

  private _conflictItems: Map<string, Node> = new Map();

  onLoad(): void {
    if (this.container) {
      this.container.active = false;
    }

    EventBus.instance.on(GameEvents.CONFLICT_OCCURRED, this.onConflictOccurred.bind(this));
    EventBus.instance.on(GameEvents.CONFLICT_RESOLVED, this.onConflictResolved.bind(this));

    if (this.resolveAllButton) {
      this.resolveAllButton.node.on(Button.EventType.CLICK, this.onResolveAll, this);
    }

    if (this.closeButton) {
      this.closeButton.node.on(Button.EventType.CLICK, this.hide, this);
    }
  }

  private onConflictOccurred(conflict: ConflictEvent): void {
    this.addConflictItem(conflict);
    this.updateCount();
    this.show();
    
    SettingsManager.getInstance().vibrate(100);
  }

  private onConflictResolved(conflictId: string): void {
    if (conflictId === 'all') {
      this.clearAllConflicts();
    } else {
      this.removeConflictItem(conflictId);
    }
    this.updateCount();
  }

  private addConflictItem(conflict: ConflictEvent): void {
    if (!this.conflictList || !this.conflictItemPrefab) return;

    const node = instantiate(this.conflictItemPrefab);
    this._conflictItems.set(conflict.id, node);

    const messageLabel = node.getChildByName('MessageLabel')?.getComponent(Label);
    if (messageLabel) {
      messageLabel.string = conflict.message;
    }

    const typeLabel = node.getChildByName('TypeLabel')?.getComponent(Label);
    if (typeLabel) {
      typeLabel.string = this.getTypeText(conflict.type);
      typeLabel.color = this.getTypeColor(conflict.type);
    }

    const resolveButton = node.getChildByName('ResolveButton')?.getComponent(Button);
    if (resolveButton) {
      resolveButton.node.on(Button.EventType.CLICK, () => {
        this.resolveConflict(conflict.id);
      }, this);
    }

    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity > 0) {
      node.setScale(0, 0, 1);
      tween(node)
        .to(0.2 * intensity, { scale: new Vec3(1, 1, 1) })
        .start();
    }

    this.conflictList.addChild(node);
  }

  private removeConflictItem(conflictId: string): void {
    const node = this._conflictItems.get(conflictId);
    if (!node) return;

    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity > 0) {
      tween(node)
        .to(0.2 * intensity, { scale: new Vec3(0, 0, 1) })
        .call(() => {
          node.destroy();
          this._conflictItems.delete(conflictId);
        })
        .start();
    } else {
      node.destroy();
      this._conflictItems.delete(conflictId);
    }
  }

  private clearAllConflicts(): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    
    this._conflictItems.forEach((node, id) => {
      if (intensity > 0) {
        tween(node)
          .to(0.2 * intensity, { scale: new Vec3(0, 0, 1) })
          .call(() => {
            node.destroy();
          })
          .start();
      } else {
        node.destroy();
      }
    });
    
    this._conflictItems.clear();
  }

  private resolveConflict(conflictId: string): void {
    ScheduleManager.getInstance().resolveConflict(conflictId);
  }

  private onResolveAll(): void {
    const resolvedCount = ScheduleManager.getInstance().resolveAllConflicts();
    if (resolvedCount > 0) {
      SettingsManager.getInstance().vibrate(50);
    }
  }

  private updateCount(): void {
    if (!this.conflictCountLabel) return;

    const label = this.conflictCountLabel.getComponent(Label);
    if (label) {
      const count = this._conflictItems.size;
      label.string = count > 0 ? `${count}` : '';
      label.node.active = count > 0;
    }
  }

  show(): void {
    if (!this.container) return;

    const intensity = SettingsManager.getInstance().animationIntensity;
    this.container.active = true;

    if (intensity > 0) {
      const opacity = this.container.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = 0;
      }

      tween(opacity)
        .to(0.2 * intensity, { opacity: 255 })
        .start();
    }
  }

  hide(): void {
    if (!this.container) return;

    const intensity = SettingsManager.getInstance().animationIntensity;

    if (intensity > 0) {
      const opacity = this.container.getComponent(UIOpacity);
      tween(opacity)
        .to(0.2 * intensity, { opacity: 0 })
        .call(() => {
          this.container!.active = false;
        })
        .start();
    } else {
      this.container.active = false;
    }
  }

  private getTypeText(type: string): string {
    const texts: Record<string, string> = {
      'room_double_booked': '教室冲突',
      'equipment_missing': '设备缺失',
      'capacity_exceeded': '容量超限',
      'time_overlap': '时间重叠',
    };
    return texts[type] || '未知冲突';
  }

  private getTypeColor(type: string): Color {
    const colors: Record<string, Color> = {
      'room_double_booked': new Color(231, 76, 60, 255),
      'equipment_missing': new Color(230, 126, 34, 255),
      'capacity_exceeded': new Color(241, 196, 15, 255),
      'time_overlap': new Color(155, 89, 182, 255),
    };
    return colors[type] || Color.GRAY;
  }

  onDestroy(): void {
    EventBus.instance.off(GameEvents.CONFLICT_OCCURRED, this.onConflictOccurred.bind(this));
    EventBus.instance.off(GameEvents.CONFLICT_RESOLVED, this.onConflictResolved.bind(this));
    
    if (this.resolveAllButton) {
      this.resolveAllButton.node.off(Button.EventType.CLICK, this.onResolveAll, this);
    }

    if (this.closeButton) {
      this.closeButton.node.off(Button.EventType.CLICK, this.hide, this);
    }
  }
}
