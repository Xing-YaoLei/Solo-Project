import {
  InspectionPhoto,
  ProblemArea,
  ConstructionPhase,
  InspectionStatus,
  ProblemType,
} from '../models';
import { eventBus, GameEvent } from '../core/EventBus';

interface InspectionResult {
  status: InspectionStatus;
  qualityScore: number;
  markedProblemIds: string[];
  missedProblemIds: string[];
  falsePositiveIds: string[];
  message: string;
  reworkRequired: boolean;
  reworkActions?: string[];
}

interface PhotoInspectionState {
  photoId: string;
  markedAreaIds: Set<string>;
  isCompleted: boolean;
  score: number;
}

interface InspectionSystemState {
  photos: Map<string, InspectionPhoto>;
  levelPhotoIds: Map<string, string[]>;
  currentLevelId: string | null;
  currentPhase: ConstructionPhase | null;
  inspectionStates: Map<string, PhotoInspectionState>;
  unlockedPhotoIds: Set<string>;
  inspectionHistory: Array<{
    phase: ConstructionPhase;
    result: InspectionResult;
    timestamp: number;
  }>;
}

export class InspectionSystem {
  private state: InspectionSystemState;
  private static instance: InspectionSystem;

  private constructor() {
    this.state = {
      photos: new Map(),
      levelPhotoIds: new Map(),
      currentLevelId: null,
      currentPhase: null,
      inspectionStates: new Map(),
      unlockedPhotoIds: new Set(),
      inspectionHistory: [],
    };
  }

  public static getInstance(): InspectionSystem {
    if (!InspectionSystem.instance) {
      InspectionSystem.instance = new InspectionSystem();
    }
    return InspectionSystem.instance;
  }

  public initialize(photos: InspectionPhoto[]): void {
    this.state.photos.clear();
    this.state.levelPhotoIds.clear();
    this.state.inspectionStates.clear();
    this.state.unlockedPhotoIds.clear();
    this.state.inspectionHistory = [];

    const levelId = photos.length > 0 ? photos[0].levelId : null;
    this.state.currentLevelId = levelId;
    this.state.currentPhase = null;

    const levelPhotoIds: string[] = [];
    photos.forEach((photo) => {
      this.state.photos.set(photo.id, photo);
      levelPhotoIds.push(photo.id);

      this.state.inspectionStates.set(photo.id, {
        photoId: photo.id,
        markedAreaIds: new Set(),
        isCompleted: false,
        score: 0,
      });

      if (photo.isUnlocked) {
        this.state.unlockedPhotoIds.add(photo.id);
      }
    });
    if (levelId) {
      this.state.levelPhotoIds.set(levelId, levelPhotoIds);
    }
  }

  public startInspection(phase: ConstructionPhase): InspectionPhoto[] {
    this.state.currentPhase = phase;
    eventBus.emit(GameEvent.INSPECTION_STARTED, { phase });
    return this.getPhotosByPhase(phase);
  }

  public getPhotosByPhase(
    phase: ConstructionPhase,
    levelId?: string
  ): InspectionPhoto[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const photos: InspectionPhoto[] = [];

    this.state.photos.forEach((photo) => {
      if (
        photo.levelId === targetLevelId &&
        photo.phase === phase &&
        this.state.unlockedPhotoIds.has(photo.id)
      ) {
        photos.push(photo);
      }
    });

    return photos;
  }

  public getPhoto(photoId: string): InspectionPhoto | undefined {
    return this.state.photos.get(photoId);
  }

  public getUnlockedPhotos(levelId?: string): InspectionPhoto[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const photos: InspectionPhoto[] = [];

    this.state.photos.forEach((photo) => {
      if (
        photo.levelId === targetLevelId &&
        this.state.unlockedPhotoIds.has(photo.id)
      ) {
        photos.push(photo);
      }
    });

    return photos;
  }

  public isPhotoUnlocked(photoId: string): boolean {
    return this.state.unlockedPhotoIds.has(photoId);
  }

  public unlockPhoto(photoId: string): boolean {
    const photo = this.state.photos.get(photoId);
    if (!photo) return false;

    this.state.unlockedPhotoIds.add(photoId);
    photo.isUnlocked = true;
    return true;
  }

  public checkUnlockConditions(
    clueIds: string[],
    actionIds: string[],
    phase: ConstructionPhase
  ): string[] {
    const newlyUnlocked: string[] = [];

    this.state.photos.forEach((photo) => {
      if (
        this.state.unlockedPhotoIds.has(photo.id) ||
        photo.levelId !== this.state.currentLevelId
      ) {
        return;
      }

      const condition = photo.unlockCondition;
      let shouldUnlock = false;

      switch (condition.type) {
        case 'phase':
          shouldUnlock = phase === condition.value;
          break;
        case 'clue':
          shouldUnlock = clueIds.includes(condition.value as string);
          break;
        case 'action':
          shouldUnlock = actionIds.includes(condition.value as string);
          break;
        case 'score':
          shouldUnlock = false;
          break;
      }

      if (shouldUnlock) {
        this.unlockPhoto(photo.id);
        newlyUnlocked.push(photo.id);
      }
    });

    return newlyUnlocked;
  }

