import { GameState, GameResult, Level, LevelGroup, TaskStep, Position } from '../models';
import { gameCore } from '../core/GameCore';

type ViewType = 'menu' | 'level_select' | 'briefing' | 'playing' | 'result' | 'replay';

export interface UICallbacks {
  onStartLevel: (level: Level) => void;
  onSelectAction: (actionId: string) => void;
  onGameComplete: (result: GameResult) => void;
  onBackToMenu: () => void;
  onRetryLevel: () => void;
  onStartGameplay: () => void;
  onGoToLevelSelect: () => void;
  onShowReplay: (replayId: string) => void;
}

export class UIManager {
  private root: HTMLElement;
  private callbacks: UICallbacks;
  private currentView: ViewType | null = null;
  private feedbackTimer: number | null = null;
  private selectedMode: 'training' | 'free_practice' = 'training';

  constructor(root: HTMLElement, callbacks: UICallbacks) {
    this.root = root;
    this.callbacks = callbacks;
  }

  render(state: GameState): void {
    switch (state.phase) {
      case 'menu':
        this.renderMenu();
        break;
      case 'level_select':
        this.renderLevelSelect();
        break;
      case 'briefing':
        if (state.currentLevel) this.renderBriefing(state.currentLevel);
        break;
      case 'playing':
        this.renderPlaying(state);
        break;
      case 'result':
        const result = gameCore.gameManager.calculateResult();
        this.renderResult(result);
        break;
      case 'replay':
        this.renderReplay();
        break;
    }
  }

  private clearRoot(): void {
    this.root.innerHTML = '';
    this.root.style.pointerEvents = 'none';
  }

  private enablePointer(): void {
    this.root.style.pointerEvents = 'auto';
  }

  private createContainer(className: string): HTMLDivElement {
    const container = document.createElement('div');
    container.className = className;
    return container;
  }

  private styleElement(el: HTMLElement, styles: Record<string, string>): void {
    Object.entries(styles).forEach(([key, value]) => {
      el.style[key as any] = value;
    });
  }

  renderMenu(): void {
    this.clearRoot();
    this.enablePointer();
    this.currentView = 'menu';

    const container = this.createContainer('main-menu');
    this.styleElement(container, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '100'
    });

    const title = document.createElement('h1');
    title.textContent = '二手车过户流程培训系统';
    this.styleElement(title, {
      color: '#fff',
      fontSize: '48px',
      fontWeight: '700',
      marginBottom: '12px',
      textShadow: '0 4px 20px rgba(0,0,0,0.5)',
      letterSpacing: '2px'
    });

    const subtitle = document.createElement('p');
    subtitle.textContent = '材料调度解谜游戏 - 新人培训专用';
    this.styleElement(subtitle, {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '20px',
      marginBottom: '60px'
    });

    const modeContainer = this.createContainer('mode-selector');
    this.styleElement(modeContainer, {
      display: 'flex',
      gap: '20px',
      marginBottom: '40px'
    });

    const trainingBtn = this.createModeButton('训练关卡', 'training', true);
    const practiceBtn = this.createModeButton('自由练习', 'free_practice', false);

    trainingBtn.addEventListener('click', () => {
      this.selectedMode = 'training';
      trainingBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
      practiceBtn.style.background = 'rgba(255,255,255,0.1)';
    });

    practiceBtn.addEventListener('click', () => {
      this.selectedMode = 'free_practice';
      practiceBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
      trainingBtn.style.background = 'rgba(255,255,255,0.1)';
    });

    modeContainer.appendChild(trainingBtn);
    modeContainer.appendChild(practiceBtn);

