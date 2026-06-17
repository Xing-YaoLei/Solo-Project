import { GameConfig } from '../config/GameConfig';

export interface Medicine {
  id: string;
  name: string;
  icon: string;
  color: number;
  dosage: string;
  frequency: string;
}

export interface ElderProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  gender: 'male' | 'female';
  careLevel: number;
  conditions: string[];
  medicines: Medicine[];
  roomType: 'single' | 'double' | 'ward';
  dietaryRestrictions: string[];
  notes: string;
}

export interface Bed {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  occupant: ElderProfile | null;
  requiredCareLevel: number;
  requiredMedicines: string[];
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  timeLimit: number;
  bedCount: number;
  elderCount: number;
  minCareLevel: number;
  maxCareLevel: number;
  medicineComplexity: number;
  targetCorrect: number;
  unlocked: boolean;
}

export interface GameResult {
  levelId: number;
  levelName: string;
  completed: boolean;
  timeTaken: number;
  timeLimit: number;
  correctCount: number;
  errorCount: number;
  maxStreak: number;
  totalActions: number;
  careLevelMatches: number[];
  accuracy: number;
  speedScore: number;
  streakScore: number;
  totalScore: number;
  care达标: { level: number; correct: number; total: number }[];
}

export class DataManager {
  private static instance: DataManager;
  private levels: LevelConfig[] = [];
  private gameResults: GameResult[] = [];

