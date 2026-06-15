let idCounter = 1000;
export function mockId(prefix = ""): string {
  idCounter += 1;
  return `${prefix}mock_${Date.now().toString(36)}_${idCounter}`;
}

export interface MockAppointment {
  _id: string;
  studentName: string;
  studentAge: number;
  guardianName: string;
  guardianPhone: string;
  courseType: string;
  timeSlotId: string;
  status: "pending" | "confirmed" | "cancelled" | "no_show";
  source: string;
  remark?: string;
  conflictId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTimeSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  teacher: string;
  classroom: string;
  courseType: string;
  capacityRuleId: string;
  maxCapacity: number;
  currentBookings: number;
  status: "available" | "full" | "closed";
  createdAt: Date;
}

export interface MockConflict {
  _id: string;
  type: "time_overlap" | "teacher_conflict" | "classroom_conflict" | "overcapacity";
  timeSlotId: string;
  affectedAppointmentIds: string[];
  affectedTimeSlotIds: string[];
  description: string;
  status: "detected" | "forwarded" | "supplemented" | "resolved";
  assignedTo?: string;
  assignedRole: "admin" | "coordinator" | "teacher";
  supplementNote?: string;
  supplementedBy?: string;
  supplementedAt?: Date;
  forwardedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface MockTimelineEvent {
  _id: string;
  appointmentId: string;
  eventType: string;
  handler: string;
  handlerRole: string;
  content?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Date;
}

export interface MockCapacityRule {
  _id: string;
  courseType: string;
  maxCapacity: number;
  overbookLimit: number;
  reminderThreshold: number;
  createdAt: Date;
}

export interface MockAttendance {
  _id: string;
  appointmentId: string;
  timeSlotId: string;
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: Date;
  note?: string;
  createdAt: Date;
}

const today = new Date();
const isoDate = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};

export const mockCapacityRules: MockCapacityRule[] = [
  { _id: "cap_piano", courseType: "钢琴", maxCapacity: 1, overbookLimit: 0, reminderThreshold: 1, createdAt: new Date() },
  { _id: "cap_paint", courseType: "绘画", maxCapacity: 8, overbookLimit: 2, reminderThreshold: 6, createdAt: new Date() },
  { _id: "cap_dance", courseType: "舞蹈", maxCapacity: 12, overbookLimit: 3, reminderThreshold: 10, createdAt: new Date() },
  { _id: "cap_english", courseType: "英语", maxCapacity: 6, overbookLimit: 1, reminderThreshold: 5, createdAt: new Date() },
  { _id: "cap_math", courseType: "数学思维", maxCapacity: 10, overbookLimit: 2, reminderThreshold: 8, createdAt: new Date() },
];

export const mockTimeSlots: MockTimeSlot[] = [
  { _id: "slot_1", date: isoDate(today), startTime: "09:00", endTime: "09:45", teacher: "王老师", classroom: "A101", courseType: "钢琴", capacityRuleId: "cap_piano", maxCapacity: 1, currentBookings: 1, status: "full", createdAt: new Date() },
  { _id: "slot_2", date: isoDate(today), startTime: "10:00", endTime: "11:30", teacher: "李老师", classroom: "B201", courseType: "绘画", capacityRuleId: "cap_paint", maxCapacity: 8, currentBookings: 5, status: "available", createdAt: new Date() },
  { _id: "slot_3", date: isoDate(today), startTime: "14:00", endTime: "15:30", teacher: "张老师", classroom: "C301", courseType: "舞蹈", capacityRuleId: "cap_dance", maxCapacity: 12, currentBookings: 8, status: "available", createdAt: new Date() },
  { _id: "slot_4", date: isoDate(today), startTime: "15:00", endTime: "16:30", teacher: "王老师", classroom: "A101", courseType: "钢琴", capacityRuleId: "cap_piano", maxCapacity: 1, currentBookings: 0, status: "available", createdAt: new Date() },
  { _id: "slot_5", date: isoDate(addDays(today, 1)), startTime: "09:30", endTime: "11:00", teacher: "陈老师", classroom: "D101", courseType: "英语", capacityRuleId: "cap_english", maxCapacity: 6, currentBookings: 4, status: "available", createdAt: new Date() },
  { _id: "slot_6", date: isoDate(addDays(today, 1)), startTime: "14:00", endTime: "15:30", teacher: "刘老师", classroom: "E201", courseType: "数学思维", capacityRuleId: "cap_math", maxCapacity: 10, currentBookings: 7, status: "available", createdAt: new Date() },
  { _id: "slot_7", date: isoDate(addDays(today, 2)), startTime: "10:00", endTime: "11:30", teacher: "李老师", classroom: "B201", courseType: "绘画", capacityRuleId: "cap_paint", maxCapacity: 8, currentBookings: 3, status: "available", createdAt: new Date() },
  { _id: "slot_8", date: isoDate(addDays(today, -1)), startTime: "14:00", endTime: "15:30", teacher: "张老师", classroom: "C301", courseType: "舞蹈", capacityRuleId: "cap_dance", maxCapacity: 12, currentBookings: 10, status: "available", createdAt: new Date() },
];

