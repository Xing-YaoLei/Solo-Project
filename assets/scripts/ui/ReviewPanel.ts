import { _decorator, Component, Node, Label, Sprite, Color, ProgressBar, Vec3, tween, UIOpacity, Prefab, instantiate } from 'cc';
import { EventBus } from '../core/EventBus';
import { GameStatistics } from '../types';
import { SettlementManager } from '../game/SettlementManager';
import { TimeManager } from '../game/TimeManager';
import { ScheduleManager } from '../game/ScheduleManager';
import { ConfigManager } from '../config/ConfigManager';
import { SettingsManager } from '../config/SettingsManager';
const { ccclass, property } = _decorator;

@ccclass('ReviewPanel')
export class ReviewPanel extends Component {
  @property(Label)
  gradeLabel: Label | null = null;

  @property(Label)
  scoreLabel: Label | null = null;

  @property(Label)
  totalTimeLabel: Label | null = null;

  @property(Label)
  reviewTimeLabel: Label | null = null;

  @property(Label)
  completionTimeLabel: Label | null = null;

  @property(Label)
  satisfactionLabel: Label | null = null;

  @property(Label)
  qualityLabel: Label | null = null;

  @property(Label)
  conflictLabel: Label | null = null;

  @property(ProgressBar)
  satisfactionProgress: ProgressBar | null = null;

  @property(ProgressBar)
  qualityProgress: ProgressBar | null = null;

  @property(Node)
  bottleneckContainer: Node | null = null;

  @property(Prefab)
  bottleneckItemPrefab: Prefab | null = null;

  @property(Sprite)
  gradeBackground: Sprite | null = null;

  @property(Node)
  content: Node | null = null;

  private _statistics: GameStatistics | null = null;

  onLoad(): void {
    if (this.content) {
      this.content.active = false;
    }
  }

  show(): void {
    const settlementManager = SettlementManager.getInstance();
    const success = settlementManager.isSuccess();
    this._statistics = settlementManager.calculateSettlement(success);
    
    this.updateDisplay();
    
    if (this.content) {
      this.content.active = true;
      const intensity = SettingsManager.getInstance().animationIntensity;
      if (intensity > 0) {
        const opacity = this.content.getComponent(UIOpacity);
        if (opacity) {
          opacity.opacity = 0;
        }
        this.content.setScale(0.8, 0.8, 1);
        
        tween(this.content)
          .parallel(
            tween().to(0.3 * intensity, { scale: new Vec3(1, 1, 1) }),
            tween().call(() => {
              if (opacity) {
                tween(opacity)
                  .to(0.3 * intensity, { opacity: 255 })
                  .start();
              }
            })
          )
          .start();
      }
    }
  }

  hide(): void {
    if (this.content) {
      const intensity = SettingsManager.getInstance().animationIntensity;
      if (intensity > 0) {
        const opacity = this.content.getComponent(UIOpacity);
        tween(this.content)
          .to(0.2 * intensity, { scale: new Vec3(0.8, 0.8, 1) })
          .call(() => {
            this.content!.active = false;
          })
          .start();
        
        if (opacity) {
          tween(opacity)
            .to(0.2 * intensity, { opacity: 0 })
            .start();
        }
      } else {
        this.content.active = false;
      }
    }
  }

  private updateDisplay(): void {
    if (!this._statistics) return;

    const settlementManager = SettlementManager.getInstance();
    const timeManager = TimeManager.getInstance();
    const scheduleManager = ScheduleManager.getInstance();

    const grade = settlementManager.getGrade();
    const score = settlementManager.calculateScore();
    const success = settlementManager.isSuccess();

    if (this.gradeLabel) {
      this.gradeLabel.string = grade;
      this.gradeLabel.color = this.getGradeColor(grade);
    }

    if (this.gradeBackground) {
      this.gradeBackground.color = success 
        ? new Color(80, 200, 120, 255) 
        : new Color(231, 76, 60, 255);
    }

    if (this.scoreLabel) {
      this.scoreLabel.string = `得分: ${score}`;
    }

    if (this.totalTimeLabel) {
      this.totalTimeLabel.string = `总用时: ${timeManager.formatTime(this._statistics.totalTime)}`;
    }

    if (this.reviewTimeLabel) {
      this.reviewTimeLabel.string = `审核时长: ${this._statistics.reviewTime.toFixed(1)}秒`;
    }

    if (this.completionTimeLabel) {
      this.completionTimeLabel.string = `完成时间: ${timeManager.formatTime(this._statistics.completionTime)}`;
    }

    if (this.satisfactionLabel) {
      this.satisfactionLabel.string = `学生满意度: ${this._statistics.studentSatisfaction.toFixed(1)}%`;
    }

    if (this.qualityLabel) {
      this.qualityLabel.string = `排课质量: ${this._statistics.scheduleQuality.toFixed(0)}分`;
    }

    if (this.conflictLabel) {
      const unresolved = this._statistics.conflictCount - this._statistics.resolvedConflicts;
      this.conflictLabel.string = `冲突: ${this._statistics.resolvedConflicts}/${this._statistics.conflictCount} 解决 (未解决: ${unresolved})`;
    }

    if (this.satisfactionProgress) {
      this.satisfactionProgress.progress = this._statistics.studentSatisfaction / 100;
    }

    if (this.qualityProgress) {
      this.qualityProgress.progress = this._statistics.scheduleQuality / 100;
    }

    this.updateBottleneckAnalysis();
    this.animateStats();
  }

  private getGradeColor(grade: string): Color {
    const colors: Record<string, Color> = {
      'S': new Color(255, 215, 0, 255),
      'A': new Color(80, 200, 120, 255),
      'B': new Color(74, 144, 217, 255),
      'C': new Color(241, 196, 15, 255),
      'D': new Color(230, 126, 34, 255),
      'F': new Color(231, 76, 60, 255),
    };
    return colors[grade] || Color.WHITE;
  }

  private updateBottleneckAnalysis(): void {
    if (!this.bottleneckContainer || !this.bottleneckItemPrefab || !this._statistics) return;

    this.bottleneckContainer.removeAllChildren();

    const analysis = SettlementManager.getInstance().getBottleneckAnalysis();
    
    analysis.forEach(text => {
      const node = instantiate(this.bottleneckItemPrefab!);
      const label = node.getComponent(Label);
      if (label) {
        label.string = `• ${text}`;
      }
      this.bottleneckContainer!.addChild(node);
    });
  }

  private animateStats(): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity <= 0) return;

    const nodes = [
      this.gradeLabel?.node,
      this.scoreLabel?.node,
      this.totalTimeLabel?.node,
      this.satisfactionLabel?.node,
      this.qualityLabel?.node,
    ].filter(n => n) as Node[];

    nodes.forEach((node, index) => {
      node.setPosition(node.position.x - 50, node.position.y, node.position.z);
      const opacity = node.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = 0;
      }

      tween(node)
        .delay(0.1 * index * intensity)
        .parallel(
          tween().by(0.3 * intensity, { position: new Vec3(50, 0, 0) }),
          tween().call(() => {
            if (opacity) {
              tween(opacity)
                .to(0.3 * intensity, { opacity: 255 })
                .start();
            }
          })
        )
        .start();
    });
  }

  onRestart(): void {
    EventBus.instance.emit('game_restart');
    this.hide();
  }

  onBackToMenu(): void {
    EventBus.instance.emit('game_back_to_menu');
    this.hide();
  }
}
