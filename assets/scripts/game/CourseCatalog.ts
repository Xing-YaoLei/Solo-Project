import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Layout, Label } from 'cc';
import { Course, CourseType } from '../types';
import { CourseItem } from './CourseItem';
import { EventBus, GameEvents } from '../core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('CourseCatalog')
export class CourseCatalog extends Component {
  @property(ScrollView)
  scrollView: ScrollView | null = null;

  @property(Prefab)
  courseItemPrefab: Prefab | null = null;

  @property(Node)
  contentContainer: Node | null = null;

  @property(Node)
  filterButtons: Node | null = null;

  @property(Label)
  countLabel: Label | null = null;

  private _courses: Course[] = [];
  private _courseItems: Map<string, CourseItem> = new Map();
  private _currentFilter: CourseType | 'all' = 'all';

  get courses(): Course[] {
    return [...this._courses];
  }

  get courseItems(): CourseItem[] {
    return Array.from(this._courseItems.values());
  }

  setCourses(courses: Course[]): void {
    this._courses = courses;
    this.clearItems();
    this.createItems();
    this.updateCount();
  }

  onLoad(): void {
    EventBus.instance.on(GameEvents.COURSE_PLACED, this.onCoursePlaced.bind(this));
    EventBus.instance.on(GameEvents.COURSE_REMOVED, this.onCourseRemoved.bind(this));
  }

  private clearItems(): void {
    this._courseItems.forEach(item => item.node.destroy());
    this._courseItems.clear();
    
    if (this.contentContainer) {
      this.contentContainer.removeAllChildren();
    }
  }

  private createItems(): void {
    if (!this.contentContainer || !this.courseItemPrefab) return;

    this._courses.forEach(course => {
      if (!this.shouldShowCourse(course)) return;

      const node = instantiate(this.courseItemPrefab);
      const item = node.getComponent(CourseItem);
      
      if (item) {
        item.setCourse(course);
        this._courseItems.set(course.id, item);
        this.contentContainer.addChild(node);
      }
    });

    this.updateLayout();
  }

  private shouldShowCourse(course: Course): boolean {
    if (this._currentFilter === 'all') return true;
    return course.type === this._currentFilter;
  }

  setFilter(filter: CourseType | 'all'): void {
    this._currentFilter = filter;
    this.clearItems();
    this.createItems();
    this.updateCount();
  }

  private onCoursePlaced(courseId: string): void {
    const item = this._courseItems.get(courseId);
    if (item) {
      item.setScheduled(true);
      item.showPlacementFeedback(true);
    }
  }

  private onCourseRemoved(courseId: string): void {
    const item = this._courseItems.get(courseId);
    if (item) {
      item.setScheduled(false);
    }
  }

  getCourseItem(courseId: string): CourseItem | undefined {
    return this._courseItems.get(courseId);
  }

  reset(): void {
    this._courseItems.forEach(item => item.setScheduled(false));
    this._currentFilter = 'all';
    this.clearItems();
    this.createItems();
  }

  private updateLayout(): void {
    if (this.contentContainer) {
      const layout = this.contentContainer.getComponent(Layout);
      if (layout) {
        layout.updateLayout();
      }
    }
  }

  private updateCount(): void {
    if (this.countLabel) {
      const scheduledCount = this._courseItems.size;
      const totalCount = this._courses.length;
      this.countLabel.string = `${scheduledCount}/${totalCount}`;
    }
  }

  onDestroy(): void {
    EventBus.instance.off(GameEvents.COURSE_PLACED, this.onCoursePlaced.bind(this));
    EventBus.instance.off(GameEvents.COURSE_REMOVED, this.onCourseRemoved.bind(this));
  }
}
