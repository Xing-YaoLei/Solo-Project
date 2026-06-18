import { Clue, ConstructionPhase, ProblemType, ClueType } from '../models';
import { eventBus, GameEvent } from '../core/EventBus';

interface ClueSystemState {
  clues: Map<string, Clue>;
  discoveredClueIds: Set<string>;
  levelClueIds: Map<string, string[]>;
  currentLevelId: string | null;
  hintUsageCount: Map<string, number>;
  maxHintsPerClue: number;
}

interface DiscoverResult {
  success: boolean;
  clue?: Clue;
  isNew: boolean;
  message: string;
}

export class ClueSystem {
  private state: ClueSystemState;
  private static instance: ClueSystem;

  private constructor() {
    this.state = {
      clues: new Map(),
      discoveredClueIds: new Set(),
      levelClueIds: new Map(),
      currentLevelId: null,
      hintUsageCount: new Map(),
      maxHintsPerClue: 3,
    };
  }

  public static getInstance(): ClueSystem {
    if (!ClueSystem.instance) {
      ClueSystem.instance = new ClueSystem();
    }
    return ClueSystem.instance;
  }

  public initialize(clues: Clue[]): void {
    this.state.clues.clear();
    this.state.discoveredClueIds.clear();
    this.state.levelClueIds.clear();
    this.state.hintUsageCount.clear();

    const levelId = clues.length > 0 ? clues[0].levelId : null;
    this.state.currentLevelId = levelId;

    const levelClueIds: string[] = [];
    clues.forEach((clue) => {
      this.state.clues.set(clue.id, clue);
      levelClueIds.push(clue.id);
      this.state.hintUsageCount.set(clue.id, 0);
    });
    if (levelId) {
      this.state.levelClueIds.set(levelId, levelClueIds);
    }
  }

  public discoverClue(clueId: string): DiscoverResult {
    const clue = this.state.clues.get(clueId);

    if (!clue) {
      return {
        success: false,
        isNew: false,
        message: `线索 ${clueId} 不存在`,
      };
    }

    if (!clue.isHidden && this.state.discoveredClueIds.has(clueId)) {
      return {
        success: true,
        clue,
        isNew: false,
        message: `线索已发现`,
      };
    }

    this.state.discoveredClueIds.add(clueId);

    eventBus.emit(GameEvent.CLUE_DISCOVERED, {
      clue,
      levelId: clue.levelId,
      timestamp: Date.now(),
    });

    this.checkRelatedClues(clue);

    return {
      success: true,
      clue,
      isNew: true,
      message: `发现新线索: ${clue.title}`,
    };
  }

  public discoverByPosition(x: number, y: number, tolerance: number = 20): DiscoverResult {
    for (const clue of this.state.clues.values()) {
      if (this.state.discoveredClueIds.has(clue.id)) continue;

      const dx = Math.abs(clue.position.x - x);
      const dy = Math.abs(clue.position.y - y);

      if (dx <= tolerance && dy <= tolerance) {
        return this.discoverClue(clue.id);
      }
    }

    return {
      success: false,
      isNew: false,
      message: '该位置没有可发现的线索',
    };
  }

  private checkRelatedClues(clue: Clue): void {
    clue.relatedClueIds.forEach((relatedId) => {
      const relatedClue = this.state.clues.get(relatedId);
      if (relatedClue && relatedClue.isHidden) {
        const allRequiredDiscovered = relatedClue.relatedClueIds.every(
          (id) => this.state.discoveredClueIds.has(id)
        );
        if (allRequiredDiscovered) {
          relatedClue.isHidden = false;
        }
      }
    });
  }

  public isDiscovered(clueId: string): boolean {
    return this.state.discoveredClueIds.has(clueId);
  }

  public getClue(clueId: string): Clue | undefined {
    return this.state.clues.get(clueId);
  }

  public getDiscoveredClues(levelId?: string): Clue[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const clueIds = targetLevelId ? this.state.levelClueIds.get(targetLevelId) : null;

    const clues: Clue[] = [];
    this.state.discoveredClueIds.forEach((id) => {
      if (!clueIds || clueIds.includes(id)) {
        const clue = this.state.clues.get(id);
        if (clue) {
          clues.push(clue);
        }
      }
    });
    return clues;
  }

