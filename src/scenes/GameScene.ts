import { Scene } from 'phaser';
import Matter from 'matter-js';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GameStage, LevelData, ReminderRule } from '../types';
import { getLevelById } from '../data/levels';
import { gameStateManager } from '../utils/GameStateManager';
import { inputManager } from '../utils/InputManager';
import { formatTime, formatPercentage, clamp } from '../utils';
import { UIButton } from '../components/UIButton';
import { UIProgressBar } from '../components/UIProgressBar';
import { UIDialog } from '../components/UIDialog';
import { UIScoringPanel } from '../components/UIScoringPanel';
import { StudentCard } from '../components/StudentCard';
import { AssignmentCard } from '../components/AssignmentCard';

export class GameScene extends Scene {
  private levelData: LevelData | null = null;
  private gameState = gameStateManager.getState();
  private matterEngine: Matter.Engine | null = null;
  private matterRunner: Matter.Runner | null = null;

  private topBar: Phaser.GameObjects.Container | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private completionProgress: UIProgressBar | null = null;
  private stageTabs: UIButton[] = [];

  private feedbackPanel: Phaser.GameObjects.Container | null = null;
  private rulesPanel: Phaser.GameObjects.Container | null = null;
  private scoringPanel: Phaser.GameObjects.Container | null = null;

  private studentCards: StudentCard[] = [];
  private assignmentCards: AssignmentCard[] = [];
  private ruleCards: Phaser.GameObjects.Container[] = [];

  private scoringDialog: UIScoringPanel | null = null;
  private dialog: UIDialog | null = null;

  private selectedStudentIndex: number = 0;
  private selectedAssignmentIndex: number = 0;
  private selectedRuleIndex: number = 0;

  private scoringArea: Phaser.GameObjects.Rectangle | null = null;
  private dropZone: Phaser.GameObjects.Zone | null = null;

  private lagCheckInterval: number = 0;
  private inputListeners: (() => void)[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    const state = gameStateManager.getState();
    this.levelData = getLevelById(state.currentLevelId);

    if (!this.levelData) {
      this.scene.start('MenuScene');
      return;
    }

    gameStateManager.setPhase('playing');
    inputManager.initialize(this);
    this.initPhysics();
    this.createUI();
    this.setupInput();

    this.cameras.main.fadeIn(300, 26, 32, 44);
  }

