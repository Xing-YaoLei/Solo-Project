import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Label, Sprite, Color, Layout } from 'cc';
import { Student } from '../types';
import { ScheduleManager } from './ScheduleManager';
import { EventBus, GameEvents } from '../core/EventBus';
import { SettingsManager } from '../config/SettingsManager';
const { ccclass, property } = _decorator;

@ccclass('StudentItem')
export class StudentItem extends Component {
  @property(Label)
  nameLabel: Label | null = null;

  @property(Label)
  majorLabel: Label | null = null;

  @property(Label)
  creditsLabel: Label | null = null;

  @property(Label)
  satisfactionLabel: Label | null = null;

  @property(Sprite)
  backgroundSprite: Sprite | null = null;

  @property(Sprite)
  statusIndicator: Sprite | null = null;

  @property(Node)
  preferredCoursesContainer: Node | null = null;

  @property(Prefab)
  courseTagPrefab: Prefab | null = null;

  private _student: Student | null = null;
  private _showDetails: boolean = false;

  get student(): Student | null {
    return this._student;
  }

  setStudent(student: Student): void {
    this._student = student;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this._student) return;

    if (this.nameLabel) {
      this.nameLabel.string = this._student.name;
    }

    if (this.majorLabel) {
      this.majorLabel.string = `${this._student.major} · ${this._student.year}年级`;
    }

    if (this.creditsLabel) {
      this.creditsLabel.string = `${this._student.currentCredits}/${this._student.maxCredits}学分`;
    }

    const satisfaction = ScheduleManager.getInstance().getStudentSatisfaction(this._student.id);
    if (this.satisfactionLabel) {
      this.satisfactionLabel.string = `满意度: ${satisfaction.toFixed(0)}%`;
    }

    this.updateStatus(satisfaction);
    this.updateCourseTags();
  }

  private updateStatus(satisfaction: number): void {
    if (!this._student) return;

    const scheduleManager = ScheduleManager.getInstance();
    const isComplete = scheduleManager.completedStudents.includes(this._student.id);

    if (this.statusIndicator) {
      if (isComplete) {
        this.statusIndicator.color = new Color(80, 200, 120, 255);
      } else if (satisfaction < 50) {
        this.statusIndicator.color = new Color(231, 76, 60, 255);
      } else {
        this.statusIndicator.color = new Color(241, 196, 15, 255);
      }
    }

    if (this.backgroundSprite) {
      if (isComplete) {
        this.backgroundSprite.color = new Color(230, 255, 230, 255);
      } else {
        this.backgroundSprite.color = new Color(255, 255, 255, 255);
      }
    }
  }

  private updateCourseTags(): void {
    if (!this.preferredCoursesContainer || !this._student) return;

    this.preferredCoursesContainer.removeAllChildren();
    
    const intensity = SettingsManager.getInstance().animationIntensity;
    const showCourses = this._showDetails || intensity > 0.5;
    
    if (showCourses) {
      const coursesToShow = [...this._student.requiredCourses, ...this._student.preferredCourses.slice(0, 2)];
      
      coursesToShow.forEach(courseId => {
        if (this.courseTagPrefab) {
          const node = instantiate(this.courseTagPrefab);
          const label = node.getComponent(Label);
          if (label) {
            const course = ScheduleManager.getInstance().courses.find(c => c.id === courseId);
            label.string = course?.name || courseId;
            
            const isRequired = this._student!.requiredCourses.includes(courseId);
            label.color = isRequired ? new Color(74, 144, 217, 255) : new Color(80, 200, 120, 255);
          }
          this.preferredCoursesContainer.addChild(node);
        }
      });
    }
  }

  toggleDetails(): void {
    this._showDetails = !this._showDetails;
    this.updateCourseTags();
  }

  refresh(): void {
    if (this._student) {
      this.updateDisplay();
    }
  }
}

@ccclass('StudentList')
export class StudentList extends Component {
  @property(ScrollView)
  scrollView: ScrollView | null = null;

  @property(Prefab)
  studentItemPrefab: Prefab | null = null;

  @property(Node)
  contentContainer: Node | null = null;

  @property(Label)
  progressLabel: Label | null = null;

  @property(Label)
  averageSatisfactionLabel: Label | null = null;

  private _studentItems: Map<string, StudentItem> = new Map();
  private _showPreferred: boolean = false;

  get studentItems(): StudentItem[] {
    return Array.from(this._studentItems.values());
  }

  onLoad(): void {
    EventBus.instance.on(GameEvents.STUDENT_COMPLETED, this.onStudentCompleted.bind(this));
    EventBus.instance.on(GameEvents.COURSE_PLACED, this.onCourseChanged.bind(this));
    EventBus.instance.on(GameEvents.COURSE_REMOVED, this.onCourseChanged.bind(this));
  }

  setStudents(students: Student[]): void {
    this.clearItems();
    this.createItems(students);
    this.updateProgress();
  }

  private clearItems(): void {
    this._studentItems.forEach(item => item.node.destroy());
    this._studentItems.clear();
    
    if (this.contentContainer) {
      this.contentContainer.removeAllChildren();
    }
  }

  private createItems(students: Student[]): void {
    if (!this.contentContainer || !this.studentItemPrefab) return;

    students.forEach(student => {
      const node = instantiate(this.studentItemPrefab);
      const item = node.getComponent(StudentItem);
      
      if (item) {
        item.setStudent(student);
        this._studentItems.set(student.id, item);
        this.contentContainer.addChild(node);
      }
    });

    this.updateLayout();
  }

  private onStudentCompleted(studentId: string): void {
    const item = this._studentItems.get(studentId);
    if (item) {
      item.refresh();
    }
    this.updateProgress();
  }

  private onCourseChanged(): void {
    this.refreshAll();
    this.updateProgress();
  }

  refreshAll(): void {
    this._studentItems.forEach(item => item.refresh());
    this.updateAverageSatisfaction();
  }

  private updateProgress(): void {
    if (this.progressLabel) {
      const scheduleManager = ScheduleManager.getInstance();
      const completed = scheduleManager.completedStudentCount;
      const total = scheduleManager.students.length;
      this.progressLabel.string = `完成进度: ${completed}/${total}`;
    }
  }

  private updateAverageSatisfaction(): void {
    if (this.averageSatisfactionLabel) {
      const avg = ScheduleManager.getInstance().getAverageSatisfaction();
      this.averageSatisfactionLabel.string = `平均满意度: ${avg.toFixed(1)}%`;
    }
  }

  togglePreferredCourses(): void {
    this._showPreferred = !this._showPreferred;
    this._studentItems.forEach(item => {
      if (this._showPreferred) {
        item.toggleDetails();
      }
    });
  }

  getStudentItem(studentId: string): StudentItem | undefined {
    return this._studentItems.get(studentId);
  }

  private updateLayout(): void {
    if (this.contentContainer) {
      const layout = this.contentContainer.getComponent(Layout);
      if (layout) {
        layout.updateLayout();
      }
    }
  }

  reset(): void {
    this._studentItems.forEach(item => item.refresh());
    this.updateProgress();
    this.updateAverageSatisfaction();
  }

  onDestroy(): void {
    EventBus.instance.off(GameEvents.STUDENT_COMPLETED, this.onStudentCompleted.bind(this));
    EventBus.instance.off(GameEvents.COURSE_PLACED, this.onCourseChanged.bind(this));
    EventBus.instance.off(GameEvents.COURSE_REMOVED, this.onCourseChanged.bind(this));
  }
}