  public getUndiscoveredClues(levelId?: string): Clue[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const clueIds = targetLevelId ? this.state.levelClueIds.get(targetLevelId) : null;

    const clues: Clue[] = [];
    this.state.clues.forEach((clue, id) => {
      if (
        !this.state.discoveredClueIds.has(id) &&
        (!clueIds || clueIds.includes(id))
      ) {
        clues.push(clue);
      }
    });
    return clues;
  }

  public getCluesByPhase(_phase: ConstructionPhase, levelId?: string): Clue[] {
    const targetLevelId = levelId ?? this.state.currentLevelId ?? undefined;
    return this.getDiscoveredClues(targetLevelId).filter(
      (clue) => clue.levelId === targetLevelId
    );
  }

  public getCluesByType(type: ClueType, levelId?: string): Clue[] {
    const targetLevelId = levelId ?? this.state.currentLevelId ?? undefined;
    return this.getDiscoveredClues(targetLevelId).filter((clue) => clue.type === type);
  }

  public getCluesByProblemType(problemType: ProblemType, levelId?: string): Clue[] {
    const targetLevelId = levelId ?? this.state.currentLevelId ?? undefined;
    return this.getDiscoveredClues(targetLevelId).filter(
      (clue) => clue.problemType === problemType
    );
  }

  public getVisibleClues(levelId?: string): Clue[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const clues: Clue[] = [];
    this.state.clues.forEach((clue) => {
      if (
        !clue.isHidden &&
        clue.levelId === targetLevelId &&
        !this.state.discoveredClueIds.has(clue.id)
      ) {
        clues.push(clue);
      }
    });
    return clues;
  }

  public getHint(clueId: string): { hint: string; remaining: number } | null {
    const clue = this.state.clues.get(clueId);
    if (!clue) return null;

    const usageCount = this.state.hintUsageCount.get(clueId) || 0;
    if (usageCount >= this.state.maxHintsPerClue) {
      return null;
    }

    this.state.hintUsageCount.set(clueId, usageCount + 1);

    return {
      hint: clue.hint,
      remaining: this.state.maxHintsPerClue - usageCount - 1,
    };
  }

  public getHintCount(clueId: string): number {
    return this.state.hintUsageCount.get(clueId) || 0;
  }

  public getDiscoveryProgress(levelId?: string): {
    discovered: number;
    total: number;
    percentage: number;
  } {
    const targetLevelId = levelId || this.state.currentLevelId;
    const clueIds = targetLevelId ? this.state.levelClueIds.get(targetLevelId) : null;

    let total = 0;
    let discovered = 0;

    if (clueIds) {
      total = clueIds.length;
      clueIds.forEach((id) => {
        if (this.state.discoveredClueIds.has(id)) {
          discovered++;
        }
      });
    } else {
      total = this.state.clues.size;
      discovered = this.state.discoveredClueIds.size;
    }

    return {
      discovered,
      total,
      percentage: total > 0 ? Math.round((discovered / total) * 100) : 0,
    };
  }

  public getMissedClues(levelId?: string): Clue[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const clueIds = targetLevelId ? this.state.levelClueIds.get(targetLevelId) : null;

    const missed: Clue[] = [];
    this.state.clues.forEach((clue, id) => {
      if (
        !this.state.discoveredClueIds.has(id) &&
        (!clueIds || clueIds.includes(id))
      ) {
        missed.push(clue);
        eventBus.emit(GameEvent.CLUE_MISSED, {
          clue,
          levelId: targetLevelId,
        });
      }
    });
    return missed;
  }

  public checkRequiredActions(clueId: string, executedActionIds: string[]): boolean {
    const clue = this.state.clues.get(clueId);
    if (!clue) return false;

    return clue.requiredActions.every((actionId) =>
      executedActionIds.includes(actionId)
    );
  }

  public getRequiredCluesForAction(actionId: string): Clue[] {
    const clues: Clue[] = [];
    this.state.clues.forEach((clue) => {
      if (clue.requiredActions.includes(actionId)) {
        clues.push(clue);
      }
    });
    return clues;
  }

  public setCurrentLevel(levelId: string): void {
    this.state.currentLevelId = levelId;
  }

  public reset(): void {
    this.state = {
      clues: new Map(),
      discoveredClueIds: new Set(),
      levelClueIds: new Map(),
      currentLevelId: null,
      hintUsageCount: new Map(),
      maxHintsPerClue: 3,
    };
  }

  public getState(): Readonly<ClueSystemState> {
    return this.state;
  }
}

export const clueSystem = ClueSystem.getInstance();
