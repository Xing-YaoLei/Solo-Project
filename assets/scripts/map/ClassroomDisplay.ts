import { _decorator, Component, Node, Label, Sprite, Color, Vec3, UIOpacity, tween } from 'cc';
import { Classroom, RoomStatus } from '../types';
import { SettingsManager } from '../config/SettingsManager';
const { ccclass, property } = _decorator;

@ccclass('ClassroomDisplay')
export class ClassroomDisplay extends Component {
  @property(Label)
  nameLabel: Label | null = null;

  @property(Label)
  capacityLabel: Label | null = null;

  @property(Sprite)
  backgroundSprite: Sprite | null = null;

  @property(Node)
  conflictIndicator: Node | null = null;

  @property(Node)
  maintenanceIndicator: Node | null = null;

  private _classroom: Classroom | null = null;
  private _originalColor: Color = new Color(255, 255, 255, 255);
  private _pulseTween: ReturnType<typeof tween> | null = null;

  get classroom(): Classroom | null {
    return this._classroom;
  }

  setClassroom(classroom: Classroom): void {
    this._classroom = classroom;
    this.updateDisplay();
  }

  onLoad(): void {
    if (this.backgroundSprite) {
      this._originalColor = new Color(this.backgroundSprite.color);
    }
  }

  updateDisplay(): void {
    if (!this._classroom) return;

    if (this.nameLabel) {
      this.nameLabel.string = this._classroom.name;
    }

    if (this.capacityLabel) {
      this.capacityLabel.string = `容量: ${this._classroom.capacity}`;
    }

    this.updateStatusVisual();
    this.node.setPosition(this._classroom.position.x, this._classroom.position.y, 0);
  }

  private updateStatusVisual(): void {
    if (!this._classroom) return;

    const intensity = SettingsManager.getInstance().animationIntensity;

    switch (this._classroom.status) {
      case 'available':
        this.setBackgroundColor(this._originalColor);
        this.setConflictIndicatorVisible(false);
        this.setMaintenanceIndicatorVisible(false);
        this.stopPulse();
        break;
      case 'occupied':
        this.setBackgroundColor(new Color(180, 180, 255, 255));
        this.setConflictIndicatorVisible(false);
        this.setMaintenanceIndicatorVisible(false);
        this.stopPulse();
        break;
      case 'maintenance':
        this.setBackgroundColor(new Color(200, 200, 200, 255));
        this.setConflictIndicatorVisible(false);
        this.setMaintenanceIndicatorVisible(true);
        this.stopPulse();
        break;
      case 'conflict':
        this.setBackgroundColor(new Color(255, 100, 100, 255));
        this.setConflictIndicatorVisible(true);
        this.setMaintenanceIndicatorVisible(false);
        if (intensity > 0) {
          this.startPulse(intensity);
        }
        break;
    }
  }

  private setBackgroundColor(color: Color): void {
    if (this.backgroundSprite) {
      const intensity = SettingsManager.getInstance().animationIntensity;
      if (intensity > 0) {
        tween(this.backgroundSprite)
          .to(0.2 * intensity, { color })
          .start();
      } else {
        this.backgroundSprite.color = color;
      }
    }
  }

  private setConflictIndicatorVisible(visible: boolean): void {
    if (this.conflictIndicator) {
      const opacity = this.conflictIndicator.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = visible ? 255 : 0;
      }
      this.conflictIndicator.active = visible;
    }
  }

  private setMaintenanceIndicatorVisible(visible: boolean): void {
    if (this.maintenanceIndicator) {
      const opacity = this.maintenanceIndicator.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = visible ? 255 : 0;
      }
      this.maintenanceIndicator.active = visible;
    }
  }

  private startPulse(intensity: number): void {
    this.stopPulse();
    
    const duration = 0.5 / intensity;
    const pulseNode = this.conflictIndicator || this.node;
    
    this._pulseTween = tween(pulseNode)
      .to(duration, { scale: new Vec3(1.1, 1.1, 1) })
      .to(duration, { scale: new Vec3(1.0, 1.0, 1) })
      .union()
      .repeatForever()
      .start();
  }

  private stopPulse(): void {
    if (this._pulseTween) {
      this._pulseTween.stop();
      this._pulseTween = null;
    }
    this.node.setScale(1, 1, 1);
  }

  setHighlight(highlighted: boolean): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    
    if (highlighted) {
      this.setBackgroundColor(new Color(255, 255, 150, 255));
      if (intensity > 0) {
        tween(this.node)
          .to(0.1 * intensity, { scale: new Vec3(1.05, 1.05, 1) })
          .start();
      }
    } else {
      this.updateStatusVisual();
      if (intensity > 0) {
        tween(this.node)
          .to(0.1 * intensity, { scale: new Vec3(1, 1, 1) })
          .start();
      }
    }
  }

  showFeedback(success: boolean): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity <= 0) return;

    const originalColor = this._classroom?.status === 'available' 
      ? this._originalColor 
      : this.backgroundSprite?.color || this._originalColor;

    const flashColor = success ? new Color(100, 255, 100, 255) : new Color(255, 100, 100, 255);
    
    if (this.backgroundSprite) {
      tween(this.backgroundSprite)
        .to(0.1 * intensity, { color: flashColor })
        .to(0.1 * intensity, { color: originalColor })
        .start();
    }
  }

  onDestroy(): void {
    this.stopPulse();
  }
}
