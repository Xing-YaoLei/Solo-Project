import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, StatusBadge, Input, Select, Label, Modal } from "~/components/ui";
import { api } from "~/utils/api";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  let slots: any[] = [];
  let capacityRules: any[] = [];

  try {
    if (startDate && endDate) {
      slots = await api.timeslots.range(startDate, endDate).catch(() => []);
    } else {
      slots = await api.timeslots.list({ date }).catch(() => []);
    }
    capacityRules = await api.capacity.list().catch(() => []);
  } catch (e) {}

  return json({ date, slots: slots || [], capacityRules: capacityRules || [] });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  try {
    const res = await api.timeslots.create(data).catch(() => ({}));
    return json(res);
  } catch (e) {
    return json({ error: "创建失败" }, { status: 500 });
  }
};

export default function CalendarPage() {
  const { date, slots, capacityRules } = useLoaderData<typeof loader>();
  const [selectedDate, setSelectedDate] = useState(date);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const fetcher = useFetcher();
  const [slotForm, setSlotForm] = useState({
    date: selectedDate,
    startTime: "09:00",
    endTime: "10:30",
    courseType: "",
    teacher: "",
    classroom: "",
    capacityRuleId: "",
  });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    courseType: "",
    maxCapacity: 10,
    overbookLimit: 2,
    reminderThreshold: 80,
    isActive: true,
    description: "",
  });

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const getWeekDates = () => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(monday);
      nd.setDate(monday.getDate() + i);
      return nd.toISOString().split("T")[0];
    });
  };
  const weekDates = getWeekDates();

  const groupedSlots = weekDates.reduce((acc: Record<string, any[]>, d) => {
    acc[d] = slots.filter((s: any) => s.date === d);
    return acc;
  }, {});

  const createSlot = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(slotForm, { method: "POST" });
    setShowSlotModal(false);
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleForm),
      });
      setShowRuleModal(false);
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日历时段</h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理课程时段及容量规则</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRuleModal(true)}>容量规则</Button>
          <Button onClick={() => setShowSlotModal(true)}>+ 新增时段</Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 7);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}>← 上周</Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-[180px]"
            />
            <Button variant="ghost" size="sm" onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 7);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}>下周 →</Button>
          </div>

          <div className="hidden md:grid md:grid-cols-7 gap-2">
            {weekDates.map((d, i) => {
              const isToday = d === new Date().toISOString().split("T")[0];
              return (
                <div key={d} className="space-y-2">
                  <div className={`text-center py-2 rounded-lg ${isToday ? "bg-indigo-50" : ""}`}>
                    <div className="text-xs text-gray-500">{weekDays[i]}</div>
                    <div className={`text-sm font-semibold ${isToday ? "text-indigo-600" : "text-gray-900"}`}>
                      {d.slice(5)}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {(groupedSlots[d] || []).map((slot: any) => (
                      <div
                        key={slot._id}
                        className={`p-2 rounded-lg border text-xs ${
                          slot.status === "full"
                            ? "bg-red-50 border-red-200"
                            : slot.status === "cancelled"
                            ? "bg-gray-100 border-gray-200 opacity-60"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="font-medium text-gray-900">{slot.startTime}-{slot.endTime}</div>
                        <div className="text-gray-600 truncate">{slot.courseType}</div>
                        <div className="text-gray-500 truncate">{slot.teacher}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-gray-500">
                            {slot.currentBookings}/{slot.capacityRuleId?.maxCapacity || 0}
                          </span>
                          <StatusBadge status={slot.status} />
                        </div>
                      </div>
                    ))}
                    {(!groupedSlots[d] || groupedSlots[d].length === 0) && (
                      <div className="p-4 text-center text-xs text-gray-400 rounded-lg border border-dashed border-gray-200">
                        无时段
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="md:hidden space-y-4">
            {weekDates.map((d, i) => (
              <div key={d}>
                <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>{weekDays[i]}</span>
                  <span className="text-gray-500">{d.slice(5)}</span>
                  {d === new Date().toISOString().split("T")[0] && <Badge variant="info">今天</Badge>}
                </div>
                <div className="space-y-2">
                  {(groupedSlots[d] || []).map((slot: any) => (
                    <div key={slot._id} className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{slot.startTime}-{slot.endTime} {slot.courseType}</div>
                        <div className="text-xs text-gray-500">{slot.teacher} · {slot.classroom}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{slot.currentBookings}/{slot.capacityRuleId?.maxCapacity}</span>
                        <StatusBadge status={slot.status} />
                      </div>
                    </div>
                  ))}
                  {(!groupedSlots[d] || groupedSlots[d].length === 0) && (
                    <div className="p-4 text-center text-sm text-gray-400 rounded-lg border border-dashed border-gray-200">
                      暂无时段
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>容量规则</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {capacityRules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无容量规则</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {capacityRules.map((rule: any) => (
                <div key={rule._id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-sm text-gray-500">{rule.courseType}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">最大容量: <b>{rule.maxCapacity}</b></span>
                    <span className="text-gray-600">超售: <b>{rule.overbookLimit}</b></span>
                    <span className="text-gray-600">提醒阈值: <b>{rule.reminderThreshold}%</b></span>
                    {rule.isActive ? <Badge variant="success">启用</Badge> : <Badge>停用</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showSlotModal} onClose={() => setShowSlotModal(false)} title="新增时段">
        <form onSubmit={createSlot} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>日期</Label>
              <Input type="date" value={slotForm.date} onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })} required />
            </div>
            <div>
              <Label>课程类型</Label>
              <Select value={slotForm.courseType} onChange={(e) => setSlotForm({ ...slotForm, courseType: e.target.value })} required>
                <option value="">请选择</option>
                {capacityRules.map((r: any) => <option key={r._id} value={r.courseType}>{r.courseType}</option>)}
              </Select>
            </div>
            <div>
              <Label>开始时间</Label>
              <Input type="time" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} required />
            </div>
            <div>
              <Label>结束时间</Label>
              <Input type="time" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} required />
            </div>
            <div>
              <Label>授课教师</Label>
              <Input value={slotForm.teacher} onChange={(e) => setSlotForm({ ...slotForm, teacher: e.target.value })} required />
            </div>
            <div>
              <Label>教室</Label>
              <Input value={slotForm.classroom} onChange={(e) => setSlotForm({ ...slotForm, classroom: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>容量规则</Label>
            <Select value={slotForm.capacityRuleId} onChange={(e) => setSlotForm({ ...slotForm, capacityRuleId: e.target.value })} required>
              <option value="">请选择容量规则</option>
              {capacityRules.map((r: any) => <option key={r._id} value={r._id}>{r.name} (最大{r.maxCapacity}人)</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowSlotModal(false)}>取消</Button>
            <Button type="submit">创建</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title="容量规则管理">
        <form onSubmit={createRule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>规则名称</Label>
              <Input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required />
            </div>
            <div>
              <Label>课程类型</Label>
              <Input value={ruleForm.courseType} onChange={(e) => setRuleForm({ ...ruleForm, courseType: e.target.value })} required />
            </div>
            <div>
              <Label>最大容量</Label>
              <Input type="number" min={1} value={ruleForm.maxCapacity} onChange={(e) => setRuleForm({ ...ruleForm, maxCapacity: Number(e.target.value) })} required />
            </div>
            <div>
              <Label>超售额度</Label>
              <Input type="number" min={0} value={ruleForm.overbookLimit} onChange={(e) => setRuleForm({ ...ruleForm, overbookLimit: Number(e.target.value) })} />
            </div>
            <div>
              <Label>提醒阈值 (%)</Label>
              <Input type="number" min={0} max={100} value={ruleForm.reminderThreshold} onChange={(e) => setRuleForm({ ...ruleForm, reminderThreshold: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>说明</Label>
            <Input value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowRuleModal(false)}>取消</Button>
            <Button type="submit">创建规则</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
