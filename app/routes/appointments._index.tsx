import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Input, Select, Badge } from "~/components/ui";
import { api } from "~/utils/api";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query: Record<string, any> = {};
  ["status", "date", "courseType", "page", "limit"].forEach((k) => {
    const v = url.searchParams.get(k);
    if (v) query[k] = v;
  });
  try {
    const data = await api.appointments.list(query).catch(() => ({ appointments: [], total: 0, page: 1, totalPages: 1 }));
    return json({ ...data, appointments: data.appointments || [], total: data.total || 0 });
  } catch (e) {
    return json({ appointments: [], total: 0, page: 1, limit: 20, totalPages: 1 });
  }
};

export default function AppointmentsList() {
  const data = useLoaderData<typeof loader>();
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    courseType: "",
    keyword: "",
  });

  const filtered = data.appointments.filter((apt: any) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      return (
        apt.studentName.toLowerCase().includes(kw) ||
        apt.guardianPhone.includes(kw) ||
        apt.guardianName.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const exportXlsx = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.date) params.set("date", filters.date);
    if (filters.courseType) params.set("courseType", filters.courseType);
    window.location.href = `/api/analytics/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预约列表</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data.total} 条记录</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportXlsx}>📥 导出Excel</Button>
          <Link to="/appointments/new" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            + 新增预约
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="搜索学员、监护人、手机号..."
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            className="sm:max-w-xs"
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="sm:w-36"
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="checked_in">已签到</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="no_show">未到场</option>
          </Select>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="sm:w-44"
          />
          <Input
            placeholder="课程类型"
            value={filters.courseType}
            onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
            className="sm:w-36"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无预约记录</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学员</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">监护人</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时段</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((apt: any) => (
                  <tr key={apt._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{apt.studentName}</div>
                      <div className="text-xs text-gray-500">{apt.studentAge}岁</div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <div className="text-sm text-gray-900">{apt.guardianName}</div>
                      <div className="text-xs text-gray-500">{apt.guardianPhone}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <Badge variant="info">{apt.courseType}</Badge>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                      {apt.timeSlotId?.date} {apt.timeSlotId?.startTime}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {apt.source === "online" ? "线上" : apt.source === "walk_in" ? "到店" : "转介绍"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={apt.status} />
                        {apt.conflictId && <Badge variant="danger">有冲突</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/appointments/${apt._id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                        详情
                      </Link>
                    </td>
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
