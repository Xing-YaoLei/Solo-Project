import type { TicketRule, PerformanceSlot, TicketOrder, SponsorItem } from '@/config/types';

export interface VerificationTask {
  order: TicketOrder;
  rule: TicketRule;
  slot: PerformanceSlot;
  sponsor?: SponsorItem;
  playerAnswer: boolean | null;
  isCorrect: boolean | null;
  actualValid: boolean;
  failReasons: string[];
}

export class VerificationSystem {
  private rules: Map<string, TicketRule> = new Map();
  private slots: Map<string, PerformanceSlot> = new Map();
  private sponsors: Map<string, SponsorItem> = new Map();
  private _tasks: VerificationTask[] = [];
  private _currentIndex = 0;
  private _completedCount = 0;

  load(rules: TicketRule[], slots: PerformanceSlot[], orders: TicketOrder[], sponsors: SponsorItem[] = []): void {
    this.rules.clear();
    this.slots.clear();
    this.sponsors.clear();
    this._tasks = [];
    this._currentIndex = 0;
    this._completedCount = 0;

    for (const r of rules) this.rules.set(r.id, r);
    for (const s of slots) this.slots.set(s.id, s);
    for (const sp of sponsors) this.sponsors.set(sp.id, sp);

    for (const order of orders) {
      const rule = this.rules.get(order.ticketRuleId);
      const slot = this.slots.get(order.slotId);
      const sponsor = order.sponsorId ? this.sponsors.get(order.sponsorId) : undefined;

      if (rule && slot) {
        const { isValid, reasons } = this.validateOrder(order, rule, slot, sponsor);
        this._tasks.push({
          order,
          rule,
          slot,
          sponsor,
          playerAnswer: null,
          isCorrect: null,
          actualValid: isValid,
          failReasons: reasons,
        });
      }
    }

    this.shuffleTasks();
  }

  private validateOrder(
    order: TicketOrder,
    rule: TicketRule,
    slot: PerformanceSlot,
    sponsor?: SponsorItem
  ): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let isValid = true;

    if (!rule.validSlots.includes(slot.id)) {
      isValid = false;
      reasons.push(`${rule.name}不可用于${slot.name}`);
    }

    if (rule.requiresSponsor) {
      if (!sponsor) {
        isValid = false;
        reasons.push('此票种需关联赞助商');
      }
    }

    if (order.quantity > rule.maxPerOrder) {
      isValid = false;
      reasons.push(`单次限购${rule.maxPerOrder}张`);
    }

    if (order.quantity <= 0) {
      isValid = false;
      reasons.push('购票数量无效');
    }

    return { isValid, reasons };
  }

  private shuffleTasks(): void {
    for (let i = this._tasks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._tasks[i], this._tasks[j]] = [this._tasks[j], this._tasks[i]];
    }
  }

  answerCurrent(playerSaysValid: boolean): VerificationTask | null {
    if (this._currentIndex >= this._tasks.length) return null;

    const task = this._tasks[this._currentIndex];
    task.playerAnswer = playerSaysValid;
    task.isCorrect = playerSaysValid === task.actualValid;
    this._currentIndex++;
    this._completedCount++;

    return task;
  }

  getCurrentTask(): VerificationTask | null {
    if (this._currentIndex >= this._tasks.length) return null;
    return this._tasks[this._currentIndex];
  }

  get progress() { return this._completedCount; }
  get total() { return this._tasks.length; }
  get isComplete() { return this._currentIndex >= this._tasks.length; }
  get tasks() { return this._tasks; }
}
