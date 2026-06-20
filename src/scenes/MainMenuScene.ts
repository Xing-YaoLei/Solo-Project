import { Scene, GameObjects } from 'phaser';
import Matter from 'matter-js';
import { Button } from '../ui/Button';
import { GameManager } from '../managers/GameManager';
import { InputManager } from '../managers/InputManager';
import { PhysicsManager } from '../managers/PhysicsManager';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';
import type { LevelConfig } from '../types/game';

export class MainMenuScene extends Scene {
  private gameManager!: GameManager;
  private inputManager!: InputManager;
  private physicsManager!: PhysicsManager;
  private levelCards: GameObjects.Container[] = [];
  private selectedLevelIndex: number = 0;
  private levels: LevelConfig[] = [];

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.inputManager.init(this);
    this.physicsManager = PhysicsManager.getInstance();
    this.physicsManager.init(this, 0.3);
    this.physicsManager.start();
    
    this.levels = this.gameManager.getLevels();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.setAlpha(0);
    this.cameras.main.fadeIn(ANIMATION_DURATIONS.normal);

    this.createBackground();
    this.createPhysicsDecorations();
    this.createTitle();
    this.createLevelCards();
    this.createBottomButtons();

    this.input.keyboard?.on('keydown-LEFT', () => this.navigateLevels(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.navigateLevels(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.selectLevel());
    this.input.keyboard?.on('keydown-SPACE', () => this.selectLevel());
  }

  update(): void {
    this.inputManager.update();
    this.physicsManager.update();
  }

  shutdown(): void {
    this.physicsManager.clear();
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const r = Math.floor(10 + i * 0.015);
      const g = Math.floor(10 + i * 0.015);
      const b = Math.floor(26 + i * 0.04);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      bgGradient.fillStyle(color, 1);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }

    const shapesGraphics = this.add.graphics();
    shapesGraphics.setAlpha(0.1);
    
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 50 + Math.random() * 150;
      const hue = 180 + Math.random() * 120;
      
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.6, 0.5).color;
      
      shapesGraphics.fillStyle(color, 0.3);
      shapesGraphics.fillCircle(x, y, size);
      