  private initPhysics(): void {
    this.matterEngine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }
    });

    this.matterRunner = Matter.Runner.create();
    Matter.Runner.run(this.matterRunner, this.matterEngine);

    const wallThickness = 50;
    const walls = [
      Matter.Bodies.rectangle(GAME_WIDTH / 2, -wallThickness / 2, GAME_WIDTH, wallThickness, { isStatic: true, label: 'topWall' }),
      Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + wallThickness / 2, GAME_WIDTH, wallThickness, { isStatic: true, label: 'bottomWall' }),
      Matter.Bodies.rectangle(-wallThickness / 2, GAME_HEIGHT / 2, wallThickness, GAME_HEIGHT, { isStatic: true, label: 'leftWall' }),
      Matter.Bodies.rectangle(GAME_WIDTH + wallThickness / 2, GAME_HEIGHT / 2, wallThickness, GAME_HEIGHT, { isStatic: true, label: 'rightWall' })
    ];

    Matter.Composite.add(this.matterEngine.world, walls);
  }

  private createUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.createTopBar();
    this.createStageTabs();
    this.createFeedbackPanel();
    this.createRulesPanel();
    this.createScoringPanel();

    this.scoringDialog = new UIScoringPanel(this, centerX, centerY, 500, 450);
    this.dialog = new UIDialog(this, centerX, centerY, 500, 300);

    this.updateStageDisplay();
  }

  private createTopBar(): void {
    this.topBar = this.add.container(0, 0);

    const bg = this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH, 60, COLORS.surface)
      .setOrigin(0.5, 0.5);

    this.add.text(20, 30, this.levelData?.title || '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.timeText = this.add.text(GAME_WIDTH / 2, 30, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.scoreText = this.add.text(GAME_WIDTH - 150, 20, '', {
      fontSize: '14px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(1, 0.5);

    this.completionProgress = new UIProgressBar(
      this,
      GAME_WIDTH - 270,
      45,
      200,
      16,
      COLORS.success,
      true,
      true
    ).setLabel('完成率').setShowPercentage(true);

    const pauseButton = new UIButton(
      this,
      GAME_WIDTH - 60,
      30,
      50,
      40,
      '⏸',
      20,
      COLORS.surfaceLight
    ).setOnClick(() => this.togglePause());

    this.topBar.add([bg, pauseButton]);
  }

  private createStageTabs(): void {
    const stages: { key: GameStage; label: string }[] = [
      { key: 'feedback', label: '📊 成绩反馈' },
      { key: 'rules', label: '⚙️ 提醒规则' },
      { key: 'scoring', label: '✏️ 章节评分' }
    ];

    const tabWidth = 180;
    const tabHeight = 40;
    const startX = (GAME_WIDTH - (stages.length * tabWidth + (stages.length - 1) * 10)) / 2 + tabWidth / 2;

    stages.forEach((stage, index) => {
      const tab = new UIButton(
        this,
        startX + index * (tabWidth + 10),
        90,
        tabWidth,
        tabHeight,
        stage.label,
        16,
        COLORS.surface
      ).setOnClick(() => {
          this.switchStage(stage.key);
        });

      this.stageTabs.push(tab);
    });
  }

  private createFeedbackPanel(): void {
    this.feedbackPanel = this.add.container(0, 120);
    this.feedbackPanel.setVisible(false);

    const title = this.add.text(GAME_WIDTH / 2, 20, '📊 观察学生成绩反馈', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const desc = this.add.text(GAME_WIDTH / 2, 55, '点击学生卡片查看详细信息，了解每位学生的学习情况', {
      fontSize: '14px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    this.feedbackPanel.add([title, desc]);

    this.studentCards = [];
    const students = this.levelData?.students || [];
    const cardWidth = 300;
    const cardHeight = 90;
    const cardsPerRow = 4;
    const spacingX = 20;
    const spacingY = 15;

    students.forEach((student, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = (GAME_WIDTH - (cardsPerRow * cardWidth + (cardsPerRow - 1) * spacingX)) / 2 +
        col * (cardWidth + spacingX) + cardWidth / 2;
      const y = 100 + row * (cardHeight + spacingY) + cardHeight / 2;

      const card = new StudentCard(
        this,
        x,
        y,
        cardWidth,
        cardHeight,
        student
      ).setOnClick((clickedCard) => {
          this.showStudentDetail(clickedCard.getStudent());
        });

      this.studentCards.push(card);
      this.feedbackPanel?.add(card);
    });

    inputManager.setMaxIndex(Math.max(0, students.length - 1));

    const nextButton = new UIButton(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 150,
      200,
      50,
      '下一步：设置规则 →',
      18,
      COLORS.primary
    ).setOnClick(() => this.switchStage('rules'));

    this.feedbackPanel.add(nextButton);
  }

  private createRulesPanel(): void {
    this.rulesPanel = this.add.container(0, 120);
    this.rulesPanel.setVisible(false);

    const title = this.add.text(GAME_WIDTH / 2, 20, '⚙️ 设置提醒规则', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const desc = this.add.text(GAME_WIDTH / 2, 55, '点击规则卡片切换启用/禁用状态，合理的规则可以提高学生表现', {
      fontSize: '14px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    this.rulesPanel.add([title, desc]);

    this.ruleCards = [];
    const rules = this.levelData?.reminderRules || [];
    const cardWidth = 550;
    const cardHeight = 80;
    const spacingY = 15;

    rules.forEach((rule, index) => {
      const y = 100 + index * (cardHeight + spacingY) + cardHeight / 2;
      const card = this.createRuleCard(GAME_WIDTH / 2, y, cardWidth, cardHeight, rule, index);
      this.ruleCards.push(card);
      this.rulesPanel?.add(card);
    });

    inputManager.setMaxIndex(Math.max(0, rules.length - 1));

    const buttonContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 150);

    const prevButton = new UIButton(
      this,
      -110,
      0,
      200,
      50,
      '← 返回：成绩反馈',
      16,
      COLORS.surfaceLight
    ).setOnClick(() => this.switchStage('feedback'));

    const nextButton = new UIButton(
      this,
      110,
      0,
      200,
      50,
      '下一步：开始评分 →',
      18,
      COLORS.primary
    ).setOnClick(() => this.switchStage('scoring'));

    buttonContainer.add([prevButton, nextButton]);
    this.rulesPanel.add(buttonContainer);
  }

  private createRuleCard(x: number, y: number, width: number, height: number, rule: ReminderRule, index: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    card.setSize(width, height);

    const bg = this.add.rectangle(0, 0, width, height, rule.active ? COLORS.surface : COLORS.surfaceLight)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, rule.active ? COLORS.success : COLORS.border);

    const statusIndicator = this.add.rectangle(-width / 2 + 25, 0, 30, 30, rule.active ? COLORS.success : COLORS.surfaceLight)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, rule.active ? COLORS.success : COLORS.border);

    const statusText = this.add.text(-width / 2 + 25, 0, rule.active ? '✓' : '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    const title = this.add.text(-width / 2 + 60, -height / 2 + 20, rule.title, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const description = this.add.text(-width / 2 + 60, 5, rule.description, {
      fontSize: '13px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif',
      wordWrap: { width: width - 160 }
    }).setOrigin(0, 0.5);

    const penaltyText = this.add.text(width / 2 - 20, 0, rule.penalty > 0 ? `-${rule.penalty}%` : `+${Math.abs(rule.penalty)}%`, {
      fontSize: '16px',
      color: rule.penalty > 0 ? '#e53e3e' : '#48bb78',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    card.setInteractive({ useHandCursor: true });
    card.on('pointerup', () => {
      if (this.levelData) {
        rule.active = !rule.active;
        gameStateManager.toggleRule(rule.id, rule.active, this.levelData);
        bg.fillColor = rule.active ? COLORS.surface : COLORS.surfaceLight;
        bg.setStrokeStyle(2, rule.active ? COLORS.success : COLORS.border);
        statusIndicator.fillColor = rule.active ? COLORS.success : COLORS.surfaceLight;
        statusIndicator.setStrokeStyle(2, rule.active ? COLORS.success : COLORS.border);
        statusText.setText(rule.active ? '✓' : '');
      }
    });

    card.add([bg, statusIndicator, statusText, title, description, penaltyText]);
    return card;
  }

  private createScoringPanel(): void {
    this.scoringPanel = this.add.container(0, 120);
    this.scoringPanel.setVisible(false);

    const title = this.add.text(GAME_WIDTH / 2, 20, '✏️ 章节作业评分', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const desc = this.add.text(GAME_WIDTH / 2, 55, '拖拽作业卡片到评分区域，或点击卡片进行评分', {
      fontSize: '14px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    this.scoringPanel.add([title, desc]);

    const chapterIndex = gameStateManager.getState().currentChapterIndex;
    const chapters = this.levelData?.chapters || [];

    if (chapters.length > 0) {
      const currentChapter = chapters[chapterIndex % chapters.length];
      const chapterTitle = this.add.text(GAME_WIDTH / 2, 90, `第${currentChapter.number}章：${currentChapter.title}`, {
        fontSize: '18px',
        color: '#4a90d9',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      this.scoringPanel.add(chapterTitle);
    }

    this.scoringArea = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 200, 600, 120, COLORS.surface, 0.5)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(3, COLORS.primary, 0.5);

    const dropText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 200, '📥 将作业拖拽到这里评分', {
      fontSize: '18px',
      color: '#718096',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    this.dropZone = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT - 200, 600, 120)
      .setRectangleDropZone(600, 120);

    this.scoringPanel.add([this.scoringArea, dropText, this.dropZone]);

    this.createAssignmentCards();

    const buttonContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);

    const prevButton = new UIButton(
      this,
      -110,
      0,
      200,
      50,
      '← 返回：规则设置',
      16,
      COLORS.surfaceLight
    ).setOnClick(() => this.switchStage('feedback'));

    const submitButton = new UIButton(
      this,
      110,
      0,
      200,
      50,
      '完成评分 ✓',
      18,
      COLORS.success
    ).setOnClick(() => this.checkScoringComplete());

    buttonContainer.add([prevButton, submitButton]);
    this.scoringPanel.add(buttonContainer);
  }

  private createAssignmentCards(): void {
    const chapterIndex = gameStateManager.getState().currentChapterIndex;
    const chapters = this.levelData?.chapters || [];
    const students = this.levelData?.students || [];

    if (chapters.length === 0) return;

    const currentChapter = chapters[chapterIndex % chapters.length];
    const assignments = currentChapter.assignments;

    this.assignmentCards.forEach(card => card.destroy());
    this.assignmentCards = [];

    const cardWidth = 180;
    const cardHeight = 130;
    const cardsPerRow = 6;
    const spacingX = 15;
    const spacingY = 15;
    let cardIndex = 0;

    students.forEach((student) => {
      assignments.forEach((assignment) => {
        const submission = student.submissions.find(s => s.assignmentId === assignment.id);
        if (!submission) return;

        const row = Math.floor(cardIndex / cardsPerRow);
        const col = cardIndex % cardsPerRow;
        const x = (GAME_WIDTH - (cardsPerRow * cardWidth + (cardsPerRow - 1) * spacingX)) / 2 +
          col * (cardWidth + spacingX) + cardWidth / 2;
        const y = 140 + row * (cardHeight + spacingY) + cardHeight / 2;

        const card = new AssignmentCard(
          this,
          x,
          y,
          cardWidth,
          cardHeight,
          assignment,
          submission,
          student
        ).setOnSelect((selectedCard) => {
            this.openScoringPanel(selectedCard);
          }).setOnDragEnd((dragCard, x, y) => {
            this.handleCardDrop(dragCard, x, y);
          });

        if (this.matterEngine) {
          card.initPhysics(this.matterEngine);
        }

        this.assignmentCards.push(card);
        this.scoringPanel?.add(card);
        cardIndex++;
      });
    });

    inputManager.setMaxIndex(Math.max(0, this.assignmentCards.length - 1));
  }

  private handleCardDrop(card: AssignmentCard, x: number, y: number): void {
    if (!this.dropZone || card.getIsGraded()) {
      card.resetPosition();
      return;
    }

    const dropBounds = this.dropZone.getBounds();
    if (Phaser.Geom.Rectangle.Contains(dropBounds, x, y)) {
      this.openScoringPanel(card);
    } else {
      card.resetPosition();
    }
  }

  private openScoringPanel(card: AssignmentCard): void {
    if (card.getIsGraded()) return;

    this.scoringDialog?.show(
      card.getSubmission(),
      card.getAssignment(),
      card.getStudent().name,
      (score) => {
        this.submitScore(card, score);
      },
      () => {
        card.resetPosition();
      }
    );
  }

  private submitScore(card: AssignmentCard, score: number): void {
    const submission = card.getSubmission();
    gameStateManager.gradeAssignment(submission.id, score);
    card.updateScore(score);

    const state = gameStateManager.getState();
    const totalSubmissions = state.students.reduce(
      (sum, s) => sum + s.submissions.length, 0
    );

    if (state.assignmentsGraded.length >= totalSubmissions) {
      this.showLevelComplete();
    }
  }

  private showStudentDetail(student: any): void {
    const avgScore = student.submissions.length > 0
      ? student.submissions.reduce((sum: number, s: any) => sum + s.score, 0) / student.submissions.length
      : 0;

    const lateCount = student.submissions.filter((s: any) => s.isLate).length;

    this.dialog?.show({
      title: `${student.avatar} ${student.name} 详细信息`,
      content: `📊 综合表现: ${student.performance}分\n` +
        `📈 进步幅度: ${student.improvement > 0 ? '+' : ''}${student.improvement}%\n` +
        `📝 提交作业: ${student.submissions.length}份\n` +
        `⏰ 迟交次数: ${lateCount}次\n` +
        `📐 平均分数: ${avgScore.toFixed(1)}分\n\n` +
        `${student.improvement > 10 ? '🌟 该学生进步明显，值得关注！' :
          student.improvement < -5 ? '⚠️ 该学生成绩有所下滑，需要提醒' :
            '📌 该学生表现稳定'}\n\n` +
        `点击"下一步"继续设置提醒规则`,
      buttons: [
        { text: '关闭', onClick: () => {} },
        { text: '下一步', isPrimary: true, onClick: () => this.switchStage('rules') }
      ]
    });
  }

  private switchStage(stage: GameStage): void {
    gameStateManager.setStage(stage);
    this.updateStageDisplay();
  }

  private updateStageDisplay(): void {
    const state = gameStateManager.getState();
    const currentStage = state.currentStage;

    this.feedbackPanel?.setVisible(currentStage === 'feedback');
    this.rulesPanel?.setVisible(currentStage === 'rules');
    this.scoringPanel?.setVisible(currentStage === 'scoring');

    this.stageTabs.forEach((tab, index) => {
      const stages: GameStage[] = ['feedback', 'rules', 'scoring'];
      if (stages[index] === currentStage) {
        tab.setColor(COLORS.primary);
        tab.scale = 1.05;
      } else {
        tab.setColor(COLORS.surface);
        tab.scale = 1;
      }
    });

    if (currentStage === 'feedback') {
      inputManager.setMaxIndex(Math.max(0, (this.levelData?.students.length || 1) - 1));
    } else if (currentStage === 'rules') {
      inputManager.setMaxIndex(Math.max(0, (this.levelData?.reminderRules.length || 1) - 1));
      this.selectedRuleIndex = 0;
      this.highlightSelectedRule();
    } else if (currentStage === 'scoring') {
      inputManager.setMaxIndex(Math.max(0, this.assignmentCards.length - 1));
    }
  }

  private setupInput(): void {
    this.inputListeners.push(
      inputManager.onKeyboard('CONFIRM', () => {
        if (this.scoringDialog?.isVisible()) {
          this.scoringDialog.confirm();
          return;
        }
        const state = gameStateManager.getState();
        if (state.currentStage === 'scoring') {
          const selectedCard = this.assignmentCards[inputManager.getSelectedIndex()];
          if (selectedCard && !selectedCard.getIsGraded()) {
            this.openScoringPanel(selectedCard);
          }
        } else if (state.currentStage === 'feedback') {
          const selectedCard = this.studentCards[inputManager.getSelectedIndex()];
          if (selectedCard) {
            this.showStudentDetail(selectedCard.getStudent());
          }
        } else if (state.currentStage === 'rules') {
          this.toggleSelectedRule();
        }
      }),

      inputManager.onKeyboard('CANCEL', () => {
        if (this.scoringDialog?.isVisible()) {
          this.scoringDialog.cancel();
          return;
        }
        this.togglePause();
      }),

      inputManager.onKeyboard('TAB_LEFT', () => {
        if (this.scoringDialog?.isVisible()) return;
        const stages: GameStage[] = ['feedback', 'rules', 'scoring'];
        const currentIndex = stages.indexOf(gameStateManager.getState().currentStage);
        const prevIndex = (currentIndex - 1 + stages.length) % stages.length;
        this.switchStage(stages[prevIndex]);
      }),

      inputManager.onKeyboard('TAB_RIGHT', () => {
        if (this.scoringDialog?.isVisible()) return;
        const stages: GameStage[] = ['feedback', 'rules', 'scoring'];
        const currentIndex = stages.indexOf(gameStateManager.getState().currentStage);
        const nextIndex = (currentIndex + 1) % stages.length;
        this.switchStage(stages[nextIndex]);
      })
    );

    for (let i = 0; i <= 9; i++) {
      this.inputListeners.push(
        inputManager.onKeyboard(`NUMBER_${i}`, () => {
          if (this.scoringDialog?.isVisible()) {
            const currentScore = this.scoringDialog.getCurrentScore();
            const maxScore = this.scoringDialog.getMaxScore();
            const newScore = clamp(currentScore * 10 + i, 0, maxScore);
            this.scoringDialog.setScore(newScore);
          }
        })
      );
    }

    inputManager.onKeyboard('UP', () => {
      if (this.scoringDialog?.isVisible()) return;
      const state = gameStateManager.getState();
      if (state.currentStage === 'scoring') {
        const maxIndex = Math.max(0, this.assignmentCards.length - 1);
        const newIndex = Math.max(0, inputManager.getSelectedIndex() - 1);
        inputManager.setSelectedIndex(newIndex);
        this.highlightSelectedCard();
      } else if (state.currentStage === 'rules') {
        const newIndex = Math.max(0, this.selectedRuleIndex - 1);
        this.selectedRuleIndex = newIndex;
        this.highlightSelectedRule();
      }
    });

    inputManager.onKeyboard('DOWN', () => {
      if (this.scoringDialog?.isVisible()) return;
      const state = gameStateManager.getState();
      if (state.currentStage === 'scoring') {
        const maxIndex = Math.max(0, this.assignmentCards.length - 1);
        const newIndex = Math.min(maxIndex, inputManager.getSelectedIndex() + 1);
        inputManager.setSelectedIndex(newIndex);
        this.highlightSelectedCard();
      } else if (state.currentStage === 'rules') {
        const maxIndex = (this.levelData?.reminderRules.length || 1) - 1;
        const newIndex = Math.min(maxIndex, this.selectedRuleIndex + 1);
        this.selectedRuleIndex = newIndex;
        this.highlightSelectedRule();
      }
    });

    inputManager.onTouch((input) => {
      if (input === 'SWIPE_LEFT') {
        const stages: GameStage[] = ['feedback', 'rules', 'scoring'];
        const currentIndex = stages.indexOf(gameStateManager.getState().currentStage);
        const nextIndex = (currentIndex + 1) % stages.length;
        this.switchStage(stages[nextIndex]);
      }
    });

    inputManager.onTouch((input) => {
      if (input === 'SWIPE_RIGHT') {
        const stages: GameStage[] = ['feedback', 'rules', 'scoring'];
        const currentIndex = stages.indexOf(gameStateManager.getState().currentStage);
        const prevIndex = (currentIndex - 1 + stages.length) % stages.length;
        this.switchStage(stages[prevIndex]);
      }
    });
  }

  private highlightSelectedCard(): void {
    const selectedIndex = inputManager.getSelectedIndex();
    this.assignmentCards.forEach((card, index) => {
      const element = card.getAt(0) as Phaser.GameObjects.Rectangle;
      if (element) {
        if (index === selectedIndex && !card.getIsGraded()) {
          element.setStrokeStyle(3, COLORS.primary);
          card.scale = 1.05;
        } else {
          element.setStrokeStyle(2, card.getIsGraded() ? COLORS.success : COLORS.border);
          card.scale = 1;
        }
      }
    });
  }

  private highlightSelectedRule(): void {
    this.ruleCards.forEach((card, index) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      if (bg) {
        if (index === this.selectedRuleIndex) {
          bg.setStrokeStyle(3, COLORS.primary);
          card.scale = 1.03;
        } else {
          const rule = this.levelData?.reminderRules[index];
          bg.setStrokeStyle(2, rule?.active ? COLORS.success : COLORS.border);
          card.scale = 1;
        }
      }
    });
  }

  private toggleSelectedRule(): void {
    if (!this.levelData) return;
    const rule = this.levelData.reminderRules[this.selectedRuleIndex];
    if (!rule) return;

    rule.active = !rule.active;
    gameStateManager.toggleRule(rule.id, rule.active, this.levelData);

    const card = this.ruleCards[this.selectedRuleIndex];
    if (card) {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      const statusIndicator = card.getAt(1) as Phaser.GameObjects.Rectangle;
      const statusText = card.getAt(2) as Phaser.GameObjects.Text;

      if (bg) {
        bg.fillColor = rule.active ? COLORS.surface : COLORS.surfaceLight;
        bg.setStrokeStyle(3, COLORS.primary);
      }
      if (statusIndicator) {
        statusIndicator.fillColor = rule.active ? COLORS.success : COLORS.surfaceLight;
        statusIndicator.setStrokeStyle(2, rule.active ? COLORS.success : COLORS.border);
      }
      if (statusText) {
        statusText.setText(rule.active ? '✓' : '');
      }
    }
  }

  private togglePause(): void {
    const state = gameStateManager.getState();
    if (state.currentPhase === 'review') return;

    gameStateManager.togglePause();

    if (gameStateManager.getState().isPaused) {
      this.dialog?.show({
        title: '⏸️ 游戏暂停',
        content: '游戏已暂停，你可以选择继续游戏或返回主菜单。',
        buttons: [
          { text: '返回菜单', onClick: () => this.returnToMenu() },
          { text: '继续游戏', isPrimary: true, onClick: () => gameStateManager.togglePause() }
        ]
      });
    }
  }

  private checkScoringComplete(): void {
    const state = gameStateManager.getState();
    const chapters = this.levelData?.chapters || [];
    const currentChapterIndex = state.currentChapterIndex;

    const ungradedCount = this.assignmentCards.filter(c => !c.getIsGraded()).length;

    if (ungradedCount > 0) {
      this.dialog?.show({
        title: '⚠️ 未完成评分',
        content: `还有 ${ungradedCount} 份作业未评分，确定要提交吗？未评分的作业将记0分。`,
        buttons: [
          { text: '继续评分', onClick: () => {} },
          {
            text: '确定提交',
            isPrimary: true,
            onClick: () => {
              this.assignmentCards.forEach(card => {
                if (!card.getIsGraded()) {
                  this.submitScore(card, 0);
                }
              });
            }
          }
        ]
      });
      return;
    }

    if (currentChapterIndex < chapters.length - 1) {
      gameStateManager.nextChapter();
      this.createAssignmentCards();
      this.dialog?.show({
        title: '✅ 章节完成',
        content: `第${currentChapterIndex + 1}章评分完成！\n准备进入第${currentChapterIndex + 2}章。`,
        buttons: [
          { text: '继续', isPrimary: true, onClick: () => {} }
        ]
      });
    } else {
      this.showLevelComplete();
    }
  }

  private checkProgressLag(): void {
    const state = gameStateManager.getState();
    const elapsed = (this.levelData?.timeLimit || 300) - state.timeRemaining;
    const totalTime = this.levelData?.timeLimit || 300;
    const expectedRate = elapsed / totalTime;

    if (gameStateManager.checkProgressLag(expectedRate)) {
      this.dialog?.show({
        title: '⚠️ 进度提醒',
        content: `你的评分进度落后于预期！\n\n` +
          `当前完成率: ${formatPercentage(state.completionRate)}\n` +
          `预期完成率: ${formatPercentage(expectedRate)}\n\n` +
          `建议加快评分速度，或批量处理相似作业。`,
        buttons: [
          { text: '知道了', isPrimary: true, onClick: () => gameStateManager.confirmNextAction() }
        ]
      });
    }
  }

  private showLevelComplete(): void {
    gameStateManager.endLevel();
    this.scene.start('ReviewScene');
  }

  private returnToMenu(): void {
    this.scene.start('MenuScene');
  }

  update(time: number, delta: number): void {
    if (this.matterEngine) {
      this.assignmentCards.forEach(card => {
        card.updatePhysics();
      });
    }

    const state = gameStateManager.getState();
    if (state.currentPhase === 'playing' && !state.isPaused) {
      gameStateManager.updateTime(delta / 1000);

      this.lagCheckInterval += delta;
      if (this.lagCheckInterval >= 10000) {
        this.lagCheckInterval = 0;
        if (state.currentStage === 'scoring') {
          this.checkProgressLag();
        }
      }
    }

    const latestState = gameStateManager.getState();
    if (this.timeText) {
      const timeColor = latestState.timeRemaining < 60 ? '#e53e3e' : '#ffffff';
      this.timeText.setText(formatTime(Math.ceil(latestState.timeRemaining)));
      this.timeText.setColor(timeColor);
    }

    if (this.scoreText) {
      this.scoreText.setText(`总分: ${latestState.totalScore}`);
    }

    if (this.completionProgress) {
      this.completionProgress.setValue(latestState.completionRate * 100, false);
    }
  }

}
