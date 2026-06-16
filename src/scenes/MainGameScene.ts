import Phaser from 'phaser';
import Matter from 'matter-js';
import type { Level, GameState, GameResult, ShelfCell, Medicine, PlacementResult } from '@/types/game';
import { SCENE_KEYS } from '@/types/game';
import { getMedicineById } from '@/data/medicines';
import { ShelfGrid } from '@/game/ShelfGrid';
import { DisplayCard } from '@/game/DisplayCard';
import { PromotionRuleEngine } from '@/game/PromotionRuleEngine';
import { ScoreCalculator } from '@/game/ScoreCalculator';
import { useGameStateStore } from '@/store/useGameStateStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { audioUtils } from '@/utils/audio';
import { vibrationUtils } from '@/utils/vibration';
import { GAME_CONFIG } from '@/game/GameConfig';

interface PhaserCard {
  id: string;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Text;
  name: Phaser.GameObjects.Text;
  category: Phaser.GameObjects.Text;
  displayCard: DisplayCard;
  isDragging: boolean;
  isPlaced: boolean;
  body?: Matter.Body;
}

interface PhaserCell {
  row: number;
  col: number;
  rect: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  cell: ShelfCell;
}

export class MainGameScene extends Phaser.Scene {
  private level!: Level;
  private shelfGrid!: ShelfGrid;
  private ruleEngine!: PromotionRuleEngine;
  private phaserCards: PhaserCard[] = [];
  private phaserCells: PhaserCell[][] = [];
  private gameState!: GameState;

  private engine!: Matter.Engine;
  private runner!: Matter.Runner;

  private topBarBg!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private comboBadge!: Phaser.GameObjects.Container;
  private comboText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Rectangle;
  private homeButton!: Phaser.GameObjects.Rectangle;
  private backText!: Phaser.GameObjects.Text;
  private pauseIcon!: Phaser.GameObjects.Text;
  private levelNameText!: Phaser.GameObjects.Text;

  private promoBannerBg!: Phaser.GameObjects.Rectangle;
  private promoRuleContainers: Phaser.GameObjects.Container[] = [];

  private feedbackContainer!: Phaser.GameObjects.Container;
  private feedbackText!: Phaser.GameObjects.Text;
  private feedbackBg!: Phaser.GameObjects.Graphics;
  private floatingScores: { id: number; text: Phaser.GameObjects.Text; createdAt: number }[] = [];
  private floatingScoreId = 0;

  private isPaused = false;
  private isGameOver = false;
  private selectedCardIndex = -1;
  private keyboardFocusCell: { row: number; col: number } | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private currentDragCard: PhaserCard | null = null;

  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private cleanupCallbacks: Array<() => void> = [];

  private onGameEndCallback: ((result: GameResult) => void) | null = null;
  private onExitCallback: (() => void) | null = null;

  constructor() {
    super(SCENE_KEYS.Game);
  }

  init(data: { level: Level; onGameEnd: (result: GameResult) => void; onExit: () => void }): void {
    if (data && data.level) {
      this.level = data.level;
      this.onGameEndCallback = data.onGameEnd;
      this.onExitCallback = data.onExit;
    } else {
      console.error('MainGameScene init: Invalid data received', data);
    }
  }

  preload(): void {}

  create(): void {
    if (!this.level) {
      console.error('MainGameScene create: Level is undefined');
      this.onExitCallback?.();
      return;
    }

    const { initGameState } = useGameStateStore.getState();
    initGameState(this.level);
    const { gameState } = useGameStateStore.getState();
    if (!gameState) {
      console.error('MainGameScene create: GameState initialization failed');
      this.onExitCallback?.();
      return;
    }
    this.gameState = gameState;

    this.shelfGrid = new ShelfGrid(
      this.level,
      GAME_CONFIG.SHELF_START_X,
      GAME_CONFIG.SHELF_START_Y,
      GAME_CONFIG.CELL_WIDTH,
      GAME_CONFIG.CELL_HEIGHT
    );
    this.ruleEngine = new PromotionRuleEngine(this.level.promotionRules);

    this.initPhysics();
    this.createUI();
    this.createShelfGrid();
    this.createDisplayCards();
    this.setupInputHandlers();
    this.setupKeyboard();
    this.startGameTimer();

    this.events.on('shutdown', this.cleanup, this);
    this.events.on('destroy', this.cleanup, this);
  }

