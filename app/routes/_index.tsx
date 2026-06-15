import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Card, CardHeader, CardTitle, CardContent, Badge, StatusBadge } from "~/components/ui";

export const loader: LoaderFunction = async () => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const [appointmentsRes, slotsRes, conflictsRes, attendanceRes] = await Promise.all([
      fetch(`http://localhost:3000/api/appointments?date=${today}&limit=100`).then((r) => r.json().catch(() => ({ appointments: [], total: 0 }))),
      fetch(`http://localhost:3000/api/timeslots?date=${today}`).then((r) => r.json().catch(() => [])),
      fetch("http://localhost:3000/api/conflicts?status=detected").then((r) => r.json().catch(() => [])),
      fetch("http://localhost:3000/api/analytics/attendance-rate").then((r) => r.json().catch(() => ({ total: 0, present: 0, rate: 0 }))),
    ]);
    return json({ today, appointments: appointmentsRes.appointments || [], total: appointmentsRes.total || 0, slots: slotsRes || [], conflicts: conflictsRes || [], attendance: attendanceRes || { total: 0, present: 0, rate: 0 } });
  } catch (e) {
    return json({ today, appointments: [], total: 0, slots: [], conflicts: [], attendance: { total: 0, present: 0, rate: 0 } });
  }
};

export default function Index() {
  const { today, appointments, total, slots, conflicts, attendance } = useLoaderData<typeof loader>();

  const statusCounts = appointments.reduce((acc: Record<string, number>, apt: any) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "今日预约", value: total, icon: "📋", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "待确认", value: statusCounts.pending || 0, icon: "⏳", color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "已确认", value: statusCounts.confirmed || 0, icon: "✅", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "已签到", value: statusCounts.checked_in || 0, icon: "✓", color: "text-green-600", bg: "bg-green-50" },
    { label: "待处理冲突", value: conflicts.length, icon: "⚠️", color: "text-red-600", bg: "bg-red-50" },
    { label: "到场率", value: `${attendance.rate || 0}%`, icon: "📊", color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">场状态看板</h1>
          <p className="text-sm text-gray-500 mt-1">{today} 实时状态概览</p>
        </div>
        <Link to="/appointments/new" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          ➕ 录入预约
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 sm:p-4">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                <span className={`text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>今日时段</CardTitle>
            <Link to="/calendar" className="text-sm text-indigo-600 hover:text-indigo-700">查看日历 →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {slots.length === 0 ? (
              <div className="p-8 text-center text-gray-500">今日暂无时段安排</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {slots.slice(0, 6).map((slot: any) => (
                  <div key={slot._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">{slot.startTime} - {slot.endTime}</div>
                      <Badge variant="info">{slot.courseType}</Badge>
                      <span className="text-sm text-gray-500">{slot.teacher} · {slot.classroom}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{slot.currentBookings}/{slot.capacityRuleId?.maxCapacity || 0}</span>
                      <StatusBadge status={slot.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>冲突待处理</CardTitle>
            <Link to="/conflicts" className="text-sm text-indigo-600 hover:text-indigo-700">全部 →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {conflicts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无待处理冲突</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conflicts.slice(0, 5).map((c: any) => (
                  <div key={c._id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-600">
                        {c.type === "overcapacity" ? "容量超限" : c.type === "teacher_conflict" ? "教师冲突" : c.type === "classroom_conflict" ? "教室冲突" : "时段重叠"}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最新预约</CardTitle>
          <Link to="/appointments" className="text-sm text-indigo-600 hover:text-indigo-700">查看全部 →</Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无预约记录</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学员</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">监护人</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时段</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.slice(0, 8).map((apt: any) => (
                  <tr key={apt._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/appointments/${apt._id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                        {apt.studentName} <span className="text-gray-400">({apt.studentAge}岁)</span>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-600">{apt.guardianName} {apt.guardianPhone}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">{apt.courseType}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                      {apt.timeSlotId?.date} {apt.timeSlotId?.startTime}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
