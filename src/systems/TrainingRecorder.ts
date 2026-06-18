import {
  TrainingRecord,
  MistakeRecord,
  MaterialDelayRecord,
  DecisionRecord,
  ChangeOrder,
  ConstructionPhase,
  MistakeReason,
  Rating,
  DecisionOutcome,
} from '../models';
import { eventBus, GameEvent } from '../core/EventBus';
import { configManager } from '../core/ConfigManager';

interface ScoreBreakdown {
  quality: number;
  cost: number;
  time: number;
  total: number;
}

interface AnalysisReport {
  overallPerformance: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  commonMistakes: Array<{
    reason: MistakeReason;
    count: number;
    description: string;
  }>;
  phasePerformance: Array<{
    phase: ConstructionPhase;
    score: number;
    mistakes: number;
  }>;
}

interface TrainingRecorderState {
  records: Map<string, TrainingRecord>;
  currentRecordId: string | null;
  playerName: string;
  isRecording: boolean;
  currentPhase: ConstructionPhase | null;
  startTime: number;
}

export class TrainingRecorder {
  private state: TrainingRecorderState;
  private static instance: TrainingRecorder;

  private constructor() {
    this.state = {
      records: new Map(),
      currentRecordId: null,
      playerName: 'Player',
      isRecording: false,
      currentPhase: null,
      startTime: 0,
    };

    this.setupEventListeners();
  }

  public static getInstance(): TrainingRecorder {
    if (!TrainingRecorder.instance) {
      TrainingRecorder.instance = new TrainingRecorder();
    }
    return TrainingRecorder.instance;
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.MISTAKE_MADE, (data) => {
      if (this.state.isRecording && data) {
        const mistakeData = data as {
          reason: MistakeReason;
          description: string;
          phase: ConstructionPhase;
          clueId?: string;
          actionId?: string;
          penalty: number;
        };
        this.recordMistake(mistakeData);
      }
    });

    eventBus.on(GameEvent.DECISION_MADE, (data) => {
      if (this.state.isRecording && data) {
        const decisionData = data as {
          action: { id: string };
          clueIds?: string[];
          phase: ConstructionPhase;
          outcome: DecisionOutcome;
          timestamp: number;
        };
        this.recordDecision({
          actionId: decisionData.action.id,
          clueId: decisionData.clueIds?.[0],
          phase: decisionData.phase,
          outcome: decisionData.outcome,
          timestamp: decisionData.timestamp,
        });
      }
    });

