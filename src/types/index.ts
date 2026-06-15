export interface Student {
  id: string;
  name: string;
  studentId: string;
  major: string;
  grade: string;
  avatar: string;
  seatNumber: number;
  hasApplied: boolean;
  seatPosition: { x: number; z: number };
}

export interface CourseScore {
  courseName: string;
  courseId: string;
  score: number;
  credits: number;
}

export interface Transcript {
  studentId: string;
  courses: CourseScore[];
  gpa: number;
  rank: number;
}

export type MaterialType = 'transcript' | 'application_form' | 'id_copy' | 'recommendation' | 'certificate';

export interface ApplicationMaterial {
  id: string;
  name: string;
  type: MaterialType;
  required: boolean;
  submitted: boolean;
}

export interface StudentMaterials {
  studentId: string;
  materials: ApplicationMaterial[];
}

export type GamePhase = 'observe' | 'transcript' | 'application' | 'complete';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  timeLimit: number;
  students: Student[];
  transcripts: Transcript[];
  studentMaterials: StudentMaterials[];
  targetUtilization: number;
  passingScore: number;
}

export interface OperationRecord {
  timestamp: number;
  type: string;
  payload: Record<string, any>;
  phase: GamePhase;
}

export interface UtilizationDataPoint {
  time: number;
  utilization: number;
  phase: GamePhase;
}

export interface StuckPoint {
  timestamp: number;
  phase: GamePhase;
  description: string;
  duration: number;
}

export interface ReplayRecord {
  id: string;
  levelId: string;
  levelName: string;
  timestamp: number;
  duration: number;
  success: boolean;
  finalScore: number;
  operations: OperationRecord[];
  stuckPoints: StuckPoint[];
  utilizationHistory: UtilizationDataPoint[];
}

export interface GameState {
  currentLevelId: string | null;
  currentPhase: GamePhase;
  score: number;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  selectedStudentId: string | null;
  missingMaterials: string[];
  operationHistory: OperationRecord[];
  classroomUtilization: UtilizationDataPoint[];
  reviewedStudents: string[];
  scoredStudents: string[];
  completedStudents: string[];
  showMissingMaterialModal: boolean;
  currentMissingMaterialStudent: string | null;
  currentReviewData: ReplayRecord | null;
}

export interface GameActions {
  startLevel: (levelId: string) => void;
  nextPhase: () => void;
  prevPhase: () => void;
  goToApplicationPhase: (studentId?: string) => void;
  selectStudent: (studentId: string) => void;
  submitScore: (studentId: string, score: number) => void;
  checkMaterials: (studentId: string) => boolean;
  getMissingMaterials: (studentId: string) => ApplicationMaterial[];
  showMissingModal: (studentId: string) => void;
  hideMissingModal: () => void;
  resolveMissingMaterial: (studentId: string, materialId: string) => void;
  skipMissingMaterial: (studentId: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  completeLevel: (success: boolean) => ReplayRecord;
  tick: (delta: number) => void;
  addUtilizationPoint: (utilization: number) => void;
  addOperation: (type: string, payload: Record<string, any>, phaseOverride?: GamePhase) => void;
  completeStudentReview: (studentId: string) => void;
  isAllStudentsCompleted: () => boolean;
  finishLevel: () => void;
  resetGame: () => void;
}

export type GameStore = GameState & GameActions;

export interface SettingsState {
  isTouchMode: boolean;
  sensitivity: number;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export interface SettingsActions {
  setTouchMode: (enabled: boolean) => void;
  setSensitivity: (value: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
}

export type SettingsStore = SettingsState & SettingsActions;
