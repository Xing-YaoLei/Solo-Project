import { GameState, GameResult, Level, LevelGroup, TaskStep, Position, ActionOption, ReplaySession, ReplayFrame } from '../models';
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

  getSelectedMode(): 'training' | 'free_practice' {
    return this.selectedMode;
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

    const isTraining = this.selectedMode === 'training';
    const levelGroups = gameCore.levelManager.getLevelGroupsByMode(this.selectedMode);

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
      marginBottom: '30px',
      maxWidth: '1200px',
      margin: '0 auto 30px'
    });

    const titleArea = this.createContainer('title-area');
    this.styleElement(titleArea, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });

    const title = document.createElement('h2');
    title.textContent = isTraining ? '训练关卡' : '自由练习';
    this.styleElement(title, {
      color: '#fff',
      fontSize: '32px',
      fontWeight: '600',
      margin: '0'
    });

    const subtitle = document.createElement('p');
    subtitle.textContent = isTraining
      ? '按岗位系统学习过户流程，循序渐进提升能力'
      : '自由选择任意关卡挑战，适合有一定基础的学员';
    this.styleElement(subtitle, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '14px',
      margin: '0'
    });

    const modeBadge = document.createElement('div');
    modeBadge.textContent = isTraining ? '🎓 训练模式' : '🎮 自由模式';
    this.styleElement(modeBadge, {
      display: 'inline-block',
      padding: '6px 16px',
      background: isTraining
        ? 'linear-gradient(135deg, #667eea, #764ba2)'
        : 'linear-gradient(135deg, #f093fb, #f5576c)',
      color: '#fff',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600'
    });

    titleArea.appendChild(title);
    titleArea.appendChild(subtitle);

    const headerRight = this.createContainer('header-right');
    this.styleElement(headerRight, {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
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

    headerRight.appendChild(modeBadge);
    headerRight.appendChild(backBtn);

    header.appendChild(titleArea);
    header.appendChild(headerRight);

    const groupsContainer = this.createContainer('groups');
    this.styleElement(groupsContainer, {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    });

    levelGroups.forEach((group: LevelGroup) => {
      groupsContainer.appendChild(this.createLevelGroupCard(group, isTraining));
    });

    container.appendChild(header);
    container.appendChild(groupsContainer);
    this.root.appendChild(container);
  }

  private createLevelGroupCard(group: LevelGroup, isTraining: boolean = true): HTMLElement {
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
      marginBottom: '12px',
      flexWrap: 'wrap'
    });

    const positionBadge = document.createElement('div');
    positionBadge.textContent = isTraining ? group.position : '🎯 难度分类';
    this.styleElement(positionBadge, {
      padding: '6px 16px',
      background: isTraining
        ? 'linear-gradient(135deg, #667eea, #764ba2)'
        : 'linear-gradient(135deg, #f093fb, #f5576c)',
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

    const levelCount = document.createElement('span');
    levelCount.textContent = `${group.levels.length} 个关卡`;
    this.styleElement(levelCount, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '13px',
      marginLeft: 'auto'
    });

    groupHeader.appendChild(positionBadge);
    groupHeader.appendChild(groupName);
    groupHeader.appendChild(levelCount);

    const groupDesc = document.createElement('p');
    groupDesc.textContent = group.description;
    this.styleElement(groupDesc, {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px',
      margin: '0 0 20px'
    });

    const levelsGrid = this.createContainer('levels-grid');
    this.styleElement(levelsGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '14px'
    });

    group.levels.forEach((level) => {
      levelsGrid.appendChild(this.createLevelCard(level, isTraining));
    });

    card.appendChild(groupHeader);
    card.appendChild(groupDesc);
    card.appendChild(levelsGrid);

    return card;
  }

  private createLevelCard(level: Level, isTraining: boolean = true): HTMLElement {
    const card = this.createContainer('level-card');
    this.styleElement(card, {
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: `2px solid ${isTraining ? 'rgba(102, 126, 234, 0.2)' : 'rgba(240, 147, 251, 0.2)'}`
    });

    card.addEventListener('mouseenter', () => {
      card.style.background = 'rgba(255,255,255,0.12)';
      card.style.borderColor = isTraining ? 'rgba(102, 126, 234, 0.6)' : 'rgba(240, 147, 251, 0.6)';
      card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = 'rgba(255,255,255,0.08)';
      card.style.borderColor = isTraining ? 'rgba(102, 126, 234, 0.2)' : 'rgba(240, 147, 251, 0.2)';
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
      padding: '16px 24px',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
      pointerEvents: 'auto'
    });

    const progressInfo = this.createContainer('progress-info');
    this.styleElement(progressInfo, {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    });

    const stepIndicator = document.createElement('div');
    stepIndicator.textContent = `步骤 ${state.currentStepIndex + 1}/${gameCore.gameManager.getTotalSteps()}`;
    this.styleElement(stepIndicator, {
      color: '#fff',
      fontSize: '15px',
      fontWeight: '600',
      padding: '7px 14px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '18px'
    });

    const scoreEl = document.createElement('div');
    scoreEl.textContent = `得分: ${state.totalScore}`;
    this.styleElement(scoreEl, {
      color: '#ffd700',
      fontSize: '15px',
      fontWeight: '600'
    });

    const errorEl = document.createElement('div');
    errorEl.textContent = `错误: ${state.errorCount}`;
    this.styleElement(errorEl, {
      color: state.errorCount > 0 ? '#ff6b6b' : '#51cf66',
      fontSize: '15px',
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
      fontSize: '22px',
      fontWeight: '700',
      fontFamily: 'monospace'
    });

    const topRight = this.createContainer('top-right');
    this.styleElement(topRight, {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    });

    const exitBtn = document.createElement('button');
    exitBtn.textContent = '退出';
    this.styleElement(exitBtn, {
      padding: '8px 18px',
      fontSize: '14px',
      color: '#fff',
      background: 'rgba(255,107,107,0.3)',
      border: '1px solid rgba(255,107,107,0.5)',
      borderRadius: '8px',
      cursor: 'pointer'
    });
    exitBtn.addEventListener('click', () => this.callbacks.onBackToMenu());

    topRight.appendChild(timeEl);
    topRight.appendChild(exitBtn);

    topBar.appendChild(progressInfo);
    topBar.appendChild(topRight);

    const docTabs = this.createContainer('doc-tabs');
    this.styleElement(docTabs, {
      position: 'absolute',
      left: '20px',
      top: '70px',
      bottom: '300px',
      width: '320px',
      background: 'rgba(20, 25, 40, 0.95)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      pointerEvents: 'auto',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    });

    const tabHeader = this.createContainer('tab-header');
    this.styleElement(tabHeader, {
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    });

    const tabs = [
      { id: 'vehicle', label: '📋 车辆档案', color: '#667eea' },
      { id: 'quote', label: '💰 报价历史', color: '#51cf66' },
      { id: 'finance', label: '💳 金融资料', color: '#ffa94d' }
    ];

    let activeTab = 'vehicle';

    const tabContent = this.createContainer('tab-content');
    this.styleElement(tabContent, {
      flex: '1',
      overflowY: 'auto',
      padding: '16px'
    });

    const renderTabContent = (tabId: string) => {
      tabContent.innerHTML = '';
      if (tabId === 'vehicle') {
        this.renderVehicleTab(tabContent, level);
      } else if (tabId === 'quote') {
        this.renderQuoteTab(tabContent, level);
      } else {
        this.renderFinanceTab(tabContent, level);
      }
    };

    tabs.forEach((tab) => {
      const tabBtn = document.createElement('button');
      tabBtn.textContent = tab.label;
      this.styleElement(tabBtn, {
        flex: '1',
        padding: '12px 8px',
        fontSize: '12px',
        color: tab.id === activeTab ? '#fff' : 'rgba(255,255,255,0.5)',
        background: tab.id === activeTab ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontWeight: tab.id === activeTab ? '600' : '400',
        transition: 'all 0.2s'
      });

      tabBtn.addEventListener('click', () => {
        activeTab = tab.id;
        Array.from(tabHeader.children).forEach((child, idx) => {
          const btn = child as HTMLButtonElement;
          const t = tabs[idx];
          btn.style.color = t.id === activeTab ? '#fff' : 'rgba(255,255,255,0.5)';
          btn.style.background = t.id === activeTab ? 'rgba(255,255,255,0.1)' : 'transparent';
          btn.style.fontWeight = t.id === activeTab ? '600' : '400';
        });
        renderTabContent(activeTab);
      });

      tabHeader.appendChild(tabBtn);
    });

    docTabs.appendChild(tabHeader);
    docTabs.appendChild(tabContent);
    renderTabContent(activeTab);

    const bottomPanel = this.createContainer('bottom-panel');
    this.styleElement(bottomPanel, {
      position: 'absolute',
      bottom: '0', left: '0',
      right: '0',
      background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
      padding: '24px 30px 32px',
      pointerEvents: 'auto'
    });

    const promptEl = document.createElement('h3');
    promptEl.textContent = step.prompt;
    this.styleElement(promptEl, {
      color: '#fff',
      fontSize: '20px',
      fontWeight: '600',
      margin: '0 0 6px'
    });

    const descEl = document.createElement('p');
    descEl.textContent = step.description;
    this.styleElement(descEl, {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '13px',
      margin: '0 0 20px'
    });

    const actionsContainer = this.createContainer('actions');
    this.styleElement(actionsContainer, {
      display: 'grid',
      gridTemplateColumns: step.availableActions.length <= 3 ? `repeat(${step.availableActions.length}, 1fr)` : 'repeat(2, 1fr)',
      gap: '10px'
    });

    step.availableActions.forEach((action: ActionOption) => {
      const actionBtn = this.createActionButton(action.label, action.description);
      actionBtn.addEventListener('click', () => this.handleActionClick(action.id, step));
      actionsContainer.appendChild(actionBtn);
    });

    const hintBtn = document.createElement('button');
    hintBtn.textContent = '💡 查看提示';
    this.styleElement(hintBtn, {
      marginTop: '16px',
      padding: '9px 20px',
      fontSize: '13px',
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
      marginTop: '16px',
      padding: '14px',
      borderRadius: '10px',
      display: 'none',
      fontSize: '14px',
      fontWeight: '500'
    });

    bottomPanel.appendChild(promptEl);
    bottomPanel.appendChild(descEl);
    bottomPanel.appendChild(actionsContainer);
    bottomPanel.appendChild(hintBtn);
    bottomPanel.appendChild(feedbackEl);

    container.appendChild(topBar);
    container.appendChild(docTabs);
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
        timerEl.textContent = this.formatTime(gameCore.gameManager.getElapsedTimeMs());
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

      result.errors.forEach((err: GameResult['errors'][0], idx: number) => {
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

      result.stallPoints.forEach((stall: GameResult['stallPoints'][0], idx: number) => {
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
      replayTitle.textContent = `📼 历史回放 (按车辆各保留最近3次)`;
      this.styleElement(replayTitle, {
        color: '#667eea',
        fontSize: '18px',
        margin: '0 0 16px'
      });

      replaySection.appendChild(replayTitle);

      replays.forEach((replay: ReplaySession, idx: number) => {
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
      maxWidth: '1000px',
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
    title.textContent = '📼 复盘回放 - 按车辆分组';
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

    const vehicles = gameCore.replayManager.getVehiclesWithReplays();

    if (vehicles.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '暂无失败回放记录，通过测试后将不会保存回放';
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

    vehicles.forEach((vehicle, vIdx) => {
      const vehicleGroup = this.createContainer('vehicle-group');
      this.styleElement(vehicleGroup, {
        marginBottom: vIdx < vehicles.length - 1 ? '32px' : '0'
      });

      const vehicleHeader = this.createContainer('vehicle-header');
      this.styleElement(vehicleHeader, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,159,67,0.1))',
        border: '1px solid rgba(255,107,107,0.2)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px'
      });

      const vehicleTitle = document.createElement('h3');
      vehicleTitle.textContent = `🚗 ${vehicle.vehicleInfo.brand} ${vehicle.vehicleInfo.model} (${vehicle.vehicleInfo.plateNumber})`;
      this.styleElement(vehicleTitle, {
        color: '#fff',
        fontSize: '18px',
        margin: '0'
      });

      const vehicleMeta = document.createElement('div');
      vehicleMeta.innerHTML = `
        <span style="color: rgba(255,255,255,0.5); font-size: 13px;">VIN: ${vehicle.vehicleInfo.vin}</span>
        <span style="background: rgba(255,107,107,0.2); color: #ff6b6b; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 12px;">失败 ${vehicle.replayCount}/3 次</span>
      `;
      this.styleElement(vehicleMeta, {
        display: 'flex',
        alignItems: 'center'
      });

      vehicleHeader.appendChild(vehicleTitle);
      vehicleHeader.appendChild(vehicleMeta);
      vehicleGroup.appendChild(vehicleHeader);

      const replays = gameCore.replayManager.getReplaysByVehicle(vehicle.vehicleArchiveId);
      replays.forEach((replay: ReplaySession, idx: number) => {
        const level = gameCore.levelManager.getLevelById(replay.levelId);
        const card = this.createContainer('replay-card');
        this.styleElement(card, {
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: idx < replays.length - 1 ? '12px' : '0',
          border: '1px solid rgba(255,255,255,0.1)'
        });

        const cardHeader = this.createContainer('card-header');
        this.styleElement(cardHeader, {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        });

        const replayTitle = document.createElement('h4');
        replayTitle.textContent = `#${replays.length - idx} ${replay.result.levelName}`;
        this.styleElement(replayTitle, {
          color: '#fff',
          fontSize: '16px',
          margin: '0'
        });

        const gradeEl = document.createElement('div');
        gradeEl.textContent = replay.result.grade;
        this.styleElement(gradeEl, {
          color: replay.result.grade === 'S' || replay.result.grade === 'A' ? '#51cf66' : '#ff6b6b',
          fontSize: '20px',
          fontWeight: '900'
        });

        cardHeader.appendChild(replayTitle);
        cardHeader.appendChild(gradeEl);

        const metaRow = this.createContainer('meta-row');
        this.styleElement(metaRow, {
          display: 'flex',
          gap: '20px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        });

        const timeEl = document.createElement('span');
        timeEl.textContent = `⏱ 用时: ${this.formatTime(replay.result.totalTimeMs)}`;
        this.styleElement(timeEl, { color: 'rgba(255,255,255,0.6)', fontSize: '13px' });

        const scoreEl = document.createElement('span');
        scoreEl.textContent = `🎯 得分: ${replay.result.totalScore}/${replay.result.maxScore}`;
        this.styleElement(scoreEl, { color: 'rgba(255,255,255,0.6)', fontSize: '13px' });

        const accEl = document.createElement('span');
        accEl.textContent = `✅ 准确率: ${replay.result.accuracyPercentage}%`;
        this.styleElement(accEl, { color: 'rgba(255,255,255,0.6)', fontSize: '13px' });

        const dateEl = document.createElement('span');
        const replayDate = new Date(replay.createdAt);
        dateEl.textContent = `📅 ${replayDate.toLocaleDateString('zh-CN')} ${replayDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
        this.styleElement(dateEl, { color: 'rgba(255,255,255,0.5)', fontSize: '12px' });

        metaRow.appendChild(timeEl);
        metaRow.appendChild(scoreEl);
        metaRow.appendChild(accEl);
        metaRow.appendChild(dateEl);

        card.appendChild(cardHeader);
        card.appendChild(metaRow);

        if (level) {
          const stallSteps = gameCore.replayManager.getStallStepsWithClues(replay.result, level);
          
          if (stallSteps.length > 0) {
            const stallSection = this.createContainer('stall-section');
            this.styleElement(stallSection, {
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(255,159,67,0.05)',
              borderRadius: '10px',
              border: '1px solid rgba(255,159,67,0.2)'
            });

            const stallTitle = document.createElement('h5');
            stallTitle.textContent = `⚠️ 卡顿点分析 (共 ${stallSteps.length} 处)`;
            this.styleElement(stallTitle, {
              color: '#ffa94d',
              fontSize: '15px',
              margin: '0 0 12px 0'
            });
            stallSection.appendChild(stallTitle);

            stallSteps.forEach((stall, sIdx) => {
              const stallItem = this.createContainer('stall-item');
              this.styleElement(stallItem, {
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: sIdx < stallSteps.length - 1 ? '10px' : '0'
              });

              const stallHeader = this.createContainer('stall-header');
              this.styleElement(stallHeader, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              });

              const stepNum = document.createElement('span');
              stepNum.textContent = `步骤 ${stall.stepNumber}`;
              this.styleElement(stepNum, {
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px'
              });

              const stepTime = document.createElement('span');
              stepTime.textContent = `⏱ ${this.formatTime(stall.timeSpentMs)} (超阈值 ${((stall.timeSpentMs / stall.thresholdMs) * 100 - 100).toFixed(0)}%)`;
              this.styleElement(stepTime, {
                color: '#ffa94d',
                fontSize: '13px',
                fontWeight: '600'
              });

              stallHeader.appendChild(stepNum);
              stallHeader.appendChild(stepTime);

              const stepPrompt = document.createElement('p');
              stepPrompt.textContent = stall.stepPrompt;
              this.styleElement(stepPrompt, {
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px',
                margin: '0 0 10px 0',
                lineHeight: '1.5'
              });

              const cluesSection = this.createContainer('clues-section');
              this.styleElement(cluesSection, {
                marginTop: '10px'
              });

              const cluesTitle = document.createElement('span');
              cluesTitle.textContent = '🔍 相关资料线索：';
              this.styleElement(cluesTitle, {
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px'
              });
              cluesSection.appendChild(cluesTitle);

              stall.relatedDocs.forEach((doc) => {
                const docTag = this.createContainer('doc-tag');
                this.styleElement(docTag, {
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  marginBottom: '6px'
                });

                const docIcon = document.createElement('span');
                const iconMap = { vehicle: '📋', quote: '💰', finance: '💳' };
                docIcon.textContent = iconMap[doc.docType];
                this.styleElement(docIcon, { fontSize: '14px' });

                const docContent = document.createElement('div');
                docContent.innerHTML = `
                  <div style="color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 2px;">
                    ${doc.docType === 'vehicle' ? '车辆档案' : doc.docType === 'quote' ? '报价历史' : '金融资料'} → ${doc.section}
                  </div>
                  <div style="color: #fff; font-size: 13px; font-weight: 500;">
                    ${doc.keyInfo}
                  </div>
                `;

                docTag.appendChild(docIcon);
                docTag.appendChild(docContent);
                cluesSection.appendChild(docTag);
              });

              stallItem.appendChild(stallHeader);
              stallItem.appendChild(stepPrompt);
              stallItem.appendChild(cluesSection);
              stallSection.appendChild(stallItem);
            });

            card.appendChild(stallSection);
          }
        }

        if (replay.result.errors.length > 0) {
          const errorsSection = this.createContainer('errors-section');
          this.styleElement(errorsSection, {
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(255,107,107,0.05)',
            borderRadius: '10px',
            border: '1px solid rgba(255,107,107,0.2)'
          });

          const errorsTitle = document.createElement('h5');
          errorsTitle.textContent = `❌ 错误动作 (共 ${replay.result.errors.length} 处)`;
          this.styleElement(errorsTitle, {
            color: '#ff6b6b',
            fontSize: '15px',
            margin: '0 0 12px 0'
          });
          errorsSection.appendChild(errorsTitle);

          replay.result.errors.forEach((err, eIdx) => {
            const errorItem = this.createContainer('error-item');
            this.styleElement(errorItem, {
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: eIdx < replay.result.errors.length - 1 ? '10px' : '0'
            });

            const errorHeader = document.createElement('div');
            errorHeader.innerHTML = `
              <span style="color: #ff6b6b; font-weight: 600; font-size: 14px;">步骤 ${err.stepNumber}</span>
              <span style="color: rgba(255,255,255,0.5); font-size: 12px; margin-left: 10px;">⏱ ${this.formatTime(err.timeSpentMs)}</span>
            `;
            this.styleElement(errorHeader, { marginBottom: '6px' });

            const stepPrompt = document.createElement('p');
            stepPrompt.textContent = err.stepPrompt;
            this.styleElement(stepPrompt, {
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              margin: '0 0 8px 0'
            });

            const errorDetail = document.createElement('div');
            errorDetail.innerHTML = `
              <div style="color: #ff6b6b; font-size: 12px; margin-bottom: 4px;">❌ 你的选择: ${err.wrongAction}</div>
              <div style="color: #51cf66; font-size: 12px; margin-bottom: 4px;">✅ 正确选择: ${err.correctAction}</div>
              <div style="color: rgba(255,255,255,0.5); font-size: 12px;">📝 错误原因: ${err.reason}</div>
            `;

            errorItem.appendChild(errorHeader);
            errorItem.appendChild(stepPrompt);
            errorItem.appendChild(errorDetail);
            errorsSection.appendChild(errorItem);
          });

          card.appendChild(errorsSection);
        }

        vehicleGroup.appendChild(card);
      });

      content.appendChild(vehicleGroup);
    });

    container.appendChild(header);
    container.appendChild(content);
    this.root.appendChild(container);
  }

  private renderVehicleTab(container: HTMLElement, level: Level): void {
    const archive = level.vehicleArchive;

    const section = this.createDocSection('基本信息', '#667eea');
    section.appendChild(this.createDocRow('品牌车型', `${archive.basicInfo.brand} ${archive.basicInfo.model}`));
    section.appendChild(this.createDocRow('年款', `${archive.basicInfo.year}款`));
    section.appendChild(this.createDocRow('车牌号', archive.basicInfo.plateNumber));
    section.appendChild(this.createDocRow('VIN码', archive.basicInfo.vin));
    section.appendChild(this.createDocRow('颜色', archive.basicInfo.color));
    section.appendChild(this.createDocRow('里程', `${archive.basicInfo.mileage.toLocaleString()} 公里`));
    section.appendChild(this.createDocRow('发动机号', archive.basicInfo.engineNumber));
    section.appendChild(this.createDocRow('排量', archive.basicInfo.displacement));
    section.appendChild(this.createDocRow('燃料类型', archive.basicInfo.fuelType));
    container.appendChild(section);

    const conditionSection = this.createDocSection('车辆状况', '#51cf66');
    conditionSection.appendChild(this.createDocRow(
      '事故历史',
      archive.condition.accidentHistory ? `是 - ${archive.condition.accidentDescription || '有记录'}` : '否',
      archive.condition.accidentHistory ? '#ff6b6b' : '#51cf66'
    ));
    conditionSection.appendChild(this.createDocRow('水泡车', archive.condition.waterDamage ? '是' : '否', archive.condition.waterDamage ? '#ff6b6b' : '#51cf66'));
    conditionSection.appendChild(this.createDocRow('火烧车', archive.condition.fireDamage ? '是' : '否', archive.condition.fireDamage ? '#ff6b6b' : '#51cf66'));
    conditionSection.appendChild(this.createDocRow('改装情况', archive.condition.modificationStatus));
    conditionSection.appendChild(this.createDocRow('轮胎磨损', archive.condition.tireWear));
    conditionSection.appendChild(this.createDocRow('刹车状况', archive.condition.brakeStatus));
    conditionSection.appendChild(this.createDocRow('综合评定', archive.condition.overallAssessment));
    container.appendChild(conditionSection);

    const ownerSection = this.createDocSection('产权信息', '#ffa94d');
    ownerSection.appendChild(this.createDocRow('车主姓名', archive.ownership.ownerName));
    ownerSection.appendChild(this.createDocRow('证件类型', archive.ownership.ownerIdType));
    ownerSection.appendChild(this.createDocRow('过户次数', `${archive.ownership.ownershipTransferCount}次`));
    ownerSection.appendChild(this.createDocRow('注册日期', archive.ownership.registrationDate));
    ownerSection.appendChild(this.createDocRow('年检有效期', archive.ownership.annualInspectionValid ? '有效' : '已过期', archive.ownership.annualInspectionValid ? '#51cf66' : '#ff6b6b'));
    container.appendChild(ownerSection);

    const statusSection = this.createDocSection('车辆状态', '#ff6b6b');
    statusSection.appendChild(this.createDocRow('抵押状态', archive.hasEncumbrance ? '有抵押' : '无抵押', archive.hasEncumbrance ? '#ff6b6b' : '#51cf66'));
    if (archive.hasEncumbrance && archive.encumbranceDescription) {
      statusSection.appendChild(this.createDocRow('抵押说明', archive.encumbranceDescription));
    }
    statusSection.appendChild(this.createDocRow('查封状态', archive.isSeized ? '已查封' : '正常', archive.isSeized ? '#ff6b6b' : '#51cf66'));
    container.appendChild(statusSection);
  }

  private renderQuoteTab(container: HTMLElement, level: Level): void {
    const quote = level.quoteHistory;

    const summarySection = this.createDocSection('报价概况', '#51cf66');
    summarySection.appendChild(this.createDocRow('最终成交价', `¥${quote.finalNegotiatedPrice.toLocaleString()}`, '#ffd700'));
    summarySection.appendChild(this.createDocRow('平均报价', `¥${quote.averageQuote.toLocaleString()}`));
    summarySection.appendChild(this.createDocRow('最高报价', `¥${quote.highestQuote.toLocaleString()}`));
    summarySection.appendChild(this.createDocRow('最低报价', `¥${quote.lowestQuote.toLocaleString()}`));
    summarySection.appendChild(this.createDocRow('价格趋势', quote.priceTrend, quote.priceTrend === '上涨' ? '#ff6b6b' : quote.priceTrend === '下跌' ? '#51cf66' : '#ffa94d'));
    summarySection.appendChild(this.createDocRow('首次报价日期', quote.initialQuoteDate));
    container.appendChild(summarySection);

    const recordSection = this.createDocSection('报价记录', '#667eea');
    quote.quoteRecords.forEach((record, idx) => {
      const recordCard = this.createContainer('quote-record');
      this.styleElement(recordCard, {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: idx < quote.quoteRecords.length - 1 ? '10px' : '0'
      });

      const header = this.createContainer('record-header');
      this.styleElement(header, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      });

      const appraiserEl = document.createElement('div');
      appraiserEl.textContent = record.appraiser;
      this.styleElement(appraiserEl, {
        color: '#fff',
        fontSize: '13px',
        fontWeight: '600'
      });

      const timeEl = document.createElement('div');
      timeEl.textContent = record.timestamp.split(' ')[0];
      this.styleElement(timeEl, {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '11px'
      });

      header.appendChild(appraiserEl);
      header.appendChild(timeEl);

      const priceEl = document.createElement('div');
      priceEl.textContent = `报价: ¥${record.finalQuote.toLocaleString()}`;
      this.styleElement(priceEl, {
        color: '#ffd700',
        fontSize: '14px',
        fontWeight: '700',
        marginBottom: '6px'
      });

      const methodEl = document.createElement('div');
      methodEl.textContent = `评估方法: ${record.valuationMethod}`;
      this.styleElement(methodEl, {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '11px'
      });

      recordCard.appendChild(header);
      recordCard.appendChild(priceEl);
      recordCard.appendChild(methodEl);
      recordSection.appendChild(recordCard);
    });
    container.appendChild(recordSection);

    const historySection = this.createDocSection('议价过程', '#ffa94d');
    const buyerOffers = quote.buyerOfferHistory.join(' → ');
    const sellerAsks = quote.sellerAskHistory.join(' → ');
    historySection.appendChild(this.createDocRow('买方出价', `¥${buyerOffers.split(' → ').map(v => Number(v).toLocaleString()).join(' → ')}`));
    historySection.appendChild(this.createDocRow('卖方要价', `¥${sellerAsks.split(' → ').map(v => Number(v).toLocaleString()).join(' → ')}`));
    container.appendChild(historySection);
  }

  private renderFinanceTab(container: HTMLElement, level: Level): void {
    const finance = level.financeDocuments;

    const financeSection = this.createDocSection('贷款信息', '#ffa94d');
    financeSection.appendChild(this.createDocRow('支付方式', finance.paymentMethod));
    financeSection.appendChild(this.createDocRow('贷款状态', finance.finance.hasLoan ? '有贷款' : '无贷款', finance.finance.hasLoan ? '#ff6b6b' : '#51cf66'));
    if (finance.finance.hasLoan) {
      financeSection.appendChild(this.createDocRow('贷款银行', finance.finance.loanBank || '未知'));
      financeSection.appendChild(this.createDocRow('贷款余额', `¥${(finance.finance.loanOutstandingBalance || 0).toLocaleString()}`));
      financeSection.appendChild(this.createDocRow('月供金额', `¥${(finance.finance.loanMonthlyPayment || 0).toLocaleString()}`));
      financeSection.appendChild(this.createDocRow('贷款期限', `${finance.finance.loanTermMonths || 0}个月`));
    }
    financeSection.appendChild(this.createDocRow('贷款已结清', finance.finance.loanPaidOff ? '是' : '否', finance.finance.loanPaidOff ? '#51cf66' : '#ff6b6b'));
    financeSection.appendChild(this.createDocRow('解除抵押证明', finance.finance.releaseOfMortgageAvailable ? '有' : '无', finance.finance.releaseOfMortgageAvailable ? '#51cf66' : '#ff6b6b'));
    financeSection.appendChild(this.createDocRow('贷款审批状态', finance.financingApprovalStatus, finance.financingApprovalStatus === '已通过' ? '#51cf66' : finance.financingApprovalStatus === '已拒绝' ? '#ff6b6b' : '#ffa94d'));
    container.appendChild(financeSection);

    const insuranceSection = this.createDocSection('保险信息', '#667eea');
    insuranceSection.appendChild(this.createDocRow('保险状态', finance.insurance.hasInsurance ? '有保险' : '无保险', finance.insurance.hasInsurance ? '#51cf66' : '#ff6b6b'));
    if (finance.insurance.hasInsurance) {
      insuranceSection.appendChild(this.createDocRow('保险类型', finance.insurance.insuranceType || '-'));
      insuranceSection.appendChild(this.createDocRow('保险公司', finance.insurance.insuranceCompany || '-'));
      insuranceSection.appendChild(this.createDocRow('保单号', finance.insurance.policyNumber || '-'));
      insuranceSection.appendChild(this.createDocRow('保险起期', finance.insurance.policyStartDate || '-'));
      insuranceSection.appendChild(this.createDocRow('保险到期', finance.insurance.policyEndDate || '-'));
      insuranceSection.appendChild(this.createDocRow('保额', `¥${(finance.insurance.coverageAmount || 0).toLocaleString()}`));
      insuranceSection.appendChild(this.createDocRow('出险次数', `${finance.insurance.claimHistory.length}次`));
    }
    container.appendChild(insuranceSection);

    const taxSection = this.createDocSection('税务信息', '#51cf66');
    taxSection.appendChild(this.createDocRow('购置税已缴', finance.tax.vehiclePurchaseTaxPaid ? '是' : '否', finance.tax.vehiclePurchaseTaxPaid ? '#51cf66' : '#ff6b6b'));
    if (finance.tax.vehiclePurchaseTaxPaid) {
      taxSection.appendChild(this.createDocRow('购置税金额', `¥${(finance.tax.vehiclePurchaseTaxAmount || 0).toLocaleString()}`));
    }
    taxSection.appendChild(this.createDocRow('车船税已缴', finance.tax.annualVehicleTaxPaid ? '是' : '否', finance.tax.annualVehicleTaxPaid ? '#51cf66' : '#ff6b6b'));
    taxSection.appendChild(this.createDocRow('税务欠费', finance.tax.taxArrears ? '有' : '无', finance.tax.taxArrears ? '#ff6b6b' : '#51cf66'));
    container.appendChild(taxSection);
  }

  private createDocSection(title: string, color: string): HTMLElement {
    const section = this.createContainer('doc-section');
    this.styleElement(section, {
      marginBottom: '16px'
    });

    const titleEl = document.createElement('h4');
    titleEl.textContent = title;
    this.styleElement(titleEl, {
      color: color,
      fontSize: '13px',
      fontWeight: '700',
      margin: '0 0 10px',
      paddingBottom: '6px',
      borderBottom: `2px solid ${color}30`
    });

    section.appendChild(titleEl);
    return section;
  }

  private createDocRow(label: string, value: string, valueColor?: string): HTMLElement {
    const row = this.createContainer('doc-row');
    this.styleElement(row, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      gap: '12px'
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    this.styleElement(labelEl, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '12px',
      flexShrink: '0'
    });

    const valueEl = document.createElement('span');
    valueEl.textContent = value;
    this.styleElement(valueEl, {
      color: valueColor || '#fff',
      fontSize: '12px',
      fontWeight: '500',
      textAlign: 'right',
      wordBreak: 'break-all'
    });

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }

  private formatTime(ms: number): string {
    return gameCore.gameManager.formatTime(ms);
  }
}