export const mockAppointments: MockAppointment[] = [
  { _id: "apt_1", studentName: "小明", studentAge: 7, guardianName: "明妈妈", guardianPhone: "13800138001", courseType: "钢琴", timeSlotId: "slot_1", status: "confirmed", source: "微信推荐", createdAt: addDays(today, -3), updatedAt: addDays(today, -3) },
  { _id: "apt_2", studentName: "小红", studentAge: 6, guardianName: "红爸爸", guardianPhone: "13800138002", courseType: "绘画", timeSlotId: "slot_2", status: "confirmed", source: "地推", createdAt: addDays(today, -2), updatedAt: addDays(today, -2) },
  { _id: "apt_3", studentName: "小刚", studentAge: 8, guardianName: "刚妈妈", guardianPhone: "13800138003", courseType: "舞蹈", timeSlotId: "slot_3", status: "pending", source: "朋友介绍", conflictId: "conflict_1", createdAt: addDays(today, -1), updatedAt: addDays(today, -1) },
  { _id: "apt_4", studentName: "小丽", studentAge: 5, guardianName: "丽妈妈", guardianPhone: "13800138004", courseType: "英语", timeSlotId: "slot_5", status: "confirmed", source: "线上广告", createdAt: addDays(today, -1), updatedAt: addDays(today, -1) },
  { _id: "apt_5", studentName: "小强", studentAge: 9, guardianName: "强爸爸", guardianPhone: "13800138005", courseType: "数学思维", timeSlotId: "slot_6", status: "confirmed", source: "微信推荐", createdAt: today, updatedAt: today },
  { _id: "apt_6", studentName: "小芳", studentAge: 7, guardianName: "芳妈妈", guardianPhone: "13800138006", courseType: "绘画", timeSlotId: "slot_2", status: "confirmed", source: "老学员推荐", createdAt: today, updatedAt: today },
  { _id: "apt_7", studentName: "小华", studentAge: 6, guardianName: "华爸爸", guardianPhone: "13800138007", courseType: "舞蹈", timeSlotId: "slot_3", status: "pending", source: "地推", conflictId: "conflict_1", createdAt: today, updatedAt: today },
  { _id: "apt_8", studentName: "小伟", studentAge: 8, guardianName: "伟妈妈", guardianPhone: "13800138008", courseType: "钢琴", timeSlotId: "slot_4", status: "confirmed", source: "朋友介绍", createdAt: today, updatedAt: today },
  { _id: "apt_9", studentName: "小娜", studentAge: 5, guardianName: "娜爸爸", guardianPhone: "13800138009", courseType: "英语", timeSlotId: "slot_5", status: "cancelled", source: "线上广告", remark: "家长有事改期", createdAt: addDays(today, -4), updatedAt: addDays(today, -2) },
  { _id: "apt_10", studentName: "小杰", studentAge: 7, guardianName: "杰妈妈", guardianPhone: "13800138010", courseType: "数学思维", timeSlotId: "slot_6", status: "confirmed", source: "微信推荐", createdAt: addDays(today, -2), updatedAt: addDays(today, -2) },
  { _id: "apt_11", studentName: "小萱", studentAge: 6, guardianName: "萱爸爸", guardianPhone: "13800138011", courseType: "绘画", timeSlotId: "slot_7", status: "confirmed", source: "老学员推荐", createdAt: today, updatedAt: today },
  { _id: "apt_12", studentName: "小浩", studentAge: 8, guardianName: "浩妈妈", guardianPhone: "13800138012", courseType: "舞蹈", timeSlotId: "slot_8", status: "no_show", source: "地推", createdAt: addDays(today, -5), updatedAt: addDays(today, -1) },
];

export const mockConflicts: MockConflict[] = [
  {
    _id: "conflict_1",
    type: "overcapacity",
    timeSlotId: "slot_3",
    affectedAppointmentIds: ["apt_3", "apt_7"],
    affectedTimeSlotIds: ["slot_3"],
    description: "舞蹈班今日 14:00-15:30 时段容量紧张（8/12，超售上限 3 人，接近提醒阈值），需协调员确认是否开放超售",
    status: "detected",
    assignedRole: "coordinator",
    createdAt: addDays(today, -1),
  },
];