  private initPhysics(): void {
    this.engine = Matter.Engine.create();
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    this.shelfGrid.getFlatCells().forEach((cell) => {
      const sensor = Matter.Bodies.rectangle(
        cell.x + cell.width / 2,
        cell.y + cell.height / 2,
        cell.width,
        cell.height,
        { isStatic: true, isSensor: true, label: `sensor-${cell.row}-${cell.col}` }
      );
      Matter.World.add(this.engine.world, sensor);
    });
  }

  private createUI(): void {
    const { width, height } = this.cameras.main;

    this.topBarBg = this.add.rectangle(0, 0, width, 70, 0xffffff, 0.95).setOrigin(0, 0).setDepth(100);
    this.topBarBg.setStrokeStyle(1, 0xe0e0e0);

    this.homeButton = this.add.rectangle(50, 35, 80, 40, 0xf0f0f0, 0).setDepth(101).setInteractive({ useHandCursor: true });
    this.backText = this.add.text(50, 35, '← 返回', {
      fontFamily: 'Noto Sans SC',
      fontSize: '16px',
      color: '#555555',
    }).setOrigin(0.5).setDepth(102);

    this.levelNameText = this.add.text(160, 35, this.level.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color: '#333333',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(102);

    this.timerText = this.add.text(width / 2 + 80, 35, '2:00', {
      fontFamily: 'Noto Sans SC',
      fontSize: '28px',
      color: '#1E88E5',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(102);

    this.scoreText = this.add.text(width / 2 + 200, 35, '0', {
      fontFamily: 'Noto Sans SC',
      fontSize: '24px',
      color: '#1E88E5',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(102);
    this.add.text(width / 2 + 200, 50, '得分', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0, 0.5).setDepth(102);

    this.comboBadge = this.add.container(width / 2 + 280, 35).setDepth(102).setVisible(false);
    const comboBg = this.createRoundedRect(0, 0, 80, 30, 15, 0xFFA000, 0.9);
    this.comboText = this.add.text(0, 0, '🔥 2 连击', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.comboBadge.add([comboBg, this.comboText]);

    this.pauseButton = this.add.rectangle(width - 40, 35, 40, 40, 0xf0f0f0).setDepth(101).setInteractive({ useHandCursor: true });
    this.pauseIcon = this.add.text(width - 40, 35, '⏸', {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color: '#555555',
    }).setOrigin(0.5).setDepth(102);

    this.promoBannerBg = this.add.rectangle(0, 70, width, 45, 0xfff8e1, 0.95).setOrigin(0, 0).setDepth(99);
    this.promoBannerBg.setStrokeStyle(1, 0xffe082);

    const rules = this.ruleEngine.getRules();
    let xOffset = 30;
    rules.forEach((rule, index) => {
      const container = this.add.container(xOffset, 92).setDepth(100);
      const bg = this.createRoundedRect(0, 0, 180, 30, 15, 0xffffff, 1, 0xe0e0e0, 1);
      const iconText = this.add.text(-75, 0, rule.icon, { fontSize: '18px' }).setOrigin(0, 0.5);
      const descText = this.add.text(-50, 0, rule.description.length > 10 ? rule.description.slice(0, 10) + '...' : rule.description, {
        fontFamily: 'Noto Sans SC',
        fontSize: '13px',
        color: '#555555',
      }).setOrigin(0, 0.5);
      const pointsText = this.add.text(65, 0, `+${rule.points}`, {
        fontFamily: 'Noto Sans SC',
        fontSize: '12px',
        color: '#FFA000',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      container.add([bg, iconText, descText, pointsText]);
      this.promoRuleContainers.push(container);
      xOffset += 200;
    });

    this.feedbackContainer = this.add.container(width / 2, height / 2).setDepth(200).setVisible(false);
    this.feedbackBg = this.createRoundedRect(0, 0, 200, 70, 12, 0x43A047, 1);
    this.feedbackText = this.add.text(0, 0, '正确！', {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.feedbackContainer.add([this.feedbackBg, this.feedbackText]);

    this.homeButton.on('pointerdown', () => {
      audioUtils.playClick();
      vibrationUtils.click();
      this.cleanup();
      this.onExitCallback?.();
    });

    this.pauseButton.on('pointerdown', () => {
      audioUtils.playClick();
      vibrationUtils.click();
      this.togglePause();
    });
  }

  private createShelfGrid(): void {
    const cells = this.shelfGrid.getCells();
    this.phaserCells = [];

    cells.forEach((row, rowIndex) => {
      this.phaserCells[rowIndex] = [];
      row.forEach((cell, colIndex) => {
        const rect = this.add.rectangle(
          cell.x + cell.width / 2,
          cell.y + cell.height / 2,
          cell.width,
          cell.height,
          0xd7ccc8,
          0.5
        ).setOrigin(0.5).setStrokeStyle(2, 0x8d6e63).setDepth(1);

        const highlight = this.add.rectangle(
          cell.x + cell.width / 2,
          cell.y + cell.height / 2,
          cell.width - 4,
          cell.height - 4,
          0x1E88E5,
          0
        ).setOrigin(0.5).setDepth(2).setVisible(false);

        this.phaserCells[rowIndex][colIndex] = {
          row: rowIndex,
          col: colIndex,
          rect,
          highlight,
          cell,
        };
      });
    });
  }

  private createDisplayCards(): void {
    const startX = GAME_CONFIG.CARD_AREA_X;
    const startY = GAME_CONFIG.CARD_AREA_Y;
    const cardWidth = GAME_CONFIG.CARD_WIDTH;
    const cardHeight = GAME_CONFIG.CARD_HEIGHT;
    const gap = GAME_CONFIG.CARD_GAP;
    const cardsPerRow = 3;

    this.level.medicines.forEach((medId, index) => {
      const medicine = getMedicineById(medId);
      if (!medicine) return;

      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      const displayCard = new DisplayCard(`card-${index}`, medicine, x, y, cardWidth, cardHeight);
      this.createPhaserCard(displayCard, medicine, x, y, cardWidth, cardHeight);
    });
  }

  private createPhaserCard(
    displayCard: DisplayCard,
    medicine: Medicine,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const container = this.add.container(centerX, centerY).setDepth(10);

    const colorHex = Phaser.Display.Color.HexStringToColor(medicine.color).color;
    const background = this.add.rectangle(0, 0, width, height, 0xffffff).setOrigin(0.5);
    background.setStrokeStyle(2, colorHex);
    background.setFillStyle(0xffffff, 1);

    const icon = this.add.text(0, -18, medicine.icon, {
      fontSize: '32px',
    }).setOrigin(0.5);

    const name = this.add.text(0, 8, medicine.name.length > 6 ? medicine.name.slice(0, 6) + '...' : medicine.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#333333',
      fontStyle: '500',
    }).setOrigin(0.5);

    const category = this.add.text(0, 25, medicine.category, {
      fontFamily: 'Noto Sans SC',
      fontSize: '10px',
      color: '#888888',
    }).setOrigin(0.5);

    container.add([background, icon, name, category]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true, draggable: true });

    const body = Matter.Bodies.rectangle(centerX, centerY, width, height, {
      label: displayCard.getId(),
      friction: 0.1,
      frictionAir: 0.1,
    });
    Matter.World.add(this.engine.world, body);

    this.phaserCards.push({
      id: displayCard.getId(),
      container,
      background,
      icon,
      name,
      category,
      displayCard,
      isDragging: false,
      isPlaced: false,
      body,
    });
  }

  private setupInputHandlers(): void {
    this.phaserCards.forEach((phaserCard) => {
      phaserCard.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.isPaused || phaserCard.isPlaced) return;
        this.startDrag(phaserCard, pointer);
      });
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.currentDragCard) {
        this.updateDrag(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.currentDragCard) {
        this.endDrag(pointer);
      }
    });
  }

  private startDrag(card: PhaserCard, pointer: Phaser.Input.Pointer): void {
    card.isDragging = true;
    this.currentDragCard = card;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.dragOffsetX = pointer.x - card.container.x;
    this.dragOffsetY = pointer.y - card.container.y;
    card.container.setDepth(50);
    card.container.setScale(1.05);
    card.background.setAlpha(0.85);

    this.selectedCardIndex = this.phaserCards.indexOf(card);
    this.phaserCards.forEach((c) => {
      c.background.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.displayCard.getMedicine().color).color);
    });
    card.background.setStrokeStyle(4, 0x1E88E5);
  }

  private updateDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.currentDragCard) return;

    const newX = pointer.x - this.dragOffsetX;
    const newY = pointer.y - this.dragOffsetY;

    this.currentDragCard.container.setPosition(newX, newY);
    this.currentDragCard.displayCard.setPosition(newX - GAME_CONFIG.CARD_WIDTH / 2, newY - GAME_CONFIG.CARD_HEIGHT / 2);

    if (this.currentDragCard.body) {
      Matter.Body.setPosition(this.currentDragCard.body, { x: newX, y: newY });
    }

    const nearest = this.shelfGrid.getNearestCell(newX, newY);
    this.highlightAllCells(false);
    if (nearest && !nearest.occupiedBy) {
      this.highlightCell(nearest.row, nearest.col, true);
    }
  }

  private endDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.currentDragCard) return;

