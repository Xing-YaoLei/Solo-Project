import { _decorator, Component, Node, Label, TiledMap, Vec3, EventTouch, UITransform, Color } from 'cc';
import { EventBus, GameEvents } from './core/EventBus';
import { ConfigManager } from './config/ConfigManager';
import { SettingsManager } from './config/SettingsManager';
import { TiledMapManager } from './map/TiledMapManager';
import { DataGenerator } from './data/DataGenerator';
import { ScheduleManager } from './game/ScheduleManager';
import { TimeManager } from './game/TimeManager';
import { SettlementManager } from './game/SettlementManager';
import { TutorialManager } from './game/TutorialManager';
import { ItemService } from './services/ItemService';
import { AnalyticsService } from './services/AnalyticsService';
import { AchievementService } from './services/AchievementService';
import { CourseCatalog } from './game/CourseCatalog';
import { StudentList } from './game/StudentList';
import { ReviewPanel } from './ui/ReviewPanel';
import { DifficultyLevel, Weekday, TimeSlot, Course, ItemEffect } from './types';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
  @property(TiledMap)
  tiledMap: TiledMap | null = null;

  @property(CourseCatalog)
  courseCatalog: CourseCatalog | null = null;

  @property(StudentList)
  studentList: StudentList | null = null;

  @property(ReviewPanel)
  reviewPanel: ReviewPanel | null = null;

  @property(Node)
  timeDisplay: Node | null = null;

  @property(Label)
  timeLabel: Label | null = null;

  @property(Node)
  itemBar: Node | null = null;

  @property(Node)
  classroomArea: Node | null = null;

  @property(Node)
  difficultySelector: Node | null = null;

  @property(Node)
  pauseMenu: Node | null = null;

  private _gameState: 'menu' | 'playing' | 'paused' | 'settlement' = 'menu';
  private _selectedWeekday: Weekday = 1;
  private _selectedTimeSlot: TimeSlot = 1;
  private _draggingCourse: Course | null = null;

  onLoad(): void {
    this.initializeManagers();
    this.setupEventListeners();
    this.loadSettings();
  }

  start(): void {
    this.showMainMenu();
  }

  update(dt: number): void {
    if (this._gameState === 'playing') {
      TimeManager.getInstance().update();
      ItemService.getInstance().update(dt);
      this.updateTimeDisplay();
      this.checkGameCompletion();
    }
  }

  private initializeManagers(): void {
    SettingsManager.getInstance().load();
    
    if (this.tiledMap) {
      TiledMapManager.getInstance().init(this.tiledMap);
    } else {
      TiledMapManager.getInstance().init({} as TiledMap);
    }
    
    AnalyticsService.getInstance().init();
    AchievementService.getInstance().init();
    ItemService.getInstance().init();
  }

  private setupEventListeners(): void {
    EventBus.instance.on(GameEvents.COURSE_DRAG_START, this.onCourseDragStart.bind(this));
    EventBus.instance.on(GameEvents.COURSE_DRAG_END, this.onCourseDragEnd.bind(this));
    EventBus.instance.on(GameEvents.GAME_END, this.onGameEnd.bind(this));
    EventBus.instance.on(GameEvents.ITEM_USED, this.onItemUsed.bind(this));
    EventBus.instance.on(GameEvents.CONFLICT_OCCURRED, this.onConflictOccurred.bind(this));
    
    EventBus.instance.on('game_restart', this.restartGame.bind(this));
    EventBus.instance.on('game_back_to_menu', this.backToMenu.bind(this));
    EventBus.instance.on('tutorial_completed', this.onTutorialCompleted.bind(this));
  }

  private loadSettings(): void {
    SettingsManager.getInstance().load();
  }

  showMainMenu(): void {
    this._gameState = 'menu';
    
    if (this.difficultySelector) {
      this.difficultySelector.active = true;
    }
    
    if (this.classroomArea) {
      this.classroomArea.active = false;
    }
    
    if (this.courseCatalog?.node) {
      this.courseCatalog.node.active = false;
    }
    
    if (this.studentList?.node) {
      this.studentList.node.active = false;
    }
    
    if (this.timeDisplay) {
      this.timeDisplay.active = false;
    }
    
    if (this.itemBar) {
      this.itemBar.active = false;
    }
  }

  startGame(difficulty: DifficultyLevel): void {
    ConfigManager.getInstance().currentDifficulty = difficulty;
    
    this.initializeGameData();
    this._gameState = 'playing';
    
    if (this.difficultySelector) {
      this.difficultySelector.active = false;
    }
    
    if (this.classroomArea) {
      this.classroomArea.active = true;
    }
    
    if (this.courseCatalog?.node) {
      this.courseCatalog.node.active = true;
    }
    
    if (this.studentList?.node) {
      this.studentList.node.active = true;
    }
    
    if (this.timeDisplay) {
      this.timeDisplay.active = true;
    }
    
    if (this.itemBar) {
      this.itemBar.active = true;
    }

    TimeManager.getInstance().init();
    TimeManager.getInstance().start();
    ItemService.getInstance().start();
    SettlementManager.getInstance().init();
    
    AnalyticsService.getInstance().trackGameStart(difficulty);
    EventBus.instance.emit(GameEvents.GAME_START);

    if (TutorialManager.getInstance().shouldShowTutorial()) {
      TutorialManager.getInstance().start();
    }

    SettingsManager.getInstance().vibrate(50);
  }

  private initializeGameData(): void {
    const { courses, students } = DataGenerator.getInstance().generateForDifficulty();
    
    ScheduleManager.getInstance().init(students, courses);
    
    if (this.courseCatalog) {
      this.courseCatalog.setCourses(courses);
    }
    
    if (this.studentList) {
      this.studentList.setStudents(students);
    }
    
    TiledMapManager.getInstance().reset();
    TimeManager.getInstance().init();
    ItemService.getInstance().reset();
    SettlementManager.getInstance().init();
    
    this._selectedWeekday = 1;
    this._selectedTimeSlot = 1;
  }

  private onCourseDragStart(course: Course): void {
    if (this._gameState !== 'playing') return;
    this._draggingCourse = course;
    
    SettlementManager.getInstance().trackBottleneck(
      { x: 0, y: 0 },
      '拖拽课程'
    );
  }

  private onCourseDragEnd(course: Course, position: Vec3): void {
    if (this._gameState !== 'playing' || !course) return;
    
    this._draggingCourse = null;
    
    const classroom = TiledMapManager.getInstance().getClassroomAtPosition(position);
    
    if (classroom) {
      const success = ScheduleManager.getInstance().placeCourse(
        course.id,
        classroom.id,
        this._selectedWeekday,
        this._selectedTimeSlot
      );
      
      const courseItem = this.courseCatalog?.getCourseItem(course.id);
      if (courseItem) {
        courseItem.showPlacementFeedback(success);
      }
      
      SettlementManager.getInstance().trackBottleneck(
        { x: position.x, y: position.y },
        success ? '放置课程成功' : '放置课程失败'
      );
    }
    
    TutorialManager.getInstance().triggerAction('course_dragged');
  }

  private onConflictOccurred(): void {
    SettingsManager.getInstance().vibrate(100);
  }

  private onItemUsed(itemId: string, effect: ItemEffect): void {
    SettlementManager.getInstance().processItemEffect(effect);
    SettingsManager.getInstance().vibrate(30);
  }

  private onGameEnd(success: boolean, stats: Record<string, unknown>): void {
    this._gameState = 'settlement';
    TimeManager.getInstance().stop();
    ItemService.getInstance().stop();
    
    if (this.reviewPanel) {
      this.reviewPanel.show();
    }
    
    EventBus.instance.emit(GameEvents.GAME_END, success, {
      ...stats,
      completionTime: TimeManager.getInstance().timeElapsed,
      perfectSchedule: ScheduleManager.getInstance().conflicts.length === 0,
    });
  }

  private updateTimeDisplay(): void {
    if (!this.timeLabel) return;
    
    const timeManager = TimeManager.getInstance();
    this.timeLabel.string = timeManager.getFormattedTimeRemaining();
    
    if (timeManager.isWarning) {
      this.timeLabel.color = timeManager.timeRemaining % 2 < 1 
        ? new Color(255, 100, 100, 255)
        : new Color(255, 255, 255, 255);
    }
  }

  private checkGameCompletion(): void {
    if (this._gameState !== 'playing') return;
    
    const scheduleManager = ScheduleManager.getInstance();
    if (scheduleManager.isComplete() && scheduleManager.unresolvedConflicts.length === 0) {
      this.onGameEnd(true, { reason: 'all_completed' });
    }
  }

  setWeekday(weekday: Weekday): void {
    this._selectedWeekday = weekday;
  }

  setTimeSlot(timeSlot: TimeSlot): void {
    this._selectedTimeSlot = timeSlot;
  }

  useItem(itemId: string): void {
    if (this._gameState !== 'playing') return;
    ItemService.getInstance().useItem(itemId);
  }

  pauseGame(): void {
    if (this._gameState !== 'playing') return;
    
    this._gameState = 'paused';
    TimeManager.getInstance().pause();
    
    if (this.pauseMenu) {
      this.pauseMenu.active = true;
    }
  }

  resumeGame(): void {
    if (this._gameState !== 'paused') return;
    
    this._gameState = 'playing';
    TimeManager.getInstance().resume();
    
    if (this.pauseMenu) {
      this.pauseMenu.active = false;
    }
  }

  restartGame(): void {
    const difficulty = ConfigManager.getInstance().currentDifficulty;
    this.resetGame();
    this.startGame(difficulty);
  }

  backToMenu(): void {
    this.resetGame();
    this.showMainMenu();
  }

  private resetGame(): void {
    ScheduleManager.getInstance().reset();
    TimeManager.getInstance().reset();
    ItemService.getInstance().reset();
    SettlementManager.getInstance().reset();
    TiledMapManager.getInstance().reset();
    DataGenerator.getInstance().reset();
    
    if (this.courseCatalog) {
      this.courseCatalog.reset();
    }
    
    if (this.studentList) {
      this.studentList.reset();
    }
    
    if (this.pauseMenu) {
      this.pauseMenu.active = false;
    }
    
    this._gameState = 'menu';
    this._draggingCourse = null;
  }

  private onTutorialCompleted(): void {
    if (this._gameState === 'playing') {
    }
  }

  onEasySelected(): void {
    this.startGame('easy');
  }

  onNormalSelected(): void {
    this.startGame('normal');
  }

  onHardSelected(): void {
    this.startGame('hard');
  }

  onDestroy(): void {
    EventBus.instance.off(GameEvents.COURSE_DRAG_START, this.onCourseDragStart.bind(this));
    EventBus.instance.off(GameEvents.COURSE_DRAG_END, this.onCourseDragEnd.bind(this));
    EventBus.instance.off(GameEvents.GAME_END, this.onGameEnd.bind(this));
    EventBus.instance.off(GameEvents.ITEM_USED, this.onItemUsed.bind(this));
    EventBus.instance.off(GameEvents.CONFLICT_OCCURRED, this.onConflictOccurred.bind(this));
    
    TiledMapManager.getInstance().destroy();
    AnalyticsService.getInstance().destroy();
    AchievementService.getInstance().destroy();
  }
}
