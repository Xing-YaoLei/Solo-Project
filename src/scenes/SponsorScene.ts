import { Scene, GameObjects } from 'phaser';
import { Button } from '../ui/Button';
import { GameManager } from '../managers/GameManager';
import { InputManager } from '../managers/InputManager';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';
import type { Sponsor, TicketType, LevelConfig } from '../types/game';

export class SponsorScene extends Scene {
  private gameManager!: GameManager;
  private inputManager!: InputManager;
  private levelConfig!: LevelConfig;
  private sponsors: Sponsor[] = [];
  private ticketTypes: TicketType[] = [];
  private selectedTab: 'sponsors' | 'tickets' = 'sponsors';
  private tabButtons: GameObjects.Container[] = [];
  private contentContainer!: GameObjects.Container;

  constructor() {
    super('SponsorScene');
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.inputManager.init(this);

    const levelState = this.gameManager.getLevelState();
    if (!levelState) {
      this.scene.start('MainMenuScene');
      return;
    }

    const config = this.gameManager.getLevelConfig(levelState.levelId);
    if (!config) {
      this.scene.start('MainMenuScene');
      return;
    }

    this.levelConfig = config;
    this.sponsors = levelState.sponsors;
    this.ticketTypes = levelState.tickets;

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.setAlpha(0);
    this.cameras.main.fadeIn(ANIMATION_DURATIONS.normal);

    this.createBackground();
    this.createHeader();
    this.createTabs();
    this.createContentContainer();
    this.createBottomButtons();

    this.showSponsors();

    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown-ENTER', () => this.startVerification());
    this.input.keyboard?.on('keydown-SPACE', () => this.startVerification());
    this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.switchTab();
    });
  }

  update(): void {
    this.inputManager.update();
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const r = Math.floor(10 + i * 0.015);
      const g = Math.floor(10 + i * 0.015);
      const b = Math.floor(26 + i * 0.04);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      bgGradient.fillStyle(color, 1);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }
  }

  private createHeader(): void {
    const headerContainer = this.add.container(0, 0);

    const backButton = this.add.text(40, 40, '← 返回', {
      fontSize: '18px',
      color: COLORS.light,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => this.goBack());
    headerContainer.add(backButton);

    const levelLabel = this.add.text(GAME_WIDTH / 2, 30, this.levelConfig.name, {
      fontSize: '24px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    levelLabel.setOrigin(0.5, 0);
    headerContainer.add(levelLabel);

    const targetLabel = this.add.text(GAME_WIDTH / 2, 65, `目标分数: ${this.levelConfig.targetScore}`, {
      fontSize: '16px',
      color: COLORS.secondary,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    targetLabel.setOrigin(0.5, 0);
    headerContainer.add(targetLabel);

    const instruction = this.add.text(GAME_WIDTH / 2, 100, '请仔细观察赞助商与票种规则', {
      fontSize: '18px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    instruction.setOrigin(0.5, 0);
    headerContainer.add(instruction);

    headerContainer.setY(-20);
    this.tweens.add({
      targets: headerContainer,
      y: 0,
      alpha: { from: 0, to: 1 },
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Cubic.easeOut',
    });
  }

  private createTabs(): void {
    const tabY = 150;
    const tabWidth = 180;
    const tabHeight = 48;
    const startX = GAME_WIDTH / 2 - tabWidth / 2 - 10;

    const sponsorsTab = this.createTabButton('赞助商', startX, tabY, tabWidth, tabHeight, 'sponsors');
    const ticketsTab = this.createTabButton('票种规则', startX + tabWidth + 20, tabY, tabWidth, tabHeight, 'tickets');

    this.tabButtons = [sponsorsTab, ticketsTab];
    this.updateTabStyles();
  }

  private createTabButton(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    tabType: 'sponsors' | 'tickets'
  ): GameObjects.Container {
    const container = this.add.container(x, y);
    container.setData('tabType', tabType);

    const bg = this.add.graphics();
    container.add(bg);

    const textObj = this.add.text(width / 2, height / 2, text, {
      fontSize: '16px',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    textObj.setOrigin(0.5);
    container.add(textObj);

    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      this.selectedTab = tabType;
      this.updateTabStyles();
      this.refreshContent();
    });

    container.setData('bg', bg);
    container.setData('textObj', textObj);

    return container;
  }

  private updateTabStyles(): void {
    this.tabButtons.forEach(tab => {
      const tabType = tab.getData('tabType');
      const isActive = tabType === this.selectedTab;
      const bg = tab.getData('bg') as GameObjects.Graphics;
      const textObj = tab.getData('textObj') as GameObjects.Text;

      const width = tab.width;
      const height = tab.height;

      bg.clear();

      if (isActive) {
        const activeColor = Phaser.Display.Color.HexStringToColor(COLORS.primary).color;
        bg.fillStyle(activeColor, 1);
        bg.fillRoundedRect(0, 0, width, height, 24);
        
        const accentColor = Phaser.Display.Color.HexStringToColor(COLORS.accent).color;
        bg.lineStyle(2, accentColor, 1);
        bg.strokeRoundedRect(0, 0, width, height, 24);

        textObj.setColor(COLORS.white);
      } else {
        const inactiveColor = Phaser.Display.Color.HexStringToColor('#1a1a3e').color;
        bg.fillStyle(inactiveColor, 1);
        bg.fillRoundedRect(0, 0, width, height, 24);

        textObj.setColor('#8892b0');
      }
    });
  }

  private createContentContainer(): void {
    this.contentContainer = this.add.container(0, 210);
  }

  private refreshContent(): void {
    this.tweens.add({
      targets: this.contentContainer,
      alpha: 0,
      y: 220,
      duration: ANIMATION_DURATIONS.fast,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.contentContainer.removeAll(true);
        
        if (this.selectedTab === 'sponsors') {
          this.showSponsors();
        } else {
          this.showTickets();
        }

        this.tweens.add({
          targets: this.contentContainer,
          alpha: 1,
          y: 210,
          duration: ANIMATION_DURATIONS.fast,
          ease: 'Cubic.easeOut',
        });
      },
    });
  }

  private switchTab(): void {
    this.selectedTab = this.selectedTab === 'sponsors' ? 'tickets' : 'sponsors';
    this.updateTabStyles();
    this.refreshContent();
  }

  private showSponsors(): void {
    const contentWidth = GAME_WIDTH - 80;
    const cardWidth = 360;
    const cardHeight = 200;
    const spacing = 30;

    const totalWidth = this.sponsors.length * cardWidth + (this.sponsors.length - 1) * spacing;
    const startX = (contentWidth - totalWidth) / 2 + cardWidth / 2;

    this.sponsors.forEach((sponsor, index) => {
      const card = this.createSponsorCard(sponsor, startX + index * (cardWidth + spacing), cardHeight / 2 + 20, cardWidth, cardHeight);
      this.contentContainer.add(card);

      card.setAlpha(0);
      card.setY(card.y + 20);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: card.y - 20,
        duration: ANIMATION_DURATIONS.normal,
        delay: index * 100,
        ease: 'Back.easeOut',
      });
    });
  }

  private createSponsorCard(
    sponsor: Sponsor,
    x: number,
    y: number,
    width: number,
    height: number
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const bgColor = Phaser.Display.Color.HexStringToColor('#16213E').color;
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);

    const accentColor = Phaser.Display.Color.HexStringToColor(sponsor.color).color;
    bg.lineStyle(3, accentColor, 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    bg.fillStyle(accentColor, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, 6, { tl: 12, tr: 12, bl: 0, br: 0 } as any);
    container.add(bg);

    const logoBg = this.add.graphics();
    logoBg.fillStyle(accentColor, 0.15);
    logoBg.fillCircle(-width / 2 + 50, -height / 2 + 50, 28);
    container.add(logoBg);

    const logoText = this.add.text(-width / 2 + 50, -height / 2 + 50, sponsor.name.charAt(0), {
      fontSize: '24px',
      color: sponsor.color,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    logoText.setOrigin(0.5);
    container.add(logoText);

    const nameText = this.add.text(-width / 2 + 90, -height / 2 + 45, sponsor.name, {
      fontSize: '20px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0, 0.5);
    container.add(nameText);

    const descText = this.add.text(-width / 2 + 25, -height / 2 + 90, sponsor.description, {
      fontSize: '13px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      wordWrap: { width: width - 50 },
    });
    container.add(descText);

    const benefitsLabel = this.add.text(-width / 2 + 25, -height / 2 + 130, '赞助权益：', {
      fontSize: '14px',
      color: COLORS.secondary,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    container.add(benefitsLabel);

    let benefitX = -width / 2 + 25;
    const benefitY = -height / 2 + 155;
    
    sponsor.benefits.forEach((benefit) => {
      const benefitBg = this.add.graphics();
      const benefitColor = Phaser.Display.Color.HexStringToColor(sponsor.color).color;
      benefitBg.fillStyle(benefitColor, 0.2);
      benefitBg.fillRoundedRect(benefitX, benefitY, 80, 24, 12);
      container.add(benefitBg);

      const benefitText = this.add.text(benefitX + 40, benefitY + 12, benefit.name, {
        fontSize: '12px',
        color: sponsor.color,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      benefitText.setOrigin(0.5);
      container.add(benefitText);

      benefitX += 90;
    });

    return container;
  }

  private showTickets(): void {
    const contentWidth = GAME_WIDTH - 80;
    const cardWidth = 260;
    const cardHeight = 320;
    const spacing = 25;

    const totalWidth = this.ticketTypes.length * cardWidth + (this.ticketTypes.length - 1) * spacing;
    const startX = (contentWidth - totalWidth) / 2 + cardWidth / 2;

    this.ticketTypes.forEach((ticket, index) => {
      const card = this.createTicketCard(ticket, startX + index * (cardWidth + spacing), cardHeight / 2 + 10, cardWidth, cardHeight);
      this.contentContainer.add(card);

      card.setAlpha(0);
      card.setY(card.y + 20);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: card.y - 20,
        duration: ANIMATION_DURATIONS.normal,
        delay: index * 100,
        ease: 'Back.easeOut',
      });
    });
  }

  private createTicketCard(
    ticket: TicketType,
    x: number,
    y: number,
    width: number,
    height: number
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const bgColor = Phaser.Display.Color.HexStringToColor('#16213E').color;
    bg.fillStyle(bgColor, 0.9);

    const radius = 16;
    const cutoutY = 50;

    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

    bg.setAlpha(0.15);
    const ticketColor = Phaser.Display.Color.HexStringToColor(ticket.color).color;
    bg.fillStyle(ticketColor, 0.15);

    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    container.add(bg);

    const ticketAccent = this.add.graphics();
    ticketAccent.fillStyle(ticketColor, 1);
    ticketAccent.fillRoundedRect(-width / 2, -height / 2, width, 8, { tl: radius, tr: radius, bl: 0, br: 0 } as any);
    container.add(ticketAccent);

    const ticketName = this.add.text(0, -height / 2 + 35, ticket.name, {
      fontSize: '20px',
      color: ticket.color,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    ticketName.setOrigin(0.5);
    container.add(ticketName);

    const priceText = this.add.text(0, -height / 2 + 65, `¥${ticket.price}`, {
      fontSize: '28px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    priceText.setOrigin(0.5);
    container.add(priceText);

    const divider = this.add.graphics();
    divider.lineStyle(1, ticketColor, 0.3);
    divider.setPosition(0, -height / 2 + cutoutY + 20);
    divider.beginPath();
    divider.moveTo(-width / 2 + 20, 0);
    divider.lineTo(width / 2 - 20, 0);
    divider.strokePath();
    container.add(divider);

    const benefitsLabel = this.add.text(-width / 2 + 20, -height / 2 + cutoutY + 40, '包含权益', {
      fontSize: '14px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    container.add(benefitsLabel);

    const benefitNames = ticket.benefits.map(b => {
      const allBenefits = this.gameManager.getSponsors().flatMap(s => s.benefits);
      const benefit = allBenefits.find(ben => ben.id === b);
      return benefit?.name || b;
    });

    let benefitY = -height / 2 + cutoutY + 70;
    benefitNames.slice(0, 5).forEach(name => {
      const dot = this.add.circle(-width / 2 + 30, benefitY, 4, ticketColor, 0.8);
      container.add(dot);

      const benefitText = this.add.text(-width / 2 + 45, benefitY, name, {
        fontSize: '13px',
        color: '#ccd6f6',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      benefitText.setOrigin(0, 0.5);
      container.add(benefitText);

      benefitY += 28;
    });

    if (benefitNames.length > 5) {
      const moreText = this.add.text(0, -height / 2 + height - 45, `等 ${benefitNames.length} 项权益`, {
        fontSize: '12px',
        color: '#666',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      moreText.setOrigin(0.5);
      container.add(moreText);
    }

    return container;
  }

  private createBottomButtons(): void {
    const buttonY = GAME_HEIGHT - 70;

    new Button(this, {
      x: GAME_WIDTH / 2,
      y: buttonY,
      width: 280,
      height: 56,
      text: '开始核销 →',
      backgroundColor: COLORS.accent,
      hoverColor: '#2CB5A8',
      textColor: COLORS.white,
      fontSize: 20,
      radius: 28,
      onClick: () => this.startVerification(),
    });

    const hint = this.add.text(GAME_WIDTH / 2, buttonY + 45, '按 Enter 或空格键开始', {
      fontSize: '13px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    hint.setOrigin(0.5);
  }

  private goBack(): void {
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('MainMenuScene');
    });
  }

  private startVerification(): void {
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('VerificationScene');
    });
  }
}
