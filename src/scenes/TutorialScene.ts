import Phaser from 'phaser';
import { gameState } from '../systems/GameState';
import { SUPPLIERS } from '../models/gameData';

const TUTORIAL_STEPS = [
  {
    title: '欢迎来到美业耗材领用经营模拟',
    content: '在这个训练中，你将扮演门店的耗材管理员，\n负责处理供应商信息、领用记录和盘点差异。',
    showSupplierDemo: false,
  },
  {
    title: '认识供应商（核心）',
    content: '门店有4个供应商，每个的交货周期、最低起订量、\n可靠性和价格都不同。正确选择供应商是训练的关键！\n\n点击下方供应商卡片了解详情 ↓',
    showSupplierDemo: true,
  },
  {
    title: '供应商选择策略',
    content: '紧急补货时 → 选交期短的（华美达2天）\n预算紧张时 → 选价格低的（鑫源×0.75）\n稳妥之选 → 选可靠性高的（华美达95%）\n\n综合评分 = 可靠性40% + 交期35% + 价格25%',
    showSupplierDemo: false,
  },
  {
    title: '安全库存线',
    content: '每种耗材都有安全库存线（红色标记），\n当库存低于安全线时门店面临断货风险。\n\n领用时需确保补货量能让库存回到安全线以上，\n同时考虑供应商交期内的消耗量。',
    showSupplierDemo: false,
  },
  {
    title: '短缺预警系统',
    content: '橙色闪烁 = 库存接近安全线，需关注\n红色闪烁 = 即将断货，需立即补货！\n\n顶部红色横幅 = 短缺预警详情，\n显示具体耗材名称和预计断货天数。\n看到预警后请尽快安排补货！',
    showSupplierDemo: false,
  },
  {
    title: '领用操作',
    content: '选好供应商后，需要确定领用数量：\n\n少量补货 = 最低起订量（可能不够）\n安全补货 = 推荐量（覆盖交期消耗）\n满仓补货 = 补满仓库（可能浪费）\n\n推荐选择"安全补货"量。',
    showSupplierDemo: false,
  },
  {
    title: '盘点核对',
    content: '每天需要进行盘点核对，\n系统记录的数量可能与实际不一致。\n\n发现差异需要及时上报，\n否则可能影响后续领用判断。\n仔细核对是关键！',
    showSupplierDemo: false,
  },
  {
    title: '复盘与改进',
    content: '每次训练结束后：\n\n复盘页 → 展示失误步骤和错因详情\n结算页 → 特别标出安全库存相关错误\n统计页 → 关注周转天数核心指标\n\n复盘是提升的关键！',
    showSupplierDemo: false,
  },
  {
    title: '准备好了吗？',
    content: '核心训练目标：\n✓ 快速判断并选择合适的供应商\n✓ 合理安排领用数量，守住安全库存线\n✓ 准确处理盘点差异\n✓ 关注周转天数，优化库存效率\n\n祝训练顺利！',
    showSupplierDemo: false,
  },
];

export class TutorialScene extends Phaser.Scene {
  private currentStep: number = 0;
  private stepContainer!: Phaser.GameObjects.Container;
  private indicatorContainer!: Phaser.GameObjects.Container;
  private supplierDemoContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    this.stepContainer = this.add.container(0, 0);
    this.indicatorContainer = this.add.container(0, 0);
    this.supplierDemoContainer = this.add.container(0, 0);

    this.renderStep();

    const hint = this.add.text(width / 2, height - 25, '点击屏幕或按空格继续', {
      fontSize: '12px', color: '#546e7a', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.3 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    this.input.on('pointerdown', () => this.nextStep());
    this.input.keyboard!.on('keydown-SPACE', () => this.nextStep());
  }

  private renderStep(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const step = TUTORIAL_STEPS[this.currentStep];

    this.stepContainer.removeAll(true);
    this.supplierDemoContainer.removeAll(true);

    const panelW = Math.min(620, width - 60);
    const panelH = step.showSupplierDemo ? 240 : 300;
    const panelX = (width - panelW) / 2;
    const panelY = step.showSupplierDemo ? 40 : (height - panelH) / 2 - 30;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0x4fc3f7, 0.4);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);
    this.stepContainer.add(panel);

