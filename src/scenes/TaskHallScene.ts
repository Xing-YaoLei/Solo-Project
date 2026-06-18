import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { taskSystem } from '../systems/TaskSystem';
import { Task, TaskStatus } from '../models';

export class TaskHallScene extends BaseScene {
  private taskCards: Map<string, UIElement> = new Map();
  private tasksContainer: Phaser.GameObjects.Container | null = null;
  private infoPanel: Phaser.GameObjects.Container | null = null;
  private selectedTaskId: string | null = null;

  constructor() {
    super('TaskHallScene');
  }

  create(): void {
    super.create();

    this.createBackground();
    this.createHeader();
    this.createTaskList();
    this.createInfoPanel();
    this.createFooter();

    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'TaskHallScene' });
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(width / 2, 50, '任务大厅', {
      fontSize: 28,
      fontStyle: 'bold',
    });

    const backButton = this.createButton({
      x: 80,
      y: 50,
      width: 100,
      height: 40,
      text: '返回',
      variant: 'outline',
      onClick: () => this.handleBack(),
    });
    this.uiElements.set('backButton', backButton);

    const playerInfo = this.saveSystem.getCurrentSave();
    if (playerInfo) {
      this.createText(width - 150, 40, `总得分: ${playerInfo.totalScore}`, {
        fontSize: 16,
        color: COLORS.ACCENT,
        origin: { x: 1, y: 0.5 },
      });

      this.createText(width - 150, 65, `完成: ${playerInfo.completedTasks.length} 个任务`, {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 1, y: 0.5 },
      });
    }

    const cornerDecorLeft = this.add.graphics();
    cornerDecorLeft.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorLeft.beginPath();
    cornerDecorLeft.moveTo(0, 90);
    cornerDecorLeft.lineTo(30, 90);
    cornerDecorLeft.lineTo(30, 80);
    cornerDecorLeft.strokePath();

    const cornerDecorRight = this.add.graphics();
    cornerDecorRight.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorRight.beginPath();
    cornerDecorRight.moveTo(width, 90);
    cornerDecorRight.lineTo(width - 30, 90);
    cornerDecorRight.lineTo(width - 30, 80);
    cornerDecorRight.strokePath();
  }

  private createTaskList(): void {
    const { width, height } = this.scale;

    this.tasksContainer = this.add.container(width * 0.35, height * 0.45);

    const listBg = this.add.rectangle(0, 0, width * 0.65, height * 0.75, COLORS.PANEL);
    listBg.setStrokeStyle(2, COLORS.PANEL_BORDER);
    this.tasksContainer.add(listBg);

    const listTitle = this.createText(0, -height * 0.35, '可用任务', {
      fontSize: 22,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });
    this.tasksContainer.add(listTitle);

    const tasks = taskSystem.getAvailableTasks();
    this.renderTaskCards(tasks);
  }

  private renderTaskCards(tasks: Task[]): void {
    if (!this.tasksContainer) return;

    const cardWidth = 600;
    const cardHeight = 120;
    const cardSpacing = 140;
    const startY = -200;

    tasks.forEach((task, index) => {
      const cardY = startY + index * cardSpacing;
      const card = this.createTaskCard(task, cardY, cardWidth, cardHeight);
      this.taskCards.set(task.id, card);
      this.tasksContainer!.add(card.container);

      card.container.setAlpha(0);
      card.container.setX(-100);
      this.tweens.add({
        targets: card.container,
        alpha: 1,
        x: 0,
        duration: 500,
        delay: index * 150,
        ease: 'Power3.easeOut',
      });
    });
  }

  private createTaskCard(task: Task, y: number, width: number, height: number): UIElement {
    const container = this.add.container(0, y);

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PRIMARY_DARK);
    bg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    const statusColor = this.getStatusColor(task.status);
    const statusBg = this.add.rectangle(-width / 2 + 60, 0, 4, height, statusColor);

    const difficultyStars = this.getDifficultyStars(task.difficulty);
    const difficultyText = this.add.text(-width / 2 + 90, -height / 2 + 25, difficultyStars, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: `#${COLORS.WARNING.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const title = this.add.text(-width / 2 + 90, 0, task.title, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: `#${COLORS.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const clientText = this.add.text(-width / 2 + 90, height / 2 - 25, `客户: ${task.clientName}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const budgetText = this.add.text(width / 2 - 20, -height / 2 + 25, `¥${task.budget.toLocaleString()}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: `#${COLORS.SUCCESS.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const durationText = this.add.text(width / 2 - 20, 0, `${task.duration}天`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5);

    const rewardText = this.add.text(width / 2 - 20, height / 2 - 25, `奖励: ¥${task.reward.toLocaleString()}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: `#${COLORS.ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5);

    container.add([bg, statusBg, difficultyText, title, clientText, budgetText, durationText, rewardText]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.fillColor = COLORS.PRIMARY_LIGHT;
      bg.strokeColor = COLORS.ACCENT;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });

    bg.on('pointerout', () => {
      bg.fillColor = COLORS.PRIMARY_DARK;
      bg.strokeColor = COLORS.PANEL_BORDER;
    });

    bg.on('pointerup', () => {
      this.selectTask(task);
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'click' });
    });

    return {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: (enabled: boolean) => {
        if (enabled) {
          bg.setInteractive({ useHandCursor: true });
          bg.setAlpha(1);
        } else {
          bg.disableInteractive();
          bg.setAlpha(0.5);
        }
      },
    };
  }

  private selectTask(task: Task): void {
    this.selectedTaskId = task.id;
    this.updateInfoPanel(task);
    this.highlightSelectedCard(task.id);
    this.emitEvent(GameEvent.TASK_SELECTED, { taskId: task.id });
  }

  private highlightSelectedCard(selectedId: string): void {
    this.taskCards.forEach((card, id) => {
      const container = card.container;
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (id === selectedId) {
        bg.strokeColor = COLORS.ACCENT;
        bg.lineWidth = 3;
      } else {
        bg.strokeColor = COLORS.PANEL_BORDER;
        bg.lineWidth = 2;
      }
    });
  }

  private createInfoPanel(): void {
    const { width, height } = this.scale;

    this.infoPanel = this.createPanel(width * 0.82, height * 0.45, 300, height * 0.75, '任务详情');

    const placeholderText = this.createText(width * 0.82, height * 0.45, '请选择一个任务\n查看详情', {
      fontSize: 18,
      color: COLORS.TEXT_DISABLED,
    });
    placeholderText.setWordWrapWidth(250);
    placeholderText.setAlign('center');

    this.infoPanel.add(placeholderText);
  }

  private updateInfoPanel(task: Task): void {
    if (!this.infoPanel) return;

    const { height } = this.scale;
    const panelX = this.infoPanel.x;
    const panelY = this.infoPanel.y;

    this.infoPanel.list
      .filter((obj) => obj !== this.infoPanel!.list[0] && obj !== this.infoPanel!.list[1])
      .forEach((obj) => obj.destroy());

    let currentY = panelY - height * 0.3 + 50;
    const lineSpacing = 45;

    const descLabel = this.createText(panelX - 130, currentY, '任务描述:', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0 },
    });

    const descText = this.createText(panelX - 130, currentY + 25, task.description, {
      fontSize: 14,
      color: COLORS.TEXT,
      origin: { x: 0, y: 0 },
    });
    descText.setWordWrapWidth(260);

    this.infoPanel.add([descLabel, descText]);
    currentY += 90;

    const clientLabel = this.createText(panelX - 130, currentY, '客户:', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0 },
    });
    const clientValue = this.createText(panelX - 70, currentY, task.clientName, {
      fontSize: 14,
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0 },
    });
    this.infoPanel.add([clientLabel, clientValue]);
    currentY += lineSpacing;

    const houseLabel = this.createText(panelX - 130, currentY, '户型:', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0 },
    });
    const houseValue = this.createText(panelX - 70, currentY, `${task.houseType} ${task.area}㎡`, {
      fontSize: 14,
      color: COLORS.TEXT,
      origin: { x: 0, y: 0 },
    });
    this.infoPanel.add([houseLabel, houseValue]);
    currentY += lineSpacing;

    const reqLabel = this.createText(panelX - 130, currentY, '客户要求:', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0 },
    });
    this.infoPanel.add(reqLabel);
    currentY += 30;

    task.requirements.forEach((req, i) => {
      const reqText = this.createText(panelX - 120, currentY + i * 25, `• ${req}`, {
        fontSize: 13,
        color: COLORS.TEXT,
        origin: { x: 0, y: 0 },
      });
      reqText.setWordWrapWidth(250);
      this.infoPanel!.add(reqText);
    });

    currentY += task.requirements.length * 25 + 30;

    const acceptButton = this.createButton({
      x: panelX,
      y: panelY + height * 0.3 - 60,
      width: 220,
      height: 50,
      text: '接受任务',
      variant: 'primary',
      onClick: () => this.handleAcceptTask(),
    });
    acceptButton.container.setAlpha(0);
    this.tweens.add({
      targets: acceptButton.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeIn',
    });
    this.uiElements.set('acceptButton', acceptButton);
    this.infoPanel.add(acceptButton.container);
  }

  private createFooter(): void {
    const { width, height } = this.scale;

    const footerBg = this.add.rectangle(width / 2, height - 30, width, 40, COLORS.PANEL);
    footerBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    this.createText(width / 2, height - 30, '点击任务卡片查看详情 | 接受任务后进入施工现场', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
    });

    const cornerDecorLeft = this.add.graphics();
    cornerDecorLeft.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorLeft.beginPath();
    cornerDecorLeft.moveTo(0, height - 50);
    cornerDecorLeft.lineTo(30, height - 50);
    cornerDecorLeft.lineTo(30, height - 40);
    cornerDecorLeft.strokePath();

    const cornerDecorRight = this.add.graphics();
    cornerDecorRight.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorRight.beginPath();
    cornerDecorRight.moveTo(width, height - 50);
    cornerDecorRight.lineTo(width - 30, height - 50);
    cornerDecorRight.lineTo(width - 30, height - 40);
    cornerDecorRight.strokePath();
  }

  private handleAcceptTask(): void {
    if (!this.selectedTaskId) return;

    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });

    const task = taskSystem.getTaskById(this.selectedTaskId);
    if (!task) return;

    taskSystem.acceptTask(this.selectedTaskId);
    this.saveSystem.addActiveTask(this.selectedTaskId);

    this.emitEvent(GameEvent.TASK_ACCEPTED, { taskId: this.selectedTaskId });

    this.transitionToScene('LevelSelectScene', { taskId: this.selectedTaskId });
  }

  private handleBack(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene('MainMenuScene');
  }

  private getStatusColor(status: TaskStatus): number {
    switch (status) {
      case TaskStatus.AVAILABLE:
        return COLORS.SUCCESS;
      case TaskStatus.IN_PROGRESS:
        return COLORS.WARNING;
      case TaskStatus.COMPLETED:
        return COLORS.TEXT_DISABLED;
      default:
        return COLORS.TEXT_DISABLED;
    }
  }

  private getDifficultyStars(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return '★☆☆ 简单';
      case 'medium':
        return '★★☆ 中等';
      case 'hard':
        return '★★★ 困难';
      default:
        return '☆☆☆ 未知';
    }
  }

  protected setupEventListeners(): void {
    this.addEventListener(GameEvent.TASK_SELECTED, (data: unknown) => {
      console.log('[TaskHallScene] Task selected:', data);
    });
  }

  destroy(): void {
    super.destroy();
  }
}
