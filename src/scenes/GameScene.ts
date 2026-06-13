import Phaser from 'phaser';
import { gameState } from '../systems/GameState';
import { GameStep, SupplierSelectData, RequisitionData, InventoryCheckData, ErrorType } from '../models/types';

type Phase = 'SUPPLIER_SELECT' | 'REQUISITION' | 'INVENTORY_CHECK' | 'DAY_SUMMARY';

export class GameScene extends Phaser.Scene {
  private currentPhase: Phase = 'SUPPLIER_SELECT';
  private selectedConsumableIndex: number = 0;
  private stepStartTime: number = 0;
  private warningTweens: Phaser.Tweens.Tween[] = [];
  private container!: Phaser.GameObjects.Container;
  private hudContainer!: Phaser.GameObjects.Container;
  private phasePanel!: Phaser.GameObjects.Container;
  private alertOverlay!: Phaser.GameObjects.Container;
  private matterWorld!: Phaser.Physics.Matter.World;
  private shelfBodies: MatterJS.BodyType[] = [];
  private itemBodies: Map<string, MatterJS.BodyType> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.matterWorld = this.matter.world as Phaser.Physics.Matter.World;
    this.matterWorld.setBounds(0, 0, width, height);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x1f2937, 0x1f2937, 1);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(0);

    this.container = this.add.container(0, 0);
    this.hudContainer = this.add.container(0, 0).setDepth(100);
    this.phasePanel = this.add.container(0, 0).setDepth(50);
    this.alertOverlay = this.add.container(0, 0).setDepth(150);

    this.createHUD(width);
    this.createShelfArea(width, height);
    this.showShortageAlerts();
    this.startPhase('SUPPLIER_SELECT');
  }

  private createHUD(width: number): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x0d1117, 0.9);
    hudBg.fillRect(0, 0, width, 60);
    hudBg.lineStyle(1, 0x4fc3f7, 0.3);
    hudBg.lineBetween(0, 60, width, 60);
    this.hudContainer.add(hudBg);

    const dayText = this.add.text(20, 15, `第 ${gameState.gameDay + 1} 天`, {
      fontSize: '18px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
    });
    const scoreText = this.add.text(20, 38, `得分: ${gameState.score}`, {
      fontSize: '14px', color: '#81c784', fontFamily: 'Arial',
    });
    this.hudContainer.add([dayText, scoreText]);

    this.hudContainer.add(
      this.add.text(width / 2, 20, this.getPhaseTitle(), {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    this.hudContainer.add(
      this.add.text(width - 20, 15, '耗材库存', {
        fontSize: '14px', color: '#b0bec5', fontFamily: 'Arial',
      }).setOrigin(1, 0)
    );

    const stockBar = this.createStockBar(width - 180, 38, 160, 12);
    this.hudContainer.add(stockBar);

    this.registry.set('hud_dayText', dayText);
    this.registry.set('hud_scoreText', scoreText);
  }

  private createStockBar(x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x37474f, 1);
    bg.fillRoundedRect(0, 0, w, h, 3);
    container.add(bg);

    const fill = this.add.graphics();
    fill.fillStyle(0x4fc3f7, 1);
    fill.fillRoundedRect(1, 1, w - 2, h - 2, 2);
    container.add(fill);
    this.registry.set('stockBarFill', fill);
    this.registry.set('stockBarW', w);
    this.registry.set('stockBarH', h);
    return container;
  }

  private getPhaseTitle(): string {
    switch (this.currentPhase) {
      case 'SUPPLIER_SELECT': return '供应商选择';
      case 'REQUISITION': return '领用操作';
      case 'INVENTORY_CHECK': return '盘点核对';
      case 'DAY_SUMMARY': return '当日总结';
    }
  }

  private showShortageAlerts(): void {
    this.alertOverlay.removeAll(true);
    this.warningTweens.forEach((t) => t.stop());
    this.warningTweens = [];

    const width = this.scale.width;
    const imminentItems: { name: string; days: number }[] = [];

    gameState.shortageImminent.forEach((daysLeft, consumableId) => {
      const c = gameState.consumables.find((item) => item.id === consumableId);
      if (c) {
        imminentItems.push({ name: c.name, days: daysLeft });
      }
    });

    if (imminentItems.length === 0) return;

    const alertBg = this.add.graphics();
    alertBg.fillStyle(0xb71c1c, 0.85);
    alertBg.fillRoundedRect(width / 2 - 260, 65, 520, 30 + imminentItems.length * 20, 6);
    alertBg.lineStyle(2, 0xff5722, 1);
    alertBg.strokeRoundedRect(width / 2 - 260, 65, 520, 30 + imminentItems.length * 20, 6);
    this.alertOverlay.add(alertBg);

    const header = this.add.text(width / 2, 78, '⚠ 短缺预警', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.alertOverlay.add(header);

    imminentItems.forEach((item, i) => {
      const color = item.days <= 0 ? '#ff1744' : item.days <= 1 ? '#ff5722' : '#ffab91';
      const msg = item.days <= 0 ? `${item.name}: 已断货!` : `${item.name}: 约${item.days}天后断货`;
      const txt = this.add.text(width / 2, 97 + i * 20, msg, {
        fontSize: '11px', color, fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.alertOverlay.add(txt);
    });

    const tween = this.tweens.add({
      targets: alertBg,
      alpha: { from: 1, to: 0.6 },
      duration: 500,
      yoyo: true,
      repeat: 4,
    });
    this.warningTweens.push(tween);
  }

  private createShelfArea(width: number, height: number): void {
    const shelfY = height - 200;
    const shelfWidth = 120;
    const gap = 15;
    const startX = (width - (gameState.consumables.length * (shelfWidth + gap) - gap)) / 2;

    for (let i = 0; i < gameState.consumables.length; i++) {
      const c = gameState.consumables[i];
      const x = startX + i * (shelfWidth + gap) + shelfWidth / 2;

      const shelfBody = this.matter.add.rectangle(x, shelfY + 80, shelfWidth, 10, {
        isStatic: true,
        render: { fillColor: 0x5d4037 },
      });
      this.shelfBodies.push(shelfBody);

      const stockRatio = c.currentStock / c.maxStock;
      const itemHeight = Math.max(10, stockRatio * 60);

      const itemBody = this.matter.add.rectangle(x, shelfY + 80 - itemHeight / 2 - 5, shelfWidth - 10, itemHeight, {
        render: { fillColor: this.getStockColor(stockRatio) },
        friction: 0.8,
        density: 0.001,
      });
      this.itemBodies.set(c.id, itemBody);

      const nameText = this.add.text(x, shelfY + 100, c.name, {
        fontSize: '11px', color: '#b0bec5', fontFamily: 'Arial',
      }).setOrigin(0.5);

      const qtyText = this.add.text(x, shelfY + 115, `${c.currentStock}${c.unit}`, {
        fontSize: '10px', color: '#78909c', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.registry.set(`qty_${c.id}`, qtyText);

      const daysLeft = c.dailyUsage > 0 ? Math.floor(c.currentStock / c.dailyUsage) : 999;
      const countdownText = this.add.text(x, shelfY + 128, daysLeft <= 3 ? `${daysLeft}天后断货` : '', {
        fontSize: '9px', color: daysLeft <= 1 ? '#ff5722' : '#ffab91', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.registry.set(`countdown_${c.id}`, countdownText);

      if (c.currentStock <= c.safetyStock * 1.5) {
        this.addWarningIndicator(x, shelfY - 30, c.id);
      }
    }
  }

  private addWarningIndicator(x: number, y: number, consumableId: string): void {
    const existing = this.registry.get(`warn_${consumableId}`);
    if (existing) return;

    const isImminent = gameState.shortageImminent.has(consumableId);
    const textureKey = isImminent ? 'danger_icon' : 'warning_icon';
    const icon = this.add.image(x, y, textureKey).setAlpha(0);
    const speed = isImminent ? 250 : 500;
    const tween = this.tweens.add({
      targets: icon,
      alpha: { from: 0, to: 1 },
      duration: speed,
      yoyo: true,
      repeat: -1,
    });
    this.warningTweens.push(tween);
    this.registry.set(`warn_${consumableId}`, icon);
  }

  private getStockColor(ratio: number): number {
    if (ratio <= 0.15) return 0xe74c3c;
    if (ratio <= 0.3) return 0xff9800;
    if (ratio <= 0.5) return 0xf1c40f;
    return 0x4caf50;
  }

  private startPhase(phase: Phase): void {
    this.currentPhase = phase;
    this.stepStartTime = Date.now();
    this.phasePanel.removeAll(true);

    const phaseTitle = this.hudContainer.getAt(2) as Phaser.GameObjects.Text;
    if (phaseTitle) phaseTitle.setText(this.getPhaseTitle());

    switch (phase) {
      case 'SUPPLIER_SELECT':
        this.renderSupplierSelect();
        break;
      case 'REQUISITION':
        this.renderRequisition();
        break;
      case 'INVENTORY_CHECK':
        this.renderInventoryCheck();
        break;
      case 'DAY_SUMMARY':
        this.renderDaySummary();
        break;
    }
  }

  private renderSupplierSelect(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const panelY = 70;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 0.95);
    panelBg.fillRoundedRect(30, panelY, width - 60, height - panelY - 220, 12);
    panelBg.lineStyle(1, 0x4fc3f7, 0.2);
    panelBg.strokeRoundedRect(30, panelY, width - 60, height - panelY - 220, 12);
    this.phasePanel.add(panelBg);

    const title = this.add.text(width / 2, panelY + 20, '选择供应商（关注交期、可靠性、最低起订量）', {
      fontSize: '16px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.phasePanel.add(title);

    const consumablesNeedingSupply = gameState.consumables.filter(
      (c) => c.currentStock <= c.safetyStock * 2
    );
    const target = consumablesNeedingSupply[this.selectedConsumableIndex % Math.max(1, consumablesNeedingSupply.length)];

    if (!target) {
      this.phasePanel.add(
        this.add.text(width / 2, height / 2, '当前库存充足，无需领用', {
          fontSize: '18px', color: '#81c784', fontFamily: 'Arial',
        }).setOrigin(0.5)
      );
      this.time.delayedCall(1500, () => this.startPhase('INVENTORY_CHECK'));
      return;
    }

    const daysUntilShortage = target.dailyUsage > 0 ? target.currentStock / target.dailyUsage : 999;

    if (gameState.shortageImminent.has(target.id)) {
      const urgentBanner = this.add.text(width / 2, panelY + 42, `⚡ ${target.name} 即将断货! 约剩${daysUntilShortage.toFixed(1)}天用量`, {
        fontSize: '13px', color: '#ff1744', fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#4a0000',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5);
      this.phasePanel.add(urgentBanner);
      this.tweens.add({
        targets: urgentBanner,
        alpha: { from: 1, to: 0.4 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.phasePanel.add(
        this.add.text(width / 2, panelY + 42, `需要补货: ${target.name}（当前${target.currentStock}${target.unit}，安全库存${target.safetyStock}${target.unit}）`, {
          fontSize: '14px', color: '#ffb74d', fontFamily: 'Arial',
        }).setOrigin(0.5)
      );
    }

    const availableSuppliers = gameState.suppliers.filter(
      (s) => s.categories.includes(target.category)
    );

    const cardStartY = panelY + 70;
    const cardWidth = (width - 80) / availableSuppliers.length - 10;

    availableSuppliers.forEach((supplier, idx) => {
      const cx = 50 + idx * (cardWidth + 10) + cardWidth / 2;
      this.createSupplierCard(cx, cardStartY, cardWidth, supplier, target, idx);
    });
  }

  private createSupplierCard(
    x: number, y: number, w: number,
    supplier: typeof gameState.suppliers[0],
    consumable: typeof gameState.consumables[0],
    index: number
  ): void {
    const h = 280;
    const card = this.add.graphics();
    card.fillStyle(0x263238, 1);
    card.fillRoundedRect(x - w / 2, y, w, h, 8);
    card.lineStyle(1, 0x4fc3f7, 0.3);
    card.strokeRoundedRect(x - w / 2, y, w, h, 8);
    this.phasePanel.add(card);

    const nameText = this.add.text(x, y + 18, supplier.name, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.phasePanel.add(nameText);

    const details = [
      `交期: ${supplier.leadTime}天`,
      `最低起订: ${supplier.minOrderQty}${consumable.unit}`,
      `可靠性: ${Math.round(supplier.reliability * 100)}%`,
      `价格系数: ×${supplier.priceMultiplier}`,
    ];
    details.forEach((line, li) => {
      this.phasePanel.add(
        this.add.text(x, y + 45 + li * 22, line, {
          fontSize: '12px', color: '#b0bec5', fontFamily: 'Arial',
        }).setOrigin(0.5)
      );
    });

    const daysUntilShortage = consumable.dailyUsage > 0 ? consumable.currentStock / consumable.dailyUsage : 999;
    const canArriveInTime = supplier.leadTime < daysUntilShortage;

    if (!canArriveInTime) {
      const alertText = this.add.text(x, y + 140, '⚠ 交期可能来不及', {
        fontSize: '11px', color: '#ff5722', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.phasePanel.add(alertText);
      this.tweens.add({
        targets: alertText,
        alpha: { from: 1, to: 0.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    } else {
      const okText = this.add.text(x, y + 140, '✓ 可在断货前到货', {
        fontSize: '11px', color: '#4caf50', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.phasePanel.add(okText);
    }

    const btnY = y + h - 50;
    const selectBtn = this.add.text(x, btnY, '选择此供应商', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#2d5f8a',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on('pointerover', () => {
      selectBtn.setStyle({ backgroundColor: '#3a7cb8' });
    });
    selectBtn.on('pointerout', () => {
      selectBtn.setStyle({ backgroundColor: '#2d5f8a' });
    });
    selectBtn.on('pointerdown', () => {
      this.handleSupplierSelect(supplier, consumable, index);
    });
    this.phasePanel.add(selectBtn);
  }

  private handleSupplierSelect(
    supplier: typeof gameState.suppliers[0],
    consumable: typeof gameState.consumables[0],
    index: number
  ): void {
    const daysUntilShortage = consumable.dailyUsage > 0 ? consumable.currentStock / consumable.dailyUsage : 999;
    const bestSupplier = gameState.suppliers
      .filter((s) => s.categories.includes(consumable.category))
      .sort((a, b) => {
        const aScore = (a.reliability * 0.4) + ((1 - a.leadTime / 10) * 0.35) + ((1 - a.priceMultiplier) * 0.25);
        const bScore = (b.reliability * 0.4) + ((1 - b.leadTime / 10) * 0.35) + ((1 - b.priceMultiplier) * 0.25);
        return bScore - aScore;
      })[0];

    const isCorrect = supplier.id === bestSupplier.id;
    let errorType: ErrorType | undefined;
    if (!isCorrect) {
      if (supplier.leadTime >= daysUntilShortage) {
        errorType = 'LEAD_TIME_MISJUDGMENT';
      } else {
        errorType = 'WRONG_SUPPLIER';
      }
    }

    const step: GameStep = {
      type: 'SUPPLIER_SELECT',
      gameDay: gameState.gameDay,
      timestamp: Date.now(),
      stepIndex: gameState.stepCounter,
      data: {
        consumableId: consumable.id,
        chosenSupplierId: supplier.id,
        correctSupplierId: bestSupplier.id,
      } as SupplierSelectData,
      isCorrect,
      errorType,
      timeSpent: Date.now() - this.stepStartTime,
    };
    gameState.recordStep(step);
    this.showStepFeedback(isCorrect, errorType);
    this.updateHUD();

    this.time.delayedCall(1000, () => {
      this.registry.set('selectedSupplier', supplier);
      this.registry.set('selectedConsumable', consumable);
      this.startPhase('REQUISITION');
    });
  }

  private renderRequisition(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const panelY = 70;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 0.95);
    panelBg.fillRoundedRect(30, panelY, width - 60, 350, 12);
    this.phasePanel.add(panelBg);

    const consumable = this.registry.get('selectedConsumable') as typeof gameState.consumables[0];
    const supplier = this.registry.get('selectedSupplier') as typeof gameState.suppliers[0];

    if (!consumable || !supplier) {
      this.startPhase('INVENTORY_CHECK');
      return;
    }

    const shortage = consumable.maxStock - consumable.currentStock;
    const daysUntilShortage = consumable.dailyUsage > 0 ? consumable.currentStock / consumable.dailyUsage : 999;
    const neededForSafety = Math.max(0, consumable.safetyStock * 2 - consumable.currentStock + consumable.dailyUsage * supplier.leadTime);

    this.phasePanel.add(
      this.add.text(width / 2, panelY + 25, `领用操作 - ${consumable.name}`, {
        fontSize: '18px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    const infoLines = [
      `当前库存: ${consumable.currentStock}${consumable.unit}`,
      `安全库存: ${consumable.safetyStock}${consumable.unit}`,
      `日消耗: ${consumable.dailyUsage}${consumable.unit}/天`,
      `预计${daysUntilShortage.toFixed(1)}天后断货`,
      `供应商: ${supplier.name}（${supplier.leadTime}天到货）`,
    ];
    infoLines.forEach((line, i) => {
      this.phasePanel.add(
        this.add.text(60, panelY + 60 + i * 22, line, {
          fontSize: '13px', color: '#b0bec5', fontFamily: 'Arial',
        })
      );
    });

    this.phasePanel.add(
      this.add.text(60, panelY + 180, `建议领用量: ${Math.ceil(neededForSafety)}${consumable.unit}`, {
        fontSize: '14px', color: '#ffb74d', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    const qtyOptions = [
      { label: '少量补货', qty: supplier.minOrderQty },
      { label: '安全补货', qty: Math.ceil(neededForSafety) },
      { label: '满仓补货', qty: shortage },
    ].filter((opt) => opt.qty > 0);

    qtyOptions.forEach((opt, i) => {
      const btn = this.add.text(width / 2 - 120 + i * 120, panelY + 220, `${opt.label}\n${opt.qty}${consumable.unit}`, {
        fontSize: '12px', color: '#ffffff', fontFamily: 'Arial',
        backgroundColor: '#2d5f8a',
        padding: { x: 8, y: 6 },
        align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#3a7cb8' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#2d5f8a' }));
      btn.on('pointerdown', () => {
        this.handleRequisition(supplier, consumable, opt.qty, neededForSafety);
      });
      this.phasePanel.add(btn);
    });
  }

  private handleRequisition(
    supplier: typeof gameState.suppliers[0],
    consumable: typeof gameState.consumables[0],
    qty: number,
    correctQty: number,
  ): void {
    let isCorrect = true;
    let errorType: ErrorType | undefined;

    if (qty < supplier.minOrderQty) {
      isCorrect = false;
      errorType = 'UNDER_ORDER';
    } else if (qty > consumable.maxStock - consumable.currentStock) {
      isCorrect = false;
      errorType = 'OVER_ORDER';
    } else if (qty < correctQty * 0.8) {
      isCorrect = false;
      errorType = 'UNDER_ORDER';
    }

    gameState.requisitionHistory.push({
      id: `req_${Date.now()}`,
      consumableId: consumable.id,
      supplierId: supplier.id,
      qty,
      timestamp: Date.now(),
      gameDay: gameState.gameDay,
      stepIndex: gameState.stepCounter,
      isCorrect,
      arrived: false,
      errorType,
    });

    const step: GameStep = {
      type: 'REQUISITION',
      gameDay: gameState.gameDay,
      timestamp: Date.now(),
      stepIndex: gameState.stepCounter,
      data: {
        consumableId: consumable.id,
        supplierId: supplier.id,
        orderQty: qty,
        correctQty,
      } as RequisitionData,
      isCorrect,
      errorType,
      timeSpent: Date.now() - this.stepStartTime,
    };
    gameState.recordStep(step);
    this.showStepFeedback(isCorrect, errorType);
    this.updateHUD();

    this.time.delayedCall(1000, () => {
      this.startPhase('INVENTORY_CHECK');
    });
  }

  private renderInventoryCheck(): void {
    const width = this.scale.width;
    const panelY = 70;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 0.95);
    panelBg.fillRoundedRect(30, panelY, width - 60, 320, 12);
    this.phasePanel.add(panelBg);

    const lowStockItems = gameState.consumables.filter((c) => c.currentStock <= c.safetyStock * 1.5);
    const pool = lowStockItems.length > 0 ? lowStockItems : gameState.consumables;
    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    const actualQty = randomItem.currentStock;
    const discrepancy = Math.random() > 0.5 ? Math.floor(Math.random() * 8) : 0;
    const reportedQty = actualQty + discrepancy;

    this.phasePanel.add(
      this.add.text(width / 2, panelY + 25, '盘点核对', {
        fontSize: '18px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    this.phasePanel.add(
      this.add.text(width / 2, panelY + 55, `耗材: ${randomItem.name}`, {
        fontSize: '14px', color: '#b0bec5', fontFamily: 'Arial',
      }).setOrigin(0.5)
    );

    this.phasePanel.add(
      this.add.text(width / 2, panelY + 85, `系统记录: ${reportedQty}${randomItem.unit}`, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0.5)
    );

    this.phasePanel.add(
      this.add.text(width / 2, panelY + 115, '实际盘点数量是否与系统一致？', {
        fontSize: '14px', color: '#ffb74d', fontFamily: 'Arial',
      }).setOrigin(0.5)
    );

    const btnYes = this.add.text(width / 2 - 80, panelY + 160, '一致', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#27ae60',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const btnNo = this.add.text(width / 2 + 80, panelY + 160, '有差异', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#c0392b',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnYes.on('pointerdown', () => {
      const hasDiscrepancy = discrepancy !== 0;
      const isCorrect = !hasDiscrepancy;
      this.handleInventoryCheck(randomItem.id, reportedQty, actualQty, isCorrect, hasDiscrepancy ? 'INVENTORY_MISMATCH' : undefined);
    });

    btnNo.on('pointerdown', () => {
      const isCorrect = discrepancy !== 0;
      this.handleInventoryCheck(randomItem.id, reportedQty, actualQty, isCorrect, discrepancy === 0 ? 'INVENTORY_MISMATCH' : undefined);
    });

    this.phasePanel.add([btnYes, btnNo]);

    if (discrepancy !== 0) {
      const hint = this.add.text(width / 2, panelY + 210, '💡 提示：仔细核对实物数量', {
        fontSize: '12px', color: '#78909c', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.phasePanel.add(hint);
    }
  }

  private handleInventoryCheck(
    consumableId: string, reportedQty: number, actualQty: number,
    isCorrect: boolean, errorType?: ErrorType
  ): void {
    const step: GameStep = {
      type: 'INVENTORY_CHECK',
      gameDay: gameState.gameDay,
      timestamp: Date.now(),
      stepIndex: gameState.stepCounter,
      data: {
        consumableId,
        reportedQty,
        actualQty,
      } as InventoryCheckData,
      isCorrect,
      errorType,
      timeSpent: Date.now() - this.stepStartTime,
    };
    gameState.recordStep(step);
    this.showStepFeedback(isCorrect, errorType);

    this.time.delayedCall(1000, () => {
      this.startPhase('DAY_SUMMARY');
    });
  }

  private renderDaySummary(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const panelY = 70;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 0.95);
    panelBg.fillRoundedRect(30, panelY, width - 60, height - panelY - 100, 12);
    this.phasePanel.add(panelBg);

    this.phasePanel.add(
      this.add.text(width / 2, panelY + 25, `第 ${gameState.gameDay + 1} 天总结`, {
        fontSize: '20px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    const todaySteps = gameState.currentSession!.steps.filter(
      (s) => s.gameDay === gameState.gameDay
    );
    const correctCount = todaySteps.filter((s) => s.isCorrect).length;
    const wrongCount = todaySteps.filter((s) => !s.isCorrect).length;

    const summaryLines: { text: string; color: string }[] = [
      { text: `操作正确: ${correctCount}次`, color: '#b0bec5' },
      { text: `操作失误: ${wrongCount}次`, color: wrongCount > 0 ? '#ff5722' : '#b0bec5' },
      { text: `当前得分: ${gameState.score}`, color: '#b0bec5' },
      { text: '', color: '#b0bec5' },
      { text: '库存状态:', color: '#b0bec5' },
    ];
    gameState.consumables.forEach((c) => {
      const status = c.currentStock <= c.safetyStock ? '⚠️ 低于安全线' : c.currentStock <= c.safetyStock * 1.5 ? '⚡ 接近安全线' : '✅ 正常';
      const color = c.currentStock <= c.safetyStock ? '#ff5722' : c.currentStock <= c.safetyStock * 1.5 ? '#ffb74d' : '#b0bec5';
      summaryLines.push({ text: `  ${c.name}: ${c.currentStock}${c.unit} ${status}`, color });
    });

    const pendingOrders = gameState.requisitionHistory.filter((r) => !r.arrived);
    if (pendingOrders.length > 0) {
      summaryLines.push({ text: '', color: '#b0bec5' });
      summaryLines.push({ text: '在途订单:', color: '#4fc3f7' });
      pendingOrders.forEach((r) => {
        const c = gameState.consumables.find((item) => item.id === r.consumableId);
        const s = gameState.suppliers.find((sup) => sup.id === r.supplierId);
        const daysLeft = s ? s.leadTime - (gameState.gameDay - r.gameDay) : '?';
        summaryLines.push({ text: `  ${c?.name || r.consumableId}: ${r.qty}${c?.unit || ''} 预计${daysLeft}天后到货`, color: '#81c784' });
      });
    }

    summaryLines.forEach((item, i) => {
      this.phasePanel.add(
        this.add.text(60, panelY + 60 + i * 20, item.text, {
          fontSize: '12px', color: item.color, fontFamily: 'Arial',
        })
      );
    });

    const nextBtn = this.add.text(width / 2, panelY + height - panelY - 140, '进入下一天', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#27ae60',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    nextBtn.on('pointerdown', () => {
      gameState.advanceDay();
      this.updateHUD();

      if (gameState.isGameOver()) {
        gameState.endSession();
        this.scene.start('SettlementScene');
      } else {
        this.selectedConsumableIndex = 0;
        this.phasePanel.removeAll(true);
        this.showShortageAlerts();
        this.startPhase('SUPPLIER_SELECT');
      }
    });
    this.phasePanel.add(nextBtn);
  }

  private showStepFeedback(isCorrect: boolean, errorType?: ErrorType): void {
    const width = this.scale.width;
    const feedback = this.add.text(width / 2, this.scale.height / 2, isCorrect ? '✓ 正确' : `✗ ${errorType || '错误'}`, {
      fontSize: '28px',
      color: isCorrect ? '#4caf50' : '#e74c3c',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: feedback,
      alpha: { from: 1, to: 0 },
      y: feedback.y - 40,
      duration: 1000,
      onComplete: () => feedback.destroy(),
    });
  }

  private updateHUD(): void {
    const dayText = this.registry.get('hud_dayText') as Phaser.GameObjects.Text;
    const scoreText = this.registry.get('hud_scoreText') as Phaser.GameObjects.Text;
    const stockFill = this.registry.get('stockBarFill') as Phaser.GameObjects.Graphics;
    const stockW = this.registry.get('stockBarW') as number;
    const stockH = this.registry.get('stockBarH') as number;

    if (dayText) dayText.setText(`第 ${gameState.gameDay + 1} 天`);
    if (scoreText) scoreText.setText(`得分: ${gameState.score}`);

    if (stockFill) {
      const totalStock = gameState.consumables.reduce((a, c) => a + c.currentStock, 0);
      const totalMax = gameState.consumables.reduce((a, c) => a + c.maxStock, 0);
      const ratio = totalStock / totalMax;
      stockFill.clear();
      const color = ratio < 0.2 ? 0xe74c3c : ratio < 0.4 ? 0xff9800 : 0x4fc3f7;
      stockFill.fillStyle(color, 1);
      stockFill.fillRoundedRect(1, 1, (stockW - 2) * ratio, stockH - 2, 2);
    }

    gameState.consumables.forEach((c) => {
      const qtyText = this.registry.get(`qty_${c.id}`) as Phaser.GameObjects.Text;
      if (qtyText) qtyText.setText(`${c.currentStock}${c.unit}`);

      const countdownText = this.registry.get(`countdown_${c.id}`) as Phaser.GameObjects.Text;
      if (countdownText) {
        const daysLeft = c.dailyUsage > 0 ? Math.floor(c.currentStock / c.dailyUsage) : 999;
        if (daysLeft <= 3) {
          countdownText.setText(`${daysLeft}天后断货`);
          countdownText.setColor(daysLeft <= 1 ? '#ff5722' : '#ffab91');
        } else {
          countdownText.setText('');
        }
      }
    });

    this.updateWarningIndicators();
  }

  private updateWarningIndicators(): void {
    for (const c of gameState.consumables) {
      const existing = this.registry.get(`warn_${c.id}`) as Phaser.GameObjects.Image | null;
      if (c.currentStock <= c.safetyStock * 1.5 && !existing) {
        const idx = gameState.consumables.indexOf(c);
        const width = this.scale.width;
        const shelfWidth = 120;
        const gap = 15;
        const startX = (width - (gameState.consumables.length * (shelfWidth + gap) - gap)) / 2;
        const x = startX + idx * (shelfWidth + gap) + shelfWidth / 2;
        this.addWarningIndicator(x, this.scale.height - 230, c.id);
      }
      if (existing) {
        if (gameState.shortageImminent.has(c.id)) {
          existing.setTexture('danger_icon');
        } else {
          existing.setTexture('warning_icon');
        }
      }
    }
  }

  update(): void {
    for (const c of gameState.consumables) {
      const body = this.itemBodies.get(c.id);
      if (body) {
        const ratio = c.currentStock / c.maxStock;
        const targetHeight = Math.max(10, ratio * 60);
        const currentBounds = (body as any).bounds;
        if (currentBounds) {
          const currentHeight = currentBounds.max.y - currentBounds.min.y;
          if (Math.abs(currentHeight - targetHeight) > 5) {
            const scale = targetHeight / Math.max(1, currentHeight);
            this.matter.body.scale(body, 1, scale);
          }
        }
      }
    }
  }
}
