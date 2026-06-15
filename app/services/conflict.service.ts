import { ConflictRecord, type IConflictRecord } from "~/models/ConflictRecord";
import { TimelineEvent } from "~/models/TimelineEvent";
import { Appointment } from "~/models/Appointment";
import { connectDB, isDbMockMode } from "~/utils/db";
import { mockStore, addTimeline } from "~/utils/mock-store";

function normalizeIds(ids: any[]): string[] {
  return ids.map((id) => (typeof id === "string" ? id : id?.toString?.() ?? String(id)));
}

export async function getConflicts(filters: { status?: string; assignedRole?: string }) {
  if (isDbMockMode()) {
    let result = [...mockStore.conflicts];
    if (filters.status) result = result.filter((c) => c.status === filters.status);
    if (filters.assignedRole) result = result.filter((c) => c.assignedRole === filters.assignedRole);
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return result.map((conflict) => ({
      ...conflict,
      timeSlotId: mockStore.timeSlots.find((s) => s._id === conflict.timeSlotId) || conflict.timeSlotId,
      affectedAppointmentIds: conflict.affectedAppointmentIds.map(
        (id) => mockStore.appointments.find((a) => a._id === id) || id
      ),
      affectedTimeSlotIds: conflict.affectedTimeSlotIds.map(
        (id) => mockStore.timeSlots.find((s) => s._id === id) || id
      ),
    })) as any;
  }
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.assignedRole) query.assignedRole = filters.assignedRole;
  return ConflictRecord.find(query)
    .populate("timeSlotId")
    .populate("affectedAppointmentIds")
    .populate("affectedTimeSlotIds")
    .sort({ createdAt: -1 });
}

export async function forwardConflict(
  id: string,
  assignedTo: string,
  assignedRole: IConflictRecord["assignedRole"]
) {
  if (isDbMockMode()) {
    const conflict = mockStore.conflicts.find((c) => c._id === id);
    if (!conflict) throw new Response("Not found", { status: 404 });
    const previousStatus = conflict.status;
    conflict.status = "forwarded";
    conflict.assignedTo = assignedTo;
    conflict.assignedRole = assignedRole;
    conflict.forwardedAt = new Date();

    const roleLabel = {
      admin: "管理员",
      coordinator: "协调员",
      teacher: "教师",
      system: "系统",
    }[assignedRole];

    for (const aptId of conflict.affectedAppointmentIds) {
      addTimeline({
        appointmentId: aptId,
        eventType: "handler_changed",
        handler: assignedTo,
        handlerRole: assignedRole,
        content: `冲突已转派：协调员将此冲突转派给【${assignedTo}】（${roleLabel}）处理，请等待确认归属。冲突ID：${conflict._id}`,
        previousValue: previousStatus,
        newValue: "forwarded",
      });
    }

    return conflict as any;
  }
  await connectDB();
  const conflict = await ConflictRecord.findByIdAndUpdate(
    id,
    { status: "forwarded", assignedTo, assignedRole, forwardedAt: new Date() },
    { new: true }
  );
  if (!conflict) throw new Response("Not found", { status: 404 });

  const aptIds = normalizeIds(conflict.affectedAppointmentIds);
  const roleLabel = {
    admin: "管理员",
    coordinator: "协调员",
    teacher: "教师",
    system: "系统",
  }[assignedRole];

  await Promise.all(
    aptIds.map((aptId) =>
      TimelineEvent.create({
        appointmentId: aptId,
        eventType: "handler_changed",
        handler: assignedTo,
        handlerRole: assignedRole,
        content: `冲突已转派：协调员将此冲突转派给【${assignedTo}】（${roleLabel}）处理，请等待确认归属。冲突ID：${conflict._id}`,
        previousValue: conflict.status,
        newValue: "forwarded",
      })
    )
  );

  return conflict;
}

