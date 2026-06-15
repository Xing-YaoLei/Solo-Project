import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Select, Label, Input, Textarea, Modal, Badge } from "~/components/ui";

export const loader: LoaderFunction = async () => {
  try {
    const conflicts = await fetch("http://localhost:3000/api/conflicts").then((r) => r.json().catch(() => []));
    return json({ conflicts: conflicts || [] });
  } catch (e) {
    return json({ conflicts: [] });
  }
};

const typeLabels: Record<string, { label: string; color: string }> = {
  time_overlap: { label: "时段重叠", color: "bg-orange-100 text-orange-700" },
  teacher_conflict: { label: "教师冲突", color: "bg-purple-100 text-purple-700" },
  classroom_conflict: { label: "教室冲突", color: "bg-pink-100 text-pink-700" },
  overcapacity: { label: "容量超限", color: "bg-red-100 text-red-700" },
};

export default function Conflicts() {
  const { conflicts } = useLoaderData<typeof loader>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [showForward, setShowForward] = useState(false);
  const [showSupplement, setShowSupplement] = useState(false);
  const [forwardForm, setForwardForm] = useState({ assignedTo: "", assignedRole: "coordinator" as const });
  const [supplementNote, setSupplementNote] = useState("");

  const filtered = conflicts.filter((c: any) => statusFilter === "all" || c.status === statusFilter);

  const handleForward = async () => {
    if (!selected) return;
    await fetch(`/api/conflicts/${selected._id}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardForm),
    });
    setShowForward(false);
    window.location.reload();
  };

  const handleSupplement = async () => {
    if (!selected) return;
    await fetch(`/api/conflicts/${selected._id}/supplement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplementNote, handler: "协调员" }),
    });
    setShowSupplement(false);
    window.location.reload();
  };

  const handleResolve = async () => {
    if (!selected) return;
    await fetch(`/api/conflicts/${selected._id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolvedBy: "管理员" }),
    });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">冲突处理</h1>
          <p className="text-sm text-gray-500 mt-1">管理预约冲突，共 {filtered.length} 条记录</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
              <option value="all">全部状态</option>
              <option value="detected">已检测</option>
              <option value="forwarded">已转派</option>
              <option value="supplemented">已补说明</option>
              <option value="resolved">已解决</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">暂无冲突记录</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c: any) => (
            <Card key={c._id}>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeLabels[c.type]?.color || "bg-gray-100 text-gray-700"}`}>
                      {typeLabels[c.type]?.label || c.type}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-gray-500">
                    检测于 {new Date(c.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">{c.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {c.timeSlotId && (
                    <div>
                      <span className="text-gray-500">关联时段</span>
                      <div className="text-gray-900">
                        {c.timeSlotId.date} {c.timeSlotId.startTime}-{c.timeSlotId.endTime} · {c.timeSlotId.courseType}
                      </div>
                    </div>
                  )}
                  {c.assignedTo && (
                    <div>
                      <span className="text-gray-500">处理人</span>
                      <div className="text-gray-900">{c.assignedTo} ({c.assignedRole})</div>
                    </div>
                  )}
                </div>

                {c.affectedAppointmentIds && c.affectedAppointmentIds.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">受影响预约 ({c.affectedAppointmentIds.length})</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {c.affectedAppointmentIds.slice(0, 5).map((apt: any) => (
                        <Link
                          key={apt._id}
                          to={`/appointments/${apt._id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded"
                        >
                          {apt.studentName}
                        </Link>
                      ))}
                      {c.affectedAppointmentIds.length > 5 && (
                        <Badge>+{c.affectedAppointmentIds.length - 5}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {c.supplementNote && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <span className="text-xs text-yellow-700 font-medium">补充说明</span>
                    <p className="text-sm text-yellow-800 mt-1">{c.supplementNote}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  {c.status === "detected" && (
                    <Button size="sm" onClick={() => { setSelected(c); setShowForward(true); }}>转派处理</Button>
                  )}
                  {(c.status === "detected" || c.status === "forwarded") && (
                    <Button size="sm" variant="secondary" onClick={() => { setSelected(c); setShowSupplement(true); }}>补说明</Button>
                  )}
                  {(c.status === "forwarded" || c.status === "supplemented") && (
                    <Button size="sm" variant="primary" onClick={() => { setSelected(c); handleResolve(); }}>确认解决</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForward} onClose={() => setShowForward(false)} title="转派冲突">
        <div className="space-y-4">
          <div>
            <Label>转派给</Label>
            <Input
              value={forwardForm.assignedTo}
              onChange={(e) => setForwardForm({ ...forwardForm, assignedTo: e.target.value })}
              placeholder="处理人姓名"
            />
          </div>
          <div>
            <Label>角色</Label>
            <Select
              value={forwardForm.assignedRole}
              onChange={(e) => setForwardForm({ ...forwardForm, assignedRole: e.target.value as any })}
            >
              <option value="coordinator">协调员</option>
              <option value="teacher">教师</option>
              <option value="admin">管理员</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForward(false)}>取消</Button>
            <Button onClick={handleForward}>确认转派</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showSupplement} onClose={() => setShowSupplement(false)} title="补充说明">
        <div className="space-y-4">
          <div>
            <Label>补充说明内容</Label>
            <Textarea
              rows={4}
              value={supplementNote}
              onChange={(e) => setSupplementNote(e.target.value)}
              placeholder="请详细描述冲突情况和处理建议..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSupplement(false)}>取消</Button>
            <Button onClick={handleSupplement}>提交</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
