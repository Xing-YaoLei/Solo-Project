import { _decorator, Component, Node, Label, Sprite, Color, Vec3, UITransform, EventTouch, UIOpacity, tween } from 'cc';
import { Course } from '../types';
import { EventBus, GameEvents } from '../core/EventBus';
import { SettingsManager } from '../config/SettingsManager';
const { ccclass, property } = _decorator;

@ccclass('CourseItem')
export class CourseItem extends Component {
  @property(Label)
  nameLabel: Label | null = null;

  @property(Label)
  teacherLabel: Label | null = null;

  @property(Label)
  creditsLabel: Label | null = null;

  @property(Sprite)
  backgroundSprite: Sprite | null = null;

  @property(Sprite)
  typeIndicator: Sprite | null = null;

  @property(Node)
  dragGhost: Node | null = null;

  private _course: Course | null = null;
  private _isDragging: boolean = false;
  private _originalPosition: Vec3 = new Vec3();
  private _originalParent: Node | null = null;
  private _startTouchPos: Vec3 = new Vec3();
  private _scheduled: boolean = false;

  get course(): Course | null {
    return this._course;
  }

  get isDragging(): boolean {
    return this._isDragging;
  }

  get scheduled(): boolean {
    return this._scheduled;
  }

  setScheduled(scheduled: boolean): void {
    this._scheduled = scheduled;
    this.updateVisualState();
  }

  setCourse(course: Course): void {
    this._course = course;
    this.updateDisplay();
  }

  onLoad(): void {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  private updateDisplay(): void {
    if (!this._course) return;

    if (this.nameLabel) {
      this.nameLabel.string = this._course.name;
    }

    if (this.teacherLabel) {
      this.teacherLabel.string = this._course.teacher;
    }

    if (this.creditsLabel) {
      this.creditsLabel.string = `${this._course.credits}学分`;
    }

    if (this.backgroundSprite) {
      this.backgroundSprite.color = new Color(this.hexToColor(this._course.color));
    }

    if (this.typeIndicator) {
      const typeColors: Record<string, Color> = {
        required: new Color(74, 144, 217, 255),
        elective: new Color(80, 200, 120, 255),
        lab: new Color(230, 126, 34, 255),
        pe: new Color(231, 76, 60, 255),
      };
      this.typeIndicator.color = typeColors[this._course.type] || Color.WHITE;
    }

    this.updateVisualState();
  }

  private updateVisualState(): void {
    const opacity = this._scheduled ? 128 : 255;
    const uiOpacity = this.node.getComponent(UIOpacity);
    if (uiOpacity) {
      uiOpacity.opacity = opacity;
    }
  }

  private hexToColor(hex: string): { r: number; g: number; b: number; a: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255,
    } : { r: 255, g: 255, b: 255, a: 255 };
  }

  private onTouchStart(event: EventTouch): void {
    if (this._scheduled) {
      event.propagationStopped = true;
      return;
    }

    this._isDragging = true;
    this._originalPosition = this.node.getPosition().clone();
    this._originalParent = this.node.parent;
    this._startTouchPos = event.getUILocation();

    EventBus.instance.emit(GameEvents.COURSE_DRAG_START, this._course, this.node);
    
    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity > 0) {
      tween(this.node)
        .to(0.1 * intensity, { scale: new Vec3(1.1, 1.1, 1) })
        .start();
    }

    this.createDragGhost();
  }

  private onTouchMove(event: EventTouch): void {
    if (!this._isDragging) return;

    const currentPos = event.getUILocation();
    const delta = new Vec3(
      currentPos.x - this._startTouchPos.x,
      currentPos.y - this._startTouchPos.y,
      0
    );

    const newPos = this._originalPosition.clone().add(delta);
    this.node.setPosition(newPos);

    if (this.dragGhost) {
      this.dragGhost.setPosition(newPos);
    }
  }

  private onTouchEnd(event: EventTouch): void {
    if (!this._isDragging) return;

    this._isDragging = false;
    
    const endPos = event.getUILocation();
    EventBus.instance.emit(GameEvents.COURSE_DRAG_END, this._course, new Vec3(endPos.x, endPos.y, 0));
    
    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity > 0) {
      tween(this.node)
        .to(0.1 * intensity, { position: this._originalPosition })
        .to(0.1 * intensity, { scale: new Vec3(1, 1, 1) })
        .start();
    } else {
      this.node.setPosition(this._originalPosition);
      this.node.setScale(1, 1, 1);
    }

    this.destroyDragGhost();
    SettingsManager.getInstance().vibrate(30);
  }

  private onTouchCancel(event: EventTouch): void {
    this.onTouchEnd(event);
  }

  private createDragGhost(): void {
    if (!this.node.parent) return;

    const ghost = instantiate(this.node);
    ghost.name = 'CourseDragGhost';
    ghost.setPosition(this.node.getPosition());
    ghost.setScale(1.05, 1.05, 1);
    
    const ghostOpacity = ghost.getComponent(UIOpacity);
    if (ghostOpacity) {
      ghostOpacity.opacity = 180;
    }

    this.node.parent.addChild(ghost);
    this.dragGhost = ghost;
  }

  private destroyDragGhost(): void {
    if (this.dragGhost) {
      this.dragGhost.destroy();
      this.dragGhost = null;
    }
  }

  showPlacementFeedback(success: boolean): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity <= 0) return;

    const flashColor = success ? new Color(100, 255, 100, 255) : new Color(255, 100, 100, 255);
    const originalColor = this._course ? new Color(this.hexToColor(this._course.color)) : Color.WHITE;

    if (this.backgroundSprite) {
      tween(this.backgroundSprite)
        .to(0.1 * intensity, { color: flashColor })
        .to(0.1 * intensity, { color: originalColor })
        .start();
    }
  }

  onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    this.destroyDragGhost();
  }
}
