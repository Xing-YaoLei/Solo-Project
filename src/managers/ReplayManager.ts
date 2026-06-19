import { ReplaySession, ReplayFrame, GameResult, Level, PlayerAction } from '../models';

const STORAGE_KEY = 'replay_sessions_by_vehicle';
const MAX_REPLAYS_PER_VEHICLE = 3;
const STALL_THRESHOLD_MS = 30000;

interface StoredReplays {
  [vehicleArchiveId: string]: ReplaySession[];
}

export class ReplayManager {
  private sessionsByVehicle: StoredReplays = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.sessionsByVehicle = JSON.parse(data) as StoredReplays;
      }
    } catch {
      this.sessionsByVehicle = {};
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessionsByVehicle));
    } catch {
      // Storage full or unavailable
    }
  }

  saveReplay(level: Level, result: GameResult, actions: PlayerAction[]): ReplaySession | null {
    if (result.passed) {
      console.log('✅ 游戏通过，不保存失败回放');
      return null;
    }

    const frames: ReplayFrame[] = [];
    let cumulativeScore = 0;
    let cumulativeErrors = 0;

    result.actions.forEach((action, index) => {
      cumulativeScore += action.pointsEarned - action.pointsDeducted;
      if (!action.isCorrect) cumulativeErrors++;

      frames.push({
        timestamp: action.timestamp,
        stepIndex: index,
        action,
        score: Math.max(0, cumulativeScore),
        errorCount: cumulativeErrors
      });
    });

    const session: ReplaySession = {
      id: `replay_${Date.now()}`,
      levelId: level.id,
      vehicleArchiveId: level.vehicleArchive.id,
      vehicleInfo: {
        brand: level.vehicleArchive.basicInfo.brand,
        model: level.vehicleArchive.basicInfo.model,
        plateNumber: level.vehicleArchive.basicInfo.plateNumber,
        vin: level.vehicleArchive.basicInfo.vin
      },
      result,
      frames,
      createdAt: new Date().toISOString()
    };

    const vehicleId = level.vehicleArchive.id;
    if (!this.sessionsByVehicle[vehicleId]) {
      this.sessionsByVehicle[vehicleId] = [];
    }

    this.sessionsByVehicle[vehicleId] = [
      session,
      ...this.sessionsByVehicle[vehicleId]
    ].slice(0, MAX_REPLAYS_PER_VEHICLE);

    this.saveToStorage();

    console.log(`💾 已保存车辆 [${level.vehicleArchive.basicInfo.plateNumber}] 的失败回放，当前共 ${this.sessionsByVehicle[vehicleId].length} 次`);
    return session;
  }

  getAllReplays(): ReplaySession[] {
    const allSessions: ReplaySession[] = [];
    Object.values(this.sessionsByVehicle).forEach((sessions) => {
      allSessions.push(...sessions);
    });
    return allSessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getReplayById(id: string): ReplaySession | undefined {
    for (const sessions of Object.values(this.sessionsByVehicle)) {
      const found = sessions.find((s) => s.id === id);
      if (found) return found;
    }
    return undefined;
  }

  getReplaysByVehicle(vehicleArchiveId: string): ReplaySession[] {
    return this.sessionsByVehicle[vehicleArchiveId] ?? [];
  }

  getReplaysByLevel(levelId: string): ReplaySession[] {
    return this.getAllReplays().filter((s) => s.levelId === levelId);
  }

  getLatestReplay(): ReplaySession | undefined {
    const all = this.getAllReplays();
    return all[0];
  }

  getVehicleIds(): string[] {
    return Object.keys(this.sessionsByVehicle);
  }

  getVehiclesWithReplays(): Array<{
    vehicleArchiveId: string;
    vehicleInfo: ReplaySession['vehicleInfo'];
    replayCount: number;
  }> {
    return Object.entries(this.sessionsByVehicle).map(([vehicleId, sessions]) => ({
      vehicleArchiveId: vehicleId,
      vehicleInfo: sessions[0].vehicleInfo,
      replayCount: sessions.length
    }));
  }

  getStallPoints(result: GameResult): Array<{
    stepNumber: number;
    stepPrompt: string;
    timeSpentMs: number;
    thresholdMs: number;
    isOverThreshold: boolean;
  }> {
    return result.actions.map((action) => ({
      stepNumber: result.actions.indexOf(action) + 1,
      stepPrompt: action.stepId,
      timeSpentMs: action.timeSpentMs,
      thresholdMs: STALL_THRESHOLD_MS,
      isOverThreshold: action.timeSpentMs >= STALL_THRESHOLD_MS
    }));
  }

  getStallStepsWithClues(result: GameResult, level: Level): Array<{
    stepNumber: number;
    stepPrompt: string;
    timeSpentMs: number;
    thresholdMs: number;
    isOverThreshold: boolean;
    relatedDocs: Array<{
      docType: 'vehicle' | 'quote' | 'finance';
      section: string;
      keyInfo: string;
    }>;
  }> {
    const stallPoints = this.getStallPoints(result);
    
    return stallPoints
      .filter((sp) => sp.isOverThreshold)
      .map((stall) => {
        const step = level.task.steps[stall.stepNumber - 1];
        const relatedDocs = this.getRelatedDocClues(step, level);
        return {
          ...stall,
          stepPrompt: step?.prompt || stall.stepPrompt,
          relatedDocs
        };
      });
  }

  private getRelatedDocClues(step: any, level: Level): Array<{
    docType: 'vehicle' | 'quote' | 'finance';
    section: string;
    keyInfo: string;
  }> {
    const clues: Array<{
      docType: 'vehicle' | 'quote' | 'finance';
      section: string;
      keyInfo: string;
    }> = [];
    const stepPrompt = step?.prompt?.toLowerCase() || '';

    if (stepPrompt.includes('抵押') || stepPrompt.includes('贷款') || stepPrompt.includes('产权')) {
      clues.push({
        docType: 'vehicle',
        section: '产权信息',
        keyInfo: `抵押状态: ${level.vehicleArchive.hasEncumbrance ? '有抵押' : '无抵押'}`
      });
      if (level.vehicleArchive.encumbranceDescription) {
        clues.push({
          docType: 'vehicle',
          section: '抵押说明',
          keyInfo: level.vehicleArchive.encumbranceDescription
        });
      }
      clues.push({
        docType: 'finance',
        section: '贷款信息',
        keyInfo: `贷款状态: ${level.financeDocuments.finance.hasLoan ? '有贷款' : '无贷款'}`
      });
    }

    if (stepPrompt.includes('身份证') || stepPrompt.includes('身份') || stepPrompt.includes('车主')) {
      clues.push({
        docType: 'vehicle',
        section: '产权信息',
        keyInfo: `车主: ${level.vehicleArchive.ownership.ownerName}`
      });
    }

    if (stepPrompt.includes('登记证书') || stepPrompt.includes('过户') || stepPrompt.includes('合同')) {
      clues.push({
        docType: 'vehicle',
        section: '车辆状态',
        keyInfo: `查封状态: ${level.vehicleArchive.isSeized ? '已查封' : '正常'}`
      });
    }

    if (stepPrompt.includes('价格') || stepPrompt.includes('报价') || stepPrompt.includes('钱')) {
      clues.push({
        docType: 'quote',
        section: '报价概况',
        keyInfo: `成交价: ${level.quoteHistory.finalNegotiatedPrice} 万元`
      });
    }

    if (stepPrompt.includes('保险') || stepPrompt.includes('保单')) {
      clues.push({
        docType: 'finance',
        section: '保险信息',
        keyInfo: `保险到期: ${level.financeDocuments.insurance.policyEndDate}`
      });
    }

    if (clues.length === 0) {
      clues.push({
        docType: 'vehicle',
        section: '基本信息',
        keyInfo: `${level.vehicleArchive.basicInfo.brand} ${level.vehicleArchive.basicInfo.model}, ${level.vehicleArchive.basicInfo.year}年款`
      });
      clues.push({
        docType: 'vehicle',
        section: '车辆状况',
        keyInfo: `车况评估: ${level.vehicleArchive.condition.overallAssessment}`
      });
    }

    return clues;
  }

  findStallDetails(result: GameResult, stepNumber: number, steps: any[]): {
    step: any;
    timeSpentMs: number;
    recommendedImprovement: string;
  } | null {
    const action = result.actions[stepNumber - 1];
    const step = steps[stepNumber - 1];

    if (!action || !step) return null;

    let recommendation = '';
    if (action.timeSpentMs >= STALL_THRESHOLD_MS * 2) {
      recommendation = '在此步骤严重卡顿，建议加强相关流程学习，多做同类练习';
    } else if (action.timeSpentMs >= STALL_THRESHOLD_MS) {
      recommendation = '在此步骤耗时较长，建议复习相关知识点';
    } else if (!action.isCorrect) {
      recommendation = '虽未超时但判断错误，需注意区分相似操作的适用场景';
    } else {
      recommendation = '表现正常';
    }

    return {
      step,
      timeSpentMs: action.timeSpentMs,
      recommendedImprovement: recommendation
    };
  }

  getReplayFrames(replayId: string): ReplayFrame[] {
    const session = this.getReplayById(replayId);
    return session?.frames ?? [];
  }

  clearAllReplays(): void {
    this.sessionsByVehicle = {};
    this.saveToStorage();
  }

  clearReplaysByVehicle(vehicleArchiveId: string): void {
    delete this.sessionsByVehicle[vehicleArchiveId];
    this.saveToStorage();
  }

  getMaxReplaysPerVehicle(): number {
    return MAX_REPLAYS_PER_VEHICLE;
  }

  getStallThreshold(): number {
    return STALL_THRESHOLD_MS;
  }
}
