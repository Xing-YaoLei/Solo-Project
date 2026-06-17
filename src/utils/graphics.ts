import Phaser from 'phaser';

export function createRoundedRect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 8,
  fillColor: number = 0xffffff,
  fillAlpha: number = 1,
  strokeColor?: number,
  strokeWidth: number = 0
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  if (strokeColor && strokeWidth > 0) {
    graphics.lineStyle(strokeWidth, strokeColor, 1);
  }

  graphics.fillStyle(fillColor, fillAlpha);

  graphics.beginPath();

  graphics.moveTo(x - width / 2 + radius, y - height / 2);
  graphics.lineTo(x + width / 2 - radius, y - height / 2);
  graphics.arc(x + width / 2 - radius, y - height / 2 + radius, radius, -Math.PI / 2, 0);
  graphics.lineTo(x + width / 2, y + height / 2 - radius);
  graphics.arc(x + width / 2 - radius, y + height / 2 - radius, radius, 0, Math.PI / 2);
  graphics.lineTo(x - width / 2 + radius, y + height / 2);
  graphics.arc(x - width / 2 + radius, y + height / 2 - radius, radius, Math.PI / 2, Math.PI);
  graphics.lineTo(x - width / 2, y - height / 2 + radius);
  graphics.arc(x - width / 2 + radius, y - height / 2 + radius, radius, Math.PI, -Math.PI / 2);

  graphics.closePath();
  graphics.fillPath();

  if (strokeColor && strokeWidth > 0) {
    graphics.strokePath();
  }

  return graphics;
}

export function updateRoundedRect(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 8,
  fillColor: number = 0xffffff,
  fillAlpha: number = 1,
  strokeColor?: number,
  strokeWidth: number = 0
): void {
  graphics.clear();

  if (strokeColor && strokeWidth > 0) {
    graphics.lineStyle(strokeWidth, strokeColor, 1);
  }

  graphics.fillStyle(fillColor, fillAlpha);

  graphics.beginPath();

  graphics.moveTo(x - width / 2 + radius, y - height / 2);
  graphics.lineTo(x + width / 2 - radius, y - height / 2);
  graphics.arc(x + width / 2 - radius, y - height / 2 + radius, radius, -Math.PI / 2, 0);
  graphics.lineTo(x + width / 2, y + height / 2 - radius);
  graphics.arc(x + width / 2 - radius, y + height / 2 - radius, radius, 0, Math.PI / 2);
  graphics.lineTo(x - width / 2 + radius, y + height / 2);
  graphics.arc(x - width / 2 + radius, y + height / 2 - radius, radius, Math.PI / 2, Math.PI);
  graphics.lineTo(x - width / 2, y - height / 2 + radius);
  graphics.arc(x - width / 2 + radius, y - height / 2 + radius, radius, Math.PI, -Math.PI / 2);

  graphics.closePath();
  graphics.fillPath();

  if (strokeColor && strokeWidth > 0) {
    graphics.strokePath();
  }
}
