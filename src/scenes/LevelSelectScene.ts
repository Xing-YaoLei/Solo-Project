import Phaser from 'phaser';
import { levels } from '../data/levels';
import { getTagById } from '../data/complaint-tags';
import { GameMode, Level } from '../game/types';
import { getDifficultyLabel, getDifficultyColor, formatTime, formatCurrency } from '../utils/helpers';

interface LevelSelectData {
  mode: GameMode;
}

export class LevelSelectScene extends Phaser.Scene {
  private mode: GameMode = 'training';
  private uiContainer!: HTMLDivElement;
  private detailModal!: HTMLDivElement | null;

  constructor() {
    super('LevelSelect');
  }

  init(data: LevelSelectData): void {
    this.mode = data.mode || 'training';
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');
    this.createDOMUI();

    this.cameras.main.fadeIn(400, 15, 23, 42);
  }

  private createDOMUI(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'level-select-container';

    const modeLabel = this.mode === 'training' ? '🎯 正式训练' : '📚 自由练习';
    const modeDesc = this.mode === 'training' 
      ? '按岗位标准考核，计时评分' 
      : '自由选择关卡，随时查看提示';

    this.uiContainer.innerHTML = `
      <div class="level-select-header">
        <button class="back-btn" id="backBtn">← 返回主菜单</button>
        <div class="header-center">
          <h1 class="page-title">${modeLabel}</h1>
          <p class="page-desc">${modeDesc}</p>
        </div>
        <div class="header-right">
          <span class="level-count">共 ${levels.length} 个关卡</span>
        </div>
      </div>

      <div class="level-grid">
        ${levels.map((level, index) => {
          const diffColor = getDifficultyColor(level.difficulty);
          return `
            <div class="level-card" data-level-id="${level.id}" style="border-left: 4px solid ${diffColor}">
              <div class="level-card-header">
                <span class="level-num">关卡 ${index + 1}</span>
                <span class="level-difficulty" style="color: ${diffColor}; background: ${diffColor}20;">
                  ${getDifficultyLabel(level.difficulty)}
                </span>
              </div>
              <h3 class="level-name">${level.name}</h3>
              <p class="level-desc">${level.description}</p>
              <div class="level-tags">
                ${level.complaintTags.slice(0, 3).map(tagId => {
                  const tag = getTagById(tagId);
                  return tag ? `<span class="mini-tag" style="color: ${tag.color}; background: ${tag.color}15;">${tag.name}</span>` : '';
                }).join('')}
                ${level.complaintTags.length > 3 ? `<span class="more-tags">+${level.complaintTags.length - 3}</span>` : ''}
              </div>
              <div class="level-footer">
                <span class="level-time">⏱ ${formatTime(level.estimatedTime)}</span>
                <span class="level-deposit">💰 ${formatCurrency(level.roomInfo.deposit)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    overlay.appendChild(this.uiContainer);

    document.getElementById('backBtn')?.addEventListener('click', () => {
      this.goBack();
    });

    const levelCards = this.uiContainer.querySelectorAll('.level-card');
    levelCards.forEach(card => {
      card.addEventListener('click', () => {
        const levelId = card.getAttribute('data-level-id');
        if (levelId) {
          const level = levels.find(l => l.id === levelId);
          if (level) {
            this.showLevelDetail(level);
          }
        }
      });
    });
  }

  private showLevelDetail(level: Level): void {
    if (this.detailModal) {
      this.detailModal.remove();
    }

    const diffColor = getDifficultyColor(level.difficulty);

    this.detailModal = document.createElement('div');
    this.detailModal.className = 'detail-modal';
    this.detailModal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content level-detail-modal">
        <div class="modal-header">
          <h2>${level.name}</h2>
          <button class="modal-close" data-close="true">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-badges">
            <span class="detail-badge" style="color: ${diffColor}; background: ${diffColor}20; border: 1px solid ${diffColor}40;">
              ${getDifficultyLabel(level.difficulty)}难度
            </span>
            <span class="detail-badge">⏱ 预计 ${formatTime(level.estimatedTime)}</span>
            <span class="detail-badge">🏠 ${level.roomInfo.roomNumber}</span>
            <span class="detail-badge">💰 押金 ${formatCurrency(level.roomInfo.deposit)}</span>
          </div>

          <div class="detail-section">
            <h4>关卡说明</h4>
            <p>${level.description}</p>
          </div>

          <div class="detail-section">
            <h4>投诉标签</h4>
            <div class="detail-tags">
              ${level.complaintTags.length > 0 
                ? level.complaintTags.map(tagId => {
                    const tag = getTagById(tagId);
                    return tag ? `
                      <div class="detail-tag" style="color: ${tag.color}; background: ${tag.color}15; border: 1px solid ${tag.color}30;">
                        <span class="tag-dot" style="background: ${tag.color};"></span>
                        ${tag.name}
                      </div>
                    ` : '';
                  }).join('')
                : '<span class="no-tags">无投诉记录</span>'
              }
            </div>
          </div>

          <div class="detail-section room-info">
            <h4>房间信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">租客姓名</span>
                <span class="info-value">${level.roomInfo.tenantName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">入住日期</span>
                <span class="info-value">${level.roomInfo.moveInDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">退租日期</span>
                <span class="info-value">${level.roomInfo.moveOutDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">月租金</span>
                <span class="info-value highlight">${formatCurrency(level.roomInfo.monthlyRent)}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>验房项目</h4>
            <p>共 ${level.inspectionItems.length} 项检查内容</p>
          </div>

          <div class="detail-section">
            <h4>收款记录</h4>
            <p>共 ${level.paymentRecords.length} 条记录</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close="true">取消</button>
          <button class="btn btn-primary" data-start="true">开始挑战 →</button>
        </div>
      </div>
    `;

    document.getElementById('ui-overlay')?.appendChild(this.detailModal);

    const closeBtns = this.detailModal.querySelectorAll('[data-close]');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeDetailModal());
    });

    this.detailModal.querySelector('.modal-overlay')?.addEventListener('click', () => {
      this.closeDetailModal();
    });

    const startBtn = this.detailModal.querySelector('[data-start]');
    startBtn?.addEventListener('click', () => {
      this.startLevel(level);
    });
  }

  private closeDetailModal(): void {
    if (this.detailModal) {
      this.detailModal.remove();
      this.detailModal = null;
    }
  }

  private startLevel(level: Level): void {
    this.closeDetailModal();
    
    this.cameras.main.fadeOut(400, 15, 23, 42);
    this.time.delayedCall(400, () => {
      if (this.uiContainer) {
        this.uiContainer.remove();
      }
      this.scene.start('Game', { level, mode: this.mode });
    });
  }

  private goBack(): void {
    this.cameras.main.fadeOut(300, 15, 23, 42);
    this.time.delayedCall(300, () => {
      if (this.uiContainer) {
        this.uiContainer.remove();
      }
      this.scene.start('MainMenu');
    });
  }

  shutdown(): void {
    if (this.uiContainer) {
      this.uiContainer.remove();
    }
    if (this.detailModal) {
      this.detailModal.remove();
    }
  }
}
