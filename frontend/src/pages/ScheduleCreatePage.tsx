import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Check,
  X,
  Search,
  Info,
  Save,
} from 'lucide-react';
import type { User, Apartment, TimeSlot, ConflictCheckResponse } from '@/types';
import { schedulesApi, usersApi, apartmentsApi, timeSlotsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import {
  formatDate,
  formatTime,
  STATUS_COLORS,
  STATUS_LABELS,
  RISK_COLORS,
  RISK_LABELS,
  cn,
} from '@/utils/format';
import type { RiskLevel } from '@/types';

export default function ScheduleCreatePage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [form, setForm] = useState({
    apartment_id: '' as number | string,
    cleaner_id: '' as number | string,
    supervisor_id: '' as number | string,
    scheduled_date: new Date().toISOString().split('T')[0],
    time_slot_id: '' as number | string,
    start_time: '',
    end_time: '',
    duration_minutes: 120,
    cleaning_type: 'routine',
    priority: 0,
    customer_notes: '',
    internal_notes: '',
    estimated_cost: '' as number | string,
  });

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [conflictCheck, setConflictCheck] = useState<ConflictCheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aptSearch, setAptSearch] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, c, t, ts] = await Promise.all([
          apartmentsApi.list(),
          usersApi.getCleaners(),
          usersApi.list({ role: 'supervisor' }),
          timeSlotsApi.list(),
        ]);
        setApartments(a.data);
        setCleaners(c.data);
        setSupervisors(t.data);
        setTimeSlots(ts.data);

        if (ts.data.length > 0) {
          const slot = ts.data[0];
          const dateStr = new Date().toISOString().split('T')[0];
          setForm((f) => ({
            ...f,
            time_slot_id: slot.id,
            start_time: `${dateStr}T${slot.start_time}`,
            end_time: `${dateStr}T${slot.end_time}`,
          }));
        }

        if (currentUser?.role === 'supervisor') {
          setForm((f) => ({ ...f, supervisor_id: currentUser.id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const selectedApt = apartments.find(
      (a) => String(a.id) === String(form.apartment_id)
    );
    if (selectedApt) {
      if (!form.start_time) return;
      setChecking(true);
      const timer = setTimeout(async () => {
        try {
          const startTime = new Date(form.start_time).toISOString();
          const endTime = new Date(form.end_time).toISOString();
          const res = await schedulesApi.checkConflicts({
            apartment_id: Number(form.apartment_id),
            cleaner_id: form.cleaner_id ? Number(form.cleaner_id) : undefined,
            start_time: startTime,
            end_time: endTime,
          });
          setConflictCheck(res.data);
        } finally {
          setChecking(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [form.apartment_id, form.cleaner_id, form.start_time, form.end_time]);

  const handleTimeSlotChange = (slotId: string | number) => {
    const slot = timeSlots.find((s) => String(s.id) === String(slotId));
    if (!slot || !form.scheduled_date) return;
    setForm((f) => ({
      ...f,
      time_slot_id: slotId,
      start_time: `${f.scheduled_date}T${slot.start_time}`,
      end_time: `${f.scheduled_date}T${slot.end_time}`,
      duration_minutes:
        (new Date(`${f.scheduled_date}T${slot.end_time}`).getTime() -
          new Date(`${f.scheduled_date}T${slot.start_time}`).getTime()) /
        60000,
    }));
  };

  const handleDateChange = (dateStr: string) => {
    setForm((f) => {
      const newForm = { ...f, scheduled_date: dateStr };
      if (f.start_time) {
        const [_d, time] = f.start_time.split('T');
        const [_d2, time2] = f.end_time.split('T');
        newForm.start_time = `${dateStr}T${time}`;
        newForm.end_time = `${dateStr}T${time2}`;
      }
      return newForm;
    });
  };

  const handleSubmit = async () => {
    if (!form.apartment_id) {
      alert('请选择公寓');
      return;
    }
    if (!form.start_time || !form.end_time) {
      alert('请设置时间');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        apartment_id: Number(form.apartment_id),
        cleaner_id: form.cleaner_id ? Number(form.cleaner_id) : null,
        supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : null,
        time_slot_id: form.time_slot_id ? Number(form.time_slot_id) : null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      };
      const res = await schedulesApi.create(payload);
      navigate({ to: `/schedules/${res.data.id}` });
    } catch (err: any) {
      alert(err?.response?.data?.detail || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApartments = apartments.filter(
    (a) =>
      !aptSearch ||
      a.apartment_code.toLowerCase().includes(aptSearch.toLowerCase()) ||
      a.building.includes(aptSearch) ||
      (a.resident_name && a.resident_name.includes(aptSearch))
  );

  const selectedApt = apartments.find(
    (a) => String(a.id) === String(form.apartment_id)
  );
  const selectedCleaner = cleaners.find(
    (c) => String(c.id) === String(form.cleaner_id)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/schedules' })}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">创建排班任务</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            按步骤填写信息，系统将自动检测时段冲突
          </p>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          {[
            { n: 1, label: '选择公寓' },
            { n: 2, label: '日历时段' },
            { n: 3, label: '人员分配' },
            { n: 4, label: '冲突核对' },
            { n: 5, label: '确认提交' },
          ].map((s, idx) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    step >= s.n
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {step > s.n ? <Check size={18} /> : s.n}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium whitespace-nowrap',
                    step >= s.n ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < 4 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3',
                    step > s.n ? 'bg-primary-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 步骤1：选择公寓 */}
          <StepCard
            title="选择公寓"
            stepNum={1}
            isActive={step === 1}
            isDone={step > 1}
            icon={MapPin}
            onClick={() => setStep(1)}
          >
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                placeholder="搜索公寓编号、楼栋、租客姓名..."
                className="input pl-10"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1">
              {filteredApartments.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-400 text-sm">
                  未找到匹配公寓
                </div>
              ) : (
                filteredApartments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => {
                      setForm((f) => ({ ...f, apartment_id: apt.id }));
                      setStep(2);
                    }}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all hover:shadow-md',
                      String(form.apartment_id) === String(apt.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="font-semibold text-gray-900 text-sm">
                      {apt.apartment_code}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {apt.building} {apt.unit}
                    </div>
                    {apt.apartment_type && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {apt.apartment_type} {apt.area_sqm}㎡
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </StepCard>

          {/* 步骤2：日历时段 */}
          <StepCard
            title="日历时段"
            stepNum={2}
            isActive={step === 2}
            isDone={step > 2}
            icon={Calendar}
            onClick={() => form.apartment_id && setStep(2)}
            disabled={!form.apartment_id}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">排班日期 *</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="label">时长（分钟）</label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      duration_minutes: Number(e.target.value),
                    }))
                  }
                  className="input"
                  min={30}
                  step={30}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="label">选择时段</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleTimeSlotChange(slot.id)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      String(form.time_slot_id) === String(slot.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300',
                      slot.is_peak && 'ring-2 ring-orange-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">
                        {slot.slot_name}
                      </span>
                      {slot.is_peak && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                          高峰
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      容量 {slot.capacity} 人
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">精确开始时间 *</label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">精确结束时间 *</label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          </StepCard>

          {/* 步骤3：人员分配 */}
          <StepCard
            title="人员分配"
            stepNum={3}
            isActive={step === 3}
            isDone={step > 3}
            icon={User}
            onClick={() => form.start_time && setStep(3)}
            disabled={!form.start_time}
          >
            <div className="space-y-4">
              <div>
                <label className="label">保洁员</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, cleaner_id: '' as any }))
                    }
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      !form.cleaner_id
                        ? 'border-dashed border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="font-semibold text-sm text-gray-500">
                      暂不分配
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      稍后调度再选
                    </div>
                  </button>
                  {cleaners.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setForm((f) => ({ ...f, cleaner_id: c.id }));
                        setStep(4);
                      }}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm',
                        String(form.cleaner_id) === String(c.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium">
                          {c.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">
                            {c.full_name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {c.phone || '暂无电话'}
                          </div>
                        </div>
                      </div>
                      {c.skills && c.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.skills.slice(0, 2).map((s, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">负责主管</label>
                <select
                  value={form.supervisor_id as any}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      supervisor_id: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                  className="input"
                >
                  <option value="">（自动分配）</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </StepCard>

          {/* 步骤4：冲突核对 */}
          <StepCard
            title="冲突与容量核对"
            stepNum={4}
            isActive={step === 4}
            isDone={step > 4}
            icon={AlertTriangle}
            onClick={() => setStep(4)}
          >
            {checking ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-700">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span>正在检测时段冲突与容量...</span>
              </div>
            ) : !conflictCheck ? (
              <div className="p-4 rounded-xl bg-gray-50 text-gray-500">
                请先选择公寓和时段后再检测
              </div>
            ) : conflictCheck.has_conflict ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-800">
                      检测到 {conflictCheck.conflicts.length} 项冲突
                    </div>
                    <p className="text-sm text-red-600 mt-0.5">
                      请调整时间或更换保洁员
                    </p>
                  </div>
                </div>
                {conflictCheck.conflicts.map((c, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-xl border',
                      RISK_BG_COLORS[c.risk_level as RiskLevel]
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={cn('badge border', RISK_COLORS[c.risk_level as RiskLevel])}
                        >
                          {RISK_LABELS[c.risk_level as RiskLevel]}
                        </span>
                        <span className="text-xs font-medium text-gray-600 ml-2">
                          {c.conflict_type}
                        </span>
                        <p className="text-sm text-gray-700 mt-2">{c.description}</p>
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="btn-outline text-xs py-1 px-3 whitespace-nowrap"
                      >
                        调整时间
                      </button>
                    </div>
                  </div>
                ))}
                {conflictCheck.capacity_warnings?.length > 0 && (
                  <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-800 mb-2">容量警告</div>
                    {conflictCheck.capacity_warnings.map((w, i) => (
                      <div key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                        <span>⚠</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Check size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-green-800">通过冲突检测</div>
                    <p className="text-sm text-green-600 mt-0.5">
                      时段空闲，容量充足
                    </p>
                  </div>
                </div>
                {conflictCheck.capacity_warnings?.length > 0 && (
                  <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-800 mb-2">
                      容量提醒
                    </div>
                    {conflictCheck.capacity_warnings.map((w, i) => (
                      <div key={i} className="text-sm text-yellow-700">
                        • {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </StepCard>

          {/* 步骤5：确认提交 */}
          <StepCard
            title="备注与提交"
            stepNum={5}
            isActive={step === 5}
            isDone={false}
            icon={Save}
            onClick={() => setStep(5)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">清洁类型</label>
                  <select
                    value={form.cleaning_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cleaning_type: e.target.value }))
                    }
                    className="input"
                  >
                    <option value="routine">日常清洁</option>
                    <option value="deep">深度清洁</option>
                    <option value="checkout">退租清洁</option>
                    <option value="movein">入住清洁</option>
                    <option value="inspection">巡检保洁</option>
                  </select>
                </div>
                <div>
                  <label className="label">优先级</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: Number(e.target.value) }))
                    }
                    className="input"
                  >
                    <option value={0}>普通</option>
                    <option value={1}>优先</option>
                    <option value={2}>紧急</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">客户备注</label>
                <textarea
                  value={form.customer_notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_notes: e.target.value }))
                  }
                  placeholder="客户特别要求、需要注意的事项等"
                  rows={2}
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="label">内部备注</label>
                <textarea
                  value={form.internal_notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, internal_notes: e.target.value }))
                  }
                  placeholder="仅内部可见的调度备注"
                  rows={2}
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="label">预估费用（元）</label>
                <input
                  type="number"
                  value={form.estimated_cost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimated_cost: e.target.value }))
                  }
                  placeholder="选填"
                  className="input"
                  min={0}
                />
              </div>
            </div>
          </StepCard>
        </div>

        {/* 右侧预览 */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-gray-500" />
                排班预览
              </h3>
              <div className="space-y-4">
                <PreviewRow label="公寓" icon={MapPin}>
                  {selectedApt ? (
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {selectedApt.apartment_code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedApt.building} {selectedApt.unit}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">未选择</span>
                  )}
                </PreviewRow>
                <PreviewRow label="日期时段" icon={Calendar}>
                  {form.scheduled_date ? (
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {formatDate(form.scheduled_date)}
                      </div>
                      {form.start_time && form.end_time && (
                        <div className="text-xs text-gray-500">
                          {formatTime(new Date(form.start_time).toISOString())} -{' '}
                          {formatTime(new Date(form.end_time).toISOString())}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">未选择</span>
                  )}
                </PreviewRow>
                <PreviewRow label="保洁员" icon={User}>
                  {selectedCleaner ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium">
                        {selectedCleaner.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm text-gray-900">
                        {selectedCleaner.full_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      {form.cleaner_id ? '待分配' : '暂未选择'}
                    </span>
                  )}
                </PreviewRow>
                <PreviewRow label="清洁类型" icon={Clock}>
                  <span className="text-sm text-gray-900 font-medium">
                    {form.cleaning_type === 'routine'
                      ? '日常'
                      : form.cleaning_type === 'deep'
                      ? '深度'
                      : form.cleaning_type === 'checkout'
                      ? '退租'
                      : form.cleaning_type === 'movein'
                      ? '入住'
                      : '巡检'}
                  </span>
                </PreviewRow>

                {conflictCheck && (
                  <div
                    className={cn(
                      'p-3 rounded-xl border mt-4',
                      conflictCheck.has_conflict
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    )}
                  >
                    {conflictCheck.has_conflict ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          存在冲突，无法提交
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          冲突检测通过
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="card p-5 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !form.apartment_id ||
                  !form.start_time ||
                  conflictCheck?.has_conflict
                }
                className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    提交中...
                  </>
                ) : (
                  '确认创建排班'
                )}
              </button>
              <Link
                to="/schedules"
                className="w-full btn-secondary block text-center"
              >
                取消返回
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  title,
  stepNum,
  isActive,
  isDone,
  icon: Icon,
  children,
  onClick,
  disabled,
}: {
  title: string;
  stepNum: number;
  isActive: boolean;
  isDone: boolean;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'card border-2 transition-all overflow-hidden',
        isActive
          ? 'border-primary-400 shadow-md'
          : 'border-transparent',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 p-5 border-b border-gray-100',
          !disabled && onClick && 'cursor-pointer hover:bg-gray-50'
        )}
        onClick={disabled ? undefined : onClick}
      >
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            isDone
              ? 'bg-green-100 text-green-600'
              : isActive
              ? 'bg-primary-100 text-primary-600'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {isDone ? <Check size={18} /> : <Icon size={18} />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            步骤{stepNum}：{title}
          </h3>
        </div>
        {isDone && (
          <span className="badge bg-green-100 text-green-700">
            <Check size={10} className="inline mr-0.5" />
            已完成
          </span>
        )}
      </div>
      {(isActive || isDone) && <div className="p-5">{children}</div>}
    </div>
  );
}

function PreviewRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        {children}
      </div>
    </div>
  );
}
