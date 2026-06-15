import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Label, Textarea, StatusBadge } from "~/components/ui";
import { api } from "~/utils/api";

export const loader: LoaderFunction = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const slots = await api.timeslots.list({ date: today }).catch(() => []);
    return json({ slots: slots || [] });
  } catch (e) {
    return json({ slots: [] });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  try {
    const result = await api.appointments.create({ ...data, handler: "协调员" }).catch(() => ({}));
    if (result.appointment?._id) {
      return redirect(`/appointments/${result.appointment._id}`);
    }
    return json({ error: "创建失败", ...result }, { status: 400 });
  } catch (e) {
    return json({ error: "创建失败" }, { status: 500 });
  }
};

export default function NewAppointment() {
  const { slots } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    studentName: "",
    studentAge: 6,
    guardianName: "",
    guardianPhone: "",
    courseType: "",
    timeSlotId: "",
    source: "online",
    remark: "",
  });
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const availableSlots = slots.filter((s: any) => s.status !== "cancelled");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">录入预约</h1>
          <p className="text-sm text-gray-500 mt-1">录入青少年试听课程预约信息</p>
        </div>
      </div>

      <form method="post" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>学员信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>学员姓名 *</Label>
                <Input
                  name="studentName"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="请输入学员姓名"
                  required
                />
              </div>
              <div>
                <Label>学员年龄 *</Label>
                <Input
                  type="number"
                  name="studentAge"
                  min={3}
                  max={18}
                  value={form.studentAge}
                  onChange={(e) => setForm({ ...form, studentAge: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>监护人信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>监护人姓名 *</Label>
                <Input
                  name="guardianName"
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  placeholder="请输入监护人姓名"
                  required
                />
              </div>
              <div>
                <Label>联系电话 *</Label>
                <Input
                  name="guardianPhone"
                  type="tel"
                  value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  placeholder="请输入联系电话"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>课程时段</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>课程类型 *</Label>
                <Select
                  name="courseType"
                  value={form.courseType}
                  onChange={(e) => setForm({ ...form, courseType: e.target.value })}
                  required
                >
                  <option value="">请选择课程</option>
                  {Array.from(new Set(availableSlots.map((s: any) => s.courseType))).map((ct) => (
                    <option key={ct as string} value={ct as string}>{ct as string}</option>
                  ))}
                  <option value="钢琴">钢琴</option>
                  <option value="美术">美术</option>
                  <option value="英语">英语</option>
                  <option value="舞蹈">舞蹈</option>
                </Select>
              </div>
              <div>
                <Label>来源渠道</Label>
                <Select
                  name="source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  <option value="online">线上预约</option>
                  <option value="walk_in">到店咨询</option>
                  <option value="referral">转介绍</option>
                </Select>
              </div>
            </div>

            <div>
              <Label>选择日期</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div>
              <Label>选择时段 *</Label>
              {availableSlots.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border rounded-lg text-center">
                  当日暂无可预约时段
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map((slot: any) => (
                    <label
                      key={slot._id}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        form.timeSlotId === slot._id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${slot.status === "full" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="timeSlotId"
                        value={slot._id}
                        checked={form.timeSlotId === slot._id}
                        onChange={(e) => setForm({ ...form, timeSlotId: e.target.value })}
                        disabled={slot.status === "full"}
                        className="sr-only"
                        required
                      />
                      <div className="text-sm font-medium text-gray-900">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {slot.teacher} · {slot.classroom}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-500">
                          {slot.currentBookings}/{slot.capacityRuleId?.maxCapacity || 0}人
                        </span>
                        <StatusBadge status={slot.status} />
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="remark"
              rows={3}
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              placeholder="填写预约备注、特殊要求等..."
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end sticky bottom-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>取消</Button>
          <Button type="submit">提交预约</Button>
        </div>
      </form>
    </div>
  );
}
