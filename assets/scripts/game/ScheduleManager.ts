import { _decorator } from 'cc';
import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { ScheduledCourse, Course, Classroom, Weekday, TimeSlot, Student, ConflictEvent } from '../types';
import { TiledMapManager } from '../map/TiledMapManager';
import { AnalyticsService } from '../services/AnalyticsService';
import { ConfigManager } from '../config/ConfigManager';
const { ccclass } = _decorator;

@ccclass('ScheduleManager')
export class ScheduleManager extends Singleton<ScheduleManager> {
  private _scheduledCourses: Map<string, ScheduledCourse> = new Map();
  private _studentSchedules: Map<string, Map<string, string>> = new Map();
  private _conflicts: ConflictEvent[] = [];
  private _students: Student[] = [];
  private _courses: Course[] = [];
  private _completedStudents: Set<string> = new Set();
  private _satisfactionBoost: number = 0;

  get scheduledCourses(): ScheduledCourse[] {
    return Array.from(this._scheduledCourses.values());
  }

  get conflicts(): ConflictEvent[] {
    return [...this._conflicts];
  }

  get unresolvedConflicts(): ConflictEvent[] {
    return this._conflicts.filter(c => !c.resolved);
  }

  get students(): Student[] {
    return [...this._students];
  }

  get courses(): Course[] {
    return [...this._courses];
  }

  get completedStudents(): string[] {
    return Array.from(this._completedStudents);
  }

  get completedStudentCount(): number {
    return this._completedStudents.size;
  }

  init(students: Student[], courses: Course[]): void {
    this._students = students;
    this._courses = courses;
    this._scheduledCourses.clear();
    this._conflicts = [];
    this._completedStudents.clear();
    this._satisfactionBoost = 0;

    students.forEach(student => {
      student.schedule.clear();
      student.currentCredits = 0;
      this._studentSchedules.set(student.id, new Map());
    });
  }

  canPlaceCourse(course: Course, classroomId: string, weekday: Weekday, timeSlot: TimeSlot): { valid: boolean; reason?: string } {
    const classroom = TiledMapManager.getInstance().getClassroom(classroomId);
    if (!classroom) {
      return { valid: false, reason: '教室不存在' };
    }

    if (classroom.status === 'maintenance') {
      return { valid: false, reason: '教室维护中' };
    }

    if (!TiledMapManager.getInstance().isClassroomAvailable(classroomId, weekday, timeSlot)) {
      return { valid: false, reason: '该时间段教室已被占用' };
    }

    if (course.requiredEquipment) {
      const hasEquipment = course.requiredEquipment.every(eq => classroom.equipment.includes(eq));
      if (!hasEquipment) {
        return { valid: false, reason: '教室缺少必要设备' };
      }
    }

    if (classroom.capacity < course.capacity) {
      return { valid: false, reason: '教室容量不足' };
    }

    return { valid: true };
  }

  placeCourse(courseId: string, classroomId: string, weekday: Weekday, timeSlot: TimeSlot): boolean {
    const course = this._courses.find(c => c.id === courseId);
    if (!course) return false;

    const validation = this.canPlaceCourse(course, classroomId, weekday, timeSlot);
    if (!validation.valid) {
      this.createConflict(courseId, classroomId, weekday, timeSlot, validation.reason || '未知错误');
      return false;
    }

    const key = this.getScheduleKey(classroomId, weekday, timeSlot);
    const scheduled: ScheduledCourse = {
      courseId,
      classroomId,
      weekday,
      timeSlot,
      studentIds: [],
    };

    this._scheduledCourses.set(key, scheduled);
    TiledMapManager.getInstance().occupyClassroom(classroomId, weekday, timeSlot, courseId);

    this._students.forEach(student => {
      if (this.canStudentTakeCourse(student, course)) {
        this.assignCourseToStudent(student, course, key);
      }
    });

    EventBus.instance.emit(GameEvents.COURSE_PLACED, courseId, classroomId, weekday, timeSlot);
    AnalyticsService.getInstance().trackCoursePlaced(courseId, classroomId, weekday, timeSlot);

    this.checkStudentCompletion();
    this.maybeTriggerRandomConflict();

    return true;
  }

