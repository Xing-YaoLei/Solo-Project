import Phaser from 'phaser';
import levelConfigs from '@/config/levelConfigs';
import { ResultStore } from '@/systems/ResultStore';
import { SettingsSystem } from '@/systems/SettingsSystem';

const BG = 0x1a1a2e;
const PRIMARY = 0x4fc3f7;
const GOLD = 0xffd54f;
const TEXT = 0xffffff;

export class LevelSelectScene extends Phaser.Scene {
  private resultStore!: ResultStore;
  private settings!: SettingsSystem;
  private scrollContainer!: Phaser.GameObjects.Container;
  private dragStartY = 0;
  private containerStartY = 0;

  constructor() {
    super({ key: 'LevelSelect' });
  }

  create(): void {
    this.resultStore = new ResultStore();
    this.settings = new SettingsSystem();

    const { width, height } = this.cameras.main;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(BG);

    this.createBackButton();
    this.createTitle(cx);

    const listStartY = 90;
    this.scrollContainer = this.add.container(0, listStartY);

    const isGrid = levelConfigs.length > 3;
    const cardW = isGrid ? 170 : 300;
    const cardH = 150;
    const gap = 14;

    levelConfigs.forEach((config, i) => {
      let cardX: number;
      let cardY: number;

      if (isGrid) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const totalW = cardW * 2 + gap;
        cardX = cx - totalW / 2 + col * (cardW + gap);
        cardY = row * (cardH + gap);
      } else {
        cardX = cx - cardW / 2;
        cardY = i * (cardH + gap);
      }

      this.createCard(cardX, cardY, cardW, cardH, config);
    });

    this.setupScroll(height, listStartY);
  }

  private createBackButton(): void {
    const btn = this.add.image(56, 36, 'btn_small')
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);
    this.add.text(56, 36, '返回', {
      fontSize: '16px',
      color: '#' + TEXT.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.wireButton(btn, () => this.scene.start('Menu'));
  }

  private createTitle(cx: number): void {
    this.add.text(cx, 36, '选择关卡', {
      fontSize: '36px',
      color: '#' + GOLD.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createCard(x: number, y: number, w: number, h: number, config: (typeof levelConfigs)[number]): void {
    const card = this.add.image(x + w / 2, y + h / 2, 'card_bg').setDisplaySize(w, h);

    const nameText = this.add.text(x + 14, y + 10, config.name, {
      fontSize: '18px',
      color: '#' + GOLD.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    });

    const descText = this.add.text(x + 14, y + 34, config.description, {
      fontSize: '12px',
      color: '#bbbbbb',
      wordWrap: { width: w - 28 },
    });

    const stars = '★'.repeat(config.difficulty) + '☆'.repeat(5 - config.difficulty);
    const diffText = this.add.text(x + 14, y + h - 50, stars, {
      fontSize: '14px',
      color: '#' + GOLD.toString(16).padStart(6, '0'),
    });

    const best = this.resultStore.getBestResult(config.id);

    const items: Phaser.GameObjects.GameObject[] = [card, nameText, descText, diffText];

    if (best) {
      const bestText = this.add.text(x + 14, y + h - 28, `最高分: ${best.score}`, {
        fontSize: '13px',
        color: '#' + PRIMARY.toString(16).padStart(6, '0'),
      });
      items.push(bestText);
    }

    const btnX = x + w - 50;
    const btnY = y + h - 26;
    const startBtn = this.add.image(btnX, btnY, 'btn_primary')
      .setDisplaySize(76, 32)
      .setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(btnX, btnY, '开始', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.wireButton(startBtn, () => this.scene.start('Game', { levelId: config.id }));

    items.push(startBtn, startLabel);
    this.scrollContainer.add(items);
  }

  private wireButton(btn: Phaser.GameObjects.Image, onClick: () => void): void {
    btn.on('pointerover', () => btn.setAlpha(0.85));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', () => btn.setAlpha(0.7));
    btn.on('pointerup', () => {
      btn.setAlpha(1);
      onClick();
    });
  }

  private setupScroll(height: number, startY: number): void {
    const zone = this.add.zone(0, startY, this.cameras.main.width, height - startY)
      .setOrigin(0)
      .setInteractive();

    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragStartY = pointer.y;
      this.containerStartY = this.scrollContainer.y;
    });

    zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const dy = pointer.y - this.dragStartY;
      const newY = this.containerStartY + dy;
      const contentH = this.getContentHeight();
      const maxScroll = startY;
      const minScroll = Math.min(startY, height - contentH - 20);
      this.scrollContainer.y = Phaser.Math.Clamp(newY, minScroll, maxScroll);
    });
  }

  private getContentHeight(): number {
    const isGrid = levelConfigs.length > 3;
    const cardH = 150;
    const gap = 14;
    if (isGrid) {
      const rows = Math.ceil(levelConfigs.length / 2);
      return rows * (cardH + gap) - gap;
    }
    return levelConfigs.length * (cardH + gap) - gap;
  }
}
