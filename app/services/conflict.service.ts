import { ConflictRecord, type IConflictRecord } from "~/models/ConflictRecord";
import { TimelineEvent } from "~/models/TimelineEvent";
import { connectDB } from "~/utils/db";

export async function getConflicts(filters: { status?: string; assignedRole?: string }) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.assignedRole) query.assignedRole = filters.assignedRole;
  return ConflictRecord.find(query)
    .populate("timeSlotId")
    .populate("affectedAppointmentIds")
    .sort({ createdAt: -1 });
}

export async function forwardConflict(id: string, assignedTo: string, assignedRole: IConflictRecord["assignedRole"]) {
  await connectDB();
  const conflict = await ConflictRecord.findByIdAndUpdate(
    id,
    { status: "forwarded", assignedTo, assignedRole },
    { new: true }
  );
  if (!conflict) throw new Response("Not found", { status: 404 });
  for (const aptId of conflict.affectedAppointmentIds) {
    await TimelineEvent.create({
      appointmentId: aptId,
      eventType: "conflict_detected",
      handler: "system",
      handlerRole: "system",
      content: `冲突已转派给 ${assignedTo}（${assignedRole}）处理`,
    });
  }
  return conflict;
}

export async function supplementConflict(id: string, supplementNote: string, handler: string) {
  await connectDB();
  const conflict = await ConflictRecord.findByIdAndUpdate(
    id,
    { status: "supplemented", supplementNote },
    { new: true }
  );
  if (!conflict) throw new Response("Not found", { status: 404 });
  for (const aptId of conflict.affectedAppointmentIds) {
    await TimelineEvent.create({
      appointmentId: aptId,
      eventType: "remark_added",
      handler,
      handlerRole: "coordinator",
      content: `冲突补说明：${supplementNote}`,
    });
  }
  return conflict;
}

export async function resolveConflict(id: string, resolvedBy: string) {
  await connectDB();
  const conflict = await ConflictRecord.findByIdAndUpdate(
    id,
    { status: "resolved", resolvedBy, resolvedAt: new Date() },
    { new: true }
  );
  if (!conflict) throw new Response("Not found", { status: 404 });
  for (const aptId of conflict.affectedAppointmentIds) {
    await TimelineEvent.create({
      appointmentId: aptId,
      eventType: "conflict_resolved",
      handler: resolvedBy,
      handlerRole: "admin",
      content: "冲突已解决",
    });
  }
  return conflict;
}
