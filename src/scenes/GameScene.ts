import Phaser from 'phaser';
import { Level, GameMode, GamePhase, GameAction } from '../game/types';
import { gameManager } from '../game/GameManager';
import { formatTime, getDifficultyLabel, getDifficultyColor, getActionLabel, getStatusLabel, getSeverityLabel, formatCurrency } from '../utils/helpers';
import { getTagById } from '../data/complaint-tags';

interface GameSceneData {
  level: Level;
  mode: GameMode;
}

type GamePhaseId = 'briefing' | 'utility' | 'inspection' | 'payment' | 'action' | 'result';

export class GameScene extends Phaser.Scene {
  private level!: Level;
  private mode!: GameMode;
  private currentPhase: GamePhaseId = 'briefing';
  private timerEvent!: Phaser.Time.TimerEvent;
  private timeRemaining: number = 0;
  private uiContainer!: HTMLDivElement;

  private phases: { id: GamePhaseId; name: string }[] = [
    { id: 'briefing', name: '任务分配' },
    { id: 'utility', name: '水电读数' },
    { id: 'inspection', name: '验房清单' },
    { id: 'payment', name: '收款流水' },
    { id: 'action', name: '动作判断' }
  ];

  constructor() {
    super('Game');
  }

  init(data: GameSceneData): void {
    this.level = data.level;
    this.mode = data.mode;
    gameManager.startLevel(this.level, this.mode);
    if (this.level.timeLimit && this.mode === 'training') {
      this.timeRemaining = this.level.timeLimit;
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');

    this.createDOMContainer();
    this.renderUI();

    if (this.mode === 'training' && this.level.timeLimit) {
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: this.onTimerTick,
        callbackScope: this,
        loop: true
      });
    }

