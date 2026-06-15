import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Input, Select, Badge } from "~/components/ui";

export const loader: LoaderFunction = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const appointments = await fetch(`http://localhost:3000/api/appointments?date=${today}&limit=100`).then((r) => r.json().catch(() => ({ appointments: [] })));
    return json({ appointments: appointments.appointments || [] });
  } catch (e) {
    return json({ appointments: [] });
  }
};

export default function CheckIn() {
  const { appointments } = useLoaderData<typeof loader>();
  const [keyword, setKeyword] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const filtered = appointments.filter((apt: any) => {
    if (!["pending", "confirmed"].includes(apt.status)) return false;
    if (courseFilter !== "all" && apt.courseType !== courseFilter) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      return (
        apt.studentName.toLowerCase().includes(kw) ||
        apt.guardianPhone.includes(kw)
      );
    }
    return true;
  });

  const courseTypes = Array.from(new Set(appointments.map((a: any) => a.courseType)));

  const doCheckIn = async (apt: any, status: "present" | "absent" | "late" | "excused") => {
    setCheckingIn(apt._id);
    try {
      await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apt._id,
          timeSlotId: apt.timeSlotId?._id,
          status,
          checkedInBy: "前台",
        }),
      });
      window.location.reload();
    } finally {
      setCheckingIn(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">快速签到</h1>
        <p className="text-sm text-gray-500 mt-1">今日待签到 {filtered.length} 人</p>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <Input
            placeholder="搜索姓名或手机号..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">全部课程</option>
            {courseTypes.map((ct) => (
              <option key={ct as string} value={ct as string}>{ct as string}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            暂无待签到预约
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt: any) => (
            <Card key={apt._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 text-base">
                      {apt.studentName} <span className="text-sm text-gray-400">({apt.studentAge}岁)</span>
                    </div>
                    <div className="text-sm text-gray-500">{apt.guardianName} · {apt.guardianPhone}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="info">{apt.courseType}</Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {apt.timeSlotId?.startTime}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <span>📍</span>
                  {apt.timeSlotId?.classroom} · {apt.timeSlotId?.teacher}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <Button
                    size="sm"
                    onClick={() => doCheckIn(apt, "present")}
                    disabled={checkingIn === apt._id}
                  >
                    ✅ 到场
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => doCheckIn(apt, "late")}
                    disabled={checkingIn === apt._id}
                  >
                    ⏰ 迟到
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => doCheckIn(apt, "excused")}
                    disabled={checkingIn === apt._id}
                  >
                    📝 请假
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => doCheckIn(apt, "absent")}
                    disabled={checkingIn === apt._id}
                  >
                    ❌ 缺勤
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
