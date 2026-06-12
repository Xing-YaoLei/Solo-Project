import type { DeviceStatus, FaultType } from '@/types/game';

export class PhotoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width = 600, height = 400) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
  }

  generate(status: DeviceStatus, deviceType: string, faultType?: FaultType): HTMLCanvasElement {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawDevice(deviceType);

    if (status === 'need_clean') {
      this.addCleanIndicator();
    } else if (status === 'fault') {
      this.addFaultIndicator(faultType);
    }

    this.addScanlineEffect();
    this.addStatusBadge(status);

    return this.canvas;
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2D2D2D');
    gradient.addColorStop(1, '#1A1A1A');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#3D3D3D';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.width; i += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
  }

  private drawDevice(deviceType: string): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.fillStyle = '#4A4A4A';
    this.ctx.fillRect(centerX - 150, centerY - 100, 300, 200);

    this.ctx.fillStyle = '#5A5A5A';
    this.ctx.fillRect(centerX - 140, centerY - 90, 280, 180);

    this.ctx.fillStyle = '#2A2A2A';
    this.ctx.fillRect(centerX - 120, centerY - 70, 100, 60);

    this.ctx.fillStyle = '#3A3A3A';
    this.ctx.fillRect(centerX + 10, centerY - 70, 110, 60);

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 70, centerY + 50, 10, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#2196F3';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 30, centerY + 50, 10, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FF9800';
    this.ctx.beginPath();
    this.ctx.arc(centerX + 10, centerY + 50, 10, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(deviceType, centerX, centerY + 90);
  }

  addCleanIndicator(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
    for (let i = 0; i < 15; i++) {
      const x = centerX - 130 + Math.random() * 260;
      const y = centerY - 80 + Math.random() * 160;
      const size = 5 + Math.random() * 15;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    for (let i = 0; i < 20; i++) {
      const x = centerX - 130 + Math.random() * 260;
      const y = centerY - 80 + Math.random() * 160;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = 'bold 16px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠ 需要清洁', centerX, centerY - 110);
  }

  addFaultIndicator(faultType?: FaultType): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.fillStyle = 'rgba(211, 47, 47, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (faultType === 'leak') {
      this.ctx.fillStyle = 'rgba(100, 181, 246, 0.7)';
      for (let i = 0; i < 10; i++) {
        const x = centerX - 100 + i * 25;
        const y = centerY + 20;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + Math.sin(i) * 10, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (faultType === 'blockage') {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(centerX - 50, centerY - 30, 100, 20);
      this.ctx.strokeStyle = '#FF5722';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 40, centerY - 20);
      this.ctx.lineTo(centerX + 40, centerY - 20);
      this.ctx.stroke();
    } else if (faultType === 'electrical') {
      this.ctx.strokeStyle = '#FFEB3B';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const startX = centerX - 100 + Math.random() * 200;
        const startY = centerY - 80;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        let x = startX;
        let y = startY;
        for (let j = 0; j < 8; j++) {
          x += (Math.random() - 0.5) * 30;
          y += 20;
          this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
      }
    } else if (faultType === 'mechanical') {
      this.ctx.strokeStyle = '#FF5722';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 80, centerY - 50);
      this.ctx.lineTo(centerX + 80, centerY + 50);
      this.ctx.moveTo(centerX + 80, centerY - 50);
      this.ctx.lineTo(centerX - 80, centerY + 50);
      this.ctx.stroke();
    } else if (faultType === 'heating') {
      this.ctx.fillStyle = 'rgba(255, 87, 34, 0.5)';
      for (let i = 0; i < 8; i++) {
        const x = centerX - 80 + i * 20;
        this.ctx.beginPath();
        this.ctx.moveTo(x, centerY + 30);
        this.ctx.quadraticCurveTo(x + 5, centerY, x, centerY - 30);
        this.ctx.quadraticCurveTo(x - 5, centerY, x, centerY + 30);
        this.ctx.fill();
      }
    }

    this.ctx.fillStyle = '#D32F2F';
    this.ctx.font = 'bold 20px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🔴 故障警报', centerX, centerY - 110);

    this.ctx.fillStyle = '#FF5722';
    this.ctx.font = '12px Inter, sans-serif';
    const faultTypeName = this.getFaultTypeName(faultType);
    this.ctx.fillText(`故障类型: ${faultTypeName}`, centerX, centerY + 110);
  }

  private getFaultTypeName(faultType?: FaultType): string {
    const names: Record<FaultType, string> = {
      leak: '泄漏',
      blockage: '堵塞',
      electrical: '电气故障',
      mechanical: '机械故障',
      heating: '加热异常',
    };
    return faultType ? names[faultType] : '未知';
  }

  addScanlineEffect(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < this.canvas.height; i += 4) {
      this.ctx.fillRect(0, i, this.canvas.width, 2);
    }

    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private addStatusBadge(status: DeviceStatus): void {
    const colors: Record<DeviceStatus, string> = {
      normal: '#4CAF50',
      need_clean: '#FF9800',
      fault: '#D32F2F',
    };

    const labels: Record<DeviceStatus, string> = {
      normal: '正常',
      need_clean: '待清洁',
      fault: '故障',
    };

    this.ctx.fillStyle = colors[status];
    this.ctx.fillRect(this.canvas.width - 100, 10, 90, 30);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labels[status], this.canvas.width - 55, 30);
  }

  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  static generatePlaceholder(status: DeviceStatus, deviceType: string, faultType?: FaultType): string {
    const generator = new PhotoGenerator();
    generator.generate(status, deviceType, faultType);
    return generator.toDataURL();
  }
}