  private canStudentTakeCourse(student: Student, course: Course): boolean {
    if (student.currentCredits + course.credits > student.maxCredits) {
      return false;
    }

    if (student.requiredCourses.includes(course.id) || student.preferredCourses.includes(course.id)) {
      return true;
    }

    return false;
  }

  private assignCourseToStudent(student: Student, course: Course, scheduleKey: string): void {
    student.schedule.set(scheduleKey, course.id);
    student.currentCredits += course.credits;

    const studentSchedule = this._studentSchedules.get(student.id);
    if (studentSchedule) {
      studentSchedule.set(scheduleKey, course.id);
    }

    const scheduled = this._scheduledCourses.get(scheduleKey);
    if (scheduled && !scheduled.studentIds.includes(student.id)) {
      scheduled.studentIds.push(student.id);
    }
  }

  removeCourse(courseId: string): boolean {
    const keysToRemove: string[] = [];
    
    this._scheduledCourses.forEach((scheduled, key) => {
      if (scheduled.courseId === courseId) {
        keysToRemove.push(key);
      }
    });

    if (keysToRemove.length === 0) return false;

    keysToRemove.forEach(key => {
      const scheduled = this._scheduledCourses.get(key);
      if (scheduled) {
        TiledMapManager.getInstance().releaseClassroom(scheduled.classroomId, scheduled.weekday, scheduled.timeSlot);
        
        scheduled.studentIds.forEach(studentId => {
          const student = this._students.find(s => s.id === studentId);
          if (student) {
            student.schedule.delete(key);
            const course = this._courses.find(c => c.id === scheduled.courseId);
            if (course) {
              student.currentCredits -= course.credits;
            }
          }

          const studentSchedule = this._studentSchedules.get(studentId);
          if (studentSchedule) {
            studentSchedule.delete(key);
          }
        });

        this._scheduledCourses.delete(key);
      }
    });

    EventBus.instance.emit(GameEvents.COURSE_REMOVED, courseId);
    AnalyticsService.getInstance().trackCourseRemoved(courseId, keysToRemove.length > 0 ? this._scheduledCourses.get(keysToRemove[0])?.classroomId || '' : '');

    this._completedStudents.clear();
    this.checkStudentCompletion();

    return true;
  }

  private createConflict(courseId: string, classroomId: string, weekday: Weekday, timeSlot: TimeSlot, message: string): void {
    const conflict: ConflictEvent = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.determineConflictType(message),
      message,
      classroomId,
      courseId,
      weekday,
      timeSlot,
      resolved: false,
    };

    this._conflicts.push(conflict);
    TiledMapManager.getInstance().setClassroomStatus(classroomId, 'conflict');
    