    this.stepContainer.add(
      this.add.text(width / 2, panelY + 28, step.title, {
        fontSize: '20px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    const lines = step.content.split('\n');
    lines.forEach((line, i) => {
      let color = '#b0bec5';
      if (line.startsWith('✓')) color = '#4caf50';
      else if (line.startsWith('紧急') || line.startsWith('预算') || line.startsWith('稳妥')) color = '#ffb74d';
      else if (line.includes('↓')) color = '#4fc3f7';

      this.stepContainer.add(
        this.add.text(panelX + 35, panelY + 60 + i * 22, line, {
          fontSize: '13px', color, fontFamily: 'Arial', wordWrap: { width: panelW - 70 },
        })
      );
    });

    if (step.showSupplierDemo) {
      this.renderSupplierDemo(panelX + 30, panelY + panelH + 15, panelW - 60);
    }

    this.renderIndicators(width, step.showSupplierDemo ? panelY + panelH + 175 : panelY + panelH + 30);
  }

  private renderSupplierDemo(x: number, y: number, width: number): void {
    const cardWidth = width / SUPPLIERS.length - 8;

    SUPPLIERS.forEach((sup, i) => {
      const cx = x + i * (cardWidth + 8) + cardWidth / 2;

      const card = this.add.graphics();
      const isBest = sup.id === 'SUP_A';
      card.fillStyle(isBest ? 0x1a3326 : 0x263238, 1);
      card.fillRoundedRect(cx - cardWidth / 2, y, cardWidth, 130, 6);
      card.lineStyle(1, isBest ? 0x4caf50 : 0x4fc3f7, isBest ? 0.8 : 0.3);
      card.strokeRoundedRect(cx - cardWidth / 2, y, cardWidth, 130, 6);
      this.supplierDemoContainer.add(card);

      this.supplierDemoContainer.add(
        this.add.text(cx, y + 12, sup.name, {
          fontSize: '10px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5)
      );

      const info = [
        `交期: ${sup.leadTime}天 ${sup.leadTime <= 3 ? '⭐' : ''}`,
        `起订: ${sup.minOrderQty}`,
        `可靠: ${Math.round(sup.reliability * 100)}% ${sup.reliability >= 0.9 ? '⭐' : ''}`,
        `价格: ×${sup.priceMultiplier}`,
      ];
      info.forEach((line, li) => {
        this.supplierDemoContainer.add(
          this.add.text(cx, y + 30 + li * 16, line, {
            fontSize: '9px', color: line.includes('⭐') ? '#ffb74d' : '#90a4ae', fontFamily: 'Arial',
          }).setOrigin(0.5)
        );
      });

      const reliabilityColor = sup.reliability >= 0.9 ? '#4caf50' : sup.reliability >= 0.8 ? '#ff9800' : '#e74c3c';
      const badge = this.add.text(cx, y + 98, sup.reliability >= 0.9 ? '✓ 推荐' : sup.reliability >= 0.8 ? '可用' : '⚠ 风险', {
        fontSize: '10px', color: reliabilityColor, fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: sup.reliability >= 0.9 ? '#1a3326' : '#263238',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);
      this.supplierDemoContainer.add(badge);

      const score = (sup.reliability * 0.4) + ((1 - sup.leadTime / 10) * 0.35) + ((1 - sup.priceMultiplier) * 0.25);
      this.supplierDemoContainer.add(
        this.add.text(cx, y + 116, `综合: ${Math.round(score * 100)}分`, {
          fontSize: '9px', color: score >= 0.7 ? '#4caf50' : '#78909c', fontFamily: 'Arial',
        }).setOrigin(0.5)
      );
    });
  }

  private renderIndicators(width: number, y: number): void {
    this.indicatorContainer.removeAll(true);
    const totalSteps = TUTORIAL_STEPS.length;

    for (let i = 0; i < totalSteps; i++) {
      const dotX = width / 2 + (i - totalSteps / 2) * 18 + 9;
      const color = i === this.currentStep ? 0x4fc3f7 : i < this.currentStep ? 0x4caf50 : 0x37474f;
      const dot = this.add.graphics();
      dot.fillStyle(color, 1);
      dot.fillCircle(dotX, y, i === this.currentStep ? 5 : 3);
      this.indicatorContainer.add(dot);
    }
  }

  private nextStep(): void {
    this.currentStep++;
    if (this.currentStep >= TUTORIAL_STEPS.length) {
      gameState.tutorialState.completed = true;
      gameState.tutorialState.supplierIntroDone = true;
      gameState.tutorialState.currentStep = TUTORIAL_STEPS.length;
      this.scene.start('GameScene');
      return;
    }
    this.renderStep();
  }
}