    eventBus.on(GameEvent.MATERIAL_DELAYED, (data) => {
      if (this.state.isRecording && data) {
        const delayData = data as {
          delayId?: string;
          materialName: string;
          plannedDate: number;
          actualDate: number;
          delayDays: number;
          impact: string;
          phase: ConstructionPhase;
        };
        this.recordMaterialDelay(delayData);
      }
    });
  }

  public startRecording(
    taskId: string,
    levelId: string,
    budget: number,
    plannedDuration: number,
    initialPhase: ConstructionPhase
  ): string {
    const recordId = this.generateId();
    const now = Date.now();

    const record: TrainingRecord = {
      id: recordId,
      taskId,
      levelId,
      playerName: this.state.playerName,
      startTime: now,
      endTime: 0,
      score: 0,
      qualityScore: 100,
      costScore: 100,
      timeScore: 100,
      actualCost: 0,
      budget,
      actualDuration: 0,
      plannedDuration,
      timeDeviation: 0,
      costDeviation: 0,
      mistakes: [],
      materialDelays: [],
      decisions: [],
      changeOrders: [],
      isPerfect: false,
      rating: 'D',
    };

    this.state.records.set(recordId, record);
    this.state.currentRecordId = recordId;
    this.state.isRecording = true;
    this.state.currentPhase = initialPhase;
    this.state.startTime = now;

    return recordId;
  }

  public stopRecording(
    qualityScore: number,
    costScore: number,
    timeScore: number,
    actualCost: number,
    actualDuration: number
  ): TrainingRecord | null {
    if (!this.state.isRecording || !this.state.currentRecordId) {
      return null;
    }

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return null;

    const now = Date.now();
    record.endTime = now;
    record.qualityScore = qualityScore;
    record.costScore = costScore;
    record.timeScore = timeScore;
    record.actualCost = actualCost;
    record.actualDuration = actualDuration;
    record.timeDeviation = actualDuration - record.plannedDuration;
    record.costDeviation = actualCost - record.budget;

    const scoreBreakdown = this.calculateTotalScore(
      qualityScore,
      costScore,
      timeScore,
      record.mistakes.length
    );
    record.score = scoreBreakdown.total;

    record.isPerfect = this.checkPerfect(record);
    record.rating = this.calculateRating(scoreBreakdown.total);

    this.state.isRecording = false;
    this.state.currentRecordId = null;
    this.state.currentPhase = null;

    return record;
  }

  public startLevel(levelId: string, taskId: string): string {
    const level = configManager.getLevelById(levelId);
    const task = configManager.getTaskById(taskId);
    const initialPhase = level.phases[0];
    return this.startRecording(taskId, levelId, task.budget, task.duration, initialPhase);
  }

  public finishLevel(
    qualityScore: number,
    budget: number,
    totalCost: number,
    actualDuration: number,
    plannedDuration: number
  ): TrainingRecord | null {
    const costScore = this.calculateCostScore(totalCost, budget);
    const timeScore = this.calculateTimeScore(actualDuration, plannedDuration);
    return this.stopRecording(qualityScore, costScore, timeScore, totalCost, actualDuration);
  }

  public recordClueDiscovered(clueId: string, phase: ConstructionPhase): void {
    if (!this.state.isRecording || !this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    this.recordDecision({
      actionId: `clue_discover_${clueId}`,
      clueId,
      phase,
      outcome: 'positive',
      timestamp: Date.now(),
    });
  }

  public recordAction(
    actionId: string,
    clueId: string,
    cost: number,
    duration: number,
    qualityImpact: number,
    phase: ConstructionPhase
  ): void {
    if (!this.state.isRecording || !this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    const outcome: DecisionOutcome = qualityImpact >= 0 ? 'positive' : (qualityImpact >= -5 ? 'neutral' : 'negative');

    this.recordDecision({
      actionId,
      clueId,
      phase,
      outcome,
      timestamp: Date.now(),
    });

    this.updateCost(record.actualCost + cost);
    this.updateDuration(record.actualDuration + duration);
    this.updateQualityScore(record.qualityScore + qualityImpact);
  }

  public recordMistake(mistake: Omit<MistakeRecord, 'id' | 'timestamp'>): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    const mistakeRecord: MistakeRecord = {
      ...mistake,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    record.mistakes.push(mistakeRecord);
  }

  public recordDecision(decision: Omit<DecisionRecord, 'id'>): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    const decisionRecord: DecisionRecord = {
      ...decision,
      id: this.generateId(),
    };

    record.decisions.push(decisionRecord);
  }

  public recordMaterialDelay(
    delay: Omit<MaterialDelayRecord, 'id'>
  ): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    const exists = record.materialDelays.some((d) => {
      if (delay.delayId && d.delayId) {
        return d.delayId === delay.delayId;
      }
      return d.materialName === delay.materialName && d.plannedDate === delay.plannedDate;
    });
    if (exists) return;

    const delayRecord: MaterialDelayRecord = {
      ...delay,
      id: this.generateId(),
    };

    record.materialDelays.push(delayRecord);
  }

  public recordChangeOrder(changeOrder: ChangeOrder): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    const existingIndex = record.changeOrders.findIndex(
      (co) => co.id === changeOrder.id
    );
    if (existingIndex >= 0) {
      record.changeOrders[existingIndex] = { ...changeOrder };
    } else {
      record.changeOrders.push({ ...changeOrder });
    }
  }

  public updateCost(cost: number): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    record.actualCost = cost;
    record.costDeviation = cost - record.budget;
    record.costScore = this.calculateCostScore(cost, record.budget);
  }

  public updateDuration(duration: number): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    record.actualDuration = duration;
    record.timeDeviation = duration - record.plannedDuration;
    record.timeScore = this.calculateTimeScore(duration, record.plannedDuration);
  }

  public updateQualityScore(score: number): void {
    if (!this.state.currentRecordId) return;

    const record = this.state.records.get(this.state.currentRecordId);
    if (!record) return;

    record.qualityScore = Math.max(0, Math.min(100, score));
  }

  public setCurrentPhase(phase: ConstructionPhase): void {
    this.state.currentPhase = phase;
  }

  public setPlayerName(name: string): void {
    this.state.playerName = name;
  }

  public getCurrentRecord(): TrainingRecord | null {
    if (!this.state.currentRecordId) return null;
    return this.state.records.get(this.state.currentRecordId) || null;
  }

  public getRecord(recordId: string): TrainingRecord | undefined {
    return this.state.records.get(recordId);
  }

  public getRecordsByTask(taskId: string): TrainingRecord[] {
    const records: TrainingRecord[] = [];
    this.state.records.forEach((record) => {
      if (record.taskId === taskId) {
        records.push(record);
      }
    });
    return records.sort((a, b) => b.endTime - a.endTime);
  }

  public getBestRecord(taskId: string): TrainingRecord | null {
    const records = this.getRecordsByTask(taskId);
    if (records.length === 0) return null;
    return records.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  }

  public getPlayerStats(): {
    totalGames: number;
    averageScore: number;
    bestScore: number;
    totalPlayTime: number;
    perfectCount: number;
    ratingDistribution: Record<Rating, number>;
  } {
    const stats = {
      totalGames: 0,
      averageScore: 0,
      bestScore: 0,
      totalPlayTime: 0,
      perfectCount: 0,
      ratingDistribution: {
        S: 0,
        A: 0,
        B: 0,
        C: 0,
        D: 0,
      } as Record<Rating, number>,
    };

    let totalScore = 0;

    this.state.records.forEach((record) => {
      if (record.endTime === 0) return;

      stats.totalGames++;
      totalScore += record.score;
      stats.bestScore = Math.max(stats.bestScore, record.score);
      stats.totalPlayTime += record.endTime - record.startTime;
      if (record.isPerfect) stats.perfectCount++;
      stats.ratingDistribution[record.rating]++;
    });

    stats.averageScore =
      stats.totalGames > 0 ? Math.round(totalScore / stats.totalGames) : 0;

    return stats;
  }

  public calculateTotalScore(
    quality: number,
    cost: number,
    time: number,
    mistakeCount: number
  ): ScoreBreakdown {
    const qualityWeight = 0.4;
    const costWeight = 0.3;
    const timeWeight = 0.3;
    const mistakePenalty = mistakeCount * 2;

    const weightedQuality = quality * qualityWeight;
    const weightedCost = cost * costWeight;
    const weightedTime = time * timeWeight;

    const total = Math.max(
      0,
      Math.round(weightedQuality + weightedCost + weightedTime - mistakePenalty)
    );

    return {
      quality: Math.round(quality),
      cost: Math.round(cost),
      time: Math.round(time),
      total,
    };
  }

  private calculateCostScore(actualCost: number, budget: number): number {
    if (actualCost <= budget) {
      const savingsRatio = 1 - actualCost / budget;
      return Math.min(100, 90 + savingsRatio * 20);
    } else {
      const overRatio = (actualCost - budget) / budget;
      return Math.max(0, 90 - overRatio * 100);
    }
  }

  private calculateTimeScore(
    actualDuration: number,
    plannedDuration: number
  ): number {
    if (actualDuration <= plannedDuration) {
      const savingsRatio = 1 - actualDuration / plannedDuration;
      return Math.min(100, 90 + savingsRatio * 20);
    } else {
      const overRatio = (actualDuration - plannedDuration) / plannedDuration;
      return Math.max(0, 90 - overRatio * 80);
    }
  }

  public calculateRating(score: number): Rating {
    if (score >= 95) return 'S';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  private checkPerfect(record: TrainingRecord): boolean {
    return (
      record.mistakes.length === 0 &&
      record.qualityScore >= 95 &&
      record.costScore >= 95 &&
      record.timeScore >= 95
    );
  }

  public generateAnalysisReport(recordId: string): AnalysisReport | null {
    const record = this.state.records.get(recordId);
    if (!record || record.endTime === 0) return null;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (record.qualityScore >= 80) {
      strengths.push('质量控制表现优秀');
    } else {
      weaknesses.push('质量控制需要加强');
      recommendations.push('建议在每个施工阶段仔细检查验收照片');
    }

    if (record.costScore >= 80) {
      strengths.push('成本控制良好');
    } else {
      weaknesses.push('成本超支问题');
      recommendations.push('在执行动作前仔细评估成本影响');
    }

    if (record.timeScore >= 80) {
      strengths.push('工期管理得当');
    } else {
      weaknesses.push('工期延误问题');
      recommendations.push('提前规划材料供应，避免延期风险');
    }

    if (record.mistakes.length === 0) {
      strengths.push('全程无错误决策');
    } else {
      weaknesses.push(`存在 ${record.mistakes.length} 处决策错误`);
      recommendations.push('仔细复盘错误原因，避免再次发生');
    }

    if (record.changeOrders.length > 0) {
      const approvedCount = record.changeOrders.filter(
        (co) => co.status === 'approved' || co.status === 'executed'
      ).length;
      if (approvedCount === record.changeOrders.length) {
        strengths.push('所有变更单均获得批准');
      } else {
        weaknesses.push('部分变更单被拒绝');
        recommendations.push('优化变更单内容，提高通过率');
      }
    }

    const mistakeCounts = new Map<MistakeReason, number>();
    record.mistakes.forEach((m) => {
      mistakeCounts.set(m.reason, (mistakeCounts.get(m.reason) || 0) + 1);
    });

    const commonMistakes: Array<{
      reason: MistakeReason;
      count: number;
      description: string;
    }> = [];

    const mistakeDescriptions: Record<MistakeReason, string> = {
      missed_clue: '遗漏线索',
      wrong_action: '错误动作',
      delayed_material: '材料延期',
      poor_quality: '质量问题',
      over_budget: '预算超支',
      over_time: '工期延误',
    };

    mistakeCounts.forEach((count, reason) => {
      commonMistakes.push({
        reason,
        count,
        description: mistakeDescriptions[reason],
      });
    });
    commonMistakes.sort((a, b) => b.count - a.count);

    const phaseScores = this.calculatePhasePerformance(record);

    let overallPerformance: string;
    if (record.rating === 'S' || record.rating === 'A') {
      overallPerformance = '优秀';
    } else if (record.rating === 'B') {
      overallPerformance = '良好';
    } else if (record.rating === 'C') {
      overallPerformance = '一般';
    } else {
      overallPerformance = '需要改进';
    }

    return {
      overallPerformance,
      strengths,
      weaknesses,
      recommendations,
      commonMistakes,
      phasePerformance: phaseScores,
    };
  }

  private calculatePhasePerformance(
    record: TrainingRecord
  ): Array<{
    phase: ConstructionPhase;
    score: number;
    mistakes: number;
  }> {
    const phaseData = new Map<
      ConstructionPhase,
      { score: number; mistakes: number; count: number }
    >();

    record.decisions.forEach((d) => {
      if (!phaseData.has(d.phase)) {
        phaseData.set(d.phase, { score: 0, mistakes: 0, count: 0 });
      }
      const data = phaseData.get(d.phase)!;
      data.count++;
      if (d.outcome === 'positive') data.score += 10;
      else if (d.outcome === 'neutral') data.score += 5;
    });

    record.mistakes.forEach((m) => {
      if (!phaseData.has(m.phase)) {
        phaseData.set(m.phase, { score: 0, mistakes: 0, count: 0 });
      }
      const data = phaseData.get(m.phase)!;
      data.mistakes++;
      data.score = Math.max(0, data.score - m.penalty);
    });

    const result: Array<{
      phase: ConstructionPhase;
      score: number;
      mistakes: number;
    }> = [];

    phaseData.forEach((data, phase) => {
      const averageScore = data.count > 0 ? data.score / data.count : 0;
      result.push({
        phase,
        score: Math.round(Math.min(100, averageScore * 10)),
        mistakes: data.mistakes,
      });
    });

    return result;
  }

  public exportRecords(): TrainingRecord[] {
    return Array.from(this.state.records.values()).filter(
      (r) => r.endTime > 0
    );
  }

  public importRecords(records: TrainingRecord[]): void {
    records.forEach((record) => {
      this.state.records.set(record.id, record);
    });
  }

  public clearRecords(): void {
    this.state.records.clear();
  }

  private generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public reset(): void {
    this.state = {
      records: new Map(),
      currentRecordId: null,
      playerName: this.state.playerName,
      isRecording: false,
      currentPhase: null,
      startTime: 0,
    };
  }

  public getState(): Readonly<TrainingRecorderState> {
    return this.state;
  }
}

export const trainingRecorder = TrainingRecorder.getInstance();
