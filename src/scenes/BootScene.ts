import Phaser from 'phaser';

const BG = 0x1a1a2e;
const PRIMARY = 0x4fc3f7;
const DANGER = 0xef5350;
const SUCCESS = 0x66bb6a;
const GOLD = 0xffd54f;

function drawRoundedButton(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  color: number,
  radius: number = 12,
): void {
  const lighter = Phaser.Display.Color.ValueToColor(color).brighten(20).color;
  graphics.clear();
  graphics.fillGradientStyle(lighter, lighter, color, color, 1);
  graphics.fillRoundedRect(0, 0, width, height, radius);
  graphics.lineStyle(1, Phaser.Display.Color.ValueToColor(color).brighten(40).color, 0.4);
  graphics.strokeRoundedRect(0, 0, width, height, radius);
}

function drawRoundedRect(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  color: number,
  alpha: number = 1,
  radius: number = 12,
): void {
  graphics.clear();
  graphics.fillStyle(color, alpha);
  graphics.fillRoundedRect(0, 0, width, height, radius);
  graphics.lineStyle(1, 0xffffff, 0.08);
  graphics.strokeRoundedRect(0, 0, width, height, radius);
}

function drawCircle(
  graphics: Phaser.GameObjects.Graphics,
  size: number,
  color: number,
): void {
  graphics.clear();
  graphics.fillStyle(color, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2);
}

function drawSpeakerIcon(graphics: Phaser.GameObjects.Graphics, on: boolean): void {
  graphics.clear();
  graphics.fillStyle(0xffffff, 1);
  graphics.fillRect(4, 10, 6, 12);
  graphics.fillTriangle(10, 10, 10, 22, 18, 26);
  graphics.fillTriangle(10, 10, 10, 22, 18, -2);
  if (on) {
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.arc(20, 16, 6, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(40), false);
    graphics.strokePath();
    graphics.arc(20, 16, 10, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(40), false);
    graphics.strokePath();
  } else {
    graphics.lineStyle(2, 0xef5350, 1);
    graphics.lineBetween(20, 8, 28, 24);
    graphics.lineBetween(20, 24, 28, 8);
  }
}

function drawVibrationIcon(graphics: Phaser.GameObjects.Graphics, on: boolean): void {
  graphics.clear();
  const color = on ? 0xffffff : 0xef5350;
  graphics.lineStyle(2, color, 1);
  graphics.strokeRect(8, 6, 16, 20);
  if (on) {
    graphics.lineBetween(2, 10, 6, 16);
    graphics.lineBetween(2, 22, 6, 16);
    graphics.lineBetween(26, 10, 30, 16);
    graphics.lineBetween(26, 22, 30, 16);
  } else {
    graphics.lineStyle(2, 0xef5350, 1);
    graphics.lineBetween(2, 6, 30, 26);
  }
}

function drawAnimIcon(graphics: Phaser.GameObjects.Graphics): void {
  graphics.clear();
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.beginPath();
  graphics.moveTo(4, 28);
  graphics.lineTo(10, 12);
  graphics.lineTo(16, 20);
  graphics.lineTo(22, 6);
  graphics.lineTo(28, 16);
  graphics.strokePath();
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG);

    const g = this.add.graphics();

    drawRoundedButton(g, 240, 56, PRIMARY);
    g.generateTexture('btn_primary', 240, 56);

    drawRoundedButton(g, 240, 56, DANGER);
    g.generateTexture('btn_danger', 240, 56);

    drawRoundedButton(g, 240, 56, SUCCESS);
    g.generateTexture('btn_success', 240, 56);

    drawRoundedButton(g, 160, 44, 0x616161);
    g.generateTexture('btn_small', 160, 44);

    drawRoundedRect(g, 300, 120, 0xffffff, 0.92);
    g.generateTexture('card_bg', 300, 120);

    drawRoundedRect(g, 140, 180, 0x2a2a4a, 1, 10);
    g.generateTexture('slot_bg', 140, 180);

    drawCircle(g, 8, 0xffffff);
    g.generateTexture('particle', 8, 8);

    drawSpeakerIcon(g, true);
    g.generateTexture('icon_sound_on', 32, 32);

    drawSpeakerIcon(g, false);
    g.generateTexture('icon_sound_off', 32, 32);

    drawVibrationIcon(g, true);
    g.generateTexture('icon_vibration_on', 32, 32);

    drawVibrationIcon(g, false);
    g.generateTexture('icon_vibration_off', 32, 32);

    drawAnimIcon(g);
    g.generateTexture('icon_anim', 32, 32);

    drawCircle(g, 24, GOLD);
    g.generateTexture('tier_gold', 24, 24);

    drawCircle(g, 24, 0xc0c0c0);
    g.generateTexture('tier_silver', 24, 24);

    drawCircle(g, 24, 0xcd7f32);
    g.generateTexture('tier_bronze', 24, 24);

    g.destroy();

    this.scene.start('Menu');
  }
}
