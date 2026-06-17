import Phaser from 'phaser';
import { Level, GameMode, GameError } from '../game/types';
import { formatTime, getDifficultyLabel, getDifficultyColor, formatCurrency, getActionLabel } from '../utils/helpers';
import { gameManager } from '../game/GameManager';

interface ResultSceneData {
  score: number;
  errors: GameError[];
  timeBonus: number;
  elapsedTime: number;
  level: Level;
  mode: GameMode;
}

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultSceneData;

  constructor() {
    super('Result');
  }

  init(data: ResultSceneData): void {
    this.resultData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');

    const { width, height } = this.scale;

    this.createDOMResult();

    this.cameras.main.fadeIn(500, 15, 23, 42);
  }

  private createDOMResult(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'result-container';

    const { score, errors, timeBonus, elapsedTime, level, mode } = this.resultData;
    const isPassed = score >= 60;
    const accuracy = errors.length > 0 
      ? Math.max(0, Math.round((1 - errors.reduce((sum, e) => sum + e.pointDeduction, 0) / 100) * 100))
      : 100;

    container.innerHTML = `
      <div class="result-header">
        <div class="result-badge ${isPassed ? 'pass' : 'fail'}">
          ${isPassed ? '🎉 考核通过' : '💪 继续加油'}
        </div>
        <h1 class="result-title">${isPassed ? '恭喜完成挑战！' : '挑战结束'}</h1>
        <p class="result-subtitle">${level.name}</p>
      </div>

      <div class="result-stats">
        <div class="stat-card main">
          <div class="stat-ring ${isPassed ? 'pass' : 'fail'}">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" stroke-width="8"/>
              <circle cx="60" cy="60" r="54" fill="none" 
                stroke="${isPassed ? '#10b981' : '#f59e0b'}" 
                stroke-width="8"
                stroke-dasharray="${score * 3.39} 339"
                stroke-linecap="round"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="stat-ring-score">${score}</div>
          </div>
          <div class="stat-label">总得分</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱</div>
          <div class="stat-value">${formatTime(elapsedTime)}</div>
          <div class="stat-label">用时</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">+${timeBonus}</div>
          <div class="stat-label">时间奖励</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${accuracy}%</div>
          <div class="stat-label">正确率</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-value">${errors.length}</div>
          <div class="stat-label">错误数</div>
        </div>
      </div>

      <div class="result-detail">
        <div class="detail-section">
          <h3>📋 正确答案参考</h3>
          <div class="answer-reference">
            <div class="ref-item">
              <span class="ref-label">正确处理方式</span>
              <span class="ref-value correct">${getActionLabel(level.correctAction)}</span>
            </div>
            <div class="ref-item">
              <span class="ref-label">应扣费用</span>
              <span class="ref-value deduction">
                ${formatCurrency(level.correctDeductions.reduce((sum, d) => sum + d.amount, 0))}
              </span>
            </div>
          </div>
        </div>

        ${errors.length > 0 ? `
          <div class="detail-section">
            <h3>⚠️ 错误分析</h3>
            <div class="error-list">
              ${errors.map((error, index) => `
                <div class="error-item">
                  <div class="error-header">
                    <span class="error-number">${index + 1}</span>
                    <span class="error-type ${error.type}">${this.getErrorTypeLabel(error.type)}</span>
                    <span class="error-deduction">-${error.pointDeduction}分</span>
                  </div>
                  <div class="error-description">${error.description}</div>
                  <div class="error-detail">
                    <div class="detail-row">
                      <span class="detail-label">你的答案</span>
                      <span class="detail-value wrong">${error.playerAnswer}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">正确答案</span>
                      <span class="detail-value right">${error.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${level.correctDeductions.length > 0 ? `
          <div class="detail-section">
            <h3>📝 扣款明细（参考）</h3>
            <div class="deduction-list">
              ${level.correctDeductions.map(detail => `
                <div class="deduction-item">
                  <span class="deduction-reason">${detail.reason}</span>
                  <span class="deduction-amount">${formatCurrency(detail.amount)}</span>
                </div>
              `).join('')}
              <div class="deduction-total">
                <span class="deduction-label">合计</span>
                <span class="deduction-value">${formatCurrency(level.correctDeductions.reduce((sum, d) => sum + d.amount, 0))}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="result-actions">
        <button class="btn btn-secondary" id="btn-retry">🔄 重新挑战</button>
        <button class="btn btn-outline" id="btn-back">📋 返回选关</button>
        <button class="btn btn-primary" id="btn-home">🏠 返回主页</button>
      </div>
    `;

    overlay.appendChild(container);

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      this.goToGame();
    });

    document.getElementById('btn-back')?.addEventListener('click', () => {
      this.goToLevelSelect();
    });

    document.getElementById('btn-home')?.addEventListener('click', () => {
      this.goToMainMenu();
    });
  }

  private getErrorTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'utility': '水电判断',
      'inspection': '验房检查',
      'payment': '收款判断',
      'action': '最终动作'
    };
    return labels[type] || type;
  }

  private goToGame(): void {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.innerHTML = '';

    this.cameras.main.fadeOut(300, 15, 23, 42);
    this.time.delayedCall(300, () => {
      this.scene.start('Game', {
        level: this.resultData.level,
        mode: this.resultData.mode
      });
    });
  }

  private goToLevelSelect(): void {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.innerHTML = '';

    this.cameras.main.fadeOut(300, 15, 23, 42);
    this.time.delayedCall(300, () => {
      this.scene.start('LevelSelect', { mode: this.resultData.mode });
    });
  }

  private goToMainMenu(): void {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.innerHTML = '';

    this.cameras.main.fadeOut(300, 15, 23, 42);
    this.time.delayedCall(300, () => {
      this.scene.start('MainMenu');
    });
  }

  shutdown(): void {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) {
      overlay.innerHTML = '';
    }
  }
}