  public markProblem(photoId: string, areaId: string): boolean {
    const photo = this.state.photos.get(photoId);
    if (!photo) return false;

    const area = photo.problemAreas.find((a) => a.id === areaId);
    if (!area) return false;

    const inspectionState = this.state.inspectionStates.get(photoId);
    if (!inspectionState) return false;

    if (inspectionState.markedAreaIds.has(areaId)) {
      return false;
    }

    inspectionState.markedAreaIds.add(areaId);
    return true;
  }

  public unmarkProblem(photoId: string, areaId: string): boolean {
    const inspectionState = this.state.inspectionStates.get(photoId);
    if (!inspectionState) return false;

    return inspectionState.markedAreaIds.delete(areaId);
  }

  public getMarkedProblems(photoId: string): string[] {
    const inspectionState = this.state.inspectionStates.get(photoId);
    return inspectionState ? Array.from(inspectionState.markedAreaIds) : [];
  }

  public isProblemMarked(photoId: string, areaId: string): boolean {
    const inspectionState = this.state.inspectionStates.get(photoId);
    return inspectionState ? inspectionState.markedAreaIds.has(areaId) : false;
  }

  public inspectPhoto(photoId: string, markedAreaIds: string[]): {
    score: number;
    correctMarks: string[];
    missedMarks: string[];
    falsePositives: string[];
  } {
    const photo = this.state.photos.get(photoId);
    if (!photo) {
      return {
        score: 0,
        correctMarks: [],
        missedMarks: [],
        falsePositives: [],
      };
    }

    const correctMarks: string[] = [];
    const missedMarks: string[] = [];
    const falsePositives: string[] = [];

    const actualProblemIds = photo.problemAreas.map((a) => a.id);

    markedAreaIds.forEach((areaId) => {
      if (actualProblemIds.includes(areaId)) {
        correctMarks.push(areaId);
      } else {
        falsePositives.push(areaId);
      }
    });

    actualProblemIds.forEach((areaId) => {
      if (!markedAreaIds.includes(areaId)) {
        missedMarks.push(areaId);
      }
    });

    const totalProblems = actualProblemIds.length;
    const baseScore =
      totalProblems > 0
        ? (correctMarks.length / totalProblems) * 100
        : 100;
    const penalty = falsePositives.length * 10;
    const score = Math.max(0, Math.round(baseScore - penalty));

    const inspectionState = this.state.inspectionStates.get(photoId);
    if (inspectionState) {
      inspectionState.score = score;
      inspectionState.isCompleted = true;
    }

    return {
      score,
      correctMarks,
      missedMarks,
      falsePositives,
    };
  }

  public submitInspection(
    phase: ConstructionPhase,
    discoveredClueIds: string[]
  ): InspectionResult {
    const phasePhotos = this.getPhotosByPhase(phase);

    let totalQualityScore = 0;
    const allMarkedProblemIds: string[] = [];
    const allMissedProblemIds: string[] = [];
    const allFalsePositiveIds: string[] = [];

    phasePhotos.forEach((photo) => {
      const inspectionState = this.state.inspectionStates.get(photo.id);
      if (!inspectionState) return;

      const markedIds = Array.from(inspectionState.markedAreaIds);
      const result = this.inspectPhoto(photo.id, markedIds);

      totalQualityScore += result.score;
      allMarkedProblemIds.push(...result.correctMarks);
      allMissedProblemIds.push(...result.missedMarks);
      allFalsePositiveIds.push(...result.falsePositives);
    });

    const averageQualityScore =
      phasePhotos.length > 0
        ? Math.round(totalQualityScore / phasePhotos.length)
        : 0;

    const clueMissedPenalty = this.calculateCluePenalty(
      phase,
      discoveredClueIds
    );
    const finalQualityScore = Math.max(
      0,
      averageQualityScore - clueMissedPenalty
    );

    let status: InspectionStatus;
    let reworkRequired = false;
    let message: string;

    if (finalQualityScore >= 90) {
      status = 'passed';
      message = `验收通过！质量评分：${finalQualityScore}分`;
    } else if (finalQualityScore >= 70) {
      status = 'rework';
      reworkRequired = true;
      message = `需要整改。质量评分：${finalQualityScore}分，标记问题后可重新验收`;
    } else {
      status = 'failed';
      reworkRequired = true;
      message = `验收失败。质量评分：${finalQualityScore}分，请认真检查后重新提交`;
    }

    const reworkActions = this.generateReworkActions(
      allMissedProblemIds,
      allFalsePositiveIds
    );

    const result: InspectionResult = {
      status,
      qualityScore: finalQualityScore,
      markedProblemIds: allMarkedProblemIds,
      missedProblemIds: allMissedProblemIds,
      falsePositiveIds: allFalsePositiveIds,
      message,
      reworkRequired,
      reworkActions,
    };

    this.state.inspectionHistory.push({
      phase,
      result,
      timestamp: Date.now(),
    });

    if (status === 'passed') {
      eventBus.emit(GameEvent.INSPECTION_COMPLETED, {
        phase,
        result,
        score: finalQualityScore,
      });
      eventBus.emit(GameEvent.PHASE_COMPLETED, { phase });
    } else if (status === 'failed') {
      eventBus.emit(GameEvent.INSPECTION_FAILED, {
        phase,
        result,
      });
    }

    eventBus.emit(GameEvent.SCORE_UPDATED, {
      qualityScore: finalQualityScore,
    });

    return result;
  }

