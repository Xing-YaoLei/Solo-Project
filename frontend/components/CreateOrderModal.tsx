import { useState, useEffect } from 'react';
import { repairOrderApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { sourceLabels, priorityLabels } from '../lib/utils';
import { OrderSource } from '../types';
import { X, CheckCircle, UserPlus, FileText, Send } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const { repairPersons, refreshOrders, fetchOrderDetail, selectOrder } = useAppStore();
  const [step, setStep] = useState<'create' | 'assign'>('create');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    source: OrderSource.PHONE,
    apartmentNo: '',
    tenantName: '',
    tenantPhone: '',
    faultType: '',
    faultDesc: '',
    priority: 1,
    assignPersonId: '',
    planStartTime: '',
    planEndTime: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setStep('create');
      setCreatedOrderId(null);
      setSuccess(false);
      setErrors({});
      setForm({
        source: OrderSource.PHONE,
        apartmentNo: '',
        tenantName: '',
        tenantPhone: '',
        faultType: '',
        faultDesc: '',
        priority: 1,
        assignPersonId: '',
        planStartTime: '',
        planEndTime: '',
      });
    }
  }, [isOpen]);

  const validateCreate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.apartmentNo.trim()) newErrors.apartmentNo = '请输入房间号';
    if (!form.tenantName.trim()) newErrors.tenantName = '请输入租客姓名';
    if (!form.tenantPhone.trim()) newErrors.tenantPhone = '请输入联系电话';
    if (!form.faultType.trim()) newErrors.faultType = '请输入故障类型';
    if (!form.faultDesc.trim()) newErrors.faultDesc = '请输入故障描述';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;

    setLoading(true);
    try {
      const order = await repairOrderApi.create({
        source: form.source,
        apartmentNo: form.apartmentNo,
        tenantName: form.tenantName,
        tenantPhone: form.tenantPhone,
        faultType: form.faultType,
        faultDesc: form.faultDesc,
        priority: form.priority,
      });
      setCreatedOrderId(order.id);
      setStep('assign');
    } catch (error) {
      console.error('创建派单失败', error);
      alert('创建派单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!createdOrderId || !form.assignPersonId) {
      alert('请选择维修人员');
      return;
    }

    setLoading(true);
    try {
      await repairOrderApi.assign(createdOrderId, {
        assignPersonId: form.assignPersonId,
        planStartTime: form.planStartTime || undefined,
        planEndTime: form.planEndTime || undefined,
      });
      setSuccess(true);
      await refreshOrders();
    } catch (error) {
      console.error('分派失败', error);
      alert('分派失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAssign = async () => {
    setSuccess(true);
    await refreshOrders();
  };

  const handleFinish = async () => {
    if (createdOrderId) {
      await fetchOrderDetail(createdOrderId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onClose : undefined} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step === 'create' && <FileText className="w-5 h-5 text-primary-500" />}
            {step === 'assign' && !success && <UserPlus className="w-5 h-5 text-primary-500" />}
            {success && <CheckCircle className="w-5 h-5 text-green-500" />}
            <h2 className="text-lg font-semibold text-gray-900">
              {step === 'create' && '录入维修派单'}
              {step === 'assign' && !success && '分派维修人员'}
              {success && '创建成功'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin">
          {step === 'create' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    来源渠道 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as OrderSource })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.values(OrderSource).map((s) => (
                      <option key={s} value={s}>{sourceLabels[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优先级 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[1, 2, 3].map((p) => (
                      <option key={p} value={p}>{priorityLabels[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    房间号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.apartmentNo}
                    onChange={(e) => setForm({ ...form, apartmentNo: e.target.value })}
                    placeholder="例如：101、1203"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.apartmentNo ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.apartmentNo && (
                    <p className="mt-1 text-xs text-red-500">{errors.apartmentNo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    租客姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.tenantName}
                    onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                    placeholder="请输入租客姓名"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.tenantName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.tenantName && (
                    <p className="mt-1 text-xs text-red-500">{errors.tenantName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.tenantPhone}
                  onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })}
                  placeholder="请输入联系电话"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.tenantPhone ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.tenantPhone && (
                  <p className="mt-1 text-xs text-red-500">{errors.tenantPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  故障类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.faultType}
                  onChange={(e) => setForm({ ...form, faultType: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.faultType ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">请选择故障类型</option>
                  <option value="水管漏水">水管漏水</option>
                  <option value="电路故障">电路故障</option>
                  <option value="门锁损坏">门锁损坏</option>
                  <option value="家电维修">家电维修</option>
                  <option value="墙面修补">墙面修补</option>
                  <option value="管道堵塞">管道堵塞</option>
                  <option value="空调维修">空调维修</option>
                  <option value="其他">其他</option>
                </select>
                {errors.faultType && (
                  <p className="mt-1 text-xs text-red-500">{errors.faultType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  故障描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.faultDesc}
                  onChange={(e) => setForm({ ...form, faultDesc: e.target.value })}
                  placeholder="请详细描述故障情况，便于维修人员提前准备"
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                    errors.faultDesc ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.faultDesc && (
                  <p className="mt-1 text-xs text-red-500">{errors.faultDesc}</p>
                )}
              </div>
            </div>
          )}

          {step === 'assign' && !success && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">派单已创建成功！</span>
                  请为这个派单分派维修人员，或稍后在列表中手动分派。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择维修人员</label>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin border border-gray-100 rounded-lg p-2">
                  {repairPersons.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => setForm({ ...form, assignPersonId: person.id })}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.assignPersonId === person.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-base font-medium text-gray-600">
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{person.name}</p>
                          <p className="text-xs text-gray-500">{person.skill} · {person.phone}</p>
                        </div>
                        {form.assignPersonId === person.id && (
                          <CheckCircle className="w-5 h-5 text-primary-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">计划开始时间</label>
                  <input
                    type="datetime-local"
                    value={form.planStartTime}
                    onChange={(e) => setForm({ ...form, planStartTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">计划结束时间</label>
                  <input
                    type="datetime-local"
                    value={form.planEndTime}
                    onChange={(e) => setForm({ ...form, planEndTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">派单创建成功！</h3>
              <p className="text-sm text-gray-500 mb-6">
                {form.assignPersonId
                  ? '派单已成功创建并分派给维修人员，可开始处理。'
                  : '派单已创建成功，稍后可在列表中分派维修人员。'}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>录入</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${form.assignPersonId ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>分派</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>处理</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>关闭</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>业务链路：</span>
            <span className={step === 'create' ? 'text-primary-600 font-medium' : ''}>录入</span>
            <span>→</span>
            <span className={step === 'assign' ? 'text-primary-600 font-medium' : ''}>分派</span>
            <span>→</span>
            <span>处理</span>
            <span>→</span>
            <span>关闭</span>
          </div>

          <div className="flex items-center gap-2">
            {step === 'create' && (
              <>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  {loading ? '创建中...' : '下一步：分派'}
                </button>
              </>
            )}

            {step === 'assign' && !success && (
              <>
                <button
                  onClick={handleSkipAssign}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  稍后分派
                </button>
                <button
                  onClick={handleAssign}
                  disabled={loading || !form.assignPersonId}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? '分派中...' : '确认分派'}
                </button>
              </>
            )}

            {success && (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                完成，查看详情
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