export async function supplementConflict(
  id: string,
  supplementNote: string,
  handler: string
) {
  if (isDbMockMode()) {
    const conflict = mockStore.conflicts.find((c) => c._id === id);
    if (!conflict) throw new Response("Not found", { status: 404 });
    conflict.status = "supplemented";
    conflict.supplementNote = supplementNote;
    conflict.supplementedAt = new Date();
    conflict.supplementedBy = handler;

    const typeLabel: Record<string, string> = {
      overcapacity: "容量超限",
      teacher_conflict: "教师冲突",
      classroom_conflict: "教室冲突",
      time_overlap: "时段重叠",
    };

    for (const aptId of conflict.affectedAppointmentIds) {
      addTimeline({
        appointmentId: aptId,
        eventType: "remark_added",
        handler,
        handlerRole: "coordinator",
        content: `冲突补充说明（${typeLabel[conflict.type] || conflict.type}）：${supplementNote} — 请根据说明调整排期或改期`,
      });
    }

    return conflict as any;
  }
  await connectDB();
  const conflict = await ConflictRecord.findByIdAndUpdate(
    id,
    { status: "supplemented", supplementNote, supplementedAt: new Date(), supplementedBy: handler },
    { new: true }
  );
  if (!conflict) throw new Response("Not found", { status: 404 });

  const aptIds = normalizeIds(conflict.affectedAppointmentIds);
  const typeLabel: Record<string, string> = {
    overcapacity: "容量超限",
    teacher_conflict: "教师冲突",
    classroom_conflict: "教室冲突",
    time_overlap: "时段重叠",
  };

  await Promise.all(
    aptIds.map((aptId) =>
      TimelineEvent.create({
        appointmentId: aptId,
        eventType: "remark_added",
        handler,
        handlerRole: "coordinator",
        content: `冲突补充说明（${typeLabel[conflict.type] || conflict.type}）：${supplementNote} — 请根据说明调整排期或改期`,
      })
    )
  );

  return conflict;
}

export async function resolveConflict(id: string, resolvedBy: string) {
  if (isDbMockMode()) {
    const conflict = mockStore.conflicts.find((c) => c._id === id);
    if (!conflict) throw new Response("Not found", { status: 404 });
    const previousStatus = conflict.status;
    conflict.status = "resolved";
    conflict.resolvedBy = resolvedBy;
    conflict.resolvedAt = new Date();

    for (const aptId of conflict.affectedAppointmentIds) {
      addTimeline({
        appointmentId: aptId,
        eventType: "conflict_resolved",
        handler: resolvedBy,
        handlerRole: "admin",
        content: `冲突已解决：归属已确认。处理人：${resolvedBy}。原冲突描述：${conflict.description}`,
        previousValue: previousStatus,
        newValue: "resolved",
      });

      const apt = mockStore.appointments.find((a) => a._id === aptId);
      if (apt && apt.status === "pending") {
        apt.status = "confirmed";
        apt.conflictId = undefined;
        (apt.updatedAt as Date) = new Date();
      }
    }

    return conflict as any;
  }
  await connectDB();
  const conflict = await ConflictRecord.findByIdAndUpdate(
    id,
    { status: "resolved", resolvedBy, resolvedAt: new Date() },
    { new: true }
  );
  if (!conflict) throw new Response("Not found", { status: 404 });

  const aptIds = normalizeIds(conflict.affectedAppointmentIds);

  await Promise.all([
    ...aptIds.map((aptId) =>
      TimelineEvent.create({
        appointmentId: aptId,
        eventType: "conflict_resolved",
        handler: resolvedBy,
        handlerRole: "admin",
        content: `冲突已解决：归属已确认。处理人：${resolvedBy}。原冲突描述：${conflict.description}`,
        previousValue: conflict.status,
        newValue: "resolved",
      })
    ),
    Appointment.updateMany(
      { _id: { $in: aptIds }, status: "pending" },
      { $unset: { conflictId: 1 }, $set: { status: "confirmed" } }
    ),
  ]);

  return conflict;
}