export const mockTimeline: MockTimelineEvent[] = [
  { _id: "tl_1", appointmentId: "apt_1", eventType: "created", handler: "系统", handlerRole: "system", content: "预约创建：小明（7岁）-钢琴 今日 09:00-09:45 王老师 A101", createdAt: addDays(today, -3) },
  { _id: "tl_2", appointmentId: "apt_1", eventType: "status_changed", handler: "协调员A", handlerRole: "coordinator", previousValue: "pending", newValue: "confirmed", content: "预约确认，已发送提醒短信", createdAt: addDays(today, -2) },
  { _id: "tl_3", appointmentId: "apt_2", eventType: "created", handler: "协调员A", handlerRole: "coordinator", content: "预约创建：小红（6岁）-绘画", createdAt: addDays(today, -2) },
  { _id: "tl_4", appointmentId: "apt_3", eventType: "created", handler: "协调员B", handlerRole: "coordinator", content: "预约创建：小刚（8岁）-舞蹈", createdAt: addDays(today, -1) },
  { _id: "tl_5", appointmentId: "apt_3", eventType: "conflict_detected", handler: "system", handlerRole: "system", content: "检测到容量超限：舞蹈班今日 14:00-15:30 时段容量紧张。已转协调员处理，请确认归属后再继续。", newValue: "conflict_1", createdAt: addDays(today, -1) },
  { _id: "tl_6", appointmentId: "apt_7", eventType: "created", handler: "协调员B", handlerRole: "coordinator", content: "预约创建：小华（6岁）-舞蹈", createdAt: today },
  { _id: "tl_7", appointmentId: "apt_7", eventType: "conflict_detected", handler: "协调员B", handlerRole: "coordinator", content: "检测到容量超限：舞蹈班今日 14:00-15:30 时段容量紧张。已转协调员处理，请确认归属后再继续。", newValue: "conflict_1", createdAt: today },
  { _id: "tl_8", appointmentId: "apt_9", eventType: "created", handler: "协调员A", handlerRole: "coordinator", content: "预约创建：小娜（5岁）-英语", createdAt: addDays(today, -4) },
  { _id: "tl_9", appointmentId: "apt_9", eventType: "status_changed", handler: "协调员A", handlerRole: "coordinator", previousValue: "confirmed", newValue: "cancelled", content: "家长有事改期，已记录", createdAt: addDays(today, -2) },
  { _id: "tl_10", appointmentId: "apt_12", eventType: "created", handler: "协调员C", handlerRole: "coordinator", content: "预约创建：小浩（8岁）-舞蹈", createdAt: addDays(today, -5) },
  { _id: "tl_11", appointmentId: "apt_12", eventType: "status_changed", handler: "系统", handlerRole: "system", previousValue: "confirmed", newValue: "no_show", content: "未到场，系统自动标记", createdAt: addDays(today, -1) },
];

export const mockAttendance: MockAttendance[] = [
  { _id: "att_1", appointmentId: "apt_12", timeSlotId: "slot_8", status: "absent", note: "未请假缺席", createdAt: addDays(today, -1) },
  { _id: "att_2", appointmentId: "apt_9", timeSlotId: "slot_5", status: "excused", note: "家长请假", createdAt: addDays(today, -2) },
];

class MockStore {
  appointments: MockAppointment[] = [...mockAppointments];
  timeSlots: MockTimeSlot[] = [...mockTimeSlots];
  conflicts: MockConflict[] = [...mockConflicts];
  timeline: MockTimelineEvent[] = [...mockTimeline];
  capacityRules: MockCapacityRule[] = [...mockCapacityRules];
  attendance: MockAttendance[] = [...mockAttendance];

  reset() {
    this.appointments = [...mockAppointments];
    this.timeSlots = [...mockTimeSlots];
    this.conflicts = [...mockConflicts];
    this.timeline = [...mockTimeline];
    this.capacityRules = [...mockCapacityRules];
    this.attendance = [...mockAttendance];
  }
}

export const mockStore = new MockStore();

export function findSlot(slotId: string): MockTimeSlot | undefined {
  return mockStore.timeSlots.find((s) => s._id === slotId);
}

export function findApt(aptId: string): MockAppointment | undefined {
  return mockStore.appointments.find((a) => a._id === aptId);
}

export function addTimeline(evt: Omit<MockTimelineEvent, "_id" | "createdAt">): MockTimelineEvent {
  const event: MockTimelineEvent = {
    _id: mockId("tl_"),
    createdAt: new Date(),
    ...evt,
  };
  mockStore.timeline.push(event);
  return event;
}
