import type { SponsorItem, PerformanceSlot } from '@/config/types';

export interface SponsorAssignment {
  sponsor: SponsorItem;
  slot: PerformanceSlot | null;
  isCorrect: boolean | null;
}

export class SponsorSystem {
  private _sponsors: SponsorItem[] = [];
  private _slots: Map<string, PerformanceSlot> = new Map();
  private _assignments: SponsorAssignment[] = [];
  private _currentIndex = 0;

  load(sponsors: SponsorItem[], slots: PerformanceSlot[]): void {
    this._sponsors = [...sponsors];
    this._slots.clear();
    this._assignments = [];
    this._currentIndex = 0;

    for (const s of slots) this._slots.set(s.id, s);

    for (const sp of sponsors) {
      this._assignments.push({
        sponsor: sp,
        slot: null,
        isCorrect: null,
      });
    }
  }

  assignSponsor(sponsorId: string, slotId: string): SponsorAssignment | null {
    const assignment = this._assignments.find(a => a.sponsor.id === sponsorId && a.slot === null);
    if (!assignment) return null;

    const slot = this._slots.get(slotId);
    if (!slot) return null;

    assignment.slot = slot;
    assignment.isCorrect = assignment.sponsor.preferredSlots.includes(slotId);

    this._currentIndex++;
    return assignment;
  }

  getCurrentSponsor(): SponsorItem | null {
    for (const a of this._assignments) {
      if (a.slot === null) return a.sponsor;
    }
    return null;
  }

  getUnassigned(): SponsorAssignment[] {
    return this._assignments.filter(a => a.slot === null);
  }

  get progress() { return this._currentIndex; }
  get total() { return this._assignments.length; }
  get isComplete() { return this._currentIndex >= this._assignments.length; }
  get assignments() { return this._assignments; }
}
