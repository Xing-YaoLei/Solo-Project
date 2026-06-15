import { COLORS, Student } from '../types';
import { getScoreColor, calculateAverage } from '../utils';

export class StudentCard extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private avatarText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private performanceBar: Phaser.GameObjects.Rectangle;
  private performanceBarBg: Phaser.GameObjects.Rectangle;
  private performanceText: Phaser.GameObjects.Text;
  private improvementText: Phaser.GameObjects.Text;
  private submissionCountText: Phaser.GameObjects.Text;
  private student: Student;
  private isSelected: boolean = false;
  private onClickCallback: ((card: StudentCard) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    student: Student
  ) {
    super(scene, x, y);
    this.student = student;

    this.background = scene.add.rectangle(0, 0, width, height, COLORS.surface)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, COLORS.border);

    this.avatarText = scene.add.text(-width / 2 + 25, 0, student.avatar, {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);

    this.nameText = scene.add.text(-width / 2 + 75, -height / 2 + 30, student.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.performanceBarBg = scene.add.rectangle(-width / 2 + 75, 0, 120, 16, COLORS.surfaceLight)
      .setOrigin(0, 0.5);

    this.performanceBar = scene.add.rectangle(-width / 2 + 75, 0, 2, 12, COLORS.primary)
      .setOrigin(0, 0.5);

    this.performanceText = scene.add.text(width / 2 - 20, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(1, 0.5);

    this.improvementText = scene.add.text(-width / 2 + 75, height / 2 - 30, '', {
      fontSize: '12px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);

    this.submissionCountText = scene.add.text(width / 2 - 20, height / 2 - 30, '', {
      fontSize: '12px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(1, 0.5);

    this.add([
      this.background,
      this.avatarText,
      this.nameText,
      this.performanceBarBg,
      this.performanceBar,
      this.performanceText,
      this.improvementText,
      this.submissionCountText
    ]);

    this.setSize(width, height);
    this.setupInteraction();
    this.updateDisplay();
    scene.add.existing(this);
  }

  private setupInteraction(): void {
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      if (!this.active) return;
      this.background.setStrokeStyle(3, COLORS.primary);
    });

    this.on('pointerout', () => {
      if (!this.active) return;
      this.background.setStrokeStyle(2, this.isSelected ? COLORS.primary : COLORS.border);
    });

    this.on('pointerdown', () => {
      if (!this.active) return;
      this.scale = 0.98;
    });

    this.on('pointerup', () => {
      if (!this.active) return;
      this.scale = 1;
      if (this.onClickCallback) {
        this.onClickCallback(this);
      }
    });
  }

  private updateDisplay(): void {
    const avgScore = calculateAverage(this.student.submissions.map(s => s.score));
    const barWidth = (this.student.performance / 100) * (this.performanceBarBg.width - 4);

    this.scene.tweens.add({
      targets: this.performanceBar,
      width: barWidth,
      duration: 500,
      ease: 'Power2.out'
    });

    this.performanceText.setText(this.student.performance.toString());
    this.performanceText.setColor('#' + getScoreColor(this.student.performance, 100).toString(16).padStart(6, '0'));

    const improvementPrefix = this.student.improvement > 0 ? '↑' : this.student.improvement < 0 ? '↓' : '→';
    const improvementColor = this.student.improvement > 0 ? '#48bb78' : this.student.improvement < 0 ? '#e53e3e' : '#a0aec0';
    this.improvementText.setText(`${improvementPrefix} ${Math.abs(this.student.improvement)}%`);
    this.improvementText.setColor(improvementColor);

    this.submissionCountText.setText(`作业: ${this.student.submissions.length}`);
  }

  setSelected(selected: boolean): this {
    this.isSelected = selected;
    this.background.setStrokeStyle(2, selected ? COLORS.primary : COLORS.border);
    this.background.fillColor = selected ? COLORS.surfaceLight : COLORS.surface;
    return this;
  }

  setOnClick(callback: (card: StudentCard) => void): this {
    this.onClickCallback = callback;
    return this;
  }

  getStudent(): Student {
    return this.student;
  }

  getIsSelected(): boolean {
    return this.isSelected;
  }

  updateStudent(student: Student): this {
    this.student = student;
    this.updateDisplay();
    return this;
  }
}
