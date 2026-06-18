import Phaser from 'phaser';
import { BaseScene, COLORS, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { ProblemArea } from '../models';

interface TutorialStep {
  id: number;
  title: string;
  subtitle: string;
  content: string[];
  tips: string[];
  visualType: 'intro' | 'problem_types' | 'compare_view' | 'markers' | 'practice';
  exampleData?: {
    problemAreas?: ProblemArea[];
  };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: '📷 什么是验收照片',
    subtitle: '第一章：入门基础',
    content: [
      '验收照片是家装施工过程中，对各阶段工程质量进行可视化记录的重要工具。',
      '在本游戏中，你需要像一名真正的项目经理一样：',
      '  ① 深入工地现场，发现并拍摄问题照片',
      '  ② 在验收界面仔细对比每一张照片',
      '  ③ 找出所有隐藏的问题区域，避免后期返工',
      '越早发现问题，修复成本越低，项目得分越高！',
    ],
    tips: [
      '💡 提示：一张好的验收照片胜过千言万语',
      '💡 提示：常见问题往往藏在细节中',
    ],
    visualType: 'intro',
  },
  {
    id: 2,
    title: '🔍 认识六大问题类型',
    subtitle: '第二章：问题分类体系',
    content: [
      '在验收照片中，你可能遇到以下六类问题：',
    ],
    tips: [
      '💡 提示：安全隐患和质量问题扣分最重',
      '💡 提示：材料问题往往影响成本和工期',
    ],
    visualType: 'problem_types',
  },
  {
    id: 3,
    title: '📊 三种视图模式',
    subtitle: '第三章：对比分析技巧',
    content: [
      '为了更好地发现问题，系统提供了三种查看模式：',
      '  【实际照片】显示施工现场的真实拍摄图，问题区域用红框标出',
      '  【标准对照】展示合格工程的标准图，用于对比参考',
      '  【对比视图】左右并排显示，一眼就能看出差异',
      '建议先看对比视图锁定差异区域，再切回实际照片仔细查看每个问题点！',
    ],
    tips: [
      '💡 提示：对比视图是新手最友好的模式',
      '💡 提示：标准图是判断对与错的"金标准"',
    ],
    visualType: 'compare_view',
  },
  {
    id: 4,
    title: '📍 问题标记详解',
    subtitle: '第四章：读懂问题信息',
    content: [
      '每张照片中的问题区域都有详细的标记：',
      '  · 红色数字圆圈：问题编号（对应下方列表）',
      '  · 红色虚线矩形：问题所在位置',
      '  · 悬停标记：显示问题类型和描述',
      '下方问题列表会展示：问题类别、详细说明、严重程度',
      '点击红框可查看详细的问题Tooltip说明！',
    ],
    tips: [
      '💡 提示：点击数字标记可弹出问题详情',
      '💡 提示：同一个区域可能隐藏多个问题',
    ],
    visualType: 'markers',
    exampleData: {
      problemAreas: [
        {
          id: 'demo_1',
          x: 30,
          y: 40,
          width: 25,
          height: 20,
          problemType: 'quality',
          description: '瓷砖缝隙不均匀，最大偏差超过2mm',
          clueId: 'clue_demo_1',
          severity: 'medium',
        },
        {
          id: 'demo_2',
          x: 65,
          y: 60,
          width: 20,
          height: 25,
          problemType: 'safety',
          description: '电线外露未穿管，存在触电隐患',
          clueId: 'clue_demo_2',
          severity: 'high',
        },
      ],
    },
  },
  {
    id: 5,
    title: '🎯 实战演练',
    subtitle: '第五章：准备出发！',
    content: [
      '现在你已经掌握了验收照片的全部知识：',
      '  ✓ 了解了验收照片的意义和价值',
      '  ✓ 认识了六种常见问题类型',
      '  ✓ 学会使用三种视图对比模式',
      '  ✓ 能够读懂问题标记和详细信息',
      '',
      '是时候进入真实项目，大展身手了！',
      '记住：认真检查每一张照片，就是对业主负责！',
    ],
    tips: [
      '🏆 目标：找出所有问题，S级评级等你！',
      '🎮 加油吧，项目经理！',
    ],
    visualType: 'practice',
  },
];

