import { COLORS, Assignment, Submission, Student } from '../types';
import { getDifficultyColor, getDifficultyLabel, getScoreColor } from '../utils';
import Matter from 'matter-js';

export class AssignmentCard extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private studentText: Phaser.GameObjects.Text;
  private difficultyBadge: Phaser.GameObjects.Rectangle;
  private difficultyText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private lateIndicator: Phaser.GameObjects.Text | null = null;
  private matterBody: Matter.Body | null = null;
  private isDragging: boolean = false;
  private hasMoved: boolean = false;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private originalX: number;
  private originalY: number;
  private assignment: Assignment;
  private submission: Submission;
  private student: Student;
  private isGraded: boolean = false;
  private onSelectCallback: ((card: AssignmentCard) => void) | null = null;
  private onDragEndCallback: ((card: AssignmentCard, x: number, y: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    assignment: Assignment,
    submission: Submission,
    student: Student
  ) {
    super(scene, x, y);
    this.originalX = x;
    this.originalY = y;
    this.assignment = assignment;
    this.submission = submission;
    this.student = student;

    this.background = scene.add.rectangle(0, 0, width, height, COLORS.surfaceLight)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, COLORS.border);

    this.titleText = scene.add.text(-width / 2 + 15, -height / 2 + 20, assignment.title, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      wordWrap: { width: width - 30 }
    }).setOrigin(0, 0);

    this.studentText = scene.add.text(-width / 2 + 15, 0, `${student.avatar} ${student.name}`, {
      fontSize: '14px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);

    const diffColor = getDifficultyColor(assignment.difficulty);
    this.difficultyBadge = scene.add.rectangle(width / 2 - 45, -height / 2 + 15, 70, 24, diffColor)
      .setOrigin(1, 0.5);

    this.difficultyText = scene.add.text(width / 2 - 50, -height / 2 + 15, getDifficultyLabel(assignment.difficulty), {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(1, 0.5);

    this.scoreText = scene.add.text(0, height / 2 - 25, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    if (submission.isLate) {
      this.lateIndicator = scene.add.text(-width / 2 + 15, height / 2 - 25, '⚠️ 迟交', {
        fontSize: '12px',
        color: '#ed8936',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5);
    }

    const children: Phaser.GameObjects.GameObject[] = [
      this.background,
      this.titleText,
      this.studentText,
      this.difficultyBadge,
      this.difficultyText,
      this.scoreText
    ];
    if (this.lateIndicator) children.push(this.lateIndicator);

    this.add(children);
    this.setSize(width, height);
    this.setupInteraction();
    this.updateScoreDisplay();
    scene.add.existing(this);
  }

  private setupInteraction(): void {
    this.setInteractive({ useHandCursor: true, draggable: true });

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.active) return;
      this.pointerDownX = pointer.x;
      this.pointerDownY = pointer.y;
      this.hasMoved = false;
      this.isDragging = true;
      this.background.setStrokeStyle(3, COLORS.primary);
      this.scale = 1.05;
      this.setDepth(100);
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isDragging) {
        const dx = Math.abs(dragX - this.x);
        const dy = Math.abs(dragY - this.y);
        if (dx > 5 || dy > 5) {
          this.hasMoved = true;
        }
        this.x = dragX;
        this.y = dragY;
        if (this.matterBody) {
          Matter.Body.setPosition(this.matterBody, { x: dragX, y: dragY });
        }
      }
    });

    this.on('dragend', (_pointer: Phaser.Input.Pointer, x: number, y: number) => {
      this.isDragging = false;
      if (this.hasMoved) {
        if (this.onDragEndCallback) {
          this.onDragEndCallback(this, x, y);
        }
      } else {
        this.resetPosition();
        if (this.onSelectCallback) {
          this.onSelectCallback(this);
        }
      }
      this.hasMoved = false;
      this.background.setStrokeStyle(2, this.isGraded ? COLORS.success : COLORS.border);
      this.scale = 1;
    });

    this.on('pointerup', () => {
      if (!this.active) return;
      if (!this.hasMoved && this.isDragging) {
        this.isDragging = false;
        this.hasMoved = false;
        if (this.onSelectCallback) {
          this.onSelectCallback(this);
        }
        this.background.setStrokeStyle(2, this.isGraded ? COLORS.success : COLORS.border);
        this.scale = 1;
      }
    });

    this.on('pointerout', () => {
      if (!this.active) return;
      if (!this.hasMoved) {
        this.isDragging = false;
        this.hasMoved = false;
        this.background.setStrokeStyle(2, this.isGraded ? COLORS.success : COLORS.border);
        this.scale = 1;
      }
    });
  }

  initPhysics(engine: Matter.Engine): void {
    this.matterBody = Matter.Bodies.rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      {
        restitution: 0.3,
        friction: 0.5,
        density: 0.001
      }
    );
    Matter.Composite.add(engine.world, this.matterBody);
  }

  updatePhysics(): void {
    if (this.matterBody && !this.isDragging) {
      this.x = this.matterBody.position.x;
      this.y = this.matterBody.position.y;
      this.rotation = this.matterBody.angle;
    }
  }

  setGraded(graded: boolean): this {
    this.isGraded = graded;
    this.background.setStrokeStyle(2, graded ? COLORS.success : COLORS.border);
    this.background.fillColor = graded ? 0x2d4a3e : COLORS.surfaceLight;
    this.active = !graded;
    return this;
  }

  setOnSelect(callback: (card: AssignmentCard) => void): this {
    this.onSelectCallback = callback;
    return this;
  }

  setOnDragEnd(callback: (card: AssignmentCard, x: number, y: number) => void): this {
    this.onDragEndCallback = callback;
    return this;
  }

  resetPosition(): this {
    this.x = this.originalX;
    this.y = this.originalY;
    this.rotation = 0;
    if (this.matterBody) {
      Matter.Body.setPosition(this.matterBody, { x: this.originalX, y: this.originalY });
      Matter.Body.setAngle(this.matterBody, 0);
      Matter.Body.setVelocity(this.matterBody, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(this.matterBody, 0);
    }
    return this;
  }

  private updateScoreDisplay(): void {
    if (this.isGraded) {
      const color = '#' + getScoreColor(this.submission.score, this.assignment.maxScore).toString(16).padStart(6, '0');
      this.scoreText.setText(`✓ ${this.submission.score}/${this.assignment.maxScore}`);
      this.scoreText.setColor(color);
    } else {
      this.scoreText.setText('待评分');
      this.scoreText.setColor('#a0aec0');
    }
  }

  updateScore(score: number): this {
    this.submission.score = score;
    this.setGraded(true);
    this.updateScoreDisplay();
    return this;
  }

  getAssignment(): Assignment {
    return this.assignment;
  }

  getSubmission(): Submission {
    return this.submission;
  }

  getStudent(): Student {
    return this.student;
  }

  getIsGraded(): boolean {
    return this.isGraded;
  }

  getOriginalPosition(): { x: number; y: number } {
    return { x: this.originalX, y: this.originalY };
  }

  destroy(fromScene?: boolean): void {
    this.matterBody = null;
    super.destroy(fromScene);
  }
}
