export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TimeSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type CourseType = 'required' | 'elective' | 'lab' | 'pe';

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'conflict';

export type GameState = 'menu' | 'tutorial' | 'playing' | 'paused' | 'settlement' | 'review';

export interface Course {
  id: string;
  name: string;
  teacher: string;
  type: CourseType;
  credits: number;
  hours: number;
  capacity: number;
  color: string;
  requiredEquipment?: string[];
}

export interface Classroom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  schedule: Map<string, string>;
  status: RoomStatus;
  position: { x: number; y: number };
}

export interface Student {
  id: string;
  name: string;
  major: string;
  year: number;
  requiredCourses: string[];
  preferredCourses: string[];
  maxCredits: number;
  currentCredits: number;
  schedule: Map<string, string>;
}

export interface ScheduledCourse {
  courseId: string;
  classroomId: string;
  weekday: Weekday;
  timeSlot: TimeSlot;
  studentIds: string[];
}

export interface ConflictEvent {
  id: string;
  type: 'room_double_booked' | 'equipment_missing' | 'capacity_exceeded' | 'time_overlap';
  message: string;
  classroomId?: string;
  courseId?: string;
  weekday?: Weekday;
  timeSlot?: TimeSlot;
  resolved: boolean;
}

export interface GameConfig {
  difficulty: DifficultyConfig;
  items: ItemConfig[];
  achievements: AchievementConfig[];
  analytics: AnalyticsConfig;
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  timeLimit: number;
  studentCount: number;
  courseCount: number;
  conflictFrequency: number;
  minSatisfaction: number;
}

export interface ItemConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number;
  effect: ItemEffect;
}

export interface ItemEffect {
  type: 'extend_time' | 'resolve_conflict' | 'boost_satisfaction' | 'reveal_preference';
  value: number;
}

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  reward: number;
}

export interface AchievementCondition {
  type: 'complete_n_games' | 'perfect_schedule' | 'no_conflict' | 'fast_completion';
  target: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  events: string[];
}

export interface GameStatistics {
  totalTime: number;
  reviewTime: number;
  completionTime: number;
  conflictCount: number;
  resolvedConflicts: number;
  studentSatisfaction: number;
  scheduleQuality: number;
  bottlenecks: BottleneckPoint[];
}

export interface BottleneckPoint {
  timestamp: number;
  position: { x: number; y: number };
  duration: number;
  action: string;
}

export interface AnalyticsEvent {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  animationIntensity: number;
  musicVolume: number;
  sfxVolume: number;
}