const PROBLEM_TYPES_INFO = [
  { key: 'quality', name: '质量问题', icon: '🔨', color: 0xf39c12, desc: '施工工艺不符合标准，如空鼓、缝隙不均、平整度差等' },
  { key: 'safety', name: '安全隐患', icon: '⚠️', color: 0xe74c3c, desc: '可能引发安全事故的问题，如电线外露、防护缺失等' },
  { key: 'material', name: '材料问题', icon: '📦', color: 0xff6b35, desc: '使用了错误材料、材料质量不合格或缺件' },
  { key: 'design', name: '设计缺陷', icon: '📐', color: 0x3498db, desc: '未按图纸施工、尺寸偏差、布局不合理等' },
  { key: 'schedule', name: '工期问题', icon: '⏰', color: 0xfdcb6e, desc: '进度滞后、工序颠倒导致的工期风险' },
  { key: 'cost', name: '成本问题', icon: '💰', color: 0xe84393, desc: '材料浪费、返工、变更等导致的额外支出' },
];

export class TutorialScene extends BaseScene {
  private currentStepIndex: number = 0;
  private tutorialContent: Phaser.GameObjects.Container | null = null;
  private progressDots: Phaser.GameObjects.Container[] = [];
  private nextButton: UIElement | null = null;
  private prevButton: UIElement | null = null;
  private fromScene: string = 'MainMenuScene';

  constructor() {
    super('TutorialScene');
  }

  init(data: { fromScene?: string }): void {
    this.fromScene = data?.fromScene || 'MainMenuScene';
  }