  private calculateCluePenalty(
    phase: ConstructionPhase,
    discoveredClueIds: string[]
  ): number {
    let penalty = 0;

    this.state.photos.forEach((photo) => {
      if (photo.phase !== phase) return;

      photo.problemAreas.forEach((area) => {
        if (
          area.clueId &&
          !discoveredClueIds.includes(area.clueId) &&
          !this.state.inspectionStates
            .get(photo.id)
            ?.markedAreaIds.has(area.id)
        ) {
          penalty += 5;

          eventBus.emit(GameEvent.MISTAKE_MADE, {
            reason: 'missed_clue',
            description: `未发现线索关联的问题区域`,
            phase,
            clueId: area.clueId,
            penalty: 5,
            timestamp: Date.now(),
          });
        }
      });
    });

    return penalty;
  }

  private generateReworkActions(
    missedProblemIds: string[],
    falsePositiveIds: string[]
  ): string[] {
    const actions: string[] = [];

    if (missedProblemIds.length > 0) {
      actions.push(`检查并标记遗漏的 ${missedProblemIds.length} 个问题区域`);
    }

    if (falsePositiveIds.length > 0) {
      actions.push(`移除 ${falsePositiveIds.length} 个错误标记的区域`);
    }

    return actions;
  }

  public calculateQualityScore(phase?: ConstructionPhase): number {
    const targetPhase = phase || this.state.currentPhase;
    if (!targetPhase) return 0;

    const phasePhotos = this.getPhotosByPhase(targetPhase);
    if (phasePhotos.length === 0) return 100;

    let totalScore = 0;
    phasePhotos.forEach((photo) => {
      const state = this.state.inspectionStates.get(photo.id);
      totalScore += state?.score || 0;
    });

    return Math.round(totalScore / phasePhotos.length);
  }

  public getInspectionProgress(phase?: ConstructionPhase): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const targetPhase = phase || this.state.currentPhase;
    const phasePhotos = this.getPhotosByPhase(targetPhase || 'preparation');

    let completed = 0;
    phasePhotos.forEach((photo) => {
      const state = this.state.inspectionStates.get(photo.id);
      if (state?.isCompleted) {
        completed++;
      }
    });

    return {
      completed,
      total: phasePhotos.length,
      percentage:
        phasePhotos.length > 0
          ? Math.round((completed / phasePhotos.length) * 100)
          : 0,
    };
  }

  public getProblemsByType(
    phase: ConstructionPhase
  ): Record<ProblemType, ProblemArea[]> {
    const result: Record<string, ProblemArea[]> = {
      quality: [],
      safety: [],
      design: [],
      material: [],
      schedule: [],
      cost: [],
    };

    const phasePhotos = this.getPhotosByPhase(phase);
    phasePhotos.forEach((photo) => {
      photo.problemAreas.forEach((area) => {
        result[area.problemType].push(area);
      });
    });

    return result;
  }

  public resetPhotoInspection(photoId: string): boolean {
    const inspectionState = this.state.inspectionStates.get(photoId);
    if (!inspectionState) return false;

    inspectionState.markedAreaIds.clear();
    inspectionState.isCompleted = false;
    inspectionState.score = 0;
    return true;
  }

  public setCurrentPhase(phase: ConstructionPhase): void {
    this.state.currentPhase = phase;
  }

  public setCurrentLevel(levelId: string): void {
    this.state.currentLevelId = levelId;
  }

  public getInspectionHistory() {
    return [...this.state.inspectionHistory];
  }

  public reset(): void {
    this.state = {
      photos: new Map(),
      levelPhotoIds: new Map(),
      currentLevelId: null,
      currentPhase: null,
      inspectionStates: new Map(),
      unlockedPhotoIds: new Set(),
      inspectionHistory: [],
    };
  }

  public getState(): Readonly<InspectionSystemState> {
    return this.state;
  }
}

export const inspectionSystem = InspectionSystem.getInstance();
