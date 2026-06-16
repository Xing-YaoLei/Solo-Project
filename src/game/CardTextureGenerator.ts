import type { Medicine } from '@/types/game';

const CARD_W = 110;
const CARD_H = 90;

const CATEGORY_CONFIG: Record<string, {
  bgGradient: [string, string];
  accent: string;
  pattern: 'bottle' | 'box' | 'tag';
  label: string;
}> = {
  '感冒药': { bgGradient: ['#E3F2FD', '#BBDEFB'], accent: '#1565C0', pattern: 'box', label: 'OTC' },
  '退烧药': { bgGradient: ['#FFF3E0', '#FFE0B2'], accent: '#E65100', pattern: 'box', label: 'OTC' },
  '肠胃药': { bgGradient: ['#E8F5E9', '#C8E6C9'], accent: '#2E7D32', pattern: 'box', label: 'OTC' },
  '维生素': { bgGradient: ['#FCE4EC', '#F8BBD0'], accent: '#AD1457', pattern: 'bottle', label: '保健' },
  '外用': { bgGradient: ['#F3E5F5', '#E1BEE7'], accent: '#6A1B9A', pattern: 'bottle', label: '外用' },
  '促销标识': { bgGradient: ['#FFFDE7', '#FFF9C4'], accent: '#F57F17', pattern: 'tag', label: '促销' },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function drawShelfBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(0, 0, CARD_W, 4);
  ctx.fillRect(0, CARD_H - 4, CARD_W, 4);

  ctx.fillStyle = '#BDBDBD';
  ctx.fillRect(0, CARD_H / 2 - 1, CARD_W, 2);

  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(0, CARD_H / 2, CARD_W, 1);
}

function drawProductBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  color: string, accent: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, 3);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + 2, y + 4, w - 4, h * 0.4);

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.3);
}

function drawBottle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  color: string, accent: string
): void {
  const capW = w * 0.35;
  const capH = h * 0.12;
  ctx.fillStyle = accent;
  ctx.fillRect(cx - capW / 2, cy - h / 2, capW, capH);

  const neckW = w * 0.3;
  ctx.fillStyle = color;
  ctx.fillRect(cx - neckW / 2, cy - h / 2 + capH, neckW, h * 0.08);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2 + capH + h * 0.08);
  ctx.lineTo(cx - w * 0.35, cy + h / 2);
  ctx.lineTo(cx + w * 0.35, cy + h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 2 + capH + h * 0.08);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(cx - w * 0.3, cy - h * 0.1, w * 0.6, h * 0.35);

  ctx.fillStyle = accent;
  ctx.fillRect(cx - w * 0.25, cy + h * 0.05, w * 0.5, 2);
}

function drawPriceTag(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  color: string, accent: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + h / 2, y);
  ctx.lineTo(x + w - h / 2, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - h / 2, y + h);
  ctx.lineTo(x + h / 2, y + h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + h * 0.35, y + h / 2, h * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(x + h * 0.6, y + h * 0.2, w * 0.5, h * 0.25);
}

function drawGradientBg(ctx: CanvasRenderingContext2D, g: [string, string]): void {
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  grad.addColorStop(0, g[0]);
  grad.addColorStop(1, g[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

function drawCategoryBadge(ctx: CanvasRenderingContext2D, label: string, accent: string): void {
  const badgeW = 32;
  const badgeH = 14;
  const bx = CARD_W - badgeW - 4;
  const by = 4;

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(bx + 3, by);
  ctx.lineTo(bx + badgeW - 3, by);
  ctx.quadraticCurveTo(bx + badgeW, by, bx + badgeW, by + 3);
  ctx.lineTo(bx + badgeW, by + badgeH - 3);
  ctx.quadraticCurveTo(bx + badgeW, by + badgeH, bx + badgeW - 3, by + badgeH);
  ctx.lineTo(bx + 3, by + badgeH);
  ctx.quadraticCurveTo(bx, by + badgeH, bx, by + badgeH - 3);
  ctx.lineTo(bx, by + 3);
  ctx.quadraticCurveTo(bx, by, bx + 3, by);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + badgeW / 2, by + badgeH / 2);
}

function drawProductName(ctx: CanvasRenderingContext2D, name: string, color: string): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const maxWidth = CARD_W - 12;
  let displayName = name;
  while (ctx.measureText(displayName).width > maxWidth && displayName.length > 2) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== name) displayName += '…';
  ctx.fillText(displayName, CARD_W / 2, CARD_H - 4);
}

function drawBorder(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2);
}

function drawRoundedClip(ctx: CanvasRenderingContext2D): void {
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(CARD_W - r, 0);
  ctx.quadraticCurveTo(CARD_W, 0, CARD_W, r);
  ctx.lineTo(CARD_W, CARD_H - r);
  ctx.quadraticCurveTo(CARD_W, CARD_H, CARD_W - r, CARD_H);
  ctx.lineTo(r, CARD_H);
  ctx.quadraticCurveTo(0, CARD_H, 0, CARD_H - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();
}

function deterministicOffset(id: string, index: number): number {
  let hash = 0;
  const str = id + String(index);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10;
}

export function generateMedicineTexture(medicine: Medicine): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  drawRoundedClip(ctx);

  const config = CATEGORY_CONFIG[medicine.category] || {
    bgGradient: ['#F5F5F5', '#E0E0E0'] as [string, string],
    accent: '#616161',
    pattern: 'box' as const,
    label: '药品',
  };

  const [r, g, b] = hexToRgb(medicine.color);

  drawGradientBg(ctx, config.bgGradient);
  drawShelfBackground(ctx);

  const patternColor = `rgba(${r}, ${g}, ${b}, 0.85)`;
  const patternAccent = config.accent;

  switch (config.pattern) {
    case 'box': {
      const bw = 32 + deterministicOffset(medicine.id, 0);
      const bh = 26 + deterministicOffset(medicine.id, 1);
      drawProductBox(ctx, 12, 14, bw, bh, patternColor, patternAccent);
      drawProductBox(ctx, 52, 10, bw - 4, bh + 4, `rgba(${r}, ${g}, ${b}, 0.65)`, patternAccent);
      drawProductBox(ctx, 16, 46, bw + 4, bh - 4, `rgba(${r}, ${g}, ${b}, 0.5)`, patternAccent);
      break;
    }
    case 'bottle': {
      drawBottle(ctx, 30, 38, 28, 40, patternColor, patternAccent);
      drawBottle(ctx, 70, 36, 24, 36, `rgba(${r}, ${g}, ${b}, 0.6)`, patternAccent);
      break;
    }
    case 'tag': {
      drawPriceTag(ctx, 15, 18, 80, 40, patternColor, patternAccent);
      break;
    }
  }

  drawCategoryBadge(ctx, config.label, config.accent);
  drawProductName(ctx, medicine.name, '#333333');
  drawBorder(ctx, medicine.color);

  ctx.restore();
  return canvas;
}