  create(): void {
    super.create();

    this.createBackground();
    this.createHeader();
    this.createProgressBar();
    this.createContentArea();
    this.createNavigation();

    this.renderCurrentStep();
    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'TutorialScene' });
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(width / 2, 40, '📚 验收照片教学中心', {
      fontSize: 24,
      fontStyle: 'bold',
    });

    this.createText(width / 2, 72, '从入门到精通，掌握验收照片的全部技巧', {
      fontSize: 13,
      color: COLORS.TEXT_SECONDARY,
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

    const skipButton = this.createButton({
      x: width - 80,
      y: 50,
      width: 100,
      height: 40,
      text: '跳过教程',
      variant: 'secondary',
      onClick: () => this.handleSkip(),
    });
    this.uiElements.set('skipButton', skipButton);

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

  private createProgressBar(): void {
    const { width } = this.scale;
    const barY = 120;
    const totalSteps = TUTORIAL_STEPS.length;
    const dotSpacing = 60;
    const totalWidth = (totalSteps - 1) * dotSpacing;
    const startX = width / 2 - totalWidth / 2;

    this.add.rectangle(width / 2, barY, totalWidth + 30, 4, COLORS.PANEL_BORDER);

    for (let i = 0; i < totalSteps; i++) {
      const x = startX + i * dotSpacing;
      const dotContainer = this.add.container(x, barY);

      const outerCircle = this.add.circle(0, 0, 16, COLORS.PANEL);
      outerCircle.setStrokeStyle(2, COLORS.PANEL_BORDER);

      const innerCircle = this.add.circle(0, 0, 10, COLORS.TEXT_DISABLED);

      const stepNumber = this.createText(0, 0, `${i + 1}`, {
        fontSize: 12,
        fontStyle: 'bold',
        color: COLORS.TEXT,
      });

      dotContainer.add([outerCircle, innerCircle, stepNumber]);
      this.progressDots.push(dotContainer);

      if (i < totalSteps - 1) {
        const lineWidth = dotSpacing - 30;
        const line = this.add.rectangle(
          x + dotSpacing / 2,
          barY,
          lineWidth,
          3,
          COLORS.PANEL_BORDER
        );
        line.setName(`connector_${i}`);
      }
    }

    this.updateProgressDots();
  }

  private updateProgressDots(): void {
    this.progressDots.forEach((dot, index) => {
      const outerCircle = dot.list[0] as Phaser.GameObjects.Arc;
      const innerCircle = dot.list[1] as Phaser.GameObjects.Arc;
      const stepText = dot.list[2] as Phaser.GameObjects.Text;

      if (index < this.currentStepIndex) {
        outerCircle.setStrokeStyle(2, COLORS.SUCCESS);
        innerCircle.setFillStyle(COLORS.SUCCESS);
        stepText.setText('✓');
      } else if (index === this.currentStepIndex) {
        outerCircle.setStrokeStyle(3, COLORS.ACCENT);
        outerCircle.setScale(1.1);
        innerCircle.setFillStyle(COLORS.ACCENT);
      } else {
        outerCircle.setStrokeStyle(2, COLORS.PANEL_BORDER);
        innerCircle.setFillStyle(COLORS.TEXT_DISABLED);
        stepText.setText(`${index + 1}`);
      }
    });

    const totalSteps = TUTORIAL_STEPS.length;
    const dotSpacing = 60;
    const totalWidth = (totalSteps - 1) * dotSpacing;
    void totalWidth;

    for (let i = 0; i < totalSteps - 1; i++) {
      const connectorName = `connector_${i}`;
      const children = this.children.getAll();
      for (const child of children) {
        if (child.name === connectorName) {
          if (i < this.currentStepIndex) {
            (child as Phaser.GameObjects.Rectangle).setFillStyle(COLORS.SUCCESS);
          }
          break;
        }
      }
    }
  }

  private createContentArea(): void {
    const { width, height } = this.scale;
    const panelWidth = width - 80;
    const panelHeight = height - 280;

    this.tutorialContent = this.createPanel(
      width / 2,
      height / 2 + 30,
      panelWidth,
      panelHeight
    );
  }

  private createNavigation(): void {
    const { width, height } = this.scale;
    const navY = height - 50;

    this.prevButton = this.createButton({
      x: width / 2 - 130,
      y: navY,
      width: 160,
      height: 48,
      text: '← 上一章',
      fontSize: 16,
      variant: 'secondary',
      disabled: true,
      onClick: () => this.prevStep(),
    });
    this.uiElements.set('prevButton', this.prevButton);

    this.nextButton = this.createButton({
      x: width / 2 + 130,
      y: navY,
      width: 160,
      height: 48,
      text: '下一章 →',
      fontSize: 16,
      variant: 'primary',
      onClick: () => this.nextStep(),
    });
    this.uiElements.set('nextButton', this.nextButton);
  }

  private renderCurrentStep(): void {
    if (!this.tutorialContent) return;

    const step = TUTORIAL_STEPS[this.currentStepIndex];
    const panel = this.tutorialContent;
    const { width, height } = this.scale;
    const panelWidth = width - 80;
    const panelHeight = height - 280;
    const panelX = panel.x;
    const panelY = panel.y;

    panel.list
      .filter((obj) => obj !== panel.list[0] && obj !== panel.list[1])
      .forEach((obj) => obj.destroy());

    const contentStartY = panelY - panelHeight / 2 + 40;

    const subtitle = this.createText(panelX - panelWidth / 2 + 40, contentStartY, step.subtitle, {
      fontSize: 14,
      color: COLORS.ACCENT,
      fontStyle: 'bold',
      origin: { x: 0, y: 0.5 },
    });
    panel.add(subtitle);

    const title = this.createText(panelX - panelWidth / 2 + 40, contentStartY + 35, step.title, {
      fontSize: 28,
      fontStyle: 'bold',
      color: COLORS.TEXT,
      origin: { x: 0, y: 0.5 },
    });
    panel.add(title);

    const divider = this.add.rectangle(panelX, contentStartY + 70, panelWidth - 80, 2, COLORS.PANEL_BORDER);
    panel.add(divider);

    const leftX = panelX - panelWidth / 2 + 40;
    const rightPanelX = panelX + panelWidth / 4 + 10;
    const rightPanelWidth = panelWidth / 2 - 40;

    const textAreaStartY = contentStartY + 110;
    const textAreaWidth = panelWidth / 2 - 60;

    step.content.forEach((line, index) => {
      const isEmpty = line.trim() === '';
      const lineText = this.createText(leftX, textAreaStartY + index * 32, isEmpty ? ' ' : line, {
        fontSize: line.startsWith('  ') ? 14 : 16,
        color: line.startsWith('  ') ? COLORS.TEXT_SECONDARY : COLORS.TEXT,
        origin: { x: 0, y: 0.5 },
      });
      lineText.setWordWrapWidth(textAreaWidth);
      panel.add(lineText);
    });

    const tipsStartY = Math.min(
      textAreaStartY + step.content.length * 32 + 30,
      panelY + panelHeight / 2 - 100
    );

    const tipsTitleBg = this.add.rectangle(leftX + 80, tipsStartY, 160, 30, COLORS.PRIMARY_DARK);
    tipsTitleBg.setStrokeStyle(1, COLORS.ACCENT);
    const tipsTitle = this.createText(leftX + 80, tipsStartY, '🌟 小贴士', {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });
    panel.add([tipsTitleBg, tipsTitle]);

    step.tips.forEach((tip, index) => {
      const tipBg = this.add.rectangle(
        leftX + (textAreaWidth / 2),
        tipsStartY + 35 + index * 40,
        textAreaWidth,
        35,
        COLORS.PRIMARY_LIGHT,
        0.5
      );
      tipBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

      const tipText = this.createText(
        leftX + 15,
        tipsStartY + 35 + index * 40,
        tip,
        {
          fontSize: 13,
          color: COLORS.TEXT,
          origin: { x: 0, y: 0.5 },
        }
      );
      tipText.setWordWrapWidth(textAreaWidth - 30);
      panel.add([tipBg, tipText]);
    });

    this.renderVisualExample(rightPanelX, textAreaStartY, rightPanelWidth, panelHeight - 150, step);

    this.updateNavigationButtons();
    this.updateProgressDots();
  }

  private renderVisualExample(
    centerX: number,
    topY: number,
    width: number,
    height: number,
    step: TutorialStep
  ): void {
    if (!this.tutorialContent) return;
    const panel = this.tutorialContent;

    const examplePanel = this.add.rectangle(centerX, topY + height / 2, width, height, COLORS.PRIMARY_DARK);
    examplePanel.setStrokeStyle(2, COLORS.ACCENT);

    const panelTitleBg = this.add.rectangle(centerX, topY + 20, Math.min(180, width - 40), 32, COLORS.ACCENT);
    const panelTitleText = this.createText(centerX, topY + 20, this.getVisualTitle(step.visualType), {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    panel.add([examplePanel, panelTitleBg, panelTitleText]);

    const contentTop = topY + 55;
    const contentHeight = height - 75;

    switch (step.visualType) {
      case 'intro':
        this.renderIntroVisual(centerX, contentTop + contentHeight / 2, width - 40, contentHeight - 20, panel);
        break;
      case 'problem_types':
        this.renderProblemTypesVisual(centerX, contentTop + contentHeight / 2, width - 40, contentHeight - 20, panel);
        break;
      case 'compare_view':
        this.renderCompareViewVisual(centerX, contentTop + contentHeight / 2, width - 40, contentHeight - 20, panel);
        break;
      case 'markers':
        this.renderMarkersVisual(centerX, contentTop + contentHeight / 2, width - 40, contentHeight - 20, panel, step.exampleData?.problemAreas || []);
        break;
      case 'practice':
        this.renderPracticeVisual(centerX, contentTop + contentHeight / 2, width - 40, contentHeight - 20, panel);
        break;
    }
  }

  private getVisualTitle(type: string): string {
    const map: Record<string, string> = {
      intro: '🎯 学习目标',
      problem_types: '📋 问题类型一览',
      compare_view: '📊 视图模式对比',
      markers: '🔎 示例：问题标记',
      practice: '🚀 实战准备',
    };
    return map[type] || '示例';
  }

  private renderIntroVisual(
    x: number,
    y: number,
    width: number,
    height: number,
    panel: Phaser.GameObjects.Container
  ): void {
    const icons = ['🏗️', '🔍', '📷', '✅', '🏆'];
    const labels = ['进入工地', '发现问题', '拍摄记录', '对比验收', '获得高分'];
    const spacing = width / (icons.length + 1);

    icons.forEach((icon, index) => {
      const itemX = x - width / 2 + spacing * (index + 1);
      const iconBg = this.add.circle(itemX, y - 30, 28, COLORS.PANEL);
      iconBg.setStrokeStyle(2, index < 3 ? COLORS.ACCENT : COLORS.SUCCESS);

      const iconText = this.createText(itemX, y - 30, icon, {
        fontSize: 24,
      });

      const label = this.createText(itemX, y + 20, labels[index], {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
      });

      panel.add([iconBg, iconText, label]);

      if (index < icons.length - 1) {
        const arrowX = itemX + spacing / 2;
        const arrow = this.createText(arrowX, y - 30, '→', {
          fontSize: 18,
          color: COLORS.ACCENT,
        });
        panel.add(arrow);
      }
    });

    const summaryBg = this.add.rectangle(x, y + height / 2 - 40, width - 20, 60, COLORS.PANEL);
    summaryBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    const summaryText = this.createText(x, y + height / 2 - 50, '验收流程总览：勘查 → 发现 → 记录 → 对比 → 报告', {
      fontSize: 14,
      color: COLORS.ACCENT,
      fontStyle: 'bold',
    });

    const subText = this.createText(x, y + height / 2 - 25, '每一步都要认真对待，细节决定成败！', {
      fontSize: 12,
      color: COLORS.TEXT_SECONDARY,
    });

    panel.add([summaryBg, summaryText, subText]);
  }

  private renderProblemTypesVisual(
    x: number,
    y: number,
    width: number,
    height: number,
    panel: Phaser.GameObjects.Container
  ): void {
    const cols = 2;
    const rows = 3;
    const cardWidth = (width - 30) / cols;
    const cardHeight = (height - 40) / rows;
    const startX = x - width / 2 + cardWidth / 2 + 10;
    const startY = y - height / 2 + cardHeight / 2 + 15;

    PROBLEM_TYPES_INFO.forEach((type, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cardX = startX + col * (cardWidth + 10);
      const cardY = startY + row * (cardHeight + 10);

      const cardBg = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, COLORS.PANEL);
      cardBg.setStrokeStyle(1, type.color);

      const iconBg = this.add.circle(cardX - cardWidth / 2 + 25, cardY, 20, type.color, 0.2);
      const iconText = this.createText(cardX - cardWidth / 2 + 25, cardY, type.icon, {
        fontSize: 18,
      });

      const name = this.createText(cardX - cardWidth / 2 + 55, cardY - 10, type.name, {
        fontSize: 13,
        fontStyle: 'bold',
        color: type.color,
        origin: { x: 0, y: 0.5 },
      });

      const desc = this.createText(cardX - cardWidth / 2 + 55, cardY + 10, type.desc, {
        fontSize: 10,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      });
      desc.setWordWrapWidth(cardWidth - 65);

      panel.add([cardBg, iconBg, iconText, name, desc]);
    });
  }

  private renderCompareViewVisual(
    x: number,
    y: number,
    width: number,
    height: number,
    panel: Phaser.GameObjects.Container
  ): void {
    const modes = [
      { name: '实际照片', color: COLORS.ERROR, desc: '现场实拍\n标红框问题', icon: '📸' },
      { name: '标准对照', color: COLORS.SUCCESS, desc: '合格工程\n用于参考', icon: '✅' },
      { name: '对比视图', color: COLORS.ACCENT, desc: '左右并排\n一眼看出差异', icon: '🔀' },
    ];

    const cardWidth = (width - 40) / 3;
    const cardHeight = height - 30;

    modes.forEach((mode, index) => {
      const cardX = x - width / 2 + cardWidth / 2 + 15 + index * (cardWidth + 10);
      const cardY = y;

      const cardBg = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, COLORS.PANEL);
      cardBg.setStrokeStyle(2, mode.color);

      const headerBg = this.add.rectangle(cardX, cardY - cardHeight / 2 + 25, cardWidth - 10, 36, mode.color);
      const headerText = this.createText(cardX, cardY - cardHeight / 2 + 25, mode.name, {
        fontSize: 14,
        fontStyle: 'bold',
        color: COLORS.TEXT,
      });

      const iconText = this.createText(cardX, cardY - 5, mode.icon, {
        fontSize: 36,
      });

      const descText = this.createText(cardX, cardY + cardHeight / 2 - 35, mode.desc, {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
      });

      panel.add([cardBg, headerBg, headerText, iconText, descText]);
    });
  }

  private renderMarkersVisual(
    x: number,
    y: number,
    width: number,
    height: number,
    panel: Phaser.GameObjects.Container,
    problemAreas: ProblemArea[]
  ): void {
    const imgWidth = width - 30;
    const imgHeight = height / 2;
    const imgY = y - height / 4 + 10;

    const imgBg = this.add.rectangle(x, imgY, imgWidth, imgHeight, 0x2a3f5f);
    imgBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, COLORS.PANEL_BORDER, 0.3);
    const gridSize = 35;
    for (let gx = x - imgWidth / 2; gx <= x + imgWidth / 2; gx += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(gx, imgY - imgHeight / 2);
      gridGraphics.lineTo(gx, imgY + imgHeight / 2);
      gridGraphics.strokePath();
    }
    for (let gy = imgY - imgHeight / 2; gy <= imgY + imgHeight / 2; gy += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x - imgWidth / 2, gy);
      gridGraphics.lineTo(x + imgWidth / 2, gy);
      gridGraphics.strokePath();
    }

    const labelBg = this.add.rectangle(x, imgY - imgHeight / 2 + 18, 100, 26, COLORS.ERROR, 0.8);
    const labelText = this.createText(x, imgY - imgHeight / 2 + 18, '实际拍摄示例', {
      fontSize: 12,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    panel.add([imgBg, gridGraphics, labelBg, labelText]);

    problemAreas.forEach((problem, index) => {
      const relX = (problem.x / 100 - 0.5) * imgWidth;
      const relY = (problem.y / 100 - 0.5) * imgHeight;
      const relW = (problem.width / 100) * imgWidth;
      const relH = (problem.height / 100) * imgHeight;

      const markerX = x + relX;
      const markerY = imgY + relY;

      const box = this.add.rectangle(markerX, markerY, relW, relH, undefined, 0);
      box.setStrokeStyle(3, COLORS.ERROR);

      const numberBg = this.add.circle(markerX - relW / 2, markerY - relH / 2, 13, COLORS.ERROR);
      const numberText = this.createText(markerX - relW / 2, markerY - relH / 2, `${index + 1}`, {
        fontSize: 12,
        fontStyle: 'bold',
        color: COLORS.TEXT,
      });

      panel.add([box, numberBg, numberText]);
    });

    const listY = y + height / 4 + 10;
    const listWidth = width - 30;
    const listHeight = height / 2 - 30;

    const listBg = this.add.rectangle(x, listY, listWidth, listHeight, COLORS.PANEL);
    listBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    const listTitle = this.createText(
      x - listWidth / 2 + 15,
      listY - listHeight / 2 + 18,
      `📋 问题区域列表 (${problemAreas.length})`,
      {
        fontSize: 13,
        fontStyle: 'bold',
        color: COLORS.WARNING,
        origin: { x: 0, y: 0.5 },
      }
    );
    panel.add([listBg, listTitle]);

    problemAreas.forEach((problem, index) => {
      const itemY = listY - listHeight / 2 + 45 + index * 55;
      const itemHeight = 45;

      const itemBg = this.add.rectangle(x, itemY, listWidth - 20, itemHeight, COLORS.PRIMARY_DARK);

      const typeInfo = PROBLEM_TYPES_INFO.find((t) => t.key === problem.problemType);
      const typeColor = typeInfo?.color || COLORS.TEXT_SECONDARY;
      const typeName = typeInfo?.name || '其他';
      const typeIcon = typeInfo?.icon || '❓';

      const numberBg = this.add.circle(x - listWidth / 2 + 35, itemY, 17, COLORS.ERROR);
      const numberText = this.createText(x - listWidth / 2 + 35, itemY, `${index + 1}`, {
        fontSize: 12,
        fontStyle: 'bold',
        color: COLORS.TEXT,
      });

      const typeText = this.createText(x - listWidth / 2 + 60, itemY - 10, `${typeIcon} ${typeName}`, {
        fontSize: 11,
        color: typeColor,
        fontStyle: 'bold',
        origin: { x: 0, y: 0.5 },
      });

      const descText = this.createText(x - listWidth / 2 + 60, itemY + 8, problem.description, {
        fontSize: 10,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      });
      descText.setWordWrapWidth(listWidth - 100);

      panel.add([itemBg, numberBg, numberText, typeText, descText]);
    });
  }

  private renderPracticeVisual(
    x: number,
    y: number,
    width: number,
    height: number,
    panel: Phaser.GameObjects.Container
  ): void {
    const medals = [
      { grade: 'S', color: 0xffd700, label: '完美无缺', min: 95 },
      { grade: 'A', color: 0xc0c0c0, label: '表现优秀', min: 85 },
      { grade: 'B', color: 0xcd7f32, label: '良好达标', min: 75 },
      { grade: 'C', color: COLORS.TEXT_SECONDARY, label: '需要加强', min: 60 },
    ];

    const medalWidth = (width - 60) / medals.length;

    medals.forEach((medal, index) => {
      const medalX = x - width / 2 + medalWidth / 2 + 20 + index * medalWidth;
      const medalY = y - height / 4;

      const medalBg = this.add.circle(medalX, medalY, 35, COLORS.PANEL);
      medalBg.setStrokeStyle(3, medal.color);

      const shine = this.add.circle(medalX - 8, medalY - 8, 8, medal.color, 0.3);

      const gradeText = this.createText(medalX, medalY, medal.grade, {
        fontSize: 32,
        fontStyle: 'bold',
        color: medal.color,
      });

      const label = this.createText(medalX, medalY + 50, medal.label, {
        fontSize: 11,
        color: COLORS.TEXT_SECONDARY,
      });

      const score = this.createText(medalX, medalY + 68, `${medal.min}分+`, {
        fontSize: 10,
        color: medal.color,
        fontStyle: 'bold',
      });

      panel.add([medalBg, shine, gradeText, label, score]);
    });

    const goalsBg = this.add.rectangle(x, y + height / 3, width - 40, height / 3 - 20, COLORS.PANEL);
    goalsBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    const goalsTitle = this.createText(x, y + height / 3 - 35, '📝 学习成果清单', {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });

    const goals = [
      '✓ 能识别6类常见施工问题',
      '✓ 熟练使用三种视图对比模式',
      '✓ 理解问题标记的含义',
      '✓ 知道如何获得高评级',
    ];

    goals.forEach((goal, index) => {
      const goalY = y + height / 3 - 10 + index * 22;
      const goalText = this.createText(x - 10, goalY, goal, {
        fontSize: 12,
        color: COLORS.SUCCESS,
        origin: { x: 0.5, y: 0.5 },
      });
      panel.add(goalText);
    });

    panel.add([goalsBg, goalsTitle]);

    const readyBg = this.add.rectangle(x, y + height / 2 - 15, width - 40, 40, COLORS.ACCENT, 0.2);
    readyBg.setStrokeStyle(2, COLORS.ACCENT);
    const readyText = this.createText(x, y + height / 2 - 15, '🎮 恭喜！你已完成全部教程，准备好进入实战了吗？', {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });
    panel.add([readyBg, readyText]);
  }

  private updateNavigationButtons(): void {
    if (this.prevButton) {
      const isFirst = this.currentStepIndex === 0;
      this.prevButton.setEnabled(!isFirst);
      const prevTextObj = this.prevButton.container.list[2] as Phaser.GameObjects.Text;
      if (prevTextObj) prevTextObj.setText('← 上一章');
    }

    if (this.nextButton) {
      const isLast = this.currentStepIndex === TUTORIAL_STEPS.length - 1;
      const nextTextObj = this.nextButton.container.list[2] as Phaser.GameObjects.Text;
      if (nextTextObj) {
        nextTextObj.setText(isLast ? '🎓 完成学习' : '下一章 →');
      }
    }
  }

  private nextStep(): void {
    if (this.currentStepIndex < TUTORIAL_STEPS.length - 1) {
      this.currentStepIndex++;
      this.renderCurrentStep();
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    } else {
      this.handleComplete();
    }
  }

  private prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.renderCurrentStep();
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    }
  }

  private handleComplete(): void {
    this.saveSystem.setTutorialCompleted(true);
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'success' });
    this.transitionToScene(this.fromScene);
  }

  private handleSkip(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene(this.fromScene);
  }

  private handleBack(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene(this.fromScene);
  }
}
