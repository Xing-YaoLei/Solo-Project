import Phaser from 'phaser';
import { GameConfig, CARE_LEVELS } from '../config/GameConfig';
import { UIHelper } from '../utils/UIHelper';
import { DataManager, ElderProfile, Bed, LevelConfig, GameResult } from '../data/DataManager';
import { SoundManager } from '../data/SoundManager';
import { SettingsManager } from '../data/SettingsManager';

interface ElderCard {
  container: Phaser.GameObjects.Container;
  elder: ElderProfile;
  isSelected: boolean;
}

interface BedSlot {
  container: Phaser.GameObjects.Container;
  bed: Bed;
  occupantCard: Phaser.GameObjects.Container | null;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelConfig;
  private elders: ElderProfile[] = [];
  private beds: Bed[] = [];
  private elderCards: ElderCard[] = [];
  private bedSlots: BedSlot[] = [];
  private selectedElder: ElderCard | null = null;
  private timeRemaining: number = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private correctCount: number = 0;
  private errorCount: number = 0;
  private currentStreak: number = 0;
  private maxStreak: number = 0;
  private isGameOver: boolean = false;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private errorLabel!: Phaser.GameObjects.Text;
  private careLevelStats: { level: number; correct: number; total: number }[] = [];
  private keyboardSelectedIndex: number = -1;
  private keyboardMode: 'elders' | 'beds' = 'elders';
  private detailPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId: number }): void {
    const levelData = DataManager.getInstance().getLevel(data.levelId);
    if (!levelData) {
      this.scene.start('LevelSelectScene');
      return;
    }
    this.level = levelData;
    this.timeRemaining = levelData.timeLimit;
    this.correctCount = 0;
    this.errorCount = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.isGameOver = false;
    this.selectedElder = null;
    this.keyboardSelectedIndex = -1;
    this.keyboardMode = 'elders';
    this.careLevelStats = CARE_LEVELS.map((l: { id: number; name: string; color: number; description: string }) => ({ level: l.id, correct: 0, total: 0 }));
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    this.createBackground();
    this.createHUD();
    this.createGameArea();
    this.setupInput();
    this.startTimer();
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.COLORS.background, 1);
    bg.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a4e, 0.5);
    for (let x = 0; x < GameConfig.GAME_WIDTH; x += 40) {
      grid.lineBetween(x, 0, x, GameConfig.GAME_HEIGHT);
    }
    for (let y = 0; y < GameConfig.GAME_HEIGHT; y += 40) {
      grid.lineBetween(0, y, GameConfig.GAME_WIDTH, y);
    }
  }

  private createHUD(): void {
    const hudY = 50;

    UIHelper.createButton(
      this, 80, hudY, 80, 40, '返回',
      () => {
        if (this.timerEvent) this.timerEvent.remove();
        this.scene.start('LevelSelectScene');
      },
      { bgColor: 0x6b7280, fontSize: 16 }
    );

    const levelLabel = this.add.text(GameConfig.GAME_WIDTH / 2, 20, this.level.name, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    levelLabel.setOrigin(0.5);

    const levelDesc = this.add.text(GameConfig.GAME_WIDTH / 2, 48, this.level.description, {
      fontSize: '14px',
      color: '#888888'
    });
    levelDesc.setOrigin(0.5);

    this.timeText = this.add.text(GameConfig.GAME_WIDTH - 180, hudY, this.formatTime(this.timeRemaining), {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.timeText.setOrigin(1, 0.5);

    const timeIcon = this.add.text(GameConfig.GAME_WIDTH - 210, hudY, '⏱', {
      fontSize: '28px'
    });
    timeIcon.setOrigin(1, 0.5);

    this.scoreText = this.add.text(GameConfig.GAME_WIDTH / 2, 85, `正确: 0 / ${this.level.targetCorrect}`, {
      fontSize: '18px',
      color: GameConfig.COLORS.success.toString(16).padStart(6, '0')
    });
    this.scoreText.setOrigin(0.5);

    this.streakText = this.add.text(GameConfig.GAME_WIDTH / 2, 110, '', {
      fontSize: '16px',
      color: GameConfig.COLORS.warning.toString(16).padStart(6, '0')
    });
    this.streakText.setOrigin(0.5);

    this.errorLabel = this.add.text(30, GameConfig.GAME_HEIGHT - 30, `错误: 0`, {
      fontSize: '18px',
      color: GameConfig.COLORS.error.toString(16).padStart(6, '0')
    });
  }

  private createGameArea(): void {
    this.elders = DataManager.getInstance().generateElders(this.level);
    const bedWidth = 120;
    const bedHeight = 100;
    this.beds = DataManager.getInstance().generateBeds(this.level, 540, 160, bedWidth, bedHeight);

    this.createBedArea();
    this.createElderQueue();
    this.createLegend();
    this.createHint();
  }

  private createBedArea(): void {
    const bedTitle = this.add.text(700, 140, '床位区域 - 选择匹配床位', {
      fontSize: '18px',
      color: '#aaaaaa',
      fontStyle: 'bold'
    });
    bedTitle.setOrigin(0.5);

    this.beds.forEach((bed, index) => {
      this.createBedSlot(bed, index);
    });
  }

  private createBedSlot(bed: Bed, index: number): void {
    const container = this.add.container(bed.x + bed.width / 2, bed.y + bed.height / 2);
    container.setSize(bed.width, bed.height);

    const bg = this.add.graphics();
    this.updateBedVisual(bg, bed, false);

    const careLevel = CARE_LEVELS.find((l: { id: number; name: string; color: number; description: string }) => l.id === bed.requiredCareLevel);
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(careLevel?.color ?? 0x888888, 1);
    levelBadge.fillRoundedRect(-bed.width / 2 + 8, -bed.height / 2 + 8, 50, 22, 6);

    const levelText = this.add.text(-bed.width / 2 + 33, -bed.height / 2 + 19, `${careLevel?.name ?? '?'}`, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    levelText.setOrigin(0.5);

    const medIcons: Phaser.GameObjects.Text[] = [];
    bed.requiredMedicines.slice(0, 3).forEach((medId, i) => {
      const med = GameConfig.MEDICINES.find((m: { id: string; name: string; icon: string; color: number }) => m.id === medId);
      const icon = this.add.text(-bed.width / 2 + 12 + i * 22, -bed.height / 2 + 42, med?.icon ?? '💊', {
        fontSize: '18px'
      });
      medIcons.push(icon);
    });

    const bedLabel = this.add.text(0, bed.height / 2 - 15, `${index + 1}号床`, {
      fontSize: '14px',
      color: '#cccccc'
    });
    bedLabel.setOrigin(0.5);

    container.add([bg, levelBadge, levelText, ...medIcons, bedLabel]);
    container.setName(`bed_${index}`);

    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, bed.width, bed.height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      if (!this.isGameOver) {
        this.input.setDefaultCursor('pointer');
        this.updateBedVisual(bg, bed, true);
      }
    });

    container.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      this.updateBedVisual(bg, bed, false);
    });

    container.on('pointerdown', () => {
      if (!this.isGameOver) {
        this.handleBedSelect(index);
      }
    });

    this.bedSlots.push({ container, bed, occupantCard: null });
    UIHelper.animateIn(this, container, 200 + index * 80);
  }

  private updateBedVisual(graphics: Phaser.GameObjects.Graphics, bed: Bed, isHovered: boolean): void {
    const slot = this.bedSlots.find(s => s.bed === bed);
    const isOccupied = slot?.occupantCard !== null;
    
    graphics.clear();
    const baseColor = isOccupied ? GameConfig.COLORS.bedOccupied : GameConfig.COLORS.bedEmpty;
    const color = isHovered ? Phaser.Display.Color.IntegerToColor(baseColor).lighten(20).color : baseColor;
    
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(-bed.width / 2, -bed.height / 2, bed.width, bed.height, 10);
    
    graphics.lineStyle(2, isHovered ? GameConfig.COLORS.primary : 0x3a4a6e, 1);
    graphics.strokeRoundedRect(-bed.width / 2, -bed.height / 2, bed.width, bed.height, 10);

    if (!isOccupied) {
      const pillow = this.add.graphics();
      pillow.fillStyle(0xffffff, 0.3);
      pillow.fillRoundedRect(-bed.width / 2 + 10, -bed.height / 2 + 35, 25, 15, 4);
    }
  }

  private createElderQueue(): void {
    const queueTitle = this.add.text(200, 140, '待入住老人 - 点击查看详情', {
      fontSize: '18px',
      color: '#aaaaaa',
      fontStyle: 'bold'
    });
    queueTitle.setOrigin(0.5);

    const cardWidth = 140;
    const cardHeight = 170;
    const gap = 15;

    this.elders.forEach((elder, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 110 + col * (cardWidth + gap) + cardWidth / 2;
      const y = 180 + row * (cardHeight + gap) + cardHeight / 2;

      this.createElderCard(x, y, cardWidth, cardHeight, elder, index);
    });
  }

  private createElderCard(x: number, y: number, width: number, height: number, elder: ElderProfile, index: number): void {
    const container = this.add.container(x, y);
    container.setSize(width, height);

    const bg = this.add.graphics();
    this.updateElderCardVisual(bg, width, height, false);

    const avatar = this.add.text(0, -height / 2 + 35, elder.avatar, {
      fontSize: '40px'
    });
    avatar.setOrigin(0.5);

    const nameText = this.add.text(0, -height / 2 + 70, elder.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);

    const ageText = this.add.text(0, -height / 2 + 95, `${elder.age}岁`, {
      fontSize: '13px',
      color: '#aaaaaa'
    });
    ageText.setOrigin(0.5);

    const careLevel = CARE_LEVELS.find((l: { id: number; name: string; color: number; description: string }) => l.id === elder.careLevel);
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(careLevel?.color ?? 0x888888, 1);
    levelBadge.fillRoundedRect(-40, -height / 2 + 110, 80, 22, 6);

    const levelText = this.add.text(0, -height / 2 + 121, careLevel?.name ?? '?', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    levelText.setOrigin(0.5);

    const medIcon = this.add.text(-width / 2 + 15, height / 2 - 25, `💊${elder.medicines.length}`, {
      fontSize: '14px',
      color: '#88ccff'
    });

    const condIcon = this.add.text(width / 2 - 15, height / 2 - 25, `🩺${elder.conditions.length}`, {
      fontSize: '14px',
      color: '#ffaa88'
    });
    condIcon.setOrigin(1, 0);

    container.add([bg, avatar, nameText, ageText, levelBadge, levelText, medIcon, condIcon]);
    container.setName(`elder_${index}`);

    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      if (!this.isGameOver) {
        this.input.setDefaultCursor('pointer');
        this.updateElderCardVisual(bg, width, height, true);
      }
    });

    container.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      if (!this.elderCards.find(c => c.container === container)?.isSelected) {
        this.updateElderCardVisual(bg, width, height, false);
      }
    });

    container.on('pointerdown', () => {
      if (!this.isGameOver) {
        this.handleElderSelect(index);
      }
    });

    this.elderCards.push({ container, elder, isSelected: false });
    UIHelper.animateIn(this, container, 300 + index * 100);
  }

  private updateElderCardVisual(graphics: Phaser.GameObjects.Graphics, width: number, height: number, isHighlighted: boolean): void {
    graphics.clear();
    const color = isHighlighted ? 0x2a3a5e : GameConfig.COLORS.panel;
    graphics.fillStyle(color, 0.95);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    
    graphics.lineStyle(isHighlighted ? 3 : 1, isHighlighted ? GameConfig.COLORS.primary : 0x3a4a6e, 1);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
  }

  private createLegend(): void {
    const legendY = GameConfig.GAME_HEIGHT - 70;
    const legendX = GameConfig.GAME_WIDTH / 2;

    const legendLabel = this.add.text(legendX, legendY - 25, '护理等级对照：', {
      fontSize: '14px',
      color: '#888888'
    });
    legendLabel.setOrigin(0.5);

    CARE_LEVELS.forEach((level: { id: number; name: string; color: number; description: string }, i: number) => {
      const x = legendX - 250 + i * 130;
      const badge = this.add.graphics();
      badge.fillStyle(level.color, 1);
      badge.fillRoundedRect(x, legendY, 60, 24, 6);

      const text = this.add.text(x + 30, legendY + 12, level.name, {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      text.setOrigin(0.5);
    });
  }

  private createHint(): void {
    const hintText = this.add.text(GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT - 120,
      '需同时匹配护理等级 + 用药配置  |  🖱 点击老人查看档案 → 点击匹配床位入住  |  ⌨️ 方向键选择 空格确认',
      {
        fontSize: '13px',
        color: '#666666'
      }
    );
    hintText.setOrigin(0.5);
  }

  private checkMedicineMatch(elder: ElderProfile, bed: Bed): boolean {
    const elderMedIds = new Set(elder.medicines.map(m => m.id));
    const bedMedIds = new Set(bed.requiredMedicines);
    for (const medId of elderMedIds) {
      if (!bedMedIds.has(medId)) {
        return false;
      }
    }
    return true;
  }

  private handleElderSelect(index: number): void {
    const elderCard = this.elderCards[index];
    if (!elderCard || !elderCard.container.active) return;

    this.elderCards.forEach(card => {
      card.isSelected = false;
      const bg = card.container.list[0] as Phaser.GameObjects.Graphics;
      this.updateElderCardVisual(bg, card.container.width, card.container.height, false);
    });

    elderCard.isSelected = true;
    const selectedBg = elderCard.container.list[0] as Phaser.GameObjects.Graphics;
    this.updateElderCardVisual(selectedBg, elderCard.container.width, elderCard.container.height, true);

    this.selectedElder = elderCard;
    this.keyboardSelectedIndex = index;
    this.keyboardMode = 'elders';

    SoundManager.getInstance().playClick();
    this.showElderDetail(elderCard.elder);
  }

  private handleBedSelect(index: number): void {
    if (!this.selectedElder) {
      this.flashHint('请先选择一位老人！');
      return;
    }

    const bedSlot = this.bedSlots[index];
    if (bedSlot.occupantCard) {
      this.flashHint('该床位已被占用！');
      return;
    }

    this.processAssignment(this.selectedElder, bedSlot);
  }

  private processAssignment(elderCard: ElderCard, bedSlot: BedSlot): void {
    const elder = elderCard.elder;
    const bed = bedSlot.bed;
    const careLevelMatch = elder.careLevel === bed.requiredCareLevel;
    const medicineMatch = this.checkMedicineMatch(elder, bed);
    const isCorrect = careLevelMatch && medicineMatch;

    const stat = this.careLevelStats.find(s => s.level === bed.requiredCareLevel);
    if (stat) stat.total++;

    if (isCorrect) {
      this.correctCount++;
      this.currentStreak++;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
      if (stat) stat.correct++;
      
      SoundManager.getInstance().playSuccess();
      UIHelper.flashSuccess(this, bedSlot.container);
      
      this.placeElderInBed(elderCard, bedSlot);
      this.updateHUD();

      if (this.currentStreak >= 3) {
        this.streakText.setText(`🔥 连续正确 ${this.currentStreak}！`);
      }

      if (this.correctCount >= this.level.targetCorrect) {
        this.endGame(true);
        return;
      }
    } else {
      this.errorCount++;
      this.currentStreak = 0;
      
      SoundManager.getInstance().playError();
      UIHelper.flashError(this, bedSlot.container);
      UIHelper.shake(this, bedSlot.container);
      this.updateHUD();
      this.streakText.setText('');

      UIHelper.shake(this, elderCard.container);

      let errorMsg = '';
      if (!careLevelMatch && !medicineMatch) {
        errorMsg = '护理等级和用药都不匹配！';
      } else if (!careLevelMatch) {
        errorMsg = `护理等级不匹配！需要${CARE_LEVELS.find((l: { id: number; name: string; color: number; description: string }) => l.id === bed.requiredCareLevel)?.name}级护理`;
      } else {
        errorMsg = '用药配置不匹配！床位缺少所需药物';
      }
      this.showFeedback(errorMsg, false);
    }

    this.hideElderDetail();
    this.selectedElder = null;
    this.elderCards.forEach(card => {
      card.isSelected = false;
      const bg = card.container.list[0] as Phaser.GameObjects.Graphics;
      this.updateElderCardVisual(bg, card.container.width, card.container.height, false);
    });
  }

  private placeElderInBed(elderCard: ElderCard, bedSlot: BedSlot): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    const targetX = bedSlot.container.x;
    const targetY = bedSlot.container.y;

    elderCard.container.x = targetX;
    elderCard.container.y = targetY;
    elderCard.container.setScale(0.6);
    elderCard.container.disableInteractive();

    if (multiplier > 0) {
      this.tweens.add({
        targets: elderCard.container,
        scale: 0.6,
        duration: 200 * multiplier,
        ease: 'Back.easeOut'
      });
    }

    bedSlot.occupantCard = elderCard.container;

    const bedBg = bedSlot.container.list[0] as Phaser.GameObjects.Graphics;
    this.updateBedVisual(bedBg, bedSlot.bed, false);

    if (this.matter && multiplier > 0) {
      this.add.particles(targetX, targetY, undefined, {
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: GameConfig.COLORS.success,
        lifespan: 500 * multiplier,
        quantity: 10
      });
    }
  }

  private showElderDetail(elder: ElderProfile): void {
    this.hideElderDetail();

    const panelWidth = 380;
    const panelHeight = 450;
    const panelX = GameConfig.GAME_WIDTH - panelWidth / 2 - 20;
    const panelY = GameConfig.GAME_HEIGHT / 2 + 20;

    this.detailPanel = UIHelper.createPanel(this, panelX, panelY, panelWidth, panelHeight, {
      hasBorder: true,
      borderColor: GameConfig.COLORS.primary
    });

    const items: Phaser.GameObjects.GameObject[] = [...this.detailPanel.list];

    const title = this.add.text(0, -panelHeight / 2 + 30, '📋 老人档案', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    items.push(title);

    const avatar = this.add.text(-panelWidth / 2 + 60, -panelHeight / 2 + 80, elder.avatar, {
      fontSize: '50px'
    });
    avatar.setOrigin(0.5);
    items.push(avatar);

    const nameText = this.add.text(-panelWidth / 2 + 130, -panelHeight / 2 + 65, elder.name, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    items.push(nameText);

    const ageText = this.add.text(-panelWidth / 2 + 130, -panelHeight / 2 + 95, `${elder.age}岁 · ${elder.gender === 'female' ? '女' : '男'}`, {
      fontSize: '16px',
      color: '#aaaaaa'
    });
    items.push(ageText);

    const careLevel = CARE_LEVELS.find((l: { id: number; name: string; color: number; description: string }) => l.id === elder.careLevel);
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(careLevel?.color ?? 0x888888, 1);
    levelBadge.fillRoundedRect(-panelWidth / 2 + 130, -panelHeight / 2 + 115, 90, 28, 8);
    items.push(levelBadge);

    const levelText = this.add.text(-panelWidth / 2 + 175, -panelHeight / 2 + 129, `${careLevel?.name ?? '?'}护理`, {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    levelText.setOrigin(0.5);
    items.push(levelText);

    const condLabel = this.add.text(0, -panelHeight / 2 + 175, '健康状况：', {
      fontSize: '16px',
      color: '#cccccc',
      fontStyle: 'bold'
    });
    condLabel.setOrigin(0, 0.5);
    condLabel.x = -panelWidth / 2 + 25;
    items.push(condLabel);

    elder.conditions.forEach((cond, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const condBadge = this.add.graphics();
      condBadge.fillStyle(0x3a4a6e, 1);
      condBadge.fillRoundedRect(-panelWidth / 2 + 25 + col * 165, -panelHeight / 2 + 195 + row * 28, 155, 24, 6);
      items.push(condBadge);

      const condText = this.add.text(-panelWidth / 2 + 102 + col * 165, -panelHeight / 2 + 207 + row * 28, cond, {
        fontSize: '13px',
        color: '#ffcc99'
      });
      condText.setOrigin(0.5);
      items.push(condText);
    });

    const medLabel = this.add.text(0, -panelHeight / 2 + 275, '用药清单：', {
      fontSize: '16px',
      color: '#cccccc',
      fontStyle: 'bold'
    });
    medLabel.setOrigin(0, 0.5);
    medLabel.x = -panelWidth / 2 + 25;
    items.push(medLabel);

    elder.medicines.forEach((med, i) => {
      if (i > 3) return;
      const y = -panelHeight / 2 + 295 + i * 32;
      
      const medIcon = this.add.text(-panelWidth / 2 + 25, y, med.icon, {
        fontSize: '20px'
      });
      items.push(medIcon);

      const medText = this.add.text(-panelWidth / 2 + 55, y, med.name, {
        fontSize: '14px',
        color: '#88ddff'
      });
      items.push(medText);

      const dosageText = this.add.text(-panelWidth / 2 + 160, y, med.dosage, {
        fontSize: '12px',
        color: '#888888'
      });
      items.push(dosageText);

      const freqText = this.add.text(panelWidth / 2 - 25, y, med.frequency, {
        fontSize: '12px',
        color: '#ffaa88'
      });
      freqText.setOrigin(1, 0);
      items.push(freqText);
    });

    const dietLabel = this.add.text(0, panelHeight / 2 - 70, '饮食要求：', {
      fontSize: '15px',
      color: '#cccccc',
      fontStyle: 'bold'
    });
    dietLabel.setOrigin(0, 0.5);
    dietLabel.x = -panelWidth / 2 + 25;
    items.push(dietLabel);

    const dietText = this.add.text(-panelWidth / 2 + 110, panelHeight / 2 - 70, elder.dietaryRestrictions.join(' · ') || '普食', {
      fontSize: '14px',
      color: '#aaddaa'
    });
    items.push(dietText);

    const hint = this.add.text(0, panelHeight / 2 - 30, '👉 选择左侧匹配床位入住', {
      fontSize: '14px',
      color: GameConfig.COLORS.warning.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    });
    hint.setOrigin(0.5);
    items.push(hint);

    this.detailPanel.add(items);
    UIHelper.animateIn(this, this.detailPanel, 200);
  }

  private hideElderDetail(): void {
    if (this.detailPanel) {
      const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
      if (multiplier > 0) {
        this.tweens.add({
          targets: this.detailPanel,
          alpha: 0,
          scale: 0.9,
          duration: 150 * multiplier,
          ease: 'Power2',
          onComplete: () => {
            this.detailPanel?.destroy();
            this.detailPanel = null;
          }
        });
      } else {
        this.detailPanel.destroy();
        this.detailPanel = null;
      }
    }
  }

  private showFeedback(message: string, isSuccess: boolean): void {
    const text = this.add.text(GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT / 2 - 50, message, {
      fontSize: '24px',
      color: isSuccess ? GameConfig.COLORS.success.toString(16).padStart(6, '0') : GameConfig.COLORS.error.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 20, y: 10 }
    });
    text.setOrigin(0.5);

    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier > 0) {
      this.tweens.add({
        targets: text,
        alpha: 0,
        y: text.y - 50,
        duration: 1500 * multiplier,
        delay: 500,
        ease: 'Power2',
        onComplete: () => text.destroy()
      });
    }
  }

  private flashHint(message: string): void {
    this.showFeedback(message, false);
    SoundManager.getInstance().playError();
  }

  private updateHUD(): void {
    this.scoreText.setText(`正确: ${this.correctCount} / ${this.level.targetCorrect}  |  错误: ${this.errorCount}`);
    
    if (this.errorLabel) {
      this.errorLabel.setText(`错误: ${this.errorCount}`);
    }

    if (this.errorCount >= 5) {
      this.endGame(false);
    }
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isGameOver) {
        if (event.key === 'Enter' || event.key === ' ') {
          this.scene.restart({ levelId: this.level.id });
        } else if (event.key === 'Escape') {
          this.scene.start('LevelSelectScene');
        }
        return;
      }

      if (event.key >= '1' && event.key <= '9') {
        const bedIndex = parseInt(event.key) - 1;
        if (bedIndex < this.bedSlots.length) {
          this.handleBedSelect(bedIndex);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          this.handleKeyboardNavigation(event.key);
          break;
        case ' ':
        case 'Enter':
          this.handleKeyboardConfirm();
          event.preventDefault();
          break;
        case 'Tab':
          this.keyboardMode = this.keyboardMode === 'elders' ? 'beds' : 'elders';
          this.keyboardSelectedIndex = 0;
          this.updateKeyboardSelection();
          event.preventDefault();
          break;
        case 'Escape':
          this.hideElderDetail();
          this.selectedElder = null;
          this.elderCards.forEach(card => {
            card.isSelected = false;
            const bg = card.container.list[0] as Phaser.GameObjects.Graphics;
            this.updateElderCardVisual(bg, card.container.width, card.container.height, false);
          });
          this.keyboardSelectedIndex = -1;
          this.updateKeyboardSelection();
          break;
      }
    });
  }

  private handleKeyboardNavigation(key: string): void {
    if (this.keyboardMode === 'elders') {
      const availableElders = this.elderCards.filter(c => c.container.input && c.container.input.enabled);
      if (availableElders.length === 0) return;

      let currentIdxInAvailable = availableElders.findIndex(c => c === this.elderCards[this.keyboardSelectedIndex]);
      if (currentIdxInAvailable === -1) currentIdxInAvailable = 0;

      const cols = 2;
      let newIdxInAvailable = currentIdxInAvailable;

      switch (key) {
        case 'ArrowRight':
          newIdxInAvailable = Math.min(currentIdxInAvailable + 1, availableElders.length - 1);
          break;
        case 'ArrowLeft':
          newIdxInAvailable = Math.max(currentIdxInAvailable - 1, 0);
          break;
        case 'ArrowDown':
          newIdxInAvailable = Math.min(currentIdxInAvailable + cols, availableElders.length - 1);
          break;
        case 'ArrowUp':
          newIdxInAvailable = Math.max(currentIdxInAvailable - cols, 0);
          break;
      }

      const selectedCard = availableElders[newIdxInAvailable];
      this.keyboardSelectedIndex = this.elderCards.indexOf(selectedCard);
    } else {
      const maxIndex = this.bedSlots.length - 1;
      if (this.keyboardSelectedIndex < 0) this.keyboardSelectedIndex = 0;
      const cols = Math.ceil(Math.sqrt(this.bedSlots.length));

      switch (key) {
        case 'ArrowRight':
          this.keyboardSelectedIndex = Math.min(this.keyboardSelectedIndex + 1, maxIndex);
          break;
        case 'ArrowLeft':
          this.keyboardSelectedIndex = Math.max(this.keyboardSelectedIndex - 1, 0);
          break;
        case 'ArrowDown':
          this.keyboardSelectedIndex = Math.min(this.keyboardSelectedIndex + cols, maxIndex);
          break;
        case 'ArrowUp':
          this.keyboardSelectedIndex = Math.max(this.keyboardSelectedIndex - cols, 0);
          break;
      }
    }

    this.updateKeyboardSelection();
  }

  private updateKeyboardSelection(): void {
    this.elderCards.forEach((card, i) => {
      const bg = card.container.list[0] as Phaser.GameObjects.Graphics;
      const isAvailable = card.container.input && card.container.input.enabled;
      const isSelected = this.keyboardMode === 'elders' && i === this.keyboardSelectedIndex && isAvailable;
      this.updateElderCardVisual(bg, card.container.width, card.container.height, isSelected || card.isSelected);
      if (!isAvailable) {
        card.container.setAlpha(0.5);
      } else {
        card.container.setAlpha(1);
      }
    });

    this.bedSlots.forEach((slot, i) => {
      const bg = slot.container.list[0] as Phaser.GameObjects.Graphics;
      const isKeyboardSelected = this.keyboardMode === 'beds' && i === this.keyboardSelectedIndex;
      if (isKeyboardSelected) {
        bg.clear();
        bg.fillStyle(0x3a5a8e, 1);
        bg.fillRoundedRect(-slot.bed.width / 2, -slot.bed.height / 2, slot.bed.width, slot.bed.height, 10);
        bg.lineStyle(3, GameConfig.COLORS.primary, 1);
        bg.strokeRoundedRect(-slot.bed.width / 2, -slot.bed.height / 2, slot.bed.width, slot.bed.height, 10);
      } else {
        this.updateBedVisual(bg, slot.bed, false);
      }
    });
  }

  private handleKeyboardConfirm(): void {
    if (this.keyboardMode === 'elders') {
      const availableCards = this.elderCards.filter(c => c.container.input && c.container.input.enabled);
      if (availableCards.length === 0) return;
      
      const card = this.elderCards[this.keyboardSelectedIndex];
      if (card && card.container.input && card.container.input.enabled) {
        this.handleElderSelect(this.keyboardSelectedIndex);
      }
    } else {
      if (this.keyboardSelectedIndex >= 0 && this.keyboardSelectedIndex < this.bedSlots.length) {
        this.handleBedSelect(this.keyboardSelectedIndex);
      }
    }
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        this.timeText.setText(this.formatTime(this.timeRemaining));

        if (this.timeRemaining <= 10) {
          this.timeText.setColor('#ff6b6b');
          if (this.timeRemaining > 0) {
            SoundManager.getInstance().playTick();
          }
        }

        if (this.timeRemaining <= 0) {
          this.endGame(false);
        }
      },
      loop: true
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private endGame(completed: boolean): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    const timeTaken = this.level.timeLimit - this.timeRemaining;
    const totalActions = this.correctCount + this.errorCount;
    const accuracy = totalActions > 0 ? this.correctCount / totalActions : 0;
    
    const timeRatio = Math.max(0, 1 - timeTaken / this.level.timeLimit);
    const speedScore = Math.round(timeRatio * 1000);
    const streakScore = this.maxStreak * 50;
    const accuracyScore = Math.round(accuracy * 1000);
    const totalScore = speedScore + streakScore + accuracyScore + this.correctCount * 100;

    if (completed) {
      SoundManager.getInstance().playLevelComplete();
      const nextLevel = DataManager.getInstance().getLevel(this.level.id + 1);
      if (nextLevel) {
        DataManager.getInstance().unlockLevel(this.level.id + 1);
      }
    } else {
      SoundManager.getInstance().playGameOver();
    }

    const result: GameResult = {
      levelId: this.level.id,
      levelName: this.level.name,
      completed,
      timeTaken,
      timeLimit: this.level.timeLimit,
      correctCount: this.correctCount,
      errorCount: this.errorCount,
      maxStreak: this.maxStreak,
      totalActions,
      careLevelMatches: [],
      accuracy,
      speedScore,
      streakScore,
      totalScore,
      care达标: this.careLevelStats
    };

    DataManager.getInstance().saveResult(result);

    this.time.delayedCall(800, () => {
      this.scene.start('ResultScene', { result, levelId: this.level.id });
    });
  }
}