    this.cameras.main.fadeIn(400, 15, 23, 42);
  }

  private createDOMContainer(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'game-ui-container';
    overlay.appendChild(this.uiContainer);
  }

  private renderUI(): void {
    if (!this.uiContainer) return;

    this.uiContainer.innerHTML = `
      <div class="game-top-bar">
        <div class="game-info">
          <span class="room-info">🏠 ${this.level.roomInfo.roomNumber}</span>
          <span class="mode-badge ${this.mode}">${this.mode === 'training' ? '正式训练' : '自由练习'}</span>
          <span class="difficulty-badge" style="color: ${getDifficultyColor(this.level.difficulty)}">${getDifficultyLabel(this.level.difficulty)}</span>
        </div>
        <div class="game-timer">
          ${this.mode === 'training' && this.level.timeLimit ? `⏱ 剩余时间: <span class="timer-text">${formatTime(this.timeRemaining)}</span>` : `⏱ 用时: <span class="timer-text">${formatTime(gameManager.getElapsedTime())}</span>`}
        </div>
      </div>

      <div class="game-progress">
        ${this.phases.map((phase, index) => `
          <div class="progress-step ${phase.id === this.currentPhase ? 'active' : ''} ${this.getPhaseCompleted(phase.id) ? 'completed' : ''}">
            <div class="step-number">${index + 1}</div>
            <div class="step-name">${phase.name}</div>
          </div>
          ${index < this.phases.length - 1 ? '<div class="step-line"></div>' : ''}
        `).join('')}
      </div>

      <div class="game-content">
        ${this.renderPhaseContent()}
      </div>

      <div class="game-bottom-bar">
        ${this.renderBottomBar()}
      </div>
    `;

    this.bindPhaseEvents();
  }

  private getPhaseCompleted(phaseId: GamePhaseId): boolean {
    const phaseOrder = this.phases.map(p => p.id);
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    const phaseIndex = phaseOrder.indexOf(phaseId);
    return phaseIndex < currentIndex;
  }

  private renderPhaseContent(): string {
    switch (this.currentPhase) {
      case 'briefing':
        return this.renderBriefing();
      case 'utility':
        return this.renderUtility();
      case 'inspection':
        return this.renderInspection();
      case 'payment':
        return this.renderPayment();
      case 'action':
        return this.renderAction();
      default:
        return '';
    }
  }

  private renderBriefing(): string {
    const { roomInfo } = this.level;
    return `
      <div class="phase-content briefing-phase">
        <div class="phase-header">
          <h2>📋 任务分配</h2>
          <p>请仔细阅读以下退租验房任务信息</p>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>房间信息</h3>
            <div class="info-row">
              <span class="info-label">房间号</span>
              <span class="info-value">${roomInfo.roomNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">租客姓名</span>
              <span class="info-value">${roomInfo.tenantName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">入住日期</span>
              <span class="info-value">${roomInfo.moveInDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">退租日期</span>
              <span class="info-value">${roomInfo.moveOutDate}</span>
            </div>
          </div>

          <div class="info-card">
            <h3>费用信息</h3>
            <div class="info-row">
              <span class="info-label">月租金</span>
              <span class="info-value highlight">${formatCurrency(roomInfo.monthlyRent)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">押金金额</span>
              <span class="info-value highlight">${formatCurrency(roomInfo.deposit)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">租期</span>
              <span class="info-value">12个月</span>
            </div>
          </div>

          <div class="info-card full-width">
            <h3>投诉标签</h3>
            <div class="tags-container">
              ${this.level.complaintTags.length > 0 
                ? this.level.complaintTags.map(tagId => {
                    const tag = getTagById(tagId);
                    return tag ? `<span class="complaint-tag" style="background: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40">${tag.name}</span>` : '';
                  }).join('')
                : '<span class="no-tags">暂无投诉记录</span>'
              }
            </div>
          </div>
        </div>

        <div class="task-description">
          <h3>📝 任务说明</h3>
          <p>${this.level.description}</p>
          <p class="tip">💡 提示：你需要依次检查水电读数、验房清单、收款流水，最后综合判断退租处理方式。</p>
        </div>
      </div>
    `;
  }

  private renderUtility(): string {
    const { utilityData } = this.level;
    const elecUsage = utilityData.electricityEnd - utilityData.electricityStart;
    const waterUsage = utilityData.waterEnd - utilityData.waterStart;
    const elecCost = elecUsage * utilityData.electricityRate;
    const waterCost = waterUsage * utilityData.waterRate;

    return `
      <div class="phase-content utility-phase">
        <div class="phase-header">
          <h2>⚡💧 水电读数</h2>
          <p>核对水电表读数，判断用量是否正常</p>
        </div>

        <div class="utility-container">
          <div class="utility-card electricity">
            <div class="utility-icon">⚡</div>
            <h3>电表读数</h3>
            <div class="meter-readings">
              <div class="reading-item">
                <span class="reading-label">期初读数</span>
                <span class="reading-value">${utilityData.electricityStart} 度</span>
              </div>
              <div class="reading-divider">→</div>
              <div class="reading-item">
                <span class="reading-label">期末读数</span>
                <span class="reading-value end">${utilityData.electricityEnd} 度</span>
              </div>
            </div>
            <div class="usage-summary">
              <div class="usage-item">
                <span class="usage-label">用电量</span>
                <span class="usage-value">${elecUsage} 度</span>
              </div>
              <div class="usage-item">
                <span class="usage-label">单价</span>
                <span class="usage-value">${utilityData.electricityRate} 元/度</span>
              </div>
              <div class="usage-item total">
                <span class="usage-label">电费合计</span>
                <span class="usage-value">${formatCurrency(elecCost)}</span>
              </div>
            </div>
          </div>

          <div class="utility-card water">
            <div class="utility-icon">💧</div>
            <h3>水表读数</h3>
            <div class="meter-readings">
              <div class="reading-item">
                <span class="reading-label">期初读数</span>
                <span class="reading-value">${utilityData.waterStart} 吨</span>
              </div>
              <div class="reading-divider">→</div>
              <div class="reading-item">
                <span class="reading-label">期末读数</span>
                <span class="reading-value end">${utilityData.waterEnd} 吨</span>
              </div>
            </div>
            <div class="usage-summary">
              <div class="usage-item">
                <span class="usage-label">用水量</span>
                <span class="usage-value">${waterUsage} 吨</span>
              </div>
              <div class="usage-item">
                <span class="usage-label">单价</span>
                <span class="usage-value">${utilityData.waterRate} 元/吨</span>
              </div>
              <div class="usage-item total">
                <span class="usage-label">水费合计</span>
                <span class="usage-value">${formatCurrency(waterCost)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="judgment-section">
          <h3>🤔 你的判断</h3>
          <p class="judgment-desc">根据水电用量和读数，你认为是否存在异常？</p>
          <div class="judgment-options">
            <label class="judgment-option ${gameManager.getState().playerAnswers.utilityJudgment === false ? 'selected normal' : ''}">
              <input type="radio" name="utility-judgment" value="normal" ${gameManager.getState().playerAnswers.utilityJudgment === false ? 'checked' : ''}>
              <span class="option-icon">✅</span>
              <span class="option-text">用量正常，无异常</span>
            </label>
            <label class="judgment-option ${gameManager.getState().playerAnswers.utilityJudgment === true ? 'selected abnormal' : ''}">
              <input type="radio" name="utility-judgment" value="abnormal" ${gameManager.getState().playerAnswers.utilityJudgment === true ? 'checked' : ''}>
              <span class="option-icon">⚠️</span>
              <span class="option-text">用量异常，需关注</span>
            </label>
          </div>
          ${this.mode === 'practice' && utilityData.hasAbnormality ? `
            <div class="practice-hint">
              💡 <strong>提示：</strong>${utilityData.abnormalityHint || '注意观察用量数据的合理性'}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderInspection(): string {
    const { inspectionItems } = this.level;
    const categories = [...new Set(inspectionItems.map(item => item.category))];

    return `
      <div class="phase-content inspection-phase">
        <div class="phase-header">
          <h2>🔍 验房清单</h2>
          <p>逐项检查房间设施，标记发现的问题</p>
        </div>

        <div class="inspection-container">
          ${categories.map(category => `
            <div class="inspection-category">
              <h3 class="category-title">${category}</h3>
              <div class="inspection-items">
                ${inspectionItems.filter(item => item.category === category).map(item => {
                  const isMarked = !!gameManager.getState().playerAnswers.inspectionMarks[item.id];
                  const statusColor = item.status === 'normal' ? '#10b981' : 
                                      item.status === 'damaged' ? '#ef4444' :
                                      item.status === 'missing' ? '#f59e0b' : '#8b5cf6';
                  return `
                    <div class="inspection-item ${isMarked ? 'marked' : ''}" data-item-id="${item.id}">
                      <div class="item-checkbox">
                        <div class="checkbox ${isMarked ? 'checked' : ''}">
                          ${isMarked ? '✓' : ''}
                        </div>
                      </div>
                      <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-desc">${item.description}</div>
                        ${isMarked ? `
                          <div class="item-status-tag" style="color: ${statusColor}">
                            ${getStatusLabel(item.status)} · ${getSeverityLabel(item.severity)}
                          </div>
                        ` : ''}
                      </div>
                      <div class="item-deduction">
                        ${item.deductionAmount > 0 ? `扣 ${formatCurrency(item.deductionAmount)}` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="inspection-summary">
          <div class="summary-item">
            <span class="summary-label">已标记问题项</span>
            <span class="summary-value">${Object.keys(gameManager.getState().playerAnswers.inspectionMarks).filter(k => gameManager.getState().playerAnswers.inspectionMarks[k]).length} 项</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">预估扣款</span>
            <span class="summary-value deduction">
              ${formatCurrency(
                inspectionItems
                  .filter(item => gameManager.getState().playerAnswers.inspectionMarks[item.id])
                  .reduce((sum, item) => sum + item.deductionAmount, 0)
              )}
            </span>
          </div>
        </div>

        ${this.mode === 'practice' ? `
          <div class="practice-hint">
            💡 <strong>练习提示：</strong>仔细阅读每项的描述，根据描述判断是否属于需要扣押金的问题。正常使用痕迹通常不需要扣款。
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderPayment(): string {
    const { paymentRecords } = this.level;
    const rentRecords = paymentRecords.filter(r => r.type === 'rent');
    const overdueCount = rentRecords.filter(r => r.status === 'overdue').length;
    const partialCount = rentRecords.filter(r => r.status === 'partial').length;

    return `
      <div class="phase-content payment-phase">
        <div class="phase-header">
          <h2>💰 收款流水</h2>
          <p>查看历史收款记录，确认是否有逾期或欠费</p>
        </div>

        <div class="payment-stats">
          <div class="stat-card">
            <div class="stat-value">${rentRecords.length}</div>
            <div class="stat-label">租金记录</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">${overdueCount}</div>
            <div class="stat-label">逾期次数</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">${partialCount}</div>
            <div class="stat-label">未结清</div>
          </div>
        </div>

        <div class="payment-timeline">
          <h3>收款记录</h3>
          <div class="timeline-container">
            ${paymentRecords.map(record => {
              const statusClass = record.status === 'paid' ? 'paid' : 
                                 record.status === 'overdue' ? 'overdue' : 'partial';
              const statusText = getStatusLabel(record.status);
              const typeIcon = record.type === 'rent' ? '🏠' : 
                              record.type === 'utility' ? '💡' :
                              record.type === 'deposit' ? '💰' : '📄';
              return `
                <div class="timeline-item ${statusClass}">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-date">${record.date}</span>
                      <span class="timeline-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="timeline-body">
                      <span class="timeline-icon">${typeIcon}</span>
                      <span class="timeline-desc">${record.description}</span>
                      <span class="timeline-amount">${formatCurrency(record.amount)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="judgment-section">
          <h3>🤔 你的判断</h3>
          <p class="judgment-desc">根据收款流水记录，你认为是否存在收款问题？</p>
          <div class="judgment-options">
            <label class="judgment-option ${gameManager.getState().playerAnswers.paymentJudgment === false ? 'selected normal' : ''}">
              <input type="radio" name="payment-judgment" value="normal" ${gameManager.getState().playerAnswers.paymentJudgment === false ? 'checked' : ''}>
              <span class="option-icon">✅</span>
              <span class="option-text">收款正常，无问题</span>
            </label>
            <label class="judgment-option ${gameManager.getState().playerAnswers.paymentJudgment === true ? 'selected abnormal' : ''}">
              <input type="radio" name="payment-judgment" value="abnormal" ${gameManager.getState().playerAnswers.paymentJudgment === true ? 'checked' : ''}>
              <span class="option-icon">⚠️</span>
              <span class="option-text">存在收款问题</span>
            </label>
          </div>
          ${this.mode === 'practice' ? `
            <div class="practice-hint">
              💡 <strong>练习提示：</strong>注意观察每条记录的状态，特别是"逾期"和"部分支付"的记录。频繁逾期可能需要特殊处理。
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderAction(): string {
    const selectedAction = gameManager.getState().playerAnswers.selectedAction;
    const { inspectionItems } = this.level;
    const totalDeduction = inspectionItems
      .filter(item => gameManager.getState().playerAnswers.inspectionMarks[item.id])
      .reduce((sum, item) => sum + item.deductionAmount, 0);

    return `
      <div class="phase-content action-phase">
        <div class="phase-header">
          <h2>🎯 动作判断</h2>
          <p>综合所有信息，选择最终的退租处理方式</p>
        </div>

        <div class="action-summary">
          <div class="summary-card">
            <h3>📊 信息汇总</h3>
            <div class="summary-row">
              <span class="summary-label">水电状态</span>
              <span class="summary-value ${gameManager.getState().playerAnswers.utilityJudgment ? 'warning' : 'normal'}">
                ${gameManager.getState().playerAnswers.utilityJudgment ? '⚠️ 异常' : '✅ 正常'}
              </span>
            </div>
            <div class="summary-row">
              <span class="summary-label">验房问题</span>
              <span class="summary-value">
                ${Object.keys(gameManager.getState().playerAnswers.inspectionMarks).filter(k => gameManager.getState().playerAnswers.inspectionMarks[k]).length} 项
              </span>
            </div>
            <div class="summary-row">
              <span class="summary-label">收款状态</span>
              <span class="summary-value ${gameManager.getState().playerAnswers.paymentJudgment ? 'warning' : 'normal'}">
                ${gameManager.getState().playerAnswers.paymentJudgment ? '⚠️ 有问题' : '✅ 正常'}
              </span>
            </div>
            <div class="summary-row highlight">
              <span class="summary-label">预估扣款</span>
              <span class="summary-value deduction">${formatCurrency(totalDeduction)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">押金金额</span>
              <span class="summary-value">${formatCurrency(this.level.roomInfo.deposit)}</span>
            </div>
          </div>
        </div>

        <div class="action-options">
          <h3>选择处理方式</h3>
          <div class="action-grid">
            <div class="action-card ${selectedAction === 'full_refund' ? 'selected' : ''}" data-action="full_refund">
              <div class="action-icon">✅</div>
              <div class="action-title">全额退还押金</div>
              <div class="action-desc">房屋状况良好，无扣款事项</div>
              <div class="action-refund">退还 ${formatCurrency(this.level.roomInfo.deposit)}</div>
            </div>
            <div class="action-card ${selectedAction === 'partial_deduction' ? 'selected' : ''}" data-action="partial_deduction">
              <div class="action-icon">📝</div>
              <div class="action-title">部分扣除押金</div>
              <div class="action-desc">存在轻微损坏，按实际损失扣除</div>
              <div class="action-refund">退还 ${formatCurrency(this.level.roomInfo.deposit - totalDeduction)}</div>
            </div>
            <div class="action-card ${selectedAction === 'full_deduction' ? 'selected' : ''}" data-action="full_deduction">
              <div class="action-icon">🚫</div>
              <div class="action-title">全额扣除押金</div>
              <div class="action-desc">损坏严重或逾期较多，押金全部扣除</div>
              <div class="action-refund">退还 ${formatCurrency(0)}</div>
            </div>
            <div class="action-card ${selectedAction === 'escalate' ? 'selected' : ''}" data-action="escalate">
              <div class="action-icon">📢</div>
              <div class="action-title">上报上级处理</div>
              <div class="action-desc">情况复杂或涉及纠纷，需上级介入</div>
              <div class="action-refund">待裁定</div>
            </div>
          </div>
        </div>

        ${this.mode === 'practice' ? `
          <div class="practice-hint">
            💡 <strong>练习提示：</strong>综合考虑所有因素。一般来说：轻微损坏选部分扣除，严重损坏或多次严重逾期选全额扣除，涉及结构改动、合同纠纷等选上报。
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderBottomBar(): string {
    const canGoBack = this.currentPhase !== 'briefing';
    const canGoForward = this.canProceed();
    const isLastPhase = this.currentPhase === 'action';

    return `
      <button class="btn btn-secondary ${!canGoBack ? 'disabled' : ''}" ${!canGoBack ? 'disabled' : ''} data-action="prev">
        ← 上一步
      </button>
      <div class="phase-indicator">
        ${this.phases.findIndex(p => p.id === this.currentPhase) + 1} / ${this.phases.length}
      </div>
      <button class="btn btn-primary ${!canGoForward ? 'disabled' : ''}" ${!canGoForward ? 'disabled' : ''} data-action="next">
        ${isLastPhase ? '提交答案 →' : '下一步 →'}
      </button>
    `;
  }

  private canProceed(): boolean {
    const answers = gameManager.getState().playerAnswers;
    switch (this.currentPhase) {
      case 'briefing':
        return true;
      case 'utility':
        return answers.utilityJudgment !== null && answers.utilityJudgment !== undefined;
      case 'inspection':
        return true;
      case 'payment':
        return answers.paymentJudgment !== null && answers.paymentJudgment !== undefined;
      case 'action':
        return answers.selectedAction !== null;
      default:
        return false;
    }
  }

  private bindPhaseEvents(): void {
    const prevBtn = this.uiContainer.querySelector('[data-action="prev"]');
    const nextBtn = this.uiContainer.querySelector('[data-action="next"]');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.goToPrevPhase());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.goToNextPhase());
    }

    const utilityOptions = this.uiContainer.querySelectorAll('input[name="utility-judgment"]');
    utilityOptions.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        gameManager.setUtilityJudgment(target.value === 'abnormal');
        this.renderUI();
      });
    });

    const paymentOptions = this.uiContainer.querySelectorAll('input[name="payment-judgment"]');
    paymentOptions.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        gameManager.setPaymentJudgment(target.value === 'abnormal');
        this.renderUI();
      });
    });

    const inspectionItems = this.uiContainer.querySelectorAll('.inspection-item');
    inspectionItems.forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.getAttribute('data-item-id');
        if (itemId) {
          gameManager.toggleInspectionItem(itemId);
          this.renderUI();
        }
      });
    });

    const actionCards = this.uiContainer.querySelectorAll('.action-card');
    actionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.getAttribute('data-action') as GameAction;
        if (action) {
          const { inspectionItems } = this.level;
          const totalDeduction = inspectionItems
            .filter(item => gameManager.getState().playerAnswers.inspectionMarks[item.id])
            .reduce((sum, item) => sum + item.deductionAmount, 0);
          gameManager.setSelectedAction(action, totalDeduction);
          this.renderUI();
        }
      });
    });
  }

  private goToPrevPhase(): void {
    const phaseOrder = this.phases.map(p => p.id);
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    if (currentIndex > 0) {
      this.currentPhase = phaseOrder[currentIndex - 1];
      this.renderUI();
    }
  }

  private goToNextPhase(): void {
    const phaseOrder = this.phases.map(p => p.id);
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    
    if (currentIndex < phaseOrder.length - 1) {
      this.currentPhase = phaseOrder[currentIndex + 1];
      this.renderUI();
    } else {
      this.finishGame();
    }
  }

  private onTimerTick(): void {
    if (this.timeRemaining > 0) {
      this.timeRemaining--;
      const timerText = this.uiContainer.querySelector('.timer-text');
      if (timerText) {
        timerText.textContent = formatTime(this.timeRemaining);
        if (this.timeRemaining <= 30) {
          timerText.classList.add('warning');
        }
      }
    } else {
      this.finishGame();
    }
  }

  private finishGame(): void {
    if (this.timerEvent) {
      this.timerEvent.remove(false);
    }
    
    const { score, errors, timeBonus } = gameManager.calculateScore();
    const elapsed = gameManager.getElapsedTime();

    if (this.uiContainer) {
      this.uiContainer.innerHTML = '';
    }

    this.cameras.main.fadeOut(500, 15, 23, 42);
    this.time.delayedCall(500, () => {
      this.scene.start('Result', {
        score,
        errors,
        timeBonus,
        elapsedTime: elapsed,
        level: this.level,
        mode: this.mode
      });
    });
  }

  update(): void {
    if (this.mode === 'practice' && this.uiContainer) {
      const timerText = this.uiContainer.querySelector('.timer-text');
      if (timerText && this.currentPhase !== 'result') {
        timerText.textContent = formatTime(gameManager.getElapsedTime());
      }
    }
  }

  shutdown(): void {
    if (this.uiContainer) {
      this.uiContainer.remove();
    }
  }
}
