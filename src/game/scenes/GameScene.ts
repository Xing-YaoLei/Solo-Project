import Phaser from 'phaser';
import Matter from 'matter-js';
import { GAME_CONFIG, TUTORIAL_STEPS } from '@/config/constants';
import { InputManager } from '@/game/systems/InputManager';
import { useGameStore } from '@/game/store/useGameStore';
import { getRandomVehicle } from '@/data/vehicles';
import { getRepairItemsByFaultCodes } from '@/data/repairs';
import { evaluateWorkOrder, getDiagnosisFromFaultCodes } from '@/utils/ResultEvaluator';
import { calculateItemTotal, calculateTotalPrice, formatPrice, formatTime, formatMileage } from '@/utils/QuoteCalculator';
import { isTutorialComplete, setTutorialComplete, saveScore } from '@/utils/Storage';
import type { Vehicle, RepairItem, WorkOrderResult, DiagnosisItem } from '@/types';

interface WorkOrderItemView {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  checkMark: Phaser.GameObjects.Text;
  checkboxBg: Phaser.GameObjects.Rectangle;
}

interface PhysicsTool {
  body: Matter.Body;
  type: string;
}

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private currentVehicle!: Vehicle;
  private repairItems: RepairItem[] = [];
  private diagnosisResults: DiagnosisItem[] = [];
  private selectedItems: Set<string> = new Set();
  private startTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private timerEvent!: Phaser.Time.TimerEvent;
  private levelTimeLimit: number = 180;
  private elapsedTime: number = 0;
  private resultModal: Phaser.GameObjects.Container | null = null;
  private tutorialOverlay: Phaser.GameObjects.Container | null = null;
  private tutorialStep: number = 0;
  private isFirstPlay: boolean = false;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private selectedWorkOrderIndex: number = 0;

  private vehicleCardElements!: {
    brandText: Phaser.GameObjects.Text;
    yearText: Phaser.GameObjects.Text;
    mileageText: Phaser.GameObjects.Text;
    faultCodesText: Phaser.GameObjects.Text;
    descText: Phaser.GameObjects.Text;
  };

  private quotePanelElements!: {
    itemsCountText: Phaser.GameObjects.Text;
    totalPriceText: Phaser.GameObjects.Text;
  };

  private workOrderViews: Map<string, WorkOrderItemView> = new Map();
  private diagnosisItemsContainer: Phaser.GameObjects.Container | null = null;

  private physicsTools: PhysicsTool[] = [];
  private physicsLayer: Phaser.GameObjects.Container | null = null;
  private isDragging: boolean = false;
  private draggingBody: Matter.Body | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    super('Game');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BG);
    this.inputManager = new InputManager(this);

    this.isFirstPlay = !isTutorialComplete();
    this.tutorialStep = 0;

    const levelId = this.registry.get('selectedLevel') as number || 1;
    const level = GAME_CONFIG.LEVELS.find(l => l.id === levelId) || GAME_CONFIG.LEVELS[0];
    this.levelTimeLimit = level.timeLimit;

    this.restartKey = this.input.keyboard!.addKey('R');

    this.initPhysics();
    this.createTopBar();
    this.createVehicleCard();
    this.createDiagnosisPanel();
    this.createWorkOrderList();
    this.createQuotePanel();
    this.createPhysicsWorkshop();
    this.loadNewVehicle();
    this.startTimer();
    this.setupKeyboardControls();
    this.setupSwipeControls();

    if (this.isFirstPlay) {
      this.showTutorialStep(0);
    }
  }

  private initPhysics(): void {
    this.matter.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.matter.world.setGravity(0, 0.8);
    this.matter.world.engine.positionIterations = 6;
    this.matter.world.engine.velocityIterations = 8;
  }

  private createPhysicsWorkshop(): void {
    const { width, height } = this.scale;

    this.physicsLayer = this.add.container(0, 0);
    this.physicsLayer.setDepth(5);

    const floorY = height - 50;
    const floor = Matter.Bodies.rectangle(width / 2, floorY + 20, width, 40, {
      isStatic: true,
      friction: 0.8,
      restitution: 0.1,
      label: 'floor'
    });
    this.matter.world.add(floor);

    const leftWall = Matter.Bodies.rectangle(-20, height / 2, 40, height, {
      isStatic: true,
      friction: 0.5,
      label: 'leftWall'
    });
    this.matter.world.add(leftWall);

    const rightWall = Matter.Bodies.rectangle(width + 20, height / 2, 40, height, {
      isStatic: true,
      friction: 0.5,
      label: 'rightWall'
    });
    this.matter.world.add(rightWall);

    const toolDefs = [
      { emoji: '🔧', type: 'wrench', size: 40, x: 60, y: 120 },
      { emoji: '🔩', type: 'bolt', size: 30, x: 120, y: 80 },
      { emoji: '⚙️', type: 'gear', size: 45, x: 400, y: 150 },
      { emoji: '🛠️', type: 'hammer', size: 42, x: 180, y: 100 },
      { emoji: '🔨', type: 'mallet', size: 38, x: 300, y: 90 },
      { emoji: '🧰', type: 'toolbox', size: 50, x: 520, y: 130 },
      { emoji: '📦', type: 'box', size: 44, x: 700, y: 110 },
      { emoji: '⛽', type: 'oil', size: 36, x: 850, y: 140 },
      { emoji: '🔋', type: 'battery', size: 38, x: 1000, y: 100 },
      { emoji: '💡', type: 'bulb', size: 32, x: 1100, y: 130 },
      { emoji: '🔑', type: 'key', size: 28, x: 250, y: 70 },
      { emoji: '🧽', type: 'sponge', size: 34, x: 600, y: 85 }
    ];

    toolDefs.forEach((def, index) => {
      this.createPhysicsTool(def.emoji, def.type, def.size, def.x, def.y, index);
    });

    this.add.text(80, height - 80, '👆 拖拽车间里的工具！', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: '#94A3B8'
    }).setOrigin(0, 0.5).setAlpha(0.8);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.draggingBody) {
        Matter.Body.setPosition(this.draggingBody, {
          x: pointer.x + this.dragOffset.x,
          y: pointer.y + this.dragOffset.y
        });
        this.draggingBody.velocity.x = 0;
        this.draggingBody.velocity.y = 0;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.draggingBody = null;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
      this.draggingBody = null;
    });
  }

  private createPhysicsTool(emoji: string, type: string, size: number, x: number, y: number, index: number): void {
    const label = this.add.text(x, y, emoji, {
      fontSize: `${size}px`
    }).setOrigin(0.5);

    label.setDepth(10);
    label.setInteractive({ useHandCursor: true });
    label.setData('type', type);
    label.setData('index', index);

    const body = Matter.Bodies.circle(x, y, size / 2, {
      friction: 0.4,
      restitution: 0.3,
      density: 0.001,
      label: `tool_${type}_${index}`
    });
    this.matter.world.add(body);

    this.physicsTools.push({ body, type });

    label.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.draggingBody = body;
      this.dragOffset.x = body.position.x - pointer.x;
      this.dragOffset.y = body.position.y - pointer.y;
      Matter.Body.setStatic(body, false);
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
    });

    this.matter.world.on('afterupdate', () => {
      if (!this.isDragging || this.draggingBody !== body) {
        label.setPosition(body.position.x, body.position.y);
        label.setRotation(body.angle);
      }
    });
  }

  private createTopBar(): void {
    const { width } = this.scale;

    this.add.rectangle(width / 2, 30, width, 60, GAME_CONFIG.COLORS.PRIMARY_DARK, 1)
      .setStrokeStyle(1, GAME_CONFIG.COLORS.ACCENT, 0.5);

    this.add.text(20, 30, '🔧 维修车间', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    }).setOrigin(0, 0.5);

    this.timerText = this.add.text(width / 2, 30, formatTime(this.levelTimeLimit), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#E85D04'
    }).setOrigin(0.5);

    const backBtn = this.add.text(width - 100, 30, '← 返回', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#94A3B8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('Menu'));

    const restartBtn = this.add.text(width - 210, 30, '↻ 重来(R)', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#94A3B8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.restartLevel());
  }

  private createVehicleCard(): void {
    const cx = 240;
    const cy = 280;
    const cardW = 420;
    const cardH = 200;

    const bg = this.add.rectangle(cx, cy, cardW, cardH, GAME_CONFIG.COLORS.PRIMARY, 0.9)
      .setStrokeStyle(2, GAME_CONFIG.COLORS.METAL, 0.6);

    this.add.text(cx - cardW / 2 + 20, cy - cardH / 2 + 16, '📋 车辆档案', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#E85D04'
    }).setOrigin(0, 0);

    this.add.text(cx - cardW / 2 + 30, cy - 30, '🚗', { fontSize: '72px' });

    const infoX = cx - cardW / 2 + 130;
    const brandText = this.add.text(infoX, cy - 55, '', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    });
    const yearText = this.add.text(infoX, cy - 20, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      color: '#94A3B8'
    });
    const mileageText = this.add.text(infoX, cy + 3, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      color: '#94A3B8'
    });

    this.add.text(cx - cardW / 2 + 20, cy + 45, '故障码:', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: '#E85D04'
    });
    const faultCodesText = this.add.text(cx - cardW / 2 + 80, cy + 45, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#F59E0B',
      wordWrap: { width: 320 }
    });

    this.add.text(cx - cardW / 2 + 20, cy + 70, '车主描述:', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '12px',
      color: '#94A3B8'
    });
    const descText = this.add.text(cx - cardW / 2 + 90, cy + 70, '', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '12px',
      color: '#F1F5F9',
      wordWrap: { width: 310 }
    });

    this.vehicleCardElements = { brandText, yearText, mileageText, faultCodesText, descText };

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(GAME_CONFIG.COLORS.PRIMARY_LIGHT, 0.9);
      bg.setStrokeStyle(3, GAME_CONFIG.COLORS.ACCENT, 0.8);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(GAME_CONFIG.COLORS.PRIMARY, 0.9);
      bg.setStrokeStyle(2, GAME_CONFIG.COLORS.METAL, 0.6);
    });
  }

  private createDiagnosisPanel(): void {
    const cx = 240;
    const cy = 490;
    const cardW = 420;
    const cardH = 180;

    this.add.rectangle(cx, cy, cardW, cardH, GAME_CONFIG.COLORS.BG_LIGHT, 1)
      .setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.4);

    this.add.text(cx - cardW / 2 + 20, cy - cardH / 2 + 16, '🔍 诊断结果', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#10B981'
    });

    this.diagnosisItemsContainer = this.add.container(0, 0);
  }

  private createWorkOrderList(): void {
    const { width } = this.scale;
    const x = 480;
    const y = 180;
    const cardW = width - 510;
    const cardH = 310;

    this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, GAME_CONFIG.COLORS.BG_LIGHT, 1)
      .setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.4);

    this.add.text(x + 20, y + 16, '📝 工单维修项目', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    });

    this.add.text(x + cardW - 20, y + 18, '勾选项目 · 数字键1-8快速选择', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '12px',
      color: '#6B7280'
    }).setOrigin(1, 0);
  }

  private createQuotePanel(): void {
    const { width } = this.scale;
    const x = 480;
    const y = 510;
    const cardW = width - 510;
    const cardH = 180;
    const cx = x + cardW / 2;
    const cy = y + cardH / 2;

    this.add.rectangle(cx, cy, cardW, cardH, GAME_CONFIG.COLORS.PRIMARY, 0.6)
      .setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT, 0.5);

    this.add.text(x + 30, y + 30, '已选项目:', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: '#94A3B8'
    });
    const itemsCountText = this.add.text(x + 120, y + 30, '0', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    });

    this.add.text(x + 30, y + 70, '报价总额:', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#94A3B8'
    });
    const totalPriceText = this.add.text(x + 130, y + 60, formatPrice(0), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#E85D04'
    });

    this.quotePanelElements = { itemsCountText, totalPriceText };

    const btnWidth = Math.min(280, cardW - 60);
    const btnX = x + cardW - btnWidth - 30;
    const btnY = y + 40;

    const submitBg = this.add.rectangle(btnX + btnWidth / 2, btnY + 35, btnWidth, 70, GAME_CONFIG.COLORS.ACCENT, 1)
      .setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT_LIGHT, 1);

    this.add.text(btnX + btnWidth / 2, btnY + 28, '✔ 提交报价', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.add.text(btnX + btnWidth / 2, btnY + 58, '[Enter] 快捷提交', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#FFE4CC'
    }).setOrigin(0.5);

    submitBg.setInteractive({ useHandCursor: true });
    submitBg.on('pointerdown', () => this.submitQuote());
  }

  private loadNewVehicle(): void {
    this.currentVehicle = getRandomVehicle();
    this.repairItems = getRepairItemsByFaultCodes(this.currentVehicle.faultCodes);
    this.diagnosisResults = getDiagnosisFromFaultCodes(this.currentVehicle.faultCodes, this.repairItems);
    this.selectedItems.clear();
    this.selectedWorkOrderIndex = 0;
    useGameStore.getState().setVehicle(this.currentVehicle);
    useGameStore.getState().setAvailableRepairItems(this.repairItems);
    useGameStore.getState().setDiagnosisResults(this.diagnosisResults);
    useGameStore.getState().clearSelectedItems();
    this.startTime = Date.now();
    this.elapsedTime = 0;

    this.updateVehicleCard();
    this.updateDiagnosisPanel();
    this.updateWorkOrderList();
    this.updateQuotePanel();
  }

  private updateVehicleCard(): void {
    const v = this.currentVehicle;
    this.vehicleCardElements.brandText.setText(`${v.brand} ${v.model}`);
    this.vehicleCardElements.yearText.setText(`${v.year}年款`);
    this.vehicleCardElements.mileageText.setText(`里程: ${formatMileage(v.mileage)}`);
    this.vehicleCardElements.faultCodesText.setText(v.faultCodes.join('  '));
    this.vehicleCardElements.descText.setText(v.customerDescription);
  }

  private updateDiagnosisPanel(): void {
    if (this.diagnosisItemsContainer) {
      this.diagnosisItemsContainer.removeAll(true);
    }

    const baseX = 50;
    const baseY = 420;

    this.diagnosisResults.forEach((diag, index) => {
      const y = baseY + index * 40;
      const width = 380;

      const statusIcon = this.add.text(baseX + 5, y, diag.confirmed ? '✅' : '❓', {
        fontSize: '20px'
      });
      if (!diag.confirmed) {
        this.tweens.add({
          targets: statusIcon,
          alpha: { from: 0.5, to: 1 },
          duration: 800,
          yoyo: true,
          repeat: -1
        });
      }

      this.add.text(baseX + 40, y, diag.name, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: diag.confirmed ? '#10B981' : '#F59E0B'
      });

      this.add.text(baseX + width - 10, y,
        '★'.repeat(diag.severity) + '☆'.repeat(5 - diag.severity), {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '14px',
          color: '#E85D04'
        }
      ).setOrigin(1, 0);

      this.add.text(baseX + 40, y + 20, diag.description, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '11px',
        color: '#94A3B8'
      });

      this.diagnosisItemsContainer?.add([statusIcon]);
    });
  }

  private updateWorkOrderList(): void {
    const { width } = this.scale;
    const x = 480;
    const y = 180;
    const cardW = width - 510;
    const itemHeight = 55;
    const maxVisible = 5;

    this.workOrderViews.forEach(view => {
      view.container.destroy();
    });
    this.workOrderViews.clear();

    this.repairItems.slice(0, maxVisible).forEach((item, index) => {
      const itemY = y + 45 + index * (itemHeight + 6);
      const container = this.add.container(0, 0);
      container.setData('itemId', item.id);
      container.setData('index', index);

      const bg = this.add.rectangle(x + (cardW) / 2, itemY + itemHeight / 2, cardW - 30, itemHeight, GAME_CONFIG.COLORS.BG, 0.7)
        .setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.3);

      const checkboxBg = this.add.rectangle(x + 26, itemY + itemHeight / 2, 28, 28, GAME_CONFIG.COLORS.BG, 1)
        .setStrokeStyle(2, GAME_CONFIG.COLORS.METAL, 0.7);

      const checkMark = this.add.text(x + 26, itemY + itemHeight / 2, '✓', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#10B981'
      }).setOrigin(0.5).setVisible(false);

      this.add.text(x + 70, itemY + itemHeight / 2, `${index + 1}`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#6B7280'
      }).setOrigin(0, 0.5);

      this.add.text(x + 100, itemY + 8, item.name, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#F1F5F9'
      });

      const categoryIcons: Record<string, string> = {
        engine: '⚙️', brake: '🛑', electrical: '⚡',
        body: '🚗', suspension: '🔩', transmission: '🔄'
      };
      this.add.text(x + 100, itemY + 32,
        `${categoryIcons[item.category] || '🔧'} ${item.description}`, {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: '11px',
          color: '#94A3B8'
        });

      this.add.text(x + cardW - 15, itemY + itemHeight / 2,
        formatPrice(calculateItemTotal(item)), {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#F59E0B'
        }
      ).setOrigin(1, 0.5);

      container.add([bg, checkboxBg, checkMark]);
      this.workOrderViews.set(item.id, { container, bg, checkMark, checkboxBg });

      bg.setInteractive(new Phaser.Geom.Rectangle(x + 15, itemY, cardW - 30, itemHeight),
        Phaser.Geom.Rectangle.Contains);
      bg.input!.cursor = 'pointer';

      bg.on('pointerover', () => {
        bg.setFillStyle(GAME_CONFIG.COLORS.PRIMARY, 0.5);
        bg.setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT, 0.5);
      });
      bg.on('pointerout', () => {
        if (this.selectedItems.has(item.id)) {
          bg.setFillStyle(GAME_CONFIG.COLORS.SUCCESS, 0.15);
          bg.setStrokeStyle(1, GAME_CONFIG.COLORS.SUCCESS, 0.5);
        } else if (this.selectedWorkOrderIndex === index) {
          bg.setFillStyle(GAME_CONFIG.COLORS.ACCENT, 0.2);
          bg.setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT, 0.6);
        } else {
          bg.setFillStyle(GAME_CONFIG.COLORS.BG, 0.7);
          bg.setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.3);
        }
      });
      bg.on('pointerdown', () => this.toggleRepairItem(item.id));
    });

    this.highlightWorkOrderSelection();
  }

  private toggleRepairItem(itemId: string): void {
    if (this.resultModal) return;
    if (this.tutorialOverlay) return;

    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
    } else {
      this.selectedItems.add(itemId);
    }

    useGameStore.getState().toggleRepairItem(itemId);
    this.updateWorkOrderListVisuals();
    this.updateQuotePanel();
  }

  private updateWorkOrderListVisuals(): void {
    this.workOrderViews.forEach((view, id) => {
      const selected = this.selectedItems.has(id);
      view.checkMark.setVisible(selected);
      if (selected) {
        view.bg.setFillStyle(GAME_CONFIG.COLORS.SUCCESS, 0.15);
        view.bg.setStrokeStyle(1, GAME_CONFIG.COLORS.SUCCESS, 0.5);
        view.checkboxBg.setStrokeStyle(2, GAME_CONFIG.COLORS.SUCCESS, 1);
        view.checkboxBg.setFillStyle(GAME_CONFIG.COLORS.SUCCESS, 0.2);

        this.tweens.add({
          targets: view.container,
          scaleX: { from: 1.01, to: 1 },
          scaleY: { from: 1.01, to: 1 },
          duration: 150,
          ease: 'Back.easeOut'
        });
      } else {
        view.bg.setFillStyle(GAME_CONFIG.COLORS.BG, 0.7);
        view.bg.setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.3);
        view.checkboxBg.setStrokeStyle(2, GAME_CONFIG.COLORS.METAL, 0.7);
        view.checkboxBg.setFillStyle(GAME_CONFIG.COLORS.BG, 1);
      }
    });
  }

  private highlightWorkOrderSelection(): void {
    Array.from(this.workOrderViews.entries()).forEach(([id, view], idx) => {
      if (idx === this.selectedWorkOrderIndex && !this.selectedItems.has(id)) {
        view.bg.setFillStyle(GAME_CONFIG.COLORS.ACCENT, 0.2);
        view.bg.setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT, 0.6);
      }
    });
  }

  private updateQuotePanel(): void {
    const selectedRepairItems = this.repairItems.filter(item => this.selectedItems.has(item.id));
    const total = calculateTotalPrice(selectedRepairItems);

    this.quotePanelElements.itemsCountText.setText(`${this.selectedItems.size} 项`);
    this.quotePanelElements.totalPriceText.setText(formatPrice(total));

    this.tweens.add({
      targets: this.quotePanelElements.totalPriceText,
      scaleX: { from: 1.15, to: 1 },
      scaleY: { from: 1.15, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.elapsedTime = 0;

    if (this.timerEvent) this.timerEvent.remove(false);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.elapsedTime++;
        const remaining = Math.max(0, this.levelTimeLimit - this.elapsedTime);
        this.timerText.setText(formatTime(remaining));

        if (remaining <= 30) {
          this.timerText.setColor('#EF4444');
          this.tweens.add({
            targets: this.timerText,
            scaleX: { from: 1.1, to: 1 },
            scaleY: { from: 1.1, to: 1 },
            duration: 300,
            ease: 'Sine.easeInOut'
          });
        }

        if (remaining <= 0) {
          this.submitQuote();
        }
      },
      loop: true
    });
  }

  private setupKeyboardControls(): void {
    this.inputManager.onKey('Escape', () => {
      if (this.resultModal) {
        this.hideResultModal();
      } else if (this.tutorialOverlay) {
        this.hideTutorial();
      }
    });

    this.inputManager.onKey('Enter', () => {
      if (!this.resultModal && !this.tutorialOverlay) {
        this.submitQuote();
      }
    });

    for (let i = 1; i <= 8; i++) {
      this.inputManager.onKey(i.toString(), () => {
        if (this.tutorialOverlay) return;
        const item = this.repairItems[i - 1];
        if (item) this.toggleRepairItem(item.id);
      });
    }

    this.inputManager.onKeys(['ArrowUp', 'w', 'W'], () => {
      if (this.resultModal || this.tutorialOverlay) return;
      this.selectedWorkOrderIndex = Math.max(0, this.selectedWorkOrderIndex - 1);
      this.updateWorkOrderListVisuals();
      this.highlightWorkOrderSelection();
    });

    this.inputManager.onKeys(['ArrowDown', 's', 'S'], () => {
      if (this.resultModal || this.tutorialOverlay) return;
      const maxIdx = Math.min(this.repairItems.length, 5) - 1;
      this.selectedWorkOrderIndex = Math.min(maxIdx, this.selectedWorkOrderIndex + 1);
      this.updateWorkOrderListVisuals();
      this.highlightWorkOrderSelection();
    });

    this.inputManager.onKey(' ', () => {
      if (this.resultModal || this.tutorialOverlay) return;
      const item = this.repairItems[this.selectedWorkOrderIndex];
      if (item) this.toggleRepairItem(item.id);
    });

    this.restartKey.on('down', () => this.restartLevel());
  }

  private setupSwipeControls(): void {
    this.inputManager.setSwipeHandlers({
      left: () => {
        if (!this.tutorialOverlay && !this.resultModal) {
          this.scene.start('Menu');
        }
      },
      right: () => {
        if (!this.tutorialOverlay && !this.resultModal) {
          this.restartLevel();
        }
      }
    });
  }

  private submitQuote(): void {
    if (this.resultModal) return;
    if (this.tutorialOverlay) return;
    if (this.selectedItems.size === 0) {
      this.flashWarning('请至少选择一个维修项目！');
      return;
    }

    this.timerEvent.remove(false);

    const result = evaluateWorkOrder({
      selectedItemIds: Array.from(this.selectedItems),
      availableItems: this.repairItems,
      faultCodes: this.currentVehicle.faultCodes,
      elapsedTime: this.elapsedTime,
      timeLimit: this.levelTimeLimit
    });

    saveScore({
      playerName: '玩家',
      reworkRate: result.isRework ? 100 : 0,
      avgCompletionTime: this.elapsedTime,
      totalScore: result.score,
      gamesPlayed: 1,
      timestamp: Date.now()
    });

    this.showResultModal(result);
    this.spawnCelebrationParticles(result.success);

    if (!result.isRework && !result.isComplaint && this.isFirstPlay) {
      setTutorialComplete(true);
    }
  }

  private spawnCelebrationParticles(success: boolean): void {
    const { width, height } = this.scale;
    const emojis = success ? ['🎉', '⭐', '✨', '🎊', '💫'] : ['💥', '⚠️', '❌'];

    for (let i = 0; i < 20; i++) {
      const emoji = emojis[Phaser.Math.Between(0, emojis.length - 1)];
      const x = Phaser.Math.Between(100, width - 100);
      const y = Phaser.Math.Between(100, height - 200);

      const particle = this.add.text(x, y, emoji, {
        fontSize: `${Phaser.Math.Between(20, 40)}px`
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: particle,
        alpha: { from: 0, to: 1, duration: 200 },
        y: { from: y + 50, to: y - 100, duration: 800 },
        scaleX: { from: 0.5, to: 1.5, duration: 600 },
        scaleY: { from: 0.5, to: 1.5, duration: 600 },
        hold: 200,
        alphaEnd: 0,
        delay: i * 30,
        ease: 'Back.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private flashWarning(msg: string): void {
    const { width } = this.scale;
    const warning = this.add.text(width / 2, 350, msg, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#EF4444'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: warning,
      alpha: { from: 0, to: 1, duration: 200 },
      y: { from: 380, to: 320, duration: 600 },
      hold: 1000,
      alphaEnd: 0,
      ease: 'Sine.easeOut',
      onComplete: () => warning.destroy()
    });

    this.cameras.main.shake(200, 0.005);
  }

  private showResultModal(result: WorkOrderResult): void {
    const { width, height } = this.scale;

    this.resultModal = this.add.container(width / 2, height / 2);
    this.resultModal.setDepth(100);

    const mask = this.add.rectangle(0, 0, width * 3, height * 3, 0x000000, 0.7);
    mask.setInteractive();

    const modalW = 560;
    const modalH = 520;
    const accentColor = result.success ? GAME_CONFIG.COLORS.SUCCESS : GAME_CONFIG.COLORS.DANGER;
    const accentBorder = result.success ? 0x34D399 : 0xF87171;

    const modalBg = this.add.rectangle(0, 0, modalW, modalH, accentColor, 0.95)
      .setStrokeStyle(4, accentBorder, 1);

    const resultIcon = this.add.text(0, -modalH / 2 + 60,
      result.success ? '🎉' : result.isRework ? '⚠️' : '😤',
      { fontSize: '64px' }
    ).setOrigin(0.5);

    const statusText = this.add.text(0, -modalH / 2 + 130,
      result.success ? '维修成功！' : result.isRework ? '返修警告！' : '客户投诉！', {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5);

    const starsText = this.add.text(0, -modalH / 2 + 185,
      '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '36px',
        color: '#FDE047'
      }
    ).setOrigin(0.5);

    const scoreText = this.add.text(0, -modalH / 2 + 240, `得分: ${result.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    const messageText = this.add.text(0, -modalH / 2 + 295, result.message, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: modalW - 60 }
    }).setOrigin(0.5);

    this.add.rectangle(0, 45, modalW - 80, 130, 0x000000, 0.25);

    this.add.text(-modalW / 2 + 60, 5, `报价准确度: ${result.priceAccuracy}%`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF'
    });
    this.add.text(-modalW / 2 + 60, 35, `用时: ${formatTime(this.elapsedTime)}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF'
    });

    const missingColor = result.missingItems.length > 0 ? '#FCA5A5' : '#FFFFFF';
    this.add.text(-modalW / 2 + 60, 65, `漏项: ${result.missingItems.length} 项`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      color: missingColor
    });

    const extraColor = result.unnecessaryItems.length > 0 ? '#FCA5A5' : '#FFFFFF';
    this.add.text(-modalW / 2 + 60, 95, `多余项目: ${result.unnecessaryItems.length} 项`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      color: extraColor
    });

    const btnW = 180;
    const btnH = 56;
    const btnY = modalH / 2 - 80;

    const retryBtnBg = this.add.rectangle(-modalW / 2 + 60 + btnW / 2, btnY + btnH / 2, btnW, btnH, 0xFFFFFF, 0.2)
      .setStrokeStyle(2, 0xFFFFFF, 0.5);

    const retryText = this.add.text(-modalW / 2 + 60 + btnW / 2, btnY + btnH / 2, '↻ 再来一局', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const nextBtnBg = this.add.rectangle(modalW / 2 - 60 - btnW / 2, btnY + btnH / 2, btnW, btnH, 0xFFFFFF, 1);

    const nextLabel = result.success ? '下一辆车 →' : '返回菜单';
    const nextTextColor = result.success ? '#059669' : '#1E293B';
    const nextText = this.add.text(modalW / 2 - 60 - btnW / 2, btnY + btnH / 2, nextLabel, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: nextTextColor
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.resultModal.add([
      mask, modalBg, resultIcon, statusText, starsText, scoreText, messageText,
      retryBtnBg, retryText, nextBtnBg, nextText
    ]);

    retryText.on('pointerdown', () => this.restartLevel());

    nextText.on('pointerdown', () => {
      if (result.success) {
        this.hideResultModal();
        this.loadNewVehicle();
        this.timerText.setColor('#E85D04');
        this.startTimer();
      } else {
        this.scene.start('Menu');
      }
    });

    this.resultModal.setAlpha(0);
    this.resultModal.setScale(0.8);
    this.tweens.add({
      targets: this.resultModal,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    if (!result.success) {
      this.cameras.main.shake(300, 0.01);
    }
  }

  private hideResultModal(): void {
    if (this.resultModal) {
      this.tweens.add({
        targets: this.resultModal,
        alpha: 0,
        scale: 0.8,
        duration: 200,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this.resultModal?.destroy();
          this.resultModal = null;
        }
      });
    }
  }

  private showTutorialStep(step: number): void {
    this.tutorialStep = step;
    const stepData = TUTORIAL_STEPS[step];
    if (!stepData) {
      this.hideTutorial();
      return;
    }

    const { width, height } = this.scale;

    if (this.tutorialOverlay) {
      this.tutorialOverlay.destroy();
    }

    this.tutorialOverlay = this.add.container(0, 0);
    this.tutorialOverlay.setDepth(200);

    const mask = this.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, 0.75);
    mask.setInteractive();
    this.tutorialOverlay.add(mask);

    const tipW = 480;
    const tipH = 180;
    const tipX = width / 2;
    const tipY = height - 140;

    const tipBg = this.add.rectangle(tipX, tipY, tipW, tipH, GAME_CONFIG.COLORS.PRIMARY_DARK, 0.98)
      .setStrokeStyle(3, GAME_CONFIG.COLORS.ACCENT, 0.8);
    this.tutorialOverlay.add(tipBg);

    const stepLabel = this.add.text(tipX - tipW / 2 + 24, tipY - tipH / 2 + 20,
      `步骤 ${step + 1} / ${TUTORIAL_STEPS.length}`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#E85D04'
      });
    this.tutorialOverlay.add(stepLabel);

    const title = this.add.text(tipX - tipW / 2 + 24, tipY - tipH / 2 + 48, stepData.title, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    });
    this.tutorialOverlay.add(title);

    const desc = this.add.text(tipX - tipW / 2 + 24, tipY - tipH / 2 + 85, stepData.desc, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      color: '#94A3B8',
      wordWrap: { width: tipW - 48 }
    });
    this.tutorialOverlay.add(desc);

    const skipBtn = this.add.text(tipX - tipW / 2 + 24, tipY + tipH / 2 - 35, '跳过引导 [Esc]', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: '#6B7280'
    }).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => this.hideTutorial());
    this.tutorialOverlay.add(skipBtn);

    const nextBtnW = 140;
    const nextBtnH = 44;
    const nextBtnX = tipX + tipW / 2 - nextBtnW / 2 - 24;
    const nextBtnY = tipY + tipH / 2 - nextBtnH / 2 - 18;

    const nextBtnBg = this.add.rectangle(nextBtnX, nextBtnY, nextBtnW, nextBtnH, GAME_CONFIG.COLORS.ACCENT, 1);
    this.tutorialOverlay.add(nextBtnBg);

    const nextLabel = step === TUTORIAL_STEPS.length - 1 ? '开始游戏 ✔' : '下一步 →';
    const nextBtn = this.add.text(nextBtnX, nextBtnY, nextLabel, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.nextTutorialStep());
    this.tutorialOverlay.add(nextBtn);

    this.tutorialOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.tutorialOverlay,
      alpha: 1,
      duration: 300
    });
  }

  private nextTutorialStep(): void {
    if (this.tutorialStep >= TUTORIAL_STEPS.length - 1) {
      this.hideTutorial();
      setTutorialComplete(true);
      this.isFirstPlay = false;
    } else {
      this.showTutorialStep(this.tutorialStep + 1);
    }
  }

  private hideTutorial(): void {
    if (this.tutorialOverlay) {
      this.tweens.add({
        targets: this.tutorialOverlay,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.tutorialOverlay?.destroy();
          this.tutorialOverlay = null;
        }
      });
    }
  }

  private restartLevel(): void {
    if (this.timerEvent) this.timerEvent.remove(false);
    this.hideResultModal();
    this.hideTutorial();
    this.selectedItems.clear();
    this.selectedWorkOrderIndex = 0;
    this.loadNewVehicle();
    this.timerText.setColor('#E85D04');
    this.startTimer();
    this.resetPhysicsTools();
  }

  private resetPhysicsTools(): void {
    const toolDefs = [
      { x: 60 }, { x: 120 }, { x: 400 }, { x: 180 }, { x: 300 },
      { x: 520 }, { x: 700 }, { x: 850 }, { x: 1000 }, { x: 1100 },
      { x: 250 }, { x: 600 }
    ];

    this.physicsTools.forEach((tool, index) => {
      const def = toolDefs[index] || { x: 100 };
      Matter.Body.setPosition(tool.body, { x: def.x, y: 100 + Math.random() * 50 });
      Matter.Body.setVelocity(tool.body, { x: 0, y: 0 });
      Matter.Body.setAngle(tool.body, 0);
      Matter.Body.setAngularVelocity(tool.body, 0);
    });
  }
}