  private constructor() {
    this.initLevels();
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  private initLevels(): void {
    this.levels = [
      {
        id: 1,
        name: '新手入门',
        description: '学习基础的床位排班，处理自理老人',
        timeLimit: 120,
        bedCount: 4,
        elderCount: 4,
        minCareLevel: 1,
        maxCareLevel: 2,
        medicineComplexity: 1,
        targetCorrect: 3,
        unlocked: true
      },
      {
        id: 2,
        name: '日常工作',
        description: '处理更多床位和混合护理等级',
        timeLimit: 150,
        bedCount: 6,
        elderCount: 6,
        minCareLevel: 1,
        maxCareLevel: 3,
        medicineComplexity: 2,
        targetCorrect: 5,
        unlocked: false
      },
      {
        id: 3,
        name: '专业挑战',
        description: '包含特护级别老人，用药更复杂',
        timeLimit: 180,
        bedCount: 8,
        elderCount: 8,
        minCareLevel: 2,
        maxCareLevel: 4,
        medicineComplexity: 3,
        targetCorrect: 7,
        unlocked: false
      },
      {
        id: 4,
        name: '紧急状态',
        description: '时间紧张，需要快速准确判断',
        timeLimit: 100,
        bedCount: 6,
        elderCount: 8,
        minCareLevel: 1,
        maxCareLevel: 4,
        medicineComplexity: 3,
        targetCorrect: 6,
        unlocked: false
      },
      {
        id: 5,
        name: '护士长考核',
        description: '终极挑战，满负荷工作状态',
        timeLimit: 200,
        bedCount: 10,
        elderCount: 12,
        minCareLevel: 1,
        maxCareLevel: 4,
        medicineComplexity: 4,
        targetCorrect: 10,
        unlocked: false
      }
    ];
  }

  public getLevels(): LevelConfig[] {
    return this.levels;
  }

  public getLevel(id: number): LevelConfig | undefined {
    return this.levels.find(l => l.id === id);
  }

  public unlockLevel(id: number): void {
    const level = this.levels.find(l => l.id === id);
    if (level) {
      level.unlocked = true;
    }
  }

  public generateElders(config: LevelConfig): ElderProfile[] {
    const elders: ElderProfile[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < config.elderCount; i++) {
      let name: string;
      do {
        const nameIdx = Math.floor(Math.random() * GameConfig.ELDERLY_NAMES.length);
        name = GameConfig.ELDERLY_NAMES[nameIdx];
      } while (usedNames.has(name));
      usedNames.add(name);

      const careLevel = config.minCareLevel + 
        Math.floor(Math.random() * (config.maxCareLevel - config.minCareLevel + 1));

      const medicines: Medicine[] = [];
      const medCount = Math.min(config.medicineComplexity + Math.floor(Math.random() * 2), GameConfig.MEDICINES.length);
      const usedMeds = new Set<string>();
      
      for (let m = 0; m < medCount; m++) {
        let medIdx: number;
        let med: typeof GameConfig.MEDICINES[0];
        do {
          medIdx = Math.floor(Math.random() * GameConfig.MEDICINES.length);
          med = GameConfig.MEDICINES[medIdx];
        } while (usedMeds.has(med.id));
        usedMeds.add(med.id);

        medicines.push({
          ...med,
          dosage: ['每日1次', '每日2次', '每日3次', '饭前服用', '饭后服用'][Math.floor(Math.random() * 5)],
          frequency: ['早', '中', '晚', '早晚', '早中晚'][Math.floor(Math.random() * 5)]
        });
      }

      const conditionCount = Math.floor(Math.random() * 3) + 1;
      const conditions: string[] = [];
      const usedConditions = new Set<string>();
      for (let c = 0; c < conditionCount; c++) {
        let cond: string;
        do {
          cond = GameConfig.CONDITIONS[Math.floor(Math.random() * GameConfig.CONDITIONS.length)];
        } while (usedConditions.has(cond));
        usedConditions.add(cond);
        conditions.push(cond);
      }

      const avatar = GameConfig.ELDERLY_AVATARS[Math.floor(Math.random() * GameConfig.ELDERLY_AVATARS.length)];
      const isFemale = name.includes('奶奶');

      elders.push({
        id: `elder_${Date.now()}_${i}`,
        name,
        avatar,
        age: 65 + Math.floor(Math.random() * 30),
        gender: isFemale ? 'female' : 'male',
        careLevel,
        conditions,
        medicines,
        roomType: ['single', 'double', 'ward'][Math.floor(Math.random() * 3)] as 'single' | 'double' | 'ward',
        dietaryRestrictions: ['低盐', '低糖', '低脂', '流质', '普食'].slice(0, Math.floor(Math.random() * 3)),
        notes: careLevel >= 3 ? '需要特别关注' : '情况稳定'
      });
    }

    return elders;
  }

  public generateBeds(config: LevelConfig, startX: number, startY: number, bedWidth: number, bedHeight: number): Bed[] {
    const beds: Bed[] = [];
    const cols = Math.ceil(Math.sqrt(config.bedCount));
    const rows = Math.ceil(config.bedCount / cols);
    const gap = 20;

    let bedIndex = 0;
    for (let row = 0; row < rows && bedIndex < config.bedCount; row++) {
      for (let col = 0; col < cols && bedIndex < config.bedCount; col++) {
        const requiredCareLevel = config.minCareLevel + 
          Math.floor(Math.random() * (config.maxCareLevel - config.minCareLevel + 1));
        
        const medCount = Math.min(config.medicineComplexity + Math.floor(Math.random() * 2), GameConfig.MEDICINES.length);
        const requiredMedicines: string[] = [];
        const usedMeds = new Set<string>();
        for (let m = 0; m < medCount; m++) {
          let medIdx: number;
          let med: typeof GameConfig.MEDICINES[0];
          do {
            medIdx = Math.floor(Math.random() * GameConfig.MEDICINES.length);
            med = GameConfig.MEDICINES[medIdx];
          } while (usedMeds.has(med.id));
          usedMeds.add(med.id);
          requiredMedicines.push(med.id);
        }
        
        beds.push({
          id: bedIndex,
          row,
          col,
          x: startX + col * (bedWidth + gap),
          y: startY + row * (bedHeight + gap),
          width: bedWidth,
          height: bedHeight,
          occupant: null,
          requiredCareLevel,
          requiredMedicines
        });
        bedIndex++;
      }
    }

    return beds;
  }

  public saveResult(result: GameResult): void {
    this.gameResults.push(result);
  }

  public getResults(): GameResult[] {
    return this.gameResults;
  }

  public getResultsByLevel(levelId: number): GameResult[] {
    return this.gameResults.filter(r => r.levelId === levelId);
  }

  public getBestResult(levelId: number): GameResult | null {
    const results = this.getResultsByLevel(levelId);
    if (results.length === 0) return null;
    return results.reduce((best, current) => 
      current.totalScore > best.totalScore ? current : best
    );
  }
}
