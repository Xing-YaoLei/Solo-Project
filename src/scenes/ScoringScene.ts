import { Scene, GameObjects } from 'phaser';
import Matter from 'matter-js';
import { Button } from '../ui/Button';
import { GameManager } from '../managers/GameManager';
import { InputManager } from '../managers/InputManager';
import { PhysicsManager } from '../managers/PhysicsManager';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';

export class ScoringScene extends Scene {
  private gameManager!: GameManager;
  private inputManager!: InputManager;
  private physicsManager!: PhysicsManager;
  private score: number = 0;
  private targetScore: number = 0;
  private stars: number = 0;

  private scoreDisplay!: GameObjects.Text;
  private starsContainer!: GameObjects.Container;

  constructor() {
    super('ScoringScene');
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.inputManager.init(this);
    this.physicsManager = PhysicsManager.getInstance();
    this.physicsManager.init(this, 1);
    this.physicsManager.start();

    const levelState = this.gameManager.getLevelState();
    const levelConfig = this.gameManager.getLevelConfig(levelState?.levelId || '');

    if (!levelState || !levelConfig) {
      this.scene.start('MainMenuScene');
      return;
    }

    this.score = levelState.score;
    this.targetScore = levelConfig.targetScore;
    this.stars = this.gameManager.calculateStars();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.setAlpha(0);
    this.cameras.main.fadeIn(ANIMATION_DURATIONS.slow);

    this.createBackground();
    this.createPhysicsWalls();
    this.createTitle();
    this.createScoreDisplay();
    this.createStars();
    this.createScoringDetails();
    this.createButtons();

    this.animateScore();

    this.input.keyboard?.on('keydown-ENTER', () => this.goToReview());
    this.input.keyboard?.on('keydown-SPACE', () => this.goToReview());
    this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());
  }

  update(): void {
    this.inputManager.update();
    this.physicsManager.update();
  }

  shutdown(): void {
    this.physicsManager.clear();
  }

  private createPhysicsWalls(): void {
    this.physicsManager.addWall(GAME_WIDTH / 2, GAME_HEIGHT + 20, GAME_WIDTH, 40);
    this.physicsManager.addWall(-20, GAME_HEIGHT / 2, 40, GAME_HEIGHT);
    this.physicsManager.addWall(GAME_WIDTH + 20, GAME_HEIGHT / 2, 40, GAME_HEIGHT);
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const r = Math.floor(10 + i * 0.015);
      const g = Math.floor(12 + i * 0.018);
      const b = Math.floor(30 + i * 0.04);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      bgGradient.fillStyle(color, 1);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }

    const particleGfx = this.add.graphics();
    particleGfx.setVisible(false);
    particleGfx.fillStyle(0xe9b824, 1);
    particleGfx.fillCircle(4, 4, 4);
    particleGfx.generateTexture('scoreParticle', 8, 8);

    const emitter = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'scoreParticle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 1000, max: 2000 },
      frequency: -1,
      gravityY: 50,
      blendMode: 'ADD',
    });

    this.time.delayedCall(800, () => {
      emitter.explode(50);
    });
  }

  private createTitle(): void {
    const title = this.add.text(GAME_WIDTH / 2, 80, '票种规则评分', {
      fontSize: '36px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setAlpha(0);

    const subtitle = this.add.text(GAME_WIDTH / 2, 125, '根据票种规则计算最终得分', {
      fontSize: '16px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    this.tweens.add({
      targets: [title, subtitle],
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 200,
      ease: 'Cubic.easeOut',
    });
  }

  private createScoreDisplay(): void {
    const container = this.add.container(GAME_WIDTH / 2, 220);

    const scoreLabel = this.add.text(0, -30, '本关得分', {
      fontSize: '20px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    scoreLabel.setOrigin(0.5);
    container.add(scoreLabel);

    this.scoreDisplay = this.add.text(0, 30, '0', {
      fontSize: '72px',
      color: COLORS.secondary,
      fontFamily: '"SF Mono", Monaco, monospace',
      fontStyle: 'bold',
    });
    this.scoreDisplay.setOrigin(0.5);
    container.add(this.scoreDisplay);

    const targetLabel = this.add.text(0, 90, `目标: ${this.targetScore}`, {
      fontSize: '18px',
      color: this.score >= this.targetScore ? COLORS.success : '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    targetLabel.setOrigin(0.5);
    container.add(targetLabel);

    const progressRing = this.add.graphics();
    const progress = Math.min(1, this.score / this.targetScore);
    const radius = 120;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;

    progressRing.lineStyle(8, 0x333333, 0.5);
    progressRing.strokeCircle(0, 30, radius);

    progressRing.lineStyle(8, Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);
    progressRing.beginPath();
    progressRing.arc(0, 30, radius, startAngle, endAngle);
    progressRing.strokePath();

    container.addAt(progressRing, 0);

    container.setScale(0.8);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: ANIMATION_DURATIONS.slow,
      delay: 400,
      ease: 'Back.easeOut',
    });
  }

  private createStars(): void {
    this.starsContainer = this.add.container(GAME_WIDTH / 2, 380);

    for (let i = 0; i < 3; i++) {
      const star = this.add.text((i - 1) * 60, 0, '★', {
        fontSize: '48px',
        color: '#333',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      star.setOrigin(0.5);
      star.setName(`star_${i}`);
      this.starsContainer.add(star);
    }

    this.starsContainer.setAlpha(0);
    this.starsContainer.setScale(0.5);
  }

  private animateStars(): void {
    this.tweens.add({
      targets: this.starsContainer,
      alpha: 1,
      scale: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 600,
      ease: 'Back.easeOut',
    });

    for (let i = 0; i < this.stars; i++) {
      this.time.delayedCall(800 + i * 200, () => {
        const star = this.starsContainer.getByName(`star_${i}`) as GameObjects.Text;
        if (star) {
          star.setColor(COLORS.secondary);
          
          this.tweens.add({
            targets: star,
            scale: 1.5,
            duration: ANIMATION_DURATIONS.fast,
            yoyo: true,
            ease: 'Back.easeOut',
          });

          this.cameras.main.flash(100, 233, 184, 36);
          this.spawnConfetti();
        }
      });
    }
  }

  private spawnConfetti(): void {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA'];
    
    for (let i = 0; i < 15; i++) {
      const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 200;
      const y = -30;
      const size = 6 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const isCircle = Math.random() > 0.5;
      
      let obj;
      if (isCircle) {
        obj = this.physicsManager.addCircle(x, y, size / 2, color, {
          restitution: 0.7,
          friction: 0.1,
          angle: Math.random() * Math.PI * 2,
          angularVelocity: (Math.random() - 0.5) * 0.1,
        });
      } else {
        obj = this.physicsManager.addRectangle(x, y, size, size * 1.5, color, {
          restitution: 0.6,
          friction: 0.15,
          angle: Math.random() * Math.PI * 2,
          angularVelocity: (Math.random() - 0.5) * 0.08,
        });
      }

      const forceX = (Math.random() - 0.5) * 0.01;
      const forceY = -0.005 - Math.random() * 0.005;
      Matter.Body.applyForce(obj.body, obj.body.position, { x: forceX, y: forceY });
    }
  }

  private createScoringDetails(): void {
    const container = this.add.container(GAME_WIDTH / 2, 500);
    const width = 500;
    const height = 140;

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor('#16213E').color, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    const title = this.add.text(-width / 2 + 20, -height / 2 + 18, '评分规则应用', {
      fontSize: '16px',
      color: COLORS.light,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    container.add(title);

    const levelState = this.gameManager.getLevelState();
    if (levelState) {
      let y = -height / 2 + 50;
      
      const baseScoreText = this.add.text(-width / 2 + 20, y, `基础分 (${levelState.correctCount}次正确 × 20分)`, {
        fontSize: '14px',
        color: '#8892b0',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      container.add(baseScoreText);

      const baseScore = this.add.text(width / 2 - 20, y, `+${levelState.correctCount * 20}`, {
        fontSize: '14px',
        color: COLORS.success,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      baseScore.setOrigin(1, 0);
      container.add(baseScore);

      y += 30;

      if (levelState.disputeCount > 0) {
        const disputeText = this.add.text(-width / 2 + 20, y, `争议处理 (${levelState.disputeCount}次 × 30分)`, {
          fontSize: '14px',
          color: '#8892b0',
          fontFamily: '"Segoe UI", Roboto, sans-serif',
        });
        container.add(disputeText);

        const disputeScore = this.add.text(width / 2 - 20, y, `+${levelState.disputeCount * 30}`, {
          fontSize: '14px',
          color: COLORS.success,
          fontFamily: '"Segoe UI", Roboto, sans-serif',
        });
        disputeScore.setOrigin(1, 0);
        container.add(disputeScore);

        y += 30;
      }

      const wrongText = this.add.text(-width / 2 + 20, y, `错误扣除 (${levelState.wrongCount}次 × 10分)`, {
        fontSize: '14px',
        color: '#8892b0',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      container.add(wrongText);

      const wrongScore = this.add.text(width / 2 - 20, y, `-${levelState.wrongCount * 10}`, {
        fontSize: '14px',
        color: COLORS.danger,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      wrongScore.setOrigin(1, 0);
      container.add(wrongScore);
    }

    container.setAlpha(0);
    container.setY(520);
    this.tweens.add({
      targets: container,
      y: 500,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 1000,
      ease: 'Cubic.easeOut',
    });
  }

  private createButtons(): void {
    const buttonY = GAME_HEIGHT - 70;

    new Button(this, {
      x: GAME_WIDTH / 2 - 130,
      y: buttonY,
      width: 220,
      height: 56,
      text: '返回菜单',
      backgroundColor: '#1a1a3e',
      hoverColor: '#2a2a4e',
      textColor: COLORS.light,
      fontSize: 18,
      radius: 28,
      onClick: () => this.goToMenu(),
    });

    new Button(this, {
      x: GAME_WIDTH / 2 + 130,
      y: buttonY,
      width: 220,
      height: 56,
      text: '查看复盘 →',
      backgroundColor: COLORS.accent,
      hoverColor: '#2CB5A8',
      textColor: COLORS.white,
      fontSize: 18,
      radius: 28,
      onClick: () => this.goToReview(),
    });

    const hint = this.add.text(GAME_WIDTH / 2, buttonY + 45, '按 Enter 或空格键查看复盘', {
      fontSize: '13px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    hint.setOrigin(0.5);
  }

  private animateScore(): void {
    let currentScore = 0;
    const duration = 1500;
    const startTime = this.time.now;

    const updateScore = () => {
      const elapsed = this.time.now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      currentScore = Math.floor(this.score * eased);
      this.scoreDisplay.setText(currentScore.toString());

      if (progress < 1) {
        this.time.delayedCall(16, updateScore);
      } else {
        this.animateStars();
      }
    };

    this.time.delayedCall(500, updateScore);
  }

  private goToReview(): void {
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('ReviewScene');
    });
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
