import { COLORS, Submission, Assignment } from '../types';
import { UIButton } from './UIButton';
import { UIProgressBar } from './UIProgressBar';
import { getScoreColor, formatDate } from '../utils';

export class UIScoringPanel extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private studentNameText: Phaser.GameObjects.Text;
  private assignmentTitleText: Phaser.GameObjects.Text;
  private submissionContentText: Phaser.GameObjects.Text;
  private scoreDisplay: Phaser.GameObjects.Text;
  private scoreSlider: UIProgressBar | null = null;
  private confirmButton: UIButton;
  private cancelButton: UIButton;
  private scoreButtons: UIButton[] = [];
  private currentScore: number = 0;
  private maxScore: number = 100;
  private submission: Submission | null = null;
  private assignment: Assignment | null = null;
  private onConfirmCallback: ((score: number) => void) | null = null;
  private onCancelCallback: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.setSize(width, height);

    this.background = scene.add.rectangle(0, 0, width, height, COLORS.surface)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(3, COLORS.primary);

    this.titleText = scene.add.text(0, -height / 2 + 30, '评分面板', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    this.studentNameText = scene.add.text(-width / 2 + 30, -height / 2 + 70, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);

    this.assignmentTitleText = scene.add.text(-width / 2 + 30, -height / 2 + 105, '', {
      fontSize: '16px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);

    this.submissionContentText = scene.add.text(-width / 2 + 30, -height / 2 + 150, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      wordWrap: { width: width - 60 }
    }).setOrigin(0, 0);

    this.scoreDisplay = scene.add.text(0, 20, '0', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    this.createScoreButtons();

    this.confirmButton = new UIButton(scene, 80, height / 2 - 40, 100, 40, '确认', 16, COLORS.success)
      .setOnClick(() => this.onConfirm());

    this.cancelButton = new UIButton(scene, -80, height / 2 - 40, 100, 40, '取消', 16, COLORS.surfaceLight)
      .setOnClick(() => this.onCancel());

    this.add([
      this.background,
      this.titleText,
      this.studentNameText,
      this.assignmentTitleText,
      this.submissionContentText,
      this.scoreDisplay,
      this.confirmButton,
      this.cancelButton,
      ...this.scoreButtons
    ]);

    this.setVisible(false);
    this.setActive(false);
    scene.add.existing(this);
  }

  private createScoreButtons(): void {
    const scores = [0, 25, 50, 75, 100];
    const spacing = 60;
    const startX = -((scores.length - 1) * spacing) / 2;

    scores.forEach((score, index) => {
      const button = new UIButton(
        this.scene,
        startX + index * spacing,
        90,
        50,
        40,
        score.toString(),
        14,
        COLORS.surfaceLight
      ).setOnClick(() => {
          this.currentScore = Math.min(score, this.maxScore);
          this.updateScoreDisplay();
        });

      this.scoreButtons.push(button);
    });
  }

  show(
    submission: Submission,
    assignment: Assignment,
    studentName: string,
    onConfirm: (score: number) => void,
    onCancel?: () => void
  ): this {
    this.submission = submission;
    this.assignment = assignment;
    this.maxScore = assignment.maxScore;
    this.currentScore = Math.min(submission.score, assignment.maxScore);
    this.onConfirmCallback = onConfirm;
    this.onCancelCallback = onCancel || null;

    this.studentNameText.setText(`学生: ${studentName}`);
    this.assignmentTitleText.setText(`作业: ${assignment.title} | 满分: ${assignment.maxScore}`);
    this.submissionContentText.setText(
      `提交时间: ${formatDate(submission.submittedAt)}\n` +
      `${submission.isLate ? '⚠️ 迟交\n' : ''}\n` +
      `作业内容:\n${submission.content}`
    );

    this.updateScoreButtons();
    this.updateScoreDisplay();

    this.setVisible(true);
    this.setActive(true);

    this.scale = 0.8;
    this.alpha = 0;
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.out'
    });

    return this;
  }

  private updateScoreButtons(): void {
    this.scoreButtons.forEach(btn => {
      const btnScore = parseInt(btn.getText());
      const adjustedScore = Math.min(btnScore, this.maxScore);
      btn.setText(adjustedScore.toString());
    });
  }

  private updateScoreDisplay(): void {
    this.scoreDisplay.setText(this.currentScore.toString());
    this.scoreDisplay.setColor('#' + getScoreColor(this.currentScore, this.maxScore).toString(16).padStart(6, '0'));

    this.scoreButtons.forEach(btn => {
      const btnScore = parseInt(btn.getText());
      if (btnScore === this.currentScore) {
        btn.setColor(COLORS.primary);
      } else {
        btn.setColor(COLORS.surfaceLight);
      }
    });
  }

  setScore(score: number): this {
    this.currentScore = Math.max(0, Math.min(this.maxScore, score));
    this.updateScoreDisplay();
    return this;
  }

  adjustScore(delta: number): this {
    return this.setScore(this.currentScore + delta);
  }

  private onConfirm(): void {
    if (this.onConfirmCallback) {
      this.onConfirmCallback(this.currentScore);
    }
    this.hide();
  }

  private onCancel(): void {
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
    this.hide();
  }

  hide(): this {
    this.scene.tweens.add({
      targets: this,
      scale: 0.8,
      alpha: 0,
      duration: 200,
      ease: 'Back.in',
      onComplete: () => {
        this.setVisible(false);
        this.setActive(false);
      }
    });
    return this;
  }

  getCurrentScore(): number {
    return this.currentScore;
  }

  getMaxScore(): number {
    return this.maxScore;
  }

  isVisible(): boolean {
    return this.active && this.visible;
  }

  confirm(): void {
    this.onConfirm();
  }

  cancel(): void {
    this.onCancel();
  }
}
