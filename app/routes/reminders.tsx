import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Input, Select, Badge } from "~/components/ui";
import { api } from "~/utils/api";

export const loader: LoaderFunction = async () => {
  try {
    const reminders = await api.attendance.reminder().catch(() => []);
    return json({ reminders: reminders || [] });
  } catch (e) {
    return json({ reminders: [] });
  }
};

export default function Reminders() {
  const { reminders } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const fetcher = useFetcher();

  const filtered = reminders.filter((r: any) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(kw) ||
        r.guardianPhone.includes(kw) ||
        r.courseType.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const updateStatus = (id: string, status: string) => {
    fetcher.submit({ status, handler: "协调员" }, { method: "PATCH", action: `/api/appointments/${id}/status` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">提醒名单</h1>
        <p className="text-sm text-gray-500 mt-1">24小时内待提醒的预约 ({filtered.length})</p>
      </div>

      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="搜索学员、手机号、课程..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-40">
            <option value="all">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-gray-500">
              暂无需要提醒的预约
            </CardContent>
          </Card>
        ) : (
          filtered.map((r: any) => (
            <Card key={r._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link to={`/appointments/${r._id}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                      {r.studentName} <span className="text-sm text-gray-400">({r.studentAge}岁)</span>
                    </Link>
                    <div className="text-sm text-gray-500 mt-0.5">{r.guardianName} · {r.guardianPhone}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="info">{r.courseType}</Badge>
                    <span className="text-gray-500">{r.source === "online" ? "线上" : r.source === "walk_in" ? "到店" : "转介绍"}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1.5">
                    <span>📅</span>
                    {r.timeSlotId?.date} {r.timeSlotId?.startTime}-{r.timeSlotId?.endTime}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1.5">
                    <span>👨‍🏫</span>
                    {r.timeSlotId?.teacher} · {r.timeSlotId?.classroom}
                  </div>
                </div>

                <div className="flex gap-2">
                  {r.status === "pending" && (
                    <Button size="sm" onClick={() => updateStatus(r._id, "confirmed")}>确认</Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(r._id, "cancelled")}>取消</Button>
                  <Link to={`/appointments/${r._id}`} className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    详情
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
