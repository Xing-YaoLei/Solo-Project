import type { TicketRule, PerformanceSlot, VerificationRecord } from '@/config/types';

export interface VerificationTask {
  record: VerificationRecord;
  rule: TicketRule;
  slot: PerformanceSlot;
  playerAnswer: boolean | null;
  isCorrect: boolean | null;
}

export class VerificationSystem {
  private rules: Map<string, TicketRule> = new Map();
  private slots: Map<string, PerformanceSlot> = new Map();
  private _tasks: VerificationTask[] = [];
  private _currentIndex = 0;
  private _completedCount = 0;

  load(rules: TicketRule[], slots: PerformanceSlot[], records: VerificationRecord[]): void {
    this.rules.clear();
    this.slots.clear();
    this._tasks = [];
    this._currentIndex = 0;
    this._completedCount = 0;

    for (const r of rules) this.rules.set(r.id, r);
    for (const s of slots) this.slots.set(s.id, s);

    for (const rec of records) {
      const rule = this.rules.get(rec.ticketRuleId);
      const slot = this.slots.get(rec.slotId);
      if (rule && slot) {
        this._tasks.push({
          record: rec,
          rule,
          slot,
          playerAnswer: null,
          isCorrect: null,
        });
      }
    }

    this.shuffleTasks();
  }

  private shuffleTasks(): void {
    for (let i = this._tasks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._tasks[i], this._tasks[j]] = [this._tasks[j], this._tasks[i]];
    }
  }

  validateTicket(ruleId: string, slotId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    return rule.validSlots.includes(slotId);
  }

  answerCurrent(playerSaysValid: boolean): VerificationTask | null {
    if (this._currentIndex >= this._tasks.length) return null;

    const task = this._tasks[this._currentIndex];
    task.playerAnswer = playerSaysValid;
    task.isCorrect = playerSaysValid === task.record.isValid;
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