    const startBtn = document.createElement('button');
    startBtn.textContent = '开始培训';
    this.styleElement(startBtn, {
      padding: '18px 80px',
      fontSize: '22px',
      fontWeight: '600',
      color: '#fff',
      background: 'linear-gradient(135deg, #f093fb, #f5576c)',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      boxShadow: '0 8px 30px rgba(245, 87, 108, 0.4)',
      transition: 'all 0.3s ease'
    });

    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'translateY(-2px)';
      startBtn.style.boxShadow = '0 12px 40px rgba(245, 87, 108, 0.5)';
    });

    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = 'translateY(0)';
      startBtn.style.boxShadow = '0 8px 30px rgba(245, 87, 108, 0.4)';
    });

    startBtn.addEventListener('click', () => this.callbacks.onGoToLevelSelect());

    const version = document.createElement('div');
    version.textContent = 'v1.0.0 | Powered by PlayCanvas + TypeScript + Ammo.js';
    this.styleElement(version, {
      position: 'absolute',
      bottom: '30px',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '14px'
    });

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(modeContainer);
    container.appendChild(startBtn);
    container.appendChild(version);
    this.root.appendChild(container);
  }

  private createModeButton(label: string, mode: 'training' | 'free_practice', selected: boolean): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    this.styleElement(btn, {
      padding: '14px 40px',
      fontSize: '18px',
      fontWeight: '500',
      color: '#fff',
      background: selected ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.1)',
      border: '2px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    });
    return btn;
  }

  renderLevelSelect(): void {
    this.clearRoot();
    this.enablePointer();
    this.currentView = 'level_select';

    const levelGroups = gameCore.levelManager.getLevelGroups();

    const container = this.createContainer('level-select');
    this.styleElement(container, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      overflowY: 'auto',
      padding: '40px',
      boxSizing: 'border-box',
      zIndex: '100'
    });

    const header = this.createContainer('header');
    this.styleElement(header, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      maxWidth: '1200px',
      margin: '0 auto 40px'
    });

    const title = document.createElement('h2');
    title.textContent = '选择关卡';
    this.styleElement(title, {
      color: '#fff',
      fontSize: '32px',
      fontWeight: '600',
      margin: '0'
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回菜单';
    this.styleElement(backBtn, {
      padding: '10px 24px',
      fontSize: '16px',
      color: '#fff',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      cursor: 'pointer'
    });
    backBtn.addEventListener('click', () => this.callbacks.onBackToMenu());

    header.appendChild(title);
    header.appendChild(backBtn);

    const groupsContainer = this.createContainer('groups');
    this.styleElement(groupsContainer, {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '30px'
    });

    levelGroups.forEach((group) => {
      groupsContainer.appendChild(this.createLevelGroupCard(group));
    });

    container.appendChild(header);
    container.appendChild(groupsContainer);
    this.root.appendChild(container);
  }

  private createLevelGroupCard(group: LevelGroup): HTMLElement {
    const card = this.createContainer('level-group');
    this.styleElement(card, {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255,255,255,0.1)'
    });

    const groupHeader = this.createContainer('group-header');
    this.styleElement(groupHeader, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px'
    });

    const positionBadge = document.createElement('div');
    positionBadge.textContent = group.position;
    this.styleElement(positionBadge, {
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600'
    });

    const groupName = document.createElement('h3');
    groupName.textContent = group.name;
    this.styleElement(groupName, {
      color: '#fff',
      fontSize: '20px',
      margin: '0'
    });

    const groupDesc = document.createElement('p');
    groupDesc.textContent = group.description;
    this.styleElement(groupDesc, {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px',
      margin: '0'
    });

    groupHeader.appendChild(positionBadge);
    groupHeader.appendChild(groupName);

    const levelsGrid = this.createContainer('levels-grid');
    this.styleElement(levelsGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '16px'
    });

    group.levels.forEach((level) => {
      levelsGrid.appendChild(this.createLevelCard(level));
    });

    card.appendChild(groupHeader);
    card.appendChild(groupDesc);
    card.appendChild(levelsGrid);

    return card;
  }

  private createLevelCard(level: Level): HTMLElement {
    const card = this.createContainer('level-card');
    this.styleElement(card, {
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '1px solid transparent'
    });

    card.addEventListener('mouseenter', () => {
      card.style.background = 'rgba(255,255,255,0.12)';
      card.style.borderColor = 'rgba(102, 126, 234, 0.5)';
      card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = 'rgba(255,255,255,0.08)';
      card.style.borderColor = 'transparent';
      card.style.transform = 'translateY(0)';
    });

    card.addEventListener('click', () => this.callbacks.onStartLevel(level));

    const levelName = document.createElement('h4');
    levelName.textContent = level.name;
    this.styleElement(levelName, {
      color: '#fff',
      fontSize: '17px',
      fontWeight: '600',
      margin: '0 0 10px'
    });

    const levelDesc = document.createElement('p');
    levelDesc.textContent = level.description;
    this.styleElement(levelDesc, {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '13px',
      lineHeight: '1.5',
      margin: '0 0 16px',
      minHeight: '40px'
    });

    const stats = this.createContainer('stats');
    this.styleElement(stats, {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    });

    const difficulty = document.createElement('span');
    difficulty.textContent = `难度: ${'★'.repeat(level.difficulty)}${'☆'.repeat(5 - level.difficulty)}`;
    this.styleElement(difficulty, {
      color: '#ffd700',
      fontSize: '12px',
      fontWeight: '600'
    });

    const time = document.createElement('span');
    time.textContent = `⏱ ${level.estimatedTimeMinutes}分钟`;
    this.styleElement(time, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '12px'
    });

    if (level.hasMissingMaterials) {
      const missing = document.createElement('span');
      missing.textContent = `📋 缺${level.missingMaterialsCount}项材料`;
      this.styleElement(missing, {
        color: '#ff6b6b',
        fontSize: '12px',
        fontWeight: '600'
      });
      stats.appendChild(missing);
    }

    stats.appendChild(difficulty);
    stats.appendChild(time);

    card.appendChild(levelName);
    card.appendChild(levelDesc);
    card.appendChild(stats);

    return card;
  }

  renderBriefing(level: Level): void {
    this.clearRoot();
    this.enablePointer();
    this.currentView = 'briefing';

    const container = this.createContainer('briefing');
    this.styleElement(container, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '100',
      padding: '20px'
    });

    const card = this.createContainer('briefing-card');
    this.styleElement(card, {
      background: 'linear-gradient(135deg, #1e2a4a, #16213e)',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '700px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)'
    });

    const badge = document.createElement('div');
    badge.textContent = '任务简报';
    this.styleElement(badge, {
      display: 'inline-block',
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #f093fb, #f5576c)',
      color: '#fff',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '20px'
    });

    const title = document.createElement('h2');
    title.textContent = level.task.title;
    this.styleElement(title, {
      color: '#fff',
      fontSize: '28px',
      fontWeight: '700',
      margin: '0 0 16px'
    });

    const desc = document.createElement('p');
    desc.textContent = level.task.description;
    this.styleElement(desc, {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '16px',
      lineHeight: '1.6',
      margin: '0 0 24px'
    });

    const infoGrid = this.createContainer('info-grid');
    this.styleElement(infoGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    });

    const vehicleInfo = this.createInfoBox('车辆信息', `${level.vehicleArchive.basicInfo.brand} ${level.vehicleArchive.basicInfo.model}`, '#667eea');
    const priceInfo = this.createInfoBox('成交价', `¥${level.quoteHistory.finalNegotiatedPrice.toLocaleString()}`, '#51cf66');
    const stepsInfo = this.createInfoBox('步骤数', `${level.task.steps.length} 步`, '#ffa94d');
    const timeInfo = this.createInfoBox('预计时间', `${level.estimatedTimeMinutes} 分钟`, '#ff6b6b');

    infoGrid.appendChild(vehicleInfo);
    infoGrid.appendChild(priceInfo);
    infoGrid.appendChild(stepsInfo);
    infoGrid.appendChild(timeInfo);

    const btnRow = this.createContainer('btn-row');
    this.styleElement(btnRow, {
      display: 'flex',
      gap: '16px',
      marginTop: '32px'
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回选择';
    this.styleElement(backBtn, {
      flex: '1',
      padding: '16px',
      fontSize: '16px',
      color: '#fff',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      cursor: 'pointer'
    });
    backBtn.addEventListener('click', () => this.callbacks.onGoToLevelSelect());

    const startBtn = document.createElement('button');
    startBtn.textContent = '开始任务 →';
    this.styleElement(startBtn, {
      flex: '2',
      padding: '16px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#fff',
      background: 'linear-gradient(135deg, #f093fb, #f5576c)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer'
    });
    startBtn.addEventListener('click', () => this.callbacks.onStartGameplay());

    btnRow.appendChild(backBtn);
    btnRow.appendChild(startBtn);

    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(infoGrid);
    card.appendChild(btnRow);
    container.appendChild(card);
    this.root.appendChild(container);
  }

  private createInfoBox(label: string, value: string, color: string): HTMLElement {
    const box = this.createContainer('info-box');
    this.styleElement(box, {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '16px',
      borderLeft: `4px solid ${color}`
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    this.styleElement(labelEl, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '12px',
      marginBottom: '6px'
    });

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    this.styleElement(valueEl, {
      color: '#fff',
      fontSize: '18px',
      fontWeight: '600'
    });

    box.appendChild(labelEl);
    box.appendChild(valueEl);
    return box;
  }

  renderPlaying(state: GameState): void {
    this.clearRoot();
    this.enablePointer();
    this.currentView = 'playing';

    const level = state.currentLevel;
    const step = gameCore.gameManager.getCurrentStep();
    if (!level || !step) return;

    const container = this.createContainer('playing-ui');
    this.styleElement(container, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: '50'
    });

    const topBar = this.createContainer('top-bar');
    this.styleElement(topBar, {
      position: 'absolute',
      top: '0', left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 30px',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
      pointerEvents: 'auto'
    });

    const progressInfo = this.createContainer('progress-info');
    this.styleElement(progressInfo, {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    });

    const stepIndicator = document.createElement('div');
    stepIndicator.textContent = `步骤 ${state.currentStepIndex + 1}/${gameCore.gameManager.getTotalSteps()}`;
    this.styleElement(stepIndicator, {
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '20px'
    });

    const scoreEl = document.createElement('div');
    scoreEl.textContent = `得分: ${state.totalScore}`;
    this.styleElement(scoreEl, {
      color: '#ffd700',
      fontSize: '16px',
      fontWeight: '600'
    });

    const errorEl = document.createElement('div');
    errorEl.textContent = `错误: ${state.errorCount}`;
    this.styleElement(errorEl, {
      color: state.errorCount > 0 ? '#ff6b6b' : '#51cf66',
      fontSize: '16px',
      fontWeight: '600'
    });

    progressInfo.appendChild(stepIndicator);
    progressInfo.appendChild(scoreEl);
    progressInfo.appendChild(errorEl);

    const timeEl = document.createElement('div');
    timeEl.id = 'game-timer';
    timeEl.textContent = this.formatTime(gameCore.gameManager.getElapsedTimeMs());
    this.styleElement(timeEl, {
      color: '#fff',
      fontSize: '24px',
      fontWeight: '700',
      fontFamily: 'monospace'
    });

    const exitBtn = document.createElement('button');
    exitBtn.textContent = '退出';
    this.styleElement(exitBtn, {
      padding: '10px 20px',
      fontSize: '14px',
      color: '#fff',
      background: 'rgba(255,107,107,0.3)',
      border: '1px solid rgba(255,107,107,0.5)',
      borderRadius: '8px',
      cursor: 'pointer'
    });
    exitBtn.addEventListener('click', () => this.callbacks.onBackToMenu());

    topBar.appendChild(progressInfo);
    topBar.appendChild(timeEl);
    topBar.appendChild(exitBtn);

    const bottomPanel = this.createContainer('bottom-panel');
    this.styleElement(bottomPanel, {
      position: 'absolute',
      bottom: '0', left: '0',
      right: '0',
      background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
      padding: '30px 30px 40px',
      pointerEvents: 'auto'
    });

    const promptEl = document.createElement('h3');
    promptEl.textContent = step.prompt;
    this.styleElement(promptEl, {
      color: '#fff',
      fontSize: '22px',
      fontWeight: '600',
      margin: '0 0 8px'
    });

    const descEl = document.createElement('p');
    descEl.textContent = step.description;
    this.styleElement(descEl, {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px',
      margin: '0 0 24px'
    });

    const actionsContainer = this.createContainer('actions');
    this.styleElement(actionsContainer, {
      display: 'grid',
      gridTemplateColumns: step.availableActions.length <= 3 ? `repeat(${step.availableActions.length}, 1fr)` : 'repeat(2, 1fr)',
      gap: '12px'
    });

    step.availableActions.forEach((action) => {
      const actionBtn = this.createActionButton(action.label, action.description);
      actionBtn.addEventListener('click', () => this.handleActionClick(action.id, step));
      actionsContainer.appendChild(actionBtn);
    });

    const hintBtn = document.createElement('button');
    hintBtn.textContent = '💡 查看提示';
    this.styleElement(hintBtn, {
      marginTop: '20px',
      padding: '10px 24px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.7)',
      background: 'transparent',
      border: '1px dashed rgba(255,255,255,0.3)',
      borderRadius: '8px',
      cursor: 'pointer'
    });
    hintBtn.addEventListener('click', () => {
      const hint = gameCore.gameManager.getHint();
      if (hint) alert(`💡 提示: ${hint}`);
    });

    const feedbackEl = document.createElement('div');
    feedbackEl.id = 'action-feedback';
    this.styleElement(feedbackEl, {
      marginTop: '20px',
      padding: '16px',
      borderRadius: '12px',
      display: 'none',
      fontSize: '15px',
      fontWeight: '500'
    });

    bottomPanel.appendChild(promptEl);
    bottomPanel.appendChild(descEl);
    bottomPanel.appendChild(actionsContainer);
    bottomPanel.appendChild(hintBtn);
    bottomPanel.appendChild(feedbackEl);

    container.appendChild(topBar);
    container.appendChild(bottomPanel);
    this.root.appendChild(container);

    this.startTimer();
  }

  private createActionButton(label: string, description: string): HTMLButtonElement {
    const btn = document.createElement('button');
    this.styleElement(btn, {
      padding: '20px 24px',
      background: 'rgba(255,255,255,0.08)',
      border: '2px solid rgba(255,255,255,0.1)',
      borderRadius: '14px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease'
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    this.styleElement(labelEl, {
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '6px'
    });

    const descEl = document.createElement('div');
    descEl.textContent = description;
    this.styleElement(descEl, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '12px'
    });

    btn.appendChild(labelEl);
    btn.appendChild(descEl);

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(102, 126, 234, 0.3)';
      btn.style.borderColor = 'rgba(102, 126, 234, 0.6)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.08)';
      btn.style.borderColor = 'rgba(255,255,255,0.1)';
    });

    return btn;
  }

  private handleActionClick(actionId: string, step: TaskStep): void {
    const action = gameCore.gameManager.getActionOption(actionId, step);
    if (!action) return;

    const feedbackEl = document.getElementById('action-feedback');
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      if (action.isCorrect) {
        feedbackEl.style.background = 'rgba(81, 207, 102, 0.2)';
        feedbackEl.style.color = '#51cf66';
        feedbackEl.style.border = '1px solid rgba(81, 207, 102, 0.4)';
        feedbackEl.textContent = `✅ ${action.feedbackCorrect}`;
      } else {
        feedbackEl.style.background = 'rgba(255, 107, 107, 0.2)';
        feedbackEl.style.color = '#ff6b6b';
        feedbackEl.style.border = '1px solid rgba(255, 107, 107, 0.4)';
        feedbackEl.textContent = `❌ ${action.feedbackWrong} (扣${action.penaltyPoints}分)`;
      }
    }

    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
    }

    this.feedbackTimer = window.setTimeout(() => {
      this.callbacks.onSelectAction(actionId);
    }, 1200);
  }

  private startTimer(): void {
    const updateTimer = () => {
      const timerEl = document.getElementById('game-timer');
      if (timerEl && gameCore.gameManager.getState().phase === 'playing') {
        timerEl.textContent = this.formatTime(gameCore.gameManager.getElapsedTime());
        requestAnimationFrame(updateTimer);
      }
    };
    requestAnimationFrame(updateTimer);
  }

  renderResult(result: GameResult): void {
    this.clearRoot();
    this.enablePointer();
    this.currentView = 'result';

    if (gameCore.gameManager.getState().currentLevel) {
      gameCore.replayManager.saveReplay(
        gameCore.gameManager.getState().currentLevel!,
        result,
        result.actions
      );
    }

    const container = this.createContainer('result-screen');
    this.styleElement(container, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      overflowY: 'auto',
      padding: '40px',
      boxSizing: 'border-box',
      zIndex: '100'
    });

    const content = this.createContainer('content');
    this.styleElement(content, {
      maxWidth: '900px',
      margin: '0 auto'
    });

    const header = this.createContainer('result-header');
    this.styleElement(header, {
      textAlign: 'center',
      marginBottom: '40px'
    });

    const gradeColors: Record<string, string> = {
      'S': '#ffd700',
      'A': '#51cf66',
      'B': '#4dabf7',
      'C': '#ffa94d',
      'D': '#ff8787',
      'F': '#ff6b6b'
    };

    const gradeEl = document.createElement('div');
    gradeEl.textContent = result.grade;
    this.styleElement(gradeEl, {
      display: 'inline-block',
      width: '100px',
      height: '100px',
      lineHeight: '100px',
      fontSize: '60px',
      fontWeight: '900',
      color: gradeColors[result.grade],
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '50%',
      marginBottom: '16px',
      boxShadow: `0 0 40px ${gradeColors[result.grade]}40`
    });

    const statusEl = document.createElement('h2');
    statusEl.textContent = result.passed ? '🎉 任务完成' : '😔 任务未通过';
    this.styleElement(statusEl, {
      color: '#fff',
      fontSize: '32px',
      margin: '0 0 8px'
    });

    const levelNameEl = document.createElement('p');
    levelNameEl.textContent = result.levelName;
    this.styleElement(levelNameEl, {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '16px',
      margin: '0'
    });

    header.appendChild(gradeEl);
    header.appendChild(statusEl);
    header.appendChild(levelNameEl);

    const statsGrid = this.createContainer('stats-grid');
    this.styleElement(statsGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '32px'
    });

    statsGrid.appendChild(this.createResultStat('最终得分', `${result.totalScore}/${result.maxScore}`, '#ffd700'));
    statsGrid.appendChild(this.createResultStat('准确率', `${result.accuracyPercentage}%`, '#51cf66'));
    statsGrid.appendChild(this.createResultStat('用时', this.formatTime(result.totalTimeMs), '#4dabf7'));
    statsGrid.appendChild(this.createResultStat('错误数', `${result.errorCount}`, '#ff6b6b'));

    if (result.errors.length > 0) {
      const errorsSection = this.createContainer('errors-section');
      this.styleElement(errorsSection, {
        background: 'rgba(255, 107, 107, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 107, 107, 0.2)'
      });

      const errorsTitle = document.createElement('h3');
      errorsTitle.textContent = `❌ 错误详情 (${result.errors.length}项)`;
      this.styleElement(errorsTitle, {
        color: '#ff6b6b',
        fontSize: '18px',
        margin: '0 0 16px'
      });

      errorsSection.appendChild(errorsTitle);

      result.errors.forEach((err, idx) => {
        const errorItem = this.createContainer('error-item');
        this.styleElement(errorItem, {
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: idx < result.errors.length - 1 ? '12px' : '0'
        });

        const stepNum = document.createElement('div');
        stepNum.textContent = `步骤 ${err.stepNumber}`;
        this.styleElement(stepNum, {
          color: '#ff6b6b',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '6px'
        });

        const prompt = document.createElement('div');
        prompt.textContent = err.stepPrompt;
        this.styleElement(prompt, {
          color: '#fff',
          fontSize: '14px',
          marginBottom: '8px'
        });

        const wrong = document.createElement('div');
        wrong.innerHTML = `<span style="color: #ff6b6b;">你的选择:</span> ${err.wrongAction}`;
        this.styleElement(wrong, {
          fontSize: '13px',
          marginBottom: '4px'
        });

        const correct = document.createElement('div');
        correct.innerHTML = `<span style="color: #51cf66;">正确选择:</span> ${err.correctAction}`;
        this.styleElement(correct, {
          fontSize: '13px',
          marginBottom: '4px'
        });

        const reason = document.createElement('div');
        reason.innerHTML = `<span style="color: #ffa94d;">原因:</span> ${err.reason}`;
        this.styleElement(reason, {
          fontSize: '13px',
          color: 'rgba(255,255,255,0.7)'
        });

        errorItem.appendChild(stepNum);
        errorItem.appendChild(prompt);
        errorItem.appendChild(wrong);
        errorItem.appendChild(correct);
        errorItem.appendChild(reason);
        errorsSection.appendChild(errorItem);
      });

      content.appendChild(errorsSection);
    }

    if (result.stallPoints.length > 0) {
      const stallSection = this.createContainer('stall-section');
      this.styleElement(stallSection, {
        background: 'rgba(255, 169, 77, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 169, 77, 0.2)'
      });

      const stallTitle = document.createElement('h3');
      stallTitle.textContent = `⚠️ 卡顿分析 (${result.stallPoints.length}处)`;
      this.styleElement(stallTitle, {
        color: '#ffa94d',
        fontSize: '18px',
        margin: '0 0 16px'
      });

      stallSection.appendChild(stallTitle);

      result.stallPoints.forEach((stall, idx) => {
        const stallItem = this.createContainer('stall-item');
        this.styleElement(stallItem, {
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: idx < result.stallPoints.length - 1 ? '12px' : '0'
        });

        const header = document.createElement('div');
        header.innerHTML = `步骤 ${stall.stepNumber} <span style="float:right; color: #ffa94d; font-weight: 600;">耗时 ${this.formatTime(stall.timeSpentMs)}</span>`;
        this.styleElement(header, {
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '6px'
        });

        const prompt = document.createElement('div');
        prompt.textContent = stall.stepPrompt;
        this.styleElement(prompt, {
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px'
        });

        stallItem.appendChild(header);
        stallItem.appendChild(prompt);
        stallSection.appendChild(stallItem);
      });

      content.appendChild(stallSection);
    }

    const replays = gameCore.replayManager.getAllReplays();
    if (replays.length > 0) {
      const replaySection = this.createContainer('replay-section');
      this.styleElement(replaySection, {
        background: 'rgba(102, 126, 234, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(102, 126, 234, 0.2)'
      });

      const replayTitle = document.createElement('h3');
      replayTitle.textContent = `📼 历史回放 (保留最近${gameCore.replayManager.getMaxReplays()}次)`;
      this.styleElement(replayTitle, {
        color: '#667eea',
        fontSize: '18px',
        margin: '0 0 16px'
      });

      replaySection.appendChild(replayTitle);

      replays.forEach((replay, idx) => {
        const replayItem = this.createContainer('replay-item');
        this.styleElement(replayItem, {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: idx < replays.length - 1 ? '10px' : '0',
          cursor: 'pointer'
        });

        const replayInfo = this.createContainer('replay-info');
        this.styleElement(replayInfo, {
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        });

        const replayName = document.createElement('div');
        replayName.textContent = replay.result.levelName;
        this.styleElement(replayName, {
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600'
        });

        const replayMeta = document.createElement('div');
        replayMeta.textContent = `${new Date(replay.createdAt).toLocaleString()} | 等级 ${replay.result.grade} | ${this.formatTime(replay.result.totalTimeMs)}`;
        this.styleElement(replayMeta, {
          color: 'rgba(255,255,255,0.5)',
          fontSize: '12px'
        });

        const replayBtn = document.createElement('button');
        replayBtn.textContent = '复盘 →';
        this.styleElement(replayBtn, {
          padding: '8px 16px',
          fontSize: '13px',
          color: '#fff',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        });

        replayBtn.addEventListener('click', () => this.callbacks.onShowReplay(replay.id));

        replayInfo.appendChild(replayName);
        replayInfo.appendChild(replayMeta);
        replayItem.appendChild(replayInfo);
        replayItem.appendChild(replayBtn);
        replaySection.appendChild(replayItem);
      });

      content.appendChild(replaySection);
    }

    const btnRow = this.createContainer('btn-row');
    this.styleElement(btnRow, {
      display: 'flex',
      gap: '16px',
      marginTop: '32px'
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回菜单';
    this.styleElement(backBtn, {
      flex: '1',
      padding: '16px',
      fontSize: '16px',
      color: '#fff',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      cursor: 'pointer'
    });
    backBtn.addEventListener('click', () => this.callbacks.onBackToMenu());

    const selectBtn = document.createElement('button');
    selectBtn.textContent = '选择关卡';
    this.styleElement(selectBtn, {
      flex: '1',
      padding: '16px',
      fontSize: '16px',
      color: '#fff',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer'
    });
    selectBtn.addEventListener('click', () => this.callbacks.onGoToLevelSelect());

    const retryBtn = document.createElement('button');
    retryBtn.textContent = '再试一次';
    this.styleElement(retryBtn, {
      flex: '1',
      padding: '16px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#fff',
      background: 'linear-gradient(135deg, #f093fb, #f5576c)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer'
    });
    retryBtn.addEventListener('click', () => this.callbacks.onRetryLevel());

    btnRow.appendChild(backBtn);
    btnRow.appendChild(selectBtn);
    btnRow.appendChild(retryBtn);

    content.appendChild(header);
    content.appendChild(statsGrid);
    content.appendChild(btnRow);
    container.appendChild(content);
    this.root.appendChild(container);
  }

  private createResultStat(label: string, value: string, color: string): HTMLElement {
    const box = this.createContainer('stat-box');
    this.styleElement(box, {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      borderTop: `3px solid ${color}`
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    this.styleElement(labelEl, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '13px',
      marginBottom: '8px'
    });

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    this.styleElement(valueEl, {
      color: '#fff',
      fontSize: '24px',
      fontWeight: '700'
    });

    box.appendChild(labelEl);
    box.appendChild(valueEl);
    return box;
  }

  renderReplay(): void {
    this.clearRoot();
    this.enablePointer();
    this.currentView = 'replay';

    const container = this.createContainer('replay-screen');
    this.styleElement(container, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      overflowY: 'auto',
      padding: '40px',
      boxSizing: 'border-box',
      zIndex: '100'
    });

    const content = this.createContainer('content');
    this.styleElement(content, {
      maxWidth: '900px',
      margin: '0 auto'
    });

    const header = this.createContainer('header');
    this.styleElement(header, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px'
    });

    const title = document.createElement('h2');
    title.textContent = '📼 复盘回放';
    this.styleElement(title, {
      color: '#fff',
      fontSize: '28px',
      margin: '0'
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回菜单';
    this.styleElement(backBtn, {
      padding: '10px 24px',
      fontSize: '14px',
      color: '#fff',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      cursor: 'pointer'
    });
    backBtn.addEventListener('click', () => this.callbacks.onBackToMenu());

    header.appendChild(title);
    header.appendChild(backBtn);

    const replays = gameCore.replayManager.getAllReplays();

    if (replays.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '暂无回放记录';
      this.styleElement(empty, {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        padding: '80px 0',
        fontSize: '18px'
      });
      content.appendChild(header);
      content.appendChild(empty);
      container.appendChild(content);
      this.root.appendChild(container);
      return;
    }

    replays.forEach((replay, idx) => {
      const card = this.createContainer('replay-card');
      this.styleElement(card, {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: idx < replays.length - 1 ? '16px' : '0',
        border: '1px solid rgba(255,255,255,0.1)'
      });

      const cardHeader = this.createContainer('card-header');
      this.styleElement(cardHeader, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      });

      const replayTitle = document.createElement('h3');
      replayTitle.textContent = replay.result.levelName;
      this.styleElement(replayTitle, {
        color: '#fff',
        fontSize: '18px',
        margin: '0'
      });

      const gradeEl = document.createElement('div');
      gradeEl.textContent = replay.result.grade;
      this.styleElement(gradeEl, {
        color: replay.result.grade === 'S' || replay.result.grade === 'A' ? '#51cf66' : '#ff6b6b',
        fontSize: '24px',
        fontWeight: '900'
      });

      cardHeader.appendChild(replayTitle);
      cardHeader.appendChild(gradeEl);

      const metaRow = this.createContainer('meta-row');
      this.styleElement(metaRow, {
        display: 'flex',
        gap: '24px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      });

      const timeEl = document.createElement('span');
      timeEl.textContent = `⏱ 用时: ${this.formatTime(replay.result.totalTimeMs)}`;
      this.styleElement(timeEl, { color: 'rgba(255,255,255,0.6)', fontSize: '14px' });

      const scoreEl = document.createElement('span');
      scoreEl.textContent = `🎯 得分: ${replay.result.totalScore}/${replay.result.maxScore}`;
      this.styleElement(scoreEl, { color: 'rgba(255,255,255,0.6)', fontSize: '14px' });

      const accEl = document.createElement('span');
      accEl.textContent = `✅ 准确率: ${replay.result.accuracyPercentage}%`;
      this.styleElement(accEl, { color: 'rgba(255,255,255,0.6)', fontSize: '14px' });

      metaRow.appendChild(timeEl);
      metaRow.appendChild(scoreEl);
      metaRow.appendChild(accEl);

      if (replay.result.stallPoints.length > 0 || replay.result.errors.length > 0) {
        const timeline = this.createContainer('timeline');
        this.styleElement(timeline, {
          borderLeft: '2px solid rgba(255,255,255,0.1)',
          paddingLeft: '20px',
          marginTop: '16px'
        });

        replay.frames.forEach((frame, fIdx) => {
          if (!frame.action) return;

          const step = frame.stepIndex + 1;
          const stepEl = this.createContainer('timeline-step');
          this.styleElement(stepEl, {
            position: 'relative',
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            marginBottom: '10px'
          });

          const dot = document.createElement('div');
          this.styleElement(dot, {
            position: 'absolute',
            left: '-28px',
            top: '18px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: frame.action.isCorrect ? '#51cf66' : '#ff6b6b',
            boxShadow: frame.action.timeSpentMs >= 30000 ? '0 0 10px #ffa94d' : 'none'
          });

          const stepHeader = this.createContainer('step-header');
          this.styleElement(stepHeader, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          });

          const stepLabel = document.createElement('span');
          stepLabel.textContent = `步骤 ${step}`;
          this.styleElement(stepLabel, {
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600'
          });

          const stepTime = document.createElement('span');
          stepTime.textContent = this.formatTime(frame.action.timeSpentMs);
          this.styleElement(stepTime, {
            color: frame.action.timeSpentMs >= 30000 ? '#ffa94d' : 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            fontWeight: frame.action.timeSpentMs >= 30000 ? '600' : '400'
          });

          stepHeader.appendChild(stepLabel);
          stepHeader.appendChild(stepTime);

          const resultLabel = document.createElement('div');
          resultLabel.textContent = frame.action.isCorrect ? '✅ 正确' : `❌ 错误 (扣${frame.action.pointsDeducted}分)`;
          this.styleElement(resultLabel, {
            color: frame.action.isCorrect ? '#51cf66' : '#ff6b6b',
            fontSize: '13px'
          });

          if (frame.action.timeSpentMs >= 30000) {
            const stallLabel = document.createElement('div');
            stallLabel.textContent = '⚠️ 此步骤存在卡顿，建议加强学习';
            this.styleElement(stallLabel, {
              color: '#ffa94d',
              fontSize: '12px',
              marginTop: '4px'
            });
            stepEl.appendChild(stallLabel);
          }

          stepEl.appendChild(dot);
          stepEl.appendChild(stepHeader);
          stepEl.appendChild(resultLabel);
          timeline.appendChild(stepEl);
        });

        card.appendChild(timeline);
      }

      card.appendChild(cardHeader);
      card.appendChild(metaRow);
      content.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(content);
    this.root.appendChild(container);
  }

  private formatTime(ms: number): string {
    return gameCore.gameManager.formatTime(ms);
  }
}
