import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  private uiContainer!: HTMLDivElement;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');
    this.addBackgroundParticles();
    this.createDOMUI();

    this.cameras.main.fadeIn(600, 15, 23, 42);
  }

  private addBackgroundParticles(): void {
    const { width, height } = this.scale;

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 8);
      const rect = this.add.rectangle(x, y, size, size, 0x334155, 0.4);

      this.tweens.add({
        targets: rect,
        y: y - 80,
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        ease: 'Sine.easeInOut'
      });
    }
  }

  private createDOMUI(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'main-menu-container';

    this.uiContainer.innerHTML = `
      <div class="menu-header">
        <div class="menu-logo">🏠</div>
        <h1 class="menu-title">长租公寓退租验房</h1>
        <p class="menu-subtitle">培训模拟游戏</p>
      </div>

      <div class="menu-cards">
        <div class="menu-card training" data-mode="training">
          <div class="card-icon">🎯</div>
          <h2 class="card-title">正式训练</h2>
          <p class="card-desc">按岗位要求进行标准化考核</p>
          <div class="card-tags">
            <span class="tag">限时挑战</span>
            <span class="tag">严格评分</span>
          </div>
          <button class="card-btn">进入训练 →</button>
        </div>

        <div class="menu-card practice" data-mode="practice">
          <div class="card-icon">📚</div>
          <h2 class="card-title">自由练习</h2>
          <p class="card-desc">自由选择关卡进行练习巩固</p>
          <div class="card-tags">
            <span class="tag">不限时间</span>
            <span class="tag">查看提示</span>
          </div>
          <button class="card-btn">开始练习 →</button>
        </div>
      </div>

      <div class="menu-footer">
        <button class="help-btn" id="helpBtn">📖 游戏说明</button>
      </div>

      <div class="help-modal" id="helpModal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>游戏说明</h2>
            <button class="modal-close" id="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="help-section">
              <h3>🎯 游戏目标</h3>
              <p>模拟长租公寓退租验房流程，根据水电读数、验房清单、收款流水等信息，判断正确的退租处理方式。</p>
            </div>
            <div class="help-section">
              <h3>📋 游戏流程</h3>
              <ol>
                <li>查看任务信息，了解退租房间基本情况</li>
                <li>核对水电表读数，判断用量是否异常</li>
                <li>检查验房清单，标记发现的问题项</li>
                <li>查看收款流水，确认是否有逾期/欠费</li>
                <li>综合判断，选择最终处理动作</li>
              </ol>
            </div>
            <div class="help-section">
              <h3>⭐ 评分规则</h3>
              <p>基础分 100 分，错误扣分，时间奖励最多 +20 分</p>
              <ul>
                <li>水电判断错误 -20 分</li>
                <li>验房漏判/误判 每项 -10 分</li>
                <li>收款判断错误 -20 分</li>
                <li>最终动作错误 -30 分</li>
              </ul>
            </div>
            <div class="help-section">
              <h3>🎮 模式说明</h3>
              <p><strong>正式训练：</strong>有时间限制，严格评分，用于岗位考核</p>
              <p><strong>自由练习：</strong>不限时，可查看提示，用于学习巩固</p>
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.appendChild(this.uiContainer);

    const trainingCard = this.uiContainer.querySelector('[data-mode="training"]');
    const practiceCard = this.uiContainer.querySelector('[data-mode="practice"]');

    trainingCard?.addEventListener('click', () => {
      this.goToLevelSelect('training');
    });

    practiceCard?.addEventListener('click', () => {
      this.goToLevelSelect('practice');
    });

    document.getElementById('helpBtn')?.addEventListener('click', () => {
      document.getElementById('helpModal')!.style.display = 'flex';
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
      document.getElementById('helpModal')!.style.display = 'none';
    });

    document.querySelector('.modal-overlay')?.addEventListener('click', () => {
      document.getElementById('helpModal')!.style.display = 'none';
    });
  }

  private goToLevelSelect(mode: 'training' | 'practice'): void {
    this.cameras.main.fadeOut(400, 15, 23, 42);
    this.time.delayedCall(400, () => {
      if (this.uiContainer) {
        this.uiContainer.remove();
      }
      this.scene.start('LevelSelect', { mode });
    });
  }

  shutdown(): void {
    if (this.uiContainer) {
      this.uiContainer.remove();
    }
  }
}
