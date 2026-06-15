import { _decorator } from 'cc';
import { Singleton } from '../core/Singleton';
import { Course, Student, CourseType } from '../types';
import { ConfigManager } from '../config/ConfigManager';
const { ccclass } = _decorator;

const COURSE_NAMES: Record<CourseType, string[]> = {
  required: ['高等数学', '大学英语', '马克思主义原理', '计算机基础', '大学物理', '线性代数'],
  elective: ['心理学导论', '艺术鉴赏', '经济学基础', '摄影技巧', '音乐欣赏', '演讲与口才'],
  lab: ['程序设计实验', '物理实验', '化学实验', '生物实验', '数据结构实验', '操作系统实验'],
  pe: ['篮球', '足球', '羽毛球', '乒乓球', '瑜伽', '太极拳'],
};

const TEACHER_NAMES = ['张教授', '李老师', '王讲师', '刘副教授', '陈教授', '杨老师', '周讲师', '吴副教授'];

const MAJORS = ['计算机科学', '电子工程', '机械工程', '土木工程', '经济学', '管理学', '文学', '物理学'];

const STUDENT_NAMES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑伟', '王芳', '李娜', '刘强', '陈静', '杨洋', '黄磊', '周敏',
  '吴涛', '郑丽', '孙浩', '马超', '朱婷', '胡歌', '郭靖', '黄蓉',
  '杨过', '小龙女', '张无忌', '赵敏', '周芷若', '宋青书', '韦一笑', '杨逍',
];

@ccclass('DataGenerator')
export class DataGenerator extends Singleton<DataGenerator> {
  private _usedNames: Set<string> = new Set();

  generateCourses(count: number): Course[] {
    const courses: Course[] = [];
    const types: CourseType[] = ['required', 'elective', 'lab', 'pe'];
    
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const typeNames = COURSE_NAMES[type];
      const nameIndex = Math.floor(i / types.length) % typeNames.length;
      
      const course: Course = {
        id: `course_${i + 1}`,
        name: typeNames[nameIndex],
        teacher: TEACHER_NAMES[i % TEACHER_NAMES.length],
        type,
        credits: type === 'lab' ? 2 : type === 'pe' ? 1 : 3,
        hours: type === 'lab' ? 4 : type === 'pe' ? 2 : 3,
        capacity: type === 'lab' ? 30 : type === 'pe' ? 50 : 60,
        color: this.getCourseColor(type),
        requiredEquipment: this.getRequiredEquipment(type),
      };
      
      courses.push(course);
    }
    
    return this.shuffleArray(courses);
  }

  generateStudents(count: number, allCourses: Course[]): Student[] {
    const students: Student[] = [];
    const availableNames = [...STUDENT_NAMES].filter(n => !this._usedNames.has(n));
    
    for (let i = 0; i < count; i++) {
      const name = availableNames[i % availableNames.length] || `学生${i + 1}`;
      this._usedNames.add(name);
      
      const major = MAJORS[i % MAJORS.length];
      const year = (i % 4) + 1;
      
      const requiredCourses = allCourses
        .filter(c => c.type === 'required')
        .slice(0, 3)
        .map(c => c.id);
      
      const shuffledElectives = this.shuffleArray(allCourses.filter(c => c.type !== 'required'));
      const preferredCourses = shuffledElectives
        .slice(0, 4)
        .map(c => c.id);
      
      const maxCredits = 15 + (i % 3) * 5;
      
      const student: Student = {
        id: `student_${i + 1}`,
        name,
        major,
        year,
        requiredCourses,
        preferredCourses,
        maxCredits,
        currentCredits: 0,
        schedule: new Map(),
      };
      
      students.push(student);
    }
    
    return this.shuffleArray(students);
  }

  generateForDifficulty(): { courses: Course[]; students: Student[] } {
    const config = ConfigManager.getInstance().difficultyConfig;
    const courses = this.generateCourses(config.courseCount);
    const students = this.generateStudents(config.studentCount, courses);
    return { courses, students };
  }

  private getCourseColor(type: CourseType): string {
    const colors: Record<CourseType, string> = {
      required: '#4A90D9',
      elective: '#50C878',
      lab: '#E67E22',
      pe: '#E74C3C',
    };
    return colors[type];
  }

  private getRequiredEquipment(type: CourseType): string[] {
    const equipment: Record<CourseType, string[]> = {
      required: ['projector', 'blackboard'],
      elective: ['projector'],
      lab: ['computers', 'projector'],
      pe: ['sports_equipment'],
    };
    return equipment[type];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  reset(): void {
    this._usedNames.clear();
  }
}