    EventBus.instance.emit(GameEvents.CONFLICT_OCCURRED, conflict);
    AnalyticsService.getInstance().trackConflictOccurred(conflict.type, classroomId, courseId);
  }

  private determineConflictType(message: string): ConflictEvent['type'] {
    if (message.includes('占用')) return 'room_double_booked';
    if (message.includes('设备')) return 'equipment_missing';
    if (message.includes('容量')) return 'capacity_exceeded';
    if (message.includes('时间')) return 'time_overlap';
    return 'room_double_booked';
  }

  resolveConflict(conflictId: string): boolean {
    const conflict = this._conflicts.find(c => c.id === conflictId);
    if (!conflict || conflict.resolved) return false;

    conflict.resolved = true;
    
    if (conflict.classroomId) {
      const classroom = TiledMapManager.getInstance().getClassroom(conflict.classroomId);
      if (classroom && classroom.status === 'conflict') {
        TiledMapManager.getInstance().setClassroomStatus(conflict.classroomId, 'available');
      }
    }

    EventBus.instance.emit(GameEvents.CONFLICT_RESOLVED, conflictId);
    AnalyticsService.getInstance().trackConflictResolved(conflictId, 'manual');

    return true;
  }

  resolveAllConflicts(): number {
    let resolvedCount = 0;
    this._conflicts.forEach(conflict => {
      if (!conflict.resolved) {
        conflict.resolved = true;
        resolvedCount++;
        
        if (conflict.classroomId) {
          const classroom = TiledMapManager.getInstance().getClassroom(conflict.classroomId);
          if (classroom && classroom.status === 'conflict') {
            TiledMapManager.getInstance().setClassroomStatus(conflict.classroomId, 'available');
          }
        }
      }
    });

    if (resolvedCount > 0) {
      EventBus.instance.emit(GameEvents.CONFLICT_RESOLVED, 'all');
      AnalyticsService.getInstance().trackConflictResolved('all', 'item');
    }

    return resolvedCount;
  }

  private maybeTriggerRandomConflict(): void {
    const config = ConfigManager.getInstance().difficultyConfig;
    if (Math.random() > config.conflictFrequency) return;

    const scheduled = this._scheduledCourses.values();
    const randomScheduled = Array.from(scheduled)[Math.floor(Math.random() * this._scheduledCourses.size)];
    
    if (!randomScheduled) return;

    const conflictTypes = [
      { type: 'equipment_missing', message: '设备临时故障' },
      { type: 'maintenance', message: '教室临时维护' },
    ];

    const randomType = conflictTypes[Math.floor(Math.random() * conflictTypes.length)];
    this.createConflict(
      randomScheduled.courseId,
      randomScheduled.classroomId,
      randomScheduled.weekday,
      randomScheduled.timeSlot,
      randomType.message
    );
  }

  private checkStudentCompletion(): void {
    this._students.forEach(student => {
      if (this._completedStudents.has(student.id)) return;

      const hasAllRequired = student.requiredCourses.every(courseId => {
        return Array.from(this._scheduledCourses.values()).some(s => s.courseId === courseId && s.studentIds.includes(student.id));
      });

      const meetsCreditRequirement = student.currentCredits >= student.maxCredits * 0.8;

      if (hasAllRequired && meetsCreditRequirement) {
        this._completedStudents.add(student.id);
        EventBus.instance.emit(GameEvents.STUDENT_COMPLETED, student.id);
      }
    });
  }

  getStudentSatisfaction(studentId: string): number {
    const student = this._students.find(s => s.id === studentId);
    if (!student) return 0;

    let score = 0;
    let total = 0;

    student.requiredCourses.forEach(courseId => {
      total++;
      const hasCourse = Array.from(this._scheduledCourses.values()).some(
        s => s.courseId === courseId && s.studentIds.includes(studentId)
      );
      if (hasCourse) score++;
    });

    student.preferredCourses.forEach(courseId => {
      total++;
      const hasCourse = Array.from(this._scheduledCourses.values()).some(
        s => s.courseId === courseId && s.studentIds.includes(studentId)
      );
      if (hasCourse) score += 0.5;
    });

    const baseSatisfaction = total > 0 ? (score / total) * 100 : 0;
    return Math.min(100, baseSatisfaction + this._satisfactionBoost);
  }

  getAverageSatisfaction(): number {
    if (this._students.length === 0) return 0;
    
    const total = this._students.reduce((sum, s) => sum + this.getStudentSatisfaction(s.id), 0);
    return total / this._students.length;
  }

  boostSatisfaction(amount: number): void {
    this._satisfactionBoost = Math.min(20, this._satisfactionBoost + amount);
  }

  getScheduleQuality(): number {
    let score = 100;
    
    score -= this.unresolvedConflicts.length * 10;
    score -= this._students.filter(s => this.getStudentSatisfaction(s.id) < 50).length * 5;
    
    return Math.max(0, score);
  }

  isComplete(): boolean {
    return this._completedStudents.size >= this._students.length;
  }

  private getScheduleKey(classroomId: string, weekday: Weekday, timeSlot: TimeSlot): string {
    return `${classroomId}_${weekday}_${timeSlot}`;
  }

  reset(): void {
    this._scheduledCourses.clear();
    this._studentSchedules.clear();
    this._conflicts = [];
    this._completedStudents.clear();
    this._satisfactionBoost = 0;
    
    this._students.forEach(student => {
      student.schedule.clear();
      student.currentCredits = 0;
    });
  }
}