    const card = this.currentDragCard;
    card.isDragging = false;
    card.container.setDepth(10);
    card.container.setScale(1);
    card.background.setAlpha(1);

    const nearest = this.shelfGrid.getNearestCell(card.container.x, card.container.y);
    this.highlightAllCells(false);

    if (nearest && !nearest.occupiedBy) {
      this.handlePlacement(card, nearest);
    } else {
      const originalPos = card.displayCard.getOriginalPosition();
      card.container.setPosition(
        originalPos.x + GAME_CONFIG.CARD_WIDTH / 2,
        originalPos.y + GAME_CONFIG.CARD_HEIGHT / 2
      );
      card.displayCard.resetPosition();
      if (card.body) {
        Matter.Body.setPosition(card.body, {
          x: originalPos.x + GAME_CONFIG.CARD_WIDTH / 2,
          y: originalPos.y + GAME_CONFIG.CARD_HEIGHT / 2,
        });
      }
    }

    card.background.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(card.displayCard.getMedicine().color).color);
    this.currentDragCard = null;
  }

  private setupKeyboard(): void {
    const keyObj = this.input.keyboard!.addKey('Tab');
    keyObj.on('down', (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.isPaused) return;
      this.handleTab(e.shiftKey);
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.togglePause();
    });

    this.input.keyboard!.on('keydown-SPACE', (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.isPaused) {
        this.togglePause();
        return;
      }
      if (this.selectedCardIndex >= 0 && this.keyboardFocusCell) {
        this.confirmKeyboardPlacement();
      }
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      if (this.isPaused) return;
      if (this.selectedCardIndex >= 0 && this.keyboardFocusCell) {
        this.confirmKeyboardPlacement();
      }
    });

    this.input.keyboard!.on('keydown-UP', (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.isPaused) return;
      this.moveKeyboardFocus(-1, 0);
    });

    this.input.keyboard!.on('keydown-DOWN', (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.isPaused) return;
      this.moveKeyboardFocus(1, 0);
    });

    this.input.keyboard!.on('keydown-LEFT', (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.isPaused) return;
      this.moveKeyboardFocus(0, -1);
    });

    this.input.keyboard!.on('keydown-RIGHT', (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.isPaused) return;
      this.moveKeyboardFocus(0, 1);
    });
  }

  private handleTab(shift: boolean): void {
    const availableCards = this.phaserCards.filter((c) => !c.isPlaced);
    if (availableCards.length === 0) return;

    let nextIndex: number;
    if (this.selectedCardIndex < 0) {
      nextIndex = this.phaserCards.indexOf(availableCards[0]);
    } else {
      const currentCard = this.phaserCards[this.selectedCardIndex];
      const currentAvailableIndex = availableCards.indexOf(currentCard);
      if (shift) {
        nextIndex = this.phaserCards.indexOf(
          availableCards[currentAvailableIndex <= 0 ? availableCards.length - 1 : currentAvailableIndex - 1]
        );
      } else {
        nextIndex = this.phaserCards.indexOf(
          availableCards[currentAvailableIndex >= availableCards.length - 1 ? 0 : currentAvailableIndex + 1]
        );
      }
    }

    this.selectCard(nextIndex);
    if (!this.keyboardFocusCell) {
      this.keyboardFocusCell = { row: 0, col: 0 };
    }
  }

  private selectCard(index: number): void {
    this.phaserCards.forEach((c) => {
      c.background.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.displayCard.getMedicine().color).color);
    });
    this.selectedCardIndex = index;
    if (index >= 0 && this.phaserCards[index]) {
      this.phaserCards[index].background.setStrokeStyle(4, 0x1E88E5);
    }
  }

  private moveKeyboardFocus(rowDelta: number, colDelta: number): void {
    if (!this.keyboardFocusCell) {
      this.keyboardFocusCell = { row: 0, col: 0 };
      return;
    }

    let { row, col } = this.keyboardFocusCell;
    row = Math.max(0, Math.min(this.shelfGrid.getRows() - 1, row + rowDelta));
    col = Math.max(0, Math.min(this.shelfGrid.getCols() - 1, col + colDelta));
    this.keyboardFocusCell = { row, col };

    this.highlightAllCells(false);
    this.highlightCell(row, col, true);

    if (this.selectedCardIndex >= 0 && this.phaserCards[this.selectedCardIndex]) {
      const card = this.phaserCards[this.selectedCardIndex];
      const cell = this.shelfGrid.getCell(row, col);
      if (cell) {
        const targetX = cell.x + (cell.width - card.displayCard.getWidth()) / 2 + GAME_CONFIG.CARD_WIDTH / 2;
        const targetY = cell.y + (cell.height - card.displayCard.getHeight()) / 2 + GAME_CONFIG.CARD_HEIGHT / 2;
        card.container.setPosition(targetX, targetY);
        card.displayCard.setPosition(targetX - GAME_CONFIG.CARD_WIDTH / 2, targetY - GAME_CONFIG.CARD_HEIGHT / 2);
        if (card.body) {
          Matter.Body.setPosition(card.body, { x: targetX, y: targetY });
        }
      }
    }
  }

  private confirmKeyboardPlacement(): void {
    if (this.selectedCardIndex < 0 || !this.keyboardFocusCell) return;
    const card = this.phaserCards[this.selectedCardIndex];
    const cell = this.shelfGrid.getCell(this.keyboardFocusCell.row, this.keyboardFocusCell.col);
    if (card && cell && !cell.occupiedBy) {
      this.handlePlacement(card, cell);
      this.selectedCardIndex = -1;
      this.keyboardFocusCell = null;
      this.highlightAllCells(false);
    }
  }

  private highlightAllCells(highlighted: boolean): void {
    this.phaserCells.forEach((row) => {
      row.forEach((phaserCell) => {
        phaserCell.highlight.setVisible(highlighted);
        phaserCell.cell.isHighlighted = highlighted;
      });
    });
  }

  private highlightCell(row: number, col: number, highlighted: boolean): void {
    if (this.phaserCells[row] && this.phaserCells[row][col]) {
      this.phaserCells[row][col].highlight.setVisible(highlighted);
      this.phaserCells[row][col].highlight.setFillStyle(0x1E88E5, highlighted ? 0.2 : 0);
      this.phaserCells[row][col].cell.isHighlighted = highlighted;
    }
  }

  private startGameTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private tickTimer(): void {
    if (this.isPaused || this.isGameOver) return;

    const { updateGameState, gameState } = useGameStateStore.getState();
    if (!gameState) return;

    const newTimeRemaining = Math.max(0, gameState.timeRemaining - 1);

    if (newTimeRemaining <= 10 && newTimeRemaining > 0) {
      audioUtils.playCountdown();
      this.timerText.setColor('#E53935');
    }

    if (newTimeRemaining <= 0) {
      updateGameState({
        timeRemaining: 0,
        isGameOver: true,
      });
      this.updateTimerDisplay(0);
      this.time.delayedCall(300, () => {
        this.endGame('timeout');
      });
    } else {
      updateGameState({ timeRemaining: newTimeRemaining });
      this.updateTimerDisplay(newTimeRemaining);
    }
  }

  private updateTimerDisplay(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
  }

  private handlePlacement(card: PhaserCard, cell: ShelfCell): void {
    const { gameState, updateGameState } = useGameStateStore.getState();
    if (!gameState) return;

    const result = this.ruleEngine.checkPlacement(
      card.displayCard.getMedicine(),
      cell,
      this.shelfGrid.getCells()
    );

    const now = Date.now();
    const placementTime = now - gameState.lastPlacementTime;
    const newCombo = result.isCorrect ? gameState.combo + 1 : 0;
    const newMaxCombo = Math.max(gameState.maxCombo, newCombo);
    const newScore = Math.max(0, gameState.score + result.points);
    const newErrors = result.isCorrect ? gameState.errors : gameState.errors + 1;
    const newTotalPlacements = gameState.totalPlacements + 1;
    const newCorrectPlacements = result.isCorrect ? gameState.correctPlacements + 1 : gameState.correctPlacements;
    const newPlacementTimes = [...gameState.placementTimes, placementTime];

    this.shelfGrid.setOccupied(cell.row, cell.col, card.id);
    card.isPlaced = true;
    card.displayCard.setPlaced(true, { row: cell.row, col: cell.col });
    card.container.disableInteractive();
    card.background.setAlpha(0.9);

    const targetX = cell.x + (cell.width - card.displayCard.getWidth()) / 2 + GAME_CONFIG.CARD_WIDTH / 2;
    const targetY = cell.y + (cell.height - card.displayCard.getHeight()) / 2 + GAME_CONFIG.CARD_HEIGHT / 2;

    this.tweens.add({
      targets: card.container,
      x: targetX,
      y: targetY,
      duration: 150,
      ease: 'Power2',
    });

    card.displayCard.setPosition(targetX - GAME_CONFIG.CARD_WIDTH / 2, targetY - GAME_CONFIG.CARD_HEIGHT / 2);
    if (card.body) {
      Matter.Body.setPosition(card.body, { x: targetX, y: targetY });
    }

    if (result.isCorrect) {
      audioUtils.playSuccess();
      vibrationUtils.success();
      if (newCombo > 1) {
        audioUtils.playCombo(newCombo);
        vibrationUtils.combo(newCombo);
      }
      this.showFeedback(result.message, true);
      this.flashCell(cell.row, cell.col, true);
    } else {
      audioUtils.playError();
      vibrationUtils.error();
      this.showFeedback(result.message, false);
      this.flashCell(cell.row, cell.col, false);
    }

    this.addFloatingScore(cell.x + cell.width / 2, cell.y, result.points, result.isCorrect);

    updateGameState({
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      errors: newErrors,
      totalPlacements: newTotalPlacements,
      correctPlacements: newCorrectPlacements,
      placementTimes: newPlacementTimes,
      lastPlacementTime: now,
    });

    this.updateScoreDisplay(newScore);
    this.updateComboDisplay(newCombo);

    this.time.delayedCall(300, () => {
      this.checkGameComplete();
    });
  }

  private flashCell(row: number, col: number, isCorrect: boolean): void {
    if (!this.phaserCells[row] || !this.phaserCells[row][col]) return;
    const phaserCell = this.phaserCells[row][col];
    const color = isCorrect ? 0x43A047 : 0xE53935;
    phaserCell.rect.setFillStyle(color, 0.3);

    if (!isCorrect) {
      this.tweens.add({
        targets: phaserCell.rect,
        x: phaserCell.rect.x + 5,
        yoyo: true,
        repeat: 3,
        duration: 50,
        onComplete: () => {
          phaserCell.rect.setFillStyle(0xd7ccc8, 0.5);
        },
      });
    } else {
      this.time.delayedCall(500, () => {
        phaserCell.rect.setFillStyle(0xd7ccc8, 0.5);
      });
    }
  }

  private showFeedback(text: string, isSuccess: boolean): void {
    this.feedbackText.setText(text);
    this.feedbackBg.clear();
    this.feedbackBg.fillStyle(isSuccess ? 0x43A047 : 0xE53935, 1);
    this.feedbackBg.fillRoundedRect(-100, -35, 200, 70, 12);
    this.feedbackContainer.setVisible(true);
    this.feedbackContainer.setScale(0.5);

    this.tweens.add({
      targets: this.feedbackContainer,
      scale: 1,
      duration: 200,
      ease: 'Back.Out',
      yoyo: true,
      hold: 800,
      onComplete: () => {
        this.feedbackContainer.setVisible(false);
      },
    });
  }

  private addFloatingScore(x: number, y: number, score: number, isPositive: boolean): void {
    const { animationEnabled } = useSettingsStore.getState();
    if (!animationEnabled) return;

    const id = this.floatingScoreId++;
    const color = isPositive ? '#43A047' : '#E53935';
    const text = this.add.text(x, y, isPositive ? `+${score}` : `${score}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(150);

    this.floatingScores.push({ id, text, createdAt: Date.now() });

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2.Out',
      onComplete: () => {
        text.destroy();
        this.floatingScores = this.floatingScores.filter((f) => f.id !== id);
      },
    });
  }

  private updateScoreDisplay(score: number): void {
    this.scoreText.setText(`${score}`);
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
    });
  }

  private updateComboDisplay(combo: number): void {
    if (combo > 1) {
      this.comboBadge.setVisible(true);
      this.comboText.setText(`🔥 ${combo} 连击`);
      this.tweens.add({
        targets: this.comboBadge,
        scale: 1.1,
        duration: 100,
        yoyo: true,
      });
    } else {
      this.comboBadge.setVisible(false);
    }
  }

  private checkGameComplete(): void {
    const allPlaced = this.phaserCards.every((card) => card.isPlaced);
    if (allPlaced && !this.isGameOver) {
      const { updateGameState, gameState } = useGameStateStore.getState();
      if (gameState) {
        updateGameState({
          isGameOver: true,
        });
      }
      this.time.delayedCall(300, () => {
        this.endGame('complete');
      });
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pauseIcon.setText(this.isPaused ? '▶' : '⏸');

    if (this.isPaused) {
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay(): void {
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0, 0).setDepth(300).setName('pauseOverlay');

    const container = this.add.container(width / 2, height / 2).setDepth(301).setName('pauseContainer');
    const card = this.createRoundedRect(0, 0, 300, 200, 12, 0xffffff, 1);

    const title = this.add.text(0, -50, '游戏暂停', {
      fontFamily: 'Noto Sans SC',
      fontSize: '24px',
      color: '#333333',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -10, '按空格键继续游戏', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    const continueBtnBg = this.createRoundedRect(-70, 50, 120, 40, 8, 0x1E88E5, 1);
    const continueBtnHitArea = this.add.rectangle(-70, 50, 120, 40).setInteractive({ useHandCursor: true }).setAlpha(0);
    const continueText = this.add.text(-70, 50, '继续游戏', {
      fontFamily: 'Noto Sans SC',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const backBtnBg = this.createRoundedRect(70, 50, 120, 40, 8, 0xffffff, 1, 0x1E88E5, 2);
    const backBtnHitArea = this.add.rectangle(70, 50, 120, 40).setInteractive({ useHandCursor: true }).setAlpha(0);
    const backBtnText = this.add.text(70, 50, '返回菜单', {
      fontFamily: 'Noto Sans SC',
      fontSize: '16px',
      color: '#1E88E5',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([card, title, subtitle, continueBtnBg, continueBtnHitArea, continueText, backBtnBg, backBtnHitArea, backBtnText]);

    continueBtnHitArea.on('pointerdown', () => {
      audioUtils.playClick();
      vibrationUtils.click();
      this.togglePause();
    });

    backBtnHitArea.on('pointerdown', () => {
      audioUtils.playClick();
      vibrationUtils.click();
      this.cleanup();
      this.onExitCallback?.();
    });
  }

  private hidePauseOverlay(): void {
    const overlay = this.children.getByName('pauseOverlay');
    const container = this.children.getByName('pauseContainer');
    if (overlay) overlay.destroy();
    if (container) container.destroy();
  }

  private createRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor: number,
    fillAlpha: number = 1,
    strokeColor: number | null = null,
    strokeWidth: number = 0
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    if (strokeColor !== null && strokeWidth > 0) {
      graphics.lineStyle(strokeWidth, strokeColor, 1);
    }
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    if (strokeColor !== null && strokeWidth > 0) {
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    }
    return graphics;
  }

  private endGame(reason: 'timeout' | 'complete' | 'exit' = 'exit'): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }

    const { updateGameState, gameState } = useGameStateStore.getState();
    if (!gameState) {
      this.cleanup();
      this.onExitCallback?.();
      return;
    }

    const finalGameState: GameState = {
      ...gameState,
      timeRemaining: 0,
      isGameOver: true,
    };

    if (reason === 'timeout') {
      updateGameState({
        timeRemaining: 0,
        isGameOver: true,
      });
    }

    const placements = this.phaserCards
      .filter((card) => card.isPlaced && card.displayCard.getPlacedCell())
      .map((card) => {
        const cell = card.displayCard.getPlacedCell()!;
        const shelfCell = this.shelfGrid.getCell(cell.row, cell.col)!;
        return {
          cardId: card.id,
          medicine: card.displayCard.getMedicine(),
          cell: shelfCell,
        };
      });

    const result = ScoreCalculator.calculateFinalScore(
      finalGameState,
      this.level,
      this.ruleEngine,
      placements
    );

    audioUtils.playGameOver(result.isWin);
    vibrationUtils.gameOver(result.isWin);

    const { addGameResult } = usePlayerStore.getState();
    const { setLastResult } = useGameStateStore.getState();
    addGameResult(result);
    setLastResult(result);

    this.cleanup();
    this.onGameEndCallback?.(result);
  }

  private cleanup = (): void => {
    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }
    if (this.runner && this.engine) {
      Matter.Runner.stop(this.runner);
      Matter.Engine.clear(this.engine);
    }
    this.cleanupCallbacks.forEach((cb) => cb());
    this.cleanupCallbacks = [];
    this.floatingScores.forEach((f) => f.text.destroy());
    this.floatingScores = [];
  };

  update(time: number, delta: number): void {
    if (this.engine) {
      Matter.Engine.update(this.engine, delta);
    }
  }
}
