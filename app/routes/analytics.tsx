import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Label } from "~/components/ui";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const courseType = url.searchParams.get("courseType") || "";

  try {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (courseType) params.set("courseType", courseType);

    const data = await fetch(`http://localhost:3000/api/analytics/attendance-rate?${params.toString()}`)
      .then((r) => r.json().catch(() => ({ total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 })));
    return json({ data: data || { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 }, filters: { startDate, endDate, courseType } });
  } catch (e) {
    return json({ data: { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 }, filters: { startDate: "", endDate: "", courseType: "" } });
  }
};

export default function Analytics() {
  const { data, filters } = useLoaderData<typeof loader>();
  const [form, setForm] = useState(filters);

  const exportXlsx = () => {
    const params = new URLSearchParams();
    if (form.startDate) params.set("startDate", form.startDate);
    if (form.endDate) params.set("endDate", form.endDate);
    if (form.courseType) params.set("courseType", form.courseType);
    window.location.href = `/api/analytics/export?${params.toString()}`;
  };

  const applyFilter = () => {
    const params = new URLSearchParams();
    if (form.startDate) params.set("startDate", form.startDate);
    if (form.endDate) params.set("endDate", form.endDate);
    if (form.courseType) params.set("courseType", form.courseType);
    window.location.href = `/analytics?${params.toString()}`;
  };

  const stats = [
    { label: "总人次", value: data.total, color: "text-gray-700", bg: "bg-gray-100", icon: "👥" },
    { label: "到场", value: data.present, color: "text-green-700", bg: "bg-green-100", icon: "✅" },
    { label: "迟到", value: data.late, color: "text-yellow-700", bg: "bg-yellow-100", icon: "⏰" },
    { label: "请假", value: data.excused, color: "text-blue-700", bg: "bg-blue-100", icon: "📝" },
    { label: "缺勤", value: data.absent, color: "text-red-700", bg: "bg-red-100", icon: "❌" },
  ];

  const maxValue = Math.max(data.total, 1);
  const segments = [
    { label: "到场", value: data.present + data.late, color: "bg-green-500" },
    { label: "请假", value: data.excused, color: "bg-blue-500" },
    { label: "缺勤", value: data.absent, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
          <p className="text-sm text-gray-500 mt-1">到场率分析与批量导出</p>
        </div>
        <Button variant="secondary" onClick={exportXlsx}>📥 导出Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label>课程类型</Label>
              <Input
                placeholder="全部课程"
                value={form.courseType}
                onChange={(e) => setForm({ ...form, courseType: e.target.value })}
              />
            </div>
            <div className="sm:self-end">
              <Button onClick={applyFilter}>应用筛选</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>到场率概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${data.rate * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{data.rate}%</span>
                  <span className="text-sm text-gray-500">到场率</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">分布</span>
                  <span className="text-gray-900 font-medium">共 {data.total} 人次</span>
                </div>
                <div className="h-6 rounded-lg overflow-hidden flex">
                  {segments.map((seg) => (
                    <div
                      key={seg.label}
                      className={`${seg.color} h-full flex items-center justify-center text-white text-xs font-medium transition-all`}
                      style={{ width: `${(seg.value / maxValue) * 100}%`, minWidth: seg.value > 0 ? "40px" : "0" }}
                      title={`${seg.label}: ${seg.value}`}
                    >
                      {seg.value > 0 ? seg.value : ""}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5 text-sm">
                      <span className={`w-3 h-3 rounded ${seg.color}`} />
                      <span className="text-gray-600">{seg.label}: {seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                <span className={`text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>批量操作</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="text-lg mb-1">📥</div>
            <div className="font-medium text-gray-900">导出预约记录</div>
            <p className="text-sm text-gray-500 mt-1">导出当前筛选条件下的所有预约数据为Excel</p>
            <Button size="sm" className="mt-3" variant="secondary" onClick={exportXlsx}>立即导出</Button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="text-lg mb-1">📊</div>
            <div className="font-medium text-gray-900">到场率报表</div>
            <p className="text-sm text-gray-500 mt-1">按课程、日期维度统计到场率情况</p>
            <Button size="sm" className="mt-3" variant="secondary">生成报表</Button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="text-lg mb-1">📈</div>
            <div className="font-medium text-gray-900">趋势分析</div>
            <p className="text-sm text-gray-500 mt-1">查看预约量、到场率的周/月趋势</p>
            <Button size="sm" className="mt-3" variant="secondary">查看趋势</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
