import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, useFetcher, useParams } from "@remix-run/react";
import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Input, Select, Label, Textarea, Badge } from "~/components/ui";

export const loader: LoaderFunction = async ({ params }) => {
  try {
    const data = await fetch(`http://localhost:3000/api/appointments/${params.id}`).then((r) => r.json().catch(() => ({ appointment: null, timeline: [] })));
    return json(data || { appointment: null, timeline: [] });
  } catch (e) {
    return json({ appointment: null, timeline: [] });
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const id = params.id!;

  try {
    if (intent === "status") {
      const status = formData.get("status") as string;
      const remark = formData.get("remark") as string;
      await fetch(`http://localhost:3000/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remark, handler: "协调员" }),
      });
    } else if (intent === "remark") {
      const content = formData.get("content") as string;
      await fetch(`http://localhost:3000/api/appointments/${id}/remark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, handler: "协调员" }),
      });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: "操作失败" }, { status: 500 });
  }
};

const eventIcons: Record<string, string> = {
  created: "📝",
  status_changed: "🔄",
  remark_added: "💬",
  attachment_added: "📎",
  conflict_detected: "⚠️",
  conflict_resolved: "✅",
  handler_changed: "👤",
};

const eventLabels: Record<string, string> = {
  created: "创建预约",
  status_changed: "状态变更",
  remark_added: "添加备注",
  attachment_added: "上传附件",
  conflict_detected: "检测到冲突",
  conflict_resolved: "冲突已解决",
  handler_changed: "处理人变更",
};

export default function AppointmentDetail() {
  const { appointment, timeline } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const params = useParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [remark, setRemark] = useState("");
  const [statusForm, setStatusForm] = useState({ status: appointment?.status || "", remark: "" });
  const [uploading, setUploading] = useState(false);

  if (!appointment) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">预约记录不存在</CardContent>
      </Card>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("handler", "协调员");
    fd.append("handlerRole", "coordinator");
    try {
      await fetch(`/api/upload/appointment/${params.id}`, { method: "POST", body: fd });
    } catch (e) {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{appointment.studentName} <span className="text-gray-400 text-lg">({appointment.studentAge}岁)</span></h1>
          <p className="text-sm text-gray-500 mt-1">创建于 {new Date(appointment.createdAt).toLocaleString("zh-CN")}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">监护人</span>
                  <div className="font-medium text-gray-900">{appointment.guardianName}</div>
                </div>
                <div>
                  <span className="text-gray-500">联系电话</span>
                  <div className="font-medium text-gray-900">{appointment.guardianPhone}</div>
                </div>
                <div>
                  <span className="text-gray-500">课程类型</span>
                  <div className="font-medium text-gray-900">{appointment.courseType}</div>
                </div>
                <div>
                  <span className="text-gray-500">来源渠道</span>
                  <div className="font-medium text-gray-900">
                    {appointment.source === "online" ? "线上预约" : appointment.source === "walk_in" ? "到店咨询" : "转介绍"}
                  </div>
                </div>
              </div>
              {appointment.timeSlotId && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-500 text-sm">预约时段</span>
                  <div className="mt-1">
                    <Badge variant="info">{appointment.courseType}</Badge>
                    <span className="ml-2 text-sm text-gray-900">
                      {appointment.timeSlotId.date} {appointment.timeSlotId.startTime}-{appointment.timeSlotId.endTime}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      👨‍🏫 {appointment.timeSlotId.teacher} · 📍 {appointment.timeSlotId.classroom}
                    </div>
                  </div>
                </div>
              )}
              {appointment.remark && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-500 text-sm">备注</span>
                  <p className="mt-1 text-sm text-gray-700">{appointment.remark}</p>
                </div>
              )}
              {appointment.conflictId && (
                <div className="pt-3 border-t border-gray-100">
                  <Badge variant="danger">⚠️ 存在冲突</Badge>
                  <p className="mt-1 text-sm text-red-600">{appointment.conflictId.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>时间线</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {timeline.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">暂无时间线记录</div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-1">
                    {timeline.map((event: any) => (
                      <div key={event._id} className="relative pl-10 py-3">
                        <div className="absolute left-2 top-3.5 w-5 h-5 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs">
                          {eventIcons[event.eventType] || "📌"}
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm">{eventLabels[event.eventType] || event.eventType}</span>
                              <Badge variant="default">{event.handler} · {event.handlerRole}</Badge>
                            </div>
                            {event.content && <p className="text-sm text-gray-600 mt-1">{event.content}</p>}
                            {event.previousValue && event.newValue && (
                              <div className="text-xs text-gray-500 mt-1">
                                {event.previousValue} → <b>{event.newValue}</b>
                              </div>
                            )}
                            {event.attachmentUrl && (
                              <a href={event.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-1 text-sm text-indigo-600 hover:text-indigo-700">
                                📎 {event.attachmentName || "查看附件"}
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(event.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>更新状态</CardTitle>
            </CardHeader>
            <CardContent>
              <fetcher.Form method="post" className="space-y-3">
                <input type="hidden" name="intent" value="status" />
                <div>
                  <Label>状态</Label>
                  <Select
                    name="status"
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  >
                    <option value="pending">待确认</option>
                    <option value="confirmed">已确认</option>
                    <option value="checked_in">已签到</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                    <option value="no_show">未到场</option>
                  </Select>
                </div>
                <div>
                  <Label>备注说明</Label>
                  <Textarea
                    name="remark"
                    rows={2}
                    value={statusForm.remark}
                    onChange={(e) => setStatusForm({ ...statusForm, remark: e.target.value })}
                    placeholder="状态变更说明..."
                  />
                </div>
                <Button className="w-full">更新状态</Button>
              </fetcher.Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>添加备注</CardTitle>
            </CardHeader>
            <CardContent>
              <fetcher.Form method="post" className="space-y-3">
                <input type="hidden" name="intent" value="remark" />
                <Textarea
                  name="content"
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="填写备注信息..."
                  required
                />
                <Button className="w-full" variant="secondary">💬 添加备注</Button>
              </fetcher.Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>上传附件</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "上传中..." : "📎 选择文件上传"}
              </Button>
              <p className="text-xs text-gray-500 mt-2">支持图片、PDF、Office文档，最大10MB</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>附件列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {timeline.filter((e: any) => e.eventType === "attachment_added").length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">暂无附件</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {timeline
                    .filter((e: any) => e.eventType === "attachment_added")
                    .map((e: any) => (
                      <a
                        key={e._id}
                        href={e.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                      >
                        <span className="text-lg">📎</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{e.attachmentName}</div>
                          <div className="text-xs text-gray-500">{e.handler} · {new Date(e.createdAt).toLocaleDateString("zh-CN")}</div>
                        </div>
                      </a>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