      this.tweens.add({
        targets: { x, y },
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        duration: 10000 + Math.random() * 10000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: (_tween, target) => {
          shapesGraphics.clear();
          for (let j = 0; j < 8; j++) {
            const px = (target as any).x + j * 100;
            const py = (target as any).y + j * 50;
            shapesGraphics.fillStyle(color, 0.3);
            shapesGraphics.fillCircle(px, py, size - j * 10);
          }
        },
      });
    }
  }

  private createPhysicsDecorations(): void {
    this.physicsManager.addWall(GAME_WIDTH / 2, -20, GAME_WIDTH, 40);
    this.physicsManager.addWall(GAME_WIDTH / 2, GAME_HEIGHT + 20, GAME_WIDTH, 40);
    this.physicsManager.addWall(-20, GAME_HEIGHT / 2, 40, GAME_HEIGHT);
    this.physicsManager.addWall(GAME_WIDTH + 20, GAME_HEIGHT / 2, 40, GAME_HEIGHT);

    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#95E1D3'];
    
    const bodies: Matter.Body[] = [];

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const radius = 4 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const circle = this.physicsManager.addCircle(x, y, radius, color, {
        restitution: 0.8,
        friction: 0.05,
        density: 0.001,
      });

      circle.graphic.setAlpha(0.6);
      bodies.push(circle.body);
    }

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        bodies.forEach(body => {
          if (Math.random() > 0.7) {
            const forceX = (Math.random() - 0.5) * 0.002;
            const forceY = -0.003 - Math.random() * 0.002;
            Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
          }
        });
      },
    });
  }

  private createTitle(): void {
    const titleContainer = this.add.container(GAME_WIDTH / 2, 120);

    const mainTitle = this.add.text(0, 0, '票务赞助权益经营模拟', {
      fontSize: '42px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    mainTitle.setOrigin(0.5);
    titleContainer.add(mainTitle);

    const subtitle = this.add.text(0, 50, 'Ticket Sponsor Management', {
      fontSize: '18px',
      color: COLORS.secondary,
      fontFamily: 'Georgia, serif',
      letterSpacing: 4,
    });
    subtitle.setOrigin(0.5);
    titleContainer.add(subtitle);

    const decorationLine = this.add.graphics();
    decorationLine.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.secondary).color, 0.5);
    decorationLine.beginPath();
    decorationLine.moveTo(-150, 80);
    decorationLine.lineTo(150, 80);
    decorationLine.strokePath();
    titleContainer.add(decorationLine);

    titleContainer.setY(-50);
    this.tweens.add({
      targets: titleContainer,
      y: 120,
      duration: ANIMATION_DURATIONS.slower,
      ease: 'Bounce.easeOut',
    });
  }

  private createLevelCards(): void {
    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT / 2 - 20;
    const cardWidth = 280;
    const cardSpacing = 40;

    this.levels.forEach((level, index) => {
      const x = startX + (index - 1) * (cardWidth + cardSpacing);
      const card = this.createLevelCard(level, x, startY, index);
      this.levelCards.push(card);
    });

    this.updateLevelSelection();
  }

  private createLevelCard(level: LevelConfig, x: number, y: number, index: number): GameObjects.Container {
    const card = this.add.container(x, y);
    card.setData('levelIndex', index);
    
    const cardWidth = 280;
    const cardHeight = 340;
    const radius = 16;

    const bgGraphics = this.add.graphics();
    
    const bgColor = Phaser.Display.Color.HexStringToColor(level.unlocked ? '#16213E' : '#0f0f1a').color;
    bgGraphics.fillStyle(bgColor, level.unlocked ? 0.9 : 0.6);
    bgGraphics.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);

    const borderColor = Phaser.Display.Color.HexStringToColor(
      level.unlocked ? COLORS.primary : '#333'
    ).color;
    bgGraphics.lineStyle(2, borderColor, level.unlocked ? 0.8 : 0.4);
    bgGraphics.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);

    card.add(bgGraphics);

    const difficultyColors: Record<string, string> = {
      easy: '#2ECC71',
      medium: '#F39C12',
      hard: '#E74C3C',
    };
    const difficultyLabels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };

    const difficultyBadge = this.add.graphics();
    const diffColor = Phaser.Display.Color.HexStringToColor(difficultyColors[level.difficulty]).color;
    difficultyBadge.fillStyle(diffColor, 1);
    difficultyBadge.fillRoundedRect(-cardWidth / 2 + 16, -cardHeight / 2 + 16, 60, 24, 12);
    card.add(difficultyBadge);

    const difficultyText = this.add.text(-cardWidth / 2 + 46, -cardHeight / 2 + 28, difficultyLabels[level.difficulty], {
      fontSize: '12px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    difficultyText.setOrigin(0.5);
    card.add(difficultyText);

    const levelNum = this.add.text(0, -60, `第 ${index + 1} 关`, {
      fontSize: '16px',
      color: level.unlocked ? '#8892b0' : '#444',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    levelNum.setOrigin(0.5);
    card.add(levelNum);

    const levelName = this.add.text(0, -20, level.name.split('：')[1] || level.name, {
      fontSize: '22px',
      color: level.unlocked ? COLORS.white : '#555',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      wordWrap: { width: cardWidth - 40 },
      align: 'center',
    });
    levelName.setOrigin(0.5);
    card.add(levelName);

    const description = this.add.text(0, 30, level.description, {
      fontSize: '13px',
      color: level.unlocked ? '#8892b0' : '#444',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      wordWrap: { width: cardWidth - 40 },
      align: 'center',
    });
    description.setOrigin(0.5);
    card.add(description);

    const targetScoreLabel = this.add.text(0, 80, '目标分数', {
      fontSize: '12px',
      color: level.unlocked ? '#666' : '#333',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    targetScoreLabel.setOrigin(0.5);
    card.add(targetScoreLabel);

    const targetScore = this.add.text(0, 100, level.targetScore.toString(), {
      fontSize: '28px',
      color: level.unlocked ? COLORS.secondary : '#444',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    targetScore.setOrigin(0.5);
    card.add(targetScore);

    const starsContainer = this.add.container(0, 135);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text((i - 1) * 28, 0, '★', {
        fontSize: '24px',
        color: i < level.stars ? COLORS.secondary : '#333',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      star.setOrigin(0.5);
      starsContainer.add(star);
    }
    card.add(starsContainer);

    if (!level.unlocked) {
      const lockIcon = this.add.text(0, -40, '🔒', {
        fontSize: '48px',
        color: '#666',
      });
      lockIcon.setOrigin(0.5);
      card.add(lockIcon);
    }

    if (level.unlocked) {
      card.setSize(cardWidth, cardHeight);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => this.onCardHover(index));
      card.on('pointerout', () => this.onCardOut(index));
      card.on('pointerdown', () => {
        this.selectedLevelIndex = index;
        this.updateLevelSelection();
        this.time.delayedCall(150, () => this.selectLevel());
      });
    }

    card.setAlpha(0);
    card.setScale(0.8);
    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      duration: ANIMATION_DURATIONS.slow,
      delay: index * 100 + 300,
      ease: 'Back.easeOut',
    });

    return card;
  }

  private onCardHover(index: number): void {
    if (!this.levels[index].unlocked) return;
    
    this.tweens.add({
      targets: this.levelCards[index],
      scale: 1.05,
      duration: ANIMATION_DURATIONS.fast,
      ease: 'Sine.easeOut',
    });
  }

  private onCardOut(index: number): void {
    if (index !== this.selectedLevelIndex) {
      this.tweens.add({
        targets: this.levelCards[index],
        scale: 1,
        duration: ANIMATION_DURATIONS.fast,
        ease: 'Sine.easeOut',
      });
    }
  }

  private navigateLevels(direction: number): void {
    const unlockedLevels = this.levels.filter(l => l.unlocked);
    if (unlockedLevels.length === 0) return;

    let newIndex = this.selectedLevelIndex + direction;
    
    while (newIndex >= 0 && newIndex < this.levels.length) {
      if (this.levels[newIndex].unlocked) {
        this.selectedLevelIndex = newIndex;
        this.updateLevelSelection();
        return;
      }
      newIndex += direction;
    }
  }

  private updateLevelSelection(): void {
    this.levelCards.forEach((card, index) => {
      const isSelected = index === this.selectedLevelIndex;
      const targetScale = isSelected ? 1.08 : 1;
      const targetAlpha = isSelected ? 1 : 0.7;

      this.tweens.add({
        targets: card,
        scale: targetScale,
        alpha: targetAlpha,
        duration: ANIMATION_DURATIONS.fast,
        ease: 'Sine.easeOut',
      });
    });
  }

  private selectLevel(): void {
    const level = this.levels[this.selectedLevelIndex];
    if (!level || !level.unlocked) return;

    this.gameManager.startLevel(level.id);
    
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('SponsorScene');
    });
  }

  private createBottomButtons(): void {
    const buttonY = GAME_HEIGHT - 80;

    new Button(this, {
      x: GAME_WIDTH / 2 - 120,
      y: buttonY,
      width: 200,
      height: 50,
      text: '开始游戏',
      backgroundColor: COLORS.accent,
      hoverColor: '#2CB5A8',
      textColor: COLORS.white,
      fontSize: 18,
      radius: 25,
      onClick: () => this.selectLevel(),
    });

    new Button(this, {
      x: GAME_WIDTH / 2 + 120,
      y: buttonY,
      width: 200,
      height: 50,
      text: '游戏设置',
      backgroundColor: COLORS.darkLight,
      hoverColor: '#1a2744',
      textColor: COLORS.light,
      fontSize: 18,
      radius: 25,
      onClick: () => this.showSettings(),
    });
  }

  private showSettings(): void {
    console.log('Settings clicked');
  }
}
