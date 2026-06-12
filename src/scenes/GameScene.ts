import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { InertialScroller } from '@/utils/phaser-matter-adapter';
import { PhotoGenerator } from '@/utils/photo-generator';
import type { Point, DeviceStatus } from '@/types/game';

export class GameScene extends BaseScene {
  private pointListContainer!: Phaser.GameObjects.Container;
  private pointScroller!: InertialScroller;
  private pointCards: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentPhoto!: Phaser.GameObjects.Image;
  private photoGenerator!: PhotoGenerator;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private itemBarContainer!: Phaser.GameObjects.Container;
  private selectedPointIndex = 0;
  private keyboardNavigationEnabled = true;
  private lastEventTriggerTime = 0;
  private eventInterval = 0;
  private pausedIndicator!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    super.create();
    this.fadeIn();

    this.photoGenerator = new PhotoGenerator(600, 400);

    this.createTopBar();
    this.createPointList();
    this.createPhotoArea();
    this.createItemBar();
    this.createPausedIndicator();

    this.setupKeyboardNavigation();
    this.setupStoreSubscriptions();

    const config = this.configStore.getState();
    const diffConfig = config.difficulty[config.currentDifficulty];
    this.eventInterval = diffConfig.totalTime / (diffConfig.eventFrequency + 1);
  }

  update(time: number, delta: number): void {
    const state = this.gameStore.getState();

    if (state.phase === 'playing') {
      this.gameStore.getState().updateTimer(delta);
      this.gameStore.getState().updateItemCooldowns(delta);
      this.updateUI();

      if (state.pausedTimeRemaining > 0) {
        this.pausedIndicator.setVisible(true);
        this.pausedIndicator.setText(`⏸ 暂停中 ${Math.ceil(state.pausedTimeRemaining)}s`);
      } else {
        this.pausedIndicator.setVisible(false);
      }

      if (time - this.lastEventTriggerTime > this.eventInterval * 1000 && !state.activeEvent) {
        if (Math.random() < 0.3) {
          this.gameStore.getState().triggerEvent();
          this.lastEventTriggerTime = time;
        }
      }

      const completedPoints = state.points.filter(p => p.isCompleted).length;
      if (completedPoints === state.points.length) {
        this.gameStore.getState().endGame();
      }
    }

    if (state.phase === 'event') {
      this.scene.launch('EventScene');
      this.scene.pause();
    }

    if (state.phase === 'result') {
      this.fadeOut(300, () => {
        this.scene.start('ResultScene');
      });
    }
  }

  private createTopBar(): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(0x1A1A2E, 0.95);
    topBar.fillRect(0, 0, this.width, 80);
    topBar.lineStyle(2, 0xFF6F00, 0.5);
    topBar.lineBetween(0, 80, this.width, 80);

    this.timerText = this.add.text(60, 40, '07:00', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0, 0.5);

    const timerIcon = this.add.text(20, 40, '⏱️', {
      fontSize: '28px',
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(this.centerX, 40, '得分: 0', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#FFB088',
    }).setOrigin(0.5);

    const progressContainer = this.add.container(this.width - 220, 40);

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x3D2D2D, 1);
    progressBg.fillRoundedRect(-180, -15, 200, 30, 15);

    this.progressBar = this.add.graphics();

    const progressText = this.add.text(10, 0, '0/0', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0, 0.5);

    progressContainer.add([progressBg, this.progressBar, progressText]);

    this.add.text(30, 40, '', { fontSize: '1px' });
    this.add.text(this.width - 30, 40, '', { fontSize: '1px' });
  }

  private createPointList(): void {
    const listX = 20;
    const listY = 100;
    const listWidth = 300;
    const listHeight = this.height - 200;

    const listBg = this.add.graphics();
    listBg.fillStyle(0x2D2D2D, 0.9);
    listBg.fillRoundedRect(listX, listY, listWidth, listHeight, 12);
    listBg.lineStyle(2, 0x444444, 0.5);
    listBg.strokeRoundedRect(listX, listY, listWidth, listHeight, 12);

    const listTitle = this.add.text(listX + 20, listY + 25, '📋 点位清单', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0);

    const hintText = this.add.text(listX + 20, listY + 50, '拖拽滚动 · ↑↓导航 · Enter选择', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0);

    this.pointListContainer = this.add.container(listX, listY + 80);
    this.pointListContainer.setSize(listWidth, listHeight - 80);

    this.refreshPointList();

    const maskShape = this.make.graphics(undefined, false);
    maskShape.fillRect(listX, listY + 80, listWidth, listHeight - 80);
    const mask = maskShape.createGeometryMask();
    this.pointListContainer.setMask(mask);

    const state = this.gameStore.getState();
    const maxScrollY = Math.min(0, -(state.points.length * 80 - (listHeight - 80)));
    this.pointScroller = new InertialScroller(this, this.pointListContainer, {
      minY: 0,
      maxY: maxScrollY,
      friction: 0.93,
    });
  }

  private refreshPointList(): void {
    this.pointListContainer.removeAll(true);
    this.pointCards.clear();

    const state = this.gameStore.getState();
    const cardWidth = 260;
    const cardHeight = 70;

    state.points.forEach((point, index) => {
      const card = this.createPointCard(point, index, cardWidth, cardHeight);
      card.setPosition(20, index * 80);
      this.pointListContainer.add(card);
      this.pointCards.set(point.id, card);
    });
  }

  private createPointCard(
    point: Point,
    index: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const bg = this.add.graphics();
    const isSelected = point.id === this.gameStore.getState().currentPointId;
    const bgColor = point.isCompleted
      ? (point.isCorrect ? 0x2E4A2E : 0x4A2E2E)
      : (isSelected ? 0x4A3A2A : 0x3A3A3A);

    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(0, 0, width, height, 8);

    if (isSelected && !point.isCompleted) {
      bg.lineStyle(3, 0xFF6F00, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    }

    const statusColor = this.getStatusColor(point.status);
    const statusDot = this.add.circle(20, height / 2, 8, statusColor, 1);

    if (point.isCompleted) {
      const checkIcon = this.add.text(15, height / 2, point.isCorrect ? '✓' : '✗', {
        fontSize: '16px',
        color: point.isCorrect ? '#4CAF50' : '#D32F2F',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      statusDot.setAlpha(0.3);
      container.add(checkIcon);
    }

    const nameText = this.add.text(40, 12, point.name, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: point.isCompleted ? '#888888' : '#FFFFFF',
    }).setOrigin(0);

    const storeText = this.add.text(40, 32, `🏪 ${point.storeName}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: point.isCompleted ? '#666666' : '#AAAAAA',
    }).setOrigin(0);

    const deviceText = this.add.text(40, 50, `⚙️ ${point.deviceType}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: point.isCompleted ? '#666666' : '#888888',
    }).setOrigin(0);

    container.add([bg, statusDot, nameText, storeText, deviceText]);

    if (!point.isCompleted) {
      container.setSize(width, height);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x5A4A3A, 0.95);
        bg.fillRoundedRect(0, 0, width, height, 8);
        if (isSelected) {
          bg.lineStyle(3, 0xFF6F00, 1);
          bg.strokeRoundedRect(0, 0, width, height, 8);
        }
      });

      container.on('pointerout', () => {
        const currentIsSelected = point.id === this.gameStore.getState().currentPointId;
        bg.clear();
        bg.fillStyle(currentIsSelected ? 0x4A3A2A : 0x3A3A3A, 0.9);
        bg.fillRoundedRect(0, 0, width, height, 8);
        if (currentIsSelected) {
          bg.lineStyle(3, 0xFF6F00, 1);
          bg.strokeRoundedRect(0, 0, width, height, 8);
        }
      });

      container.on('pointerdown', () => {
        this.playSound('click');
        this.selectPoint(index);
      });
    }

    container.setData('pointId', point.id);
    container.setData('index', index);
    container.setData('bg', bg);

    return container;
  }

  private selectPoint(index: number): void {
    const state = this.gameStore.getState();
    if (index < 0 || index >= state.points.length) return;

    const point = state.points[index];
    if (point.isCompleted) return;

    this.selectedPointIndex = index;
    this.gameStore.getState().selectPoint(point.id);
    this.refreshPointList();
    this.updatePhoto();

    const cardHeight = 80;
    const listHeight = this.height - 280;
    const scrollY = Math.max(
      Math.min(0, -(index * cardHeight - listHeight / 2 + cardHeight / 2)),
      -(state.points.length * cardHeight - listHeight)
    );
    this.pointScroller.scrollTo(scrollY, true);
  }

  private createPhotoArea(): void {
    const photoX = 340;
    const photoY = 100;
    const photoWidth = 600;
    const photoHeight = 400;

    const frameBg = this.add.graphics();
    frameBg.fillStyle(0x1A1A1A, 1);
    frameBg.fillRoundedRect(photoX, photoY, photoWidth, photoHeight, 12);
    frameBg.lineStyle(3, 0x444444, 1);
    frameBg.strokeRoundedRect(photoX, photoY, photoWidth, photoHeight, 12);

    const state = this.gameStore.getState();
    const currentPoint = state.points.find(p => p.id === state.currentPointId);

    let photoDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmQyZDJkIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+566h55CG5aSn5Lic5qC85Zu+54mHPC90ZXh0Pjwvc3ZnPg==';

    if (currentPoint) {
      photoDataUrl = PhotoGenerator.generatePlaceholder(
        currentPoint.status,
        currentPoint.deviceType,
        currentPoint.faultType
      );
    }

    this.currentPhoto = this.add.image(photoX + photoWidth / 2, photoY + photoHeight / 2, '');
    this.load.image('currentPhoto', photoDataUrl);
    this.load.once('complete', () => {
      this.currentPhoto.setTexture('currentPhoto');
      this.currentPhoto.setDisplaySize(photoWidth - 20, photoHeight - 20);
    });
    this.load.start();

    const scanline = this.add.graphics();
    scanline.fillStyle(0xFFFFFF, 0.03);
    scanline.fillRect(photoX + 10, photoY + 10, photoWidth - 20, 2);

    this.tweens.add({
      targets: scanline,
      y: photoHeight - 20,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const photoLabel = this.add.text(photoX + 20, photoY + photoHeight - 30, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0);

    if (currentPoint) {
      photoLabel.setText(`📷 ${currentPoint.name} - ${currentPoint.storeName}`);
    }

    this.createDecisionButtons(photoX, photoY + photoHeight + 20);
  }

  private updatePhoto(): void {
    const state = this.gameStore.getState();
    const currentPoint = state.points.find(p => p.id === state.currentPointId);

    if (currentPoint && this.currentPhoto) {
      const photoDataUrl = PhotoGenerator.generatePlaceholder(
        currentPoint.status,
        currentPoint.deviceType,
        currentPoint.faultType
      );

      this.textures.remove('currentPhoto');
      this.load.image('currentPhoto', photoDataUrl);
      this.load.once('complete', () => {
        this.currentPhoto.setTexture('currentPhoto');
      });
      this.load.start();

      const photoLabel = this.children.list.find(c =>
        c instanceof Phaser.GameObjects.Text && c.text.includes('📷')
      ) as Phaser.GameObjects.Text;
      if (photoLabel) {
        photoLabel.setText(`📷 ${currentPoint.name} - ${currentPoint.storeName}`);
      }
    }
  }

  private createDecisionButtons(x: number, y: number): void {
    const buttonWidth = 180;
    const buttonHeight = 60;
    const spacing = 30;
    const startX = x + (600 - (buttonWidth * 3 + spacing * 2)) / 2;

    const decisions: { status: DeviceStatus; label: string; icon: string; color: number; hoverColor: number }[] = [
      { status: 'normal', label: '正常', icon: '✅', color: 0x4CAF50, hoverColor: 0x66BB6A },
      { status: 'need_clean', label: '需清洁', icon: '🧹', color: 0xFF9800, hoverColor: 0xFFB74D },
      { status: 'fault', label: '故障', icon: '🔧', color: 0xD32F2F, hoverColor: 0xEF5350 },
    ];

    decisions.forEach((decision, index) => {
      const btnX = startX + index * (buttonWidth + spacing) + buttonWidth / 2;
      const button = this.addButton(
        btnX,
        y + buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        `${decision.icon} ${decision.label}`,
        () => {
          this.makeDecision(decision.status);
        },
        {
          bgColor: decision.color,
          hoverColor: decision.hoverColor,
          textColor: '#FFFFFF',
        }
      );

      const hintKey = `hint_${decision.status}`;
      button.setName(hintKey);
    });

    const hintText = this.add.text(
      x + 300,
      y + buttonHeight + 30,
      '快捷键: 1=正常 · 2=需清洁 · 3=故障',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#666666',
      }
    ).setOrigin(0.5);

    this.add.text(x, y, '', { fontSize: '1px' });
    this.add.text(x + 600, y + buttonHeight + 60, '', { fontSize: '1px' });
  }

  private makeDecision(decision: DeviceStatus): void {
    const state = this.gameStore.getState();
    const currentPoint = state.points.find(p => p.id === state.currentPointId);
    if (!currentPoint || currentPoint.isCompleted) return;

    const isCorrect = decision === currentPoint.status;

    if (isCorrect) {
      this.playSound('success');
      this.addParticles(this.centerX, this.centerY, 0x4CAF50, 30);
    } else {
      this.playSound('error');
      this.shake(200, 0.005);
    }

    this.gameStore.getState().makeDecision(currentPoint.id, decision);

    this.time.delayedCall(500, () => {
      const updatedState = this.gameStore.getState();
      const allCompleted = updatedState.points.every(p => p.isCompleted);

      if (allCompleted) {
        this.gameStore.getState().endGame();
      } else {
        const nextIndex = this.findNextIncompletePoint();
        if (nextIndex >= 0) {
          this.selectPoint(nextIndex);
        }
      }
    });

    this.updateUI();
  }

  private findNextIncompletePoint(): number {
    const state = this.gameStore.getState();
    const nextIndex = state.points.findIndex((p, i) => i > this.selectedPointIndex && !p.isCompleted);
    if (nextIndex >= 0) return nextIndex;
    return state.points.findIndex(p => !p.isCompleted);
  }

  private createItemBar(): void {
    const barY = this.height - 70;
    const barHeight = 60;

    this.itemBarContainer = this.add.container(this.centerX, barY + barHeight / 2);

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1A1A2E, 0.95);
    barBg.fillRoundedRect(-this.width / 2 + 20, -barHeight / 2, this.width - 40, barHeight, 12);
    barBg.lineStyle(2, 0x444444, 0.5);
    barBg.strokeRoundedRect(-this.width / 2 + 20, -barHeight / 2, this.width - 40, barHeight, 12);

    this.itemBarContainer.add(barBg);

    this.refreshItemBar();
  }

  private refreshItemBar(): void {
    const state = this.gameStore.getState();
    const items = state.items;
    const itemWidth = 120;
    const itemHeight = 50;
    const spacing = 20;
    const totalWidth = items.length * itemWidth + (items.length - 1) * spacing;
    const startX = -totalWidth / 2 + itemWidth / 2;

    const existingItems = this.itemBarContainer.list.filter(c => c.name?.startsWith('item_'));
    existingItems.forEach(item => item.destroy());

    items.forEach((item, index) => {
      const itemX = startX + index * (itemWidth + spacing);
      const isOnCooldown = item.currentCooldown > 0;

      const container = this.add.container(itemX, 0);
      container.setName(`item_${item.id}`);

      const bg = this.add.graphics();
      bg.fillStyle(isOnCooldown ? 0x444444 : 0x3D3D3D, 0.9);
      bg.fillRoundedRect(-itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight, 8);

      if (!isOnCooldown) {
        bg.lineStyle(2, 0xFF6F00, 0.5);
        bg.strokeRoundedRect(-itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight, 8);
      }

      const icon = this.add.text(-itemWidth / 2 + 15, 0, item.icon, {
        fontSize: '24px',
      }).setOrigin(0, 0.5);

      const name = this.add.text(-itemWidth / 2 + 50, -8, item.name, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: isOnCooldown ? '#666666' : '#FFFFFF',
      }).setOrigin(0);

      const hotkey = this.add.text(-itemWidth / 2 + 50, 12, `[${index + 1}]`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#888888',
      }).setOrigin(0);

      container.add([bg, icon, name, hotkey]);

      if (isOnCooldown) {
        const cooldownBg = this.add.graphics();
        cooldownBg.fillStyle(0x000000, 0.7);
        cooldownBg.fillRoundedRect(-itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight, 8);

        const cooldownText = this.add.text(0, 0, `${Math.ceil(item.currentCooldown)}s`, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#FFFFFF',
        }).setOrigin(0.5);

        container.add([cooldownBg, cooldownText]);
      } else {
        container.setSize(itemWidth, itemHeight);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', () => {
          this.playSound('click');
          this.gameStore.getState().useItem(item.id);
        });
      }

      this.itemBarContainer.add(container);
    });
  }

  private createPausedIndicator(): void {
    this.pausedIndicator = this.add.text(this.centerX, 120, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FF6F00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setVisible(false);
  }

  private setupKeyboardNavigation(): void {
    const canOperate = () => {
      const state = this.gameStore.getState();
      return state.phase === 'playing' || state.phase === 'inspecting';
    };

    this.input.keyboard!.on('keydown-UP', () => {
      if (!this.keyboardNavigationEnabled || !canOperate()) return;
      const state = this.gameStore.getState();

      let newIndex = this.selectedPointIndex - 1;
      while (newIndex >= 0 && state.points[newIndex]?.isCompleted) {
        newIndex--;
      }
      if (newIndex >= 0) {
        this.playSound('click');
        this.selectPoint(newIndex);
        if (state.phase === 'inspecting') {
          this.gameStore.getState().setPhase('playing');
        }
      }
    });

    this.input.keyboard!.on('keydown-DOWN', () => {
      if (!this.keyboardNavigationEnabled || !canOperate()) return;
      const state = this.gameStore.getState();

      let newIndex = this.selectedPointIndex + 1;
      while (newIndex < state.points.length && state.points[newIndex]?.isCompleted) {
        newIndex++;
      }
      if (newIndex < state.points.length) {
        this.playSound('click');
        this.selectPoint(newIndex);
        if (state.phase === 'inspecting') {
          this.gameStore.getState().setPhase('playing');
        }
      }
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      const state = this.gameStore.getState();
      if (!canOperate()) return;

      const currentPoint = state.points.find(p => p.id === state.currentPointId);
      if (currentPoint && !currentPoint.isCompleted) {
        if (state.phase === 'playing') {
          this.gameStore.getState().setPhase('inspecting');
          this.playSound('click');
          this.highlightSelectedPoint();
        }
      }
    });

    this.input.keyboard!.on('keydown-ONE', () => {
      if (!canOperate()) return;
      this.makeDecision('normal');
    });

    this.input.keyboard!.on('keydown-TWO', () => {
      if (!canOperate()) return;
      this.makeDecision('need_clean');
    });

    this.input.keyboard!.on('keydown-THREE', () => {
      if (!canOperate()) return;
      this.makeDecision('fault');
    });

    this.input.keyboard!.on('keydown-Q', () => {
      const state = this.gameStore.getState();
      if (canOperate() && state.items[0]?.currentCooldown === 0) {
        this.gameStore.getState().useItem(state.items[0].id);
      }
    });

    this.input.keyboard!.on('keydown-W', () => {
      const state = this.gameStore.getState();
      if (canOperate() && state.items[1]?.currentCooldown === 0) {
        this.gameStore.getState().useItem(state.items[1].id);
      }
    });

    this.input.keyboard!.on('keydown-E', () => {
      const state = this.gameStore.getState();
      if (canOperate() && state.items[2]?.currentCooldown === 0) {
        this.gameStore.getState().useItem(state.items[2].id);
      }
    });

    this.input.keyboard!.on('keydown-R', () => {
      const state = this.gameStore.getState();
      if (canOperate() && state.items[3]?.currentCooldown === 0) {
        this.gameStore.getState().useItem(state.items[3].id);
      }
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      const state = this.gameStore.getState();
      if (state.phase === 'playing' || state.phase === 'inspecting') {
        this.gameStore.getState().pauseGame();
      } else if (state.phase === 'paused') {
        this.gameStore.getState().resumeGame();
      }
    });
  }

  private highlightSelectedPoint(): void {
    const state = this.gameStore.getState();
    const currentPoint = state.points.find(p => p.id === state.currentPointId);
    if (!currentPoint) return;

    const card = this.pointCards.get(currentPoint.id);
    if (card) {
      this.tweens.add({
        targets: card,
        scale: 1.03,
        duration: 150,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.InOut',
      });
    }
  }

  private setupStoreSubscriptions(): void {
    this.gameStore.subscribe((state) => {
      if (state.phase === 'playing') {
        this.refreshPointList();
        this.refreshItemBar();
      }

      if (state.hintedPointId) {
        const currentPoint = state.points.find(p => p.id === state.hintedPointId);
        if (currentPoint) {
          this.highlightCorrectDecision(currentPoint.status);
        }
      }
    });
  }

  private highlightCorrectDecision(status: DeviceStatus): void {
    const hintKey = `hint_${status}`;
    const button = this.children.list.find(c => c.name === hintKey) as Phaser.GameObjects.Container;
    if (button) {
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 300,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.InOut',
      });

      const glow = this.add.graphics();
      glow.fillStyle(0xFFD700, 0.3);
      glow.fillRoundedRect(button.x - 100, button.y - 35, 200, 70, 12);

      this.tweens.add({
        targets: glow,
        alpha: 0,
        duration: 1500,
        onComplete: () => glow.destroy(),
      });
    }
  }

  private updateUI(): void {
    const state = this.gameStore.getState();

    this.timerText.setText(this.formatTime(state.timeRemaining));

    if (state.timeRemaining < 60) {
      this.timerText.setColor('#D32F2F');
    } else if (state.timeRemaining < 120) {
      this.timerText.setColor('#FF9800');
    } else {
      this.timerText.setColor('#FFFFFF');
    }

    this.scoreText.setText(`得分: ${state.score}`);

    const completedPoints = state.points.filter(p => p.isCompleted).length;
    const totalPoints = state.points.length;
    const progress = totalPoints > 0 ? completedPoints / totalPoints : 0;

    this.progressBar.clear();
    this.progressBar.fillStyle(0xFF6F00, 1);
    this.progressBar.fillRoundedRect(-178, -13, 196 * progress, 26, 13);

    const progressText = this.itemBarContainer?.parentContainer?.list.find(c =>
      c instanceof Phaser.GameObjects.Text && /\d+\s*\/\s*\d+/.test(c.text)
    ) as Phaser.GameObjects.Text;
    if (progressText) {
      progressText.setText(`${completedPoints}/${totalPoints}`);
    }

    const progressText2 = this.children.list.find(c =>
      c instanceof Phaser.GameObjects.Text && /\d+\s*\/\s*\d+/.test(c.text) && c.y < 100
    ) as Phaser.GameObjects.Text;
    if (progressText2) {
      progressText2.setText(`${completedPoints}/${totalPoints}`);
    }
  }
}
