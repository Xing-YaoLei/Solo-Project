import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { workOrderApi } from '@/api/workOrderApi';
import { authApi } from '@/api/authApi';
import { vehicleApi } from '@/api/vehicleApi';
import { diagnosisApi } from '@/api/diagnosisApi';
import type { WorkOrder, WorkOrderStatus, WorkOrderItem, Vehicle, Diagnosis } from '@/types';
import { WorkOrderStatusText } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';

interface UserOpt {
  id: string;
  fullName: string;
}

interface NewWorkOrderItem {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  laborCost: number;
  partId?: string;
}

const WorkOrders: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<UserOpt[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [newForm, setNewForm] = useState({
    vehicleId: '',
    assignedToUserId: '',
    scheduledDate: dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
    status: 'Pending' as WorkOrderStatus,
    description: '',
    items: [{ itemName: '', quantity: 1, unitPrice: 0, laborCost: 0 }] as NewWorkOrderItem[],
  });

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showDiagnosisCreate, setShowDiagnosisCreate] = useState(false);
  const [diagnosisForm, setDiagnosisForm] = useState({
    symptomDescription: '',
    diagnosticResult: '',
    faultCodes: '',
    recommendations: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: { date?: string; userId?: string } = { date: selectedDate };
      if (selectedTechnician) params.userId = selectedTechnician;
      const isTech = user?.roles.includes('Technician') && !user?.roles.includes('Manager');
      if (isTech && user?.id) {
        params.userId = user.id;
      }
      const [ordersRes, techRes, vehicleRes] = await Promise.all([
        workOrderApi.getWorkOrders(params),
        authApi.getTechnicians(),
        vehicleApi.getAllVehicles(),
      ]);
      setWorkOrders(ordersRes.data || []);
      setTechnicians(techRes.data || []);
      setVehicles(vehicleRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedTechnician]);

  const handleViewDetail = async (orderId: string) => {
    const res = await workOrderApi.getWorkOrderById(orderId);
    setSelectedOrder(res.data);
    setShowDetail(true);
  };

  const handleUpdateStatus = async (orderId: string, status: WorkOrderStatus) => {
    await workOrderApi.updateWorkOrderStatus(orderId, status);
    if (selectedOrder?.id === orderId) {
      const res = await workOrderApi.getWorkOrderById(orderId);
      setSelectedOrder(res.data);
    }
    fetchData();
  };

  const handleAddItem = () => {
    setNewForm((p) => ({
      ...p,
      items: [...p.items, { itemName: '', quantity: 1, unitPrice: 0, laborCost: 0 }],
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setNewForm((p) => ({
      ...p,
      items: p.items.filter((_, i) => i !== idx),
    }));
  };

  const handleItemChange = (idx: number, field: keyof NewWorkOrderItem, value: any) => {
    setNewForm((p) => {
      const items = [...p.items];
      (items[idx] as any)[field] = value;
      return { ...p, items };
    });
  };

  const handleCreateWorkOrder = async () => {
    if (!newForm.vehicleId) {
      alert('请选择车辆');
      return;
    }
    if (newForm.items.some((i) => !i.itemName.trim())) {
      alert('请填写所有工单项目名称');
      return;
    }
    setSubmitting(true);
    try {
      const items = newForm.items.map((i) => ({
        itemName: i.itemName.trim(),
        description: i.description,
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        laborCost: Number(i.laborCost) || 0,
        partId: i.partId || undefined,
      }));
      await workOrderApi.createWorkOrder({
        vehicleId: newForm.vehicleId,
        assignedToUserId: newForm.assignedToUserId || undefined,
        status: newForm.status,
        description: newForm.description || undefined,
        scheduledDate: new Date(newForm.scheduledDate).toISOString(),
        items,
      });
      setShowCreate(false);
      setNewForm({
        vehicleId: '',
        assignedToUserId: '',
        scheduledDate: dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
        status: 'Pending',
        description: '',
        items: [{ itemName: '', quantity: 1, unitPrice: 0, laborCost: 0 }],
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDiagnosis = async () => {
    if (!selectedOrder) return;
    if (!diagnosisForm.symptomDescription.trim() || !diagnosisForm.diagnosticResult.trim()) {
      alert('请填写症状和诊断结果');
      return;
    }
    setSubmitting(true);
    try {
      await diagnosisApi.createDiagnosis({
        vehicleId: selectedOrder.vehicleId,
        workOrderId: selectedOrder.id,
        symptomDescription: diagnosisForm.symptomDescription,
        diagnosticResult: diagnosisForm.diagnosticResult,
        faultCodes: diagnosisForm.faultCodes || undefined,
        recommendations: diagnosisForm.recommendations || undefined,
      });
      setShowDiagnosisCreate(false);
      setDiagnosisForm({ symptomDescription: '', diagnosticResult: '', faultCodes: '', recommendations: '' });
      const res = await workOrderApi.getWorkOrderById(selectedOrder.id);
      setSelectedOrder(res.data);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.licensePlate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">工单管理</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">日期：</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">技师：</label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + 创建工单
          </button>
        </div>
      </div>

      {workOrders.length === 0 ? (
        <EmptyState description='暂无工单记录，点击"创建工单"开始' />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleViewDetail(order.id)}
              className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  order.status === 'Rework'
                    ? '#ef4444'
                    : order.status === 'Completed'
                    ? '#22c55e'
                    : order.status === 'InProgress'
                    ? '#3b82f6'
                    : order.status === 'Cancelled'
                    ? '#9ca3af'
                    : '#eab308',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                <StatusBadge status={order.status} type="workOrder" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>车辆：</span>
                  <span className="font-medium text-gray-900">{order.vehicleLicensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span>品牌型号：</span>
                  <span>
                    {order.vehicleBrand} {order.vehicleModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>分配技师：</span>
                  <span>{order.assignedToUserName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>项目数量：</span>
                  <span>{order.items?.length || 0} 项</span>
                </div>
                <div className="flex justify-between">
                  <span>诊断记录：</span>
                  <span>{order.diagnoses?.length || 0} 条</span>
                </div>
                <div className="flex justify-between">
                  <span>计划时间：</span>
                  <span>{dayjs(order.scheduledDate).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                {order.isRework && (
                  <div className="pt-1">
                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">返修单</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedOrder && (
        <Modal
          title={`工单详情 - ${selectedOrder.orderNumber}`}
          onClose={() => setShowDetail(false)}
          size="large"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">工单号：</span>
                <span className="font-medium">{selectedOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">状态：</span>
                <StatusBadge status={selectedOrder.status} type="workOrder" />
              </div>
              <div>
                <span className="text-gray-500">车牌号：</span>
                <span>{selectedOrder.vehicleLicensePlate}</span>
              </div>
              <div>
                <span className="text-gray-500">品牌型号：</span>
                <span>
                  {selectedOrder.vehicleBrand} {selectedOrder.vehicleModel}
                </span>
              </div>
              <div>
                <span className="text-gray-500">分配技师：</span>
                <span>{selectedOrder.assignedToUserName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">计划时间：</span>
                <span>{dayjs(selectedOrder.scheduledDate).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              {selectedOrder.startedAt && (
                <div>
                  <span className="text-gray-500">开始时间：</span>
                  <span>{dayjs(selectedOrder.startedAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              )}
              {selectedOrder.completedAt && (
                <div>
                  <span className="text-gray-500">完成时间：</span>
                  <span>{dayjs(selectedOrder.completedAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-gray-600">更新状态：</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as WorkOrderStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {Object.entries(WorkOrderStatusText).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowDiagnosisCreate(true)}
                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                + 添加诊断记录
              </button>
            </div>

            {selectedOrder.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">工单描述</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedOrder.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                诊断记录 ({selectedOrder.diagnoses?.length || 0})
              </h4>
              {selectedOrder.diagnoses?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无诊断记录</p>
              ) : (
                <div className="space-y-2">
                  {selectedOrder.diagnoses.map((d: Diagnosis) => (
                    <div key={d.id} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{d.diagnosedByUserName || '未记录'}</span>
                        <span className="text-gray-500">{dayjs(d.diagnosedAt).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      <p>
                        <span className="text-gray-500">症状：</span>
                        {d.symptomDescription}
                      </p>
                      <p>
                        <span className="text-gray-500">结果：</span>
                        {d.diagnosticResult}
                      </p>
                      {d.faultCodes && (
                        <p>
                          <span className="text-gray-500">故障码：</span>
                          <span className="font-mono bg-yellow-50 px-1 text-yellow-700">{d.faultCodes}</span>
                        </p>
                      )}
                      {d.recommendations && (
                        <p>
                          <span className="text-gray-500">建议：</span>
                          {d.recommendations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                工单项目 ({selectedOrder.items?.length || 0})
              </h4>
              {selectedOrder.items?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无项目</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">项目名称</th>
                        <th className="px-3 py-2 text-right">数量</th>
                        <th className="px-3 py-2 text-right">单价</th>
                        <th className="px-3 py-2 text-right">人工费</th>
                        <th className="px-3 py-2 text-right">小计</th>
                        <th className="px-3 py-2 text-right">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item: WorkOrderItem) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <div>
                              <div className="font-medium">{item.itemName}</div>
                              {item.partName && <div className="text-xs text-gray-500">配件：{item.partName}</div>}
                              {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">¥{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">¥{item.laborCost.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            ¥{(item.quantity * (item.unitPrice + item.laborCost)).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.isCompleted ? (
                              <span className="text-green-600">已完成</span>
                            ) : (
                              <span className="text-yellow-600">未完成</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showCreate && (
        <Modal
          title="创建工单 - 接入日常排程"
          onClose={() => setShowCreate(false)}
          size="large"
          footer={
            <>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleCreateWorkOrder}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? '创建中...' : '创建工单'}
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择车辆 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="搜索车牌号、品牌、型号..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y">
                  {filteredVehicles.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">未找到车辆，请先在"车辆档案"中添加</div>
                  ) : (
                    filteredVehicles.map((v) => (
                      <label
                        key={v.id}
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 ${
                          newForm.vehicleId === v.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="vehicle"
                            checked={newForm.vehicleId === v.id}
                            onChange={() => setNewForm((p) => ({ ...p, vehicleId: v.id }))}
                          />
                          <div>
                            <div className="font-medium">
                              {v.licensePlate} <span className="text-xs text-gray-500">({v.ownerName || '未登记车主'})</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {v.brand} {v.model} · 里程 {v.mileage.toLocaleString()} km
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {dayjs(v.createdAt).format('MM-DD')} 建档
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分配技师</label>
                <select
                  value={newForm.assignedToUserId}
                  onChange={(e) => setNewForm((p) => ({ ...p, assignedToUserId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">暂不分配</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排程时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newForm.scheduledDate}
                  onChange={(e) => setNewForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始状态</label>
                <select
                  value={newForm.status}
                  onChange={(e) => setNewForm((p) => ({ ...p, status: e.target.value as WorkOrderStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {Object.entries(WorkOrderStatusText).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">工单描述</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="简述客户报修内容或保养需求..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  工单项目 <span className="text-gray-500 font-normal text-sm">（与诊断结果核对后执行）</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + 添加项目
                </button>
              </div>
              <div className="space-y-2">
                {newForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="项目名称 *"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="数量"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="单价"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="人工费"
                        value={item.laborCost}
                        onChange={(e) => handleItemChange(idx, 'laborCost', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        ¥{(item.quantity * (Number(item.unitPrice) + Number(item.laborCost))).toFixed(2)}
                      </span>
                      {newForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-end">
                <div className="text-sm">
                  <span className="text-gray-500">预计金额：</span>
                  <span className="text-lg font-bold text-blue-600">
                    ¥
                    {newForm.items
                      .reduce(
                        (sum, it) =>
                          sum + (Number(it.quantity) || 0) * ((Number(it.unitPrice) || 0) + (Number(it.laborCost) || 0)),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDiagnosisCreate && selectedOrder && (
        <Modal
          title="添加诊断记录"
          onClose={() => setShowDiagnosisCreate(false)}
          footer={
            <>
              <button
                onClick={() => setShowDiagnosisCreate(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleCreateDiagnosis}
                className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? '保存中...' : '保存诊断'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-500 bg-indigo-50 p-3 rounded">
              车辆：<span className="font-medium text-gray-900">{selectedOrder.vehicleLicensePlate}</span>
              <span className="mx-2">·</span>
              工单：<span className="font-medium text-gray-900">{selectedOrder.orderNumber}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                症状描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={diagnosisForm.symptomDescription}
                onChange={(e) => setDiagnosisForm((p) => ({ ...p, symptomDescription: e.target.value }))}
                placeholder="客户描述的故障现象..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                诊断结果 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={diagnosisForm.diagnosticResult}
                onChange={(e) => setDiagnosisForm((p) => ({ ...p, diagnosticResult: e.target.value }))}
                placeholder="技师的诊断结论..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">故障码</label>
              <input
                type="text"
                value={diagnosisForm.faultCodes}
                onChange={(e) => setDiagnosisForm((p) => ({ ...p, faultCodes: e.target.value }))}
                placeholder="如：P0300, P0171"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修建议</label>
              <textarea
                rows={2}
                value={diagnosisForm.recommendations}
                onChange={(e) => setDiagnosisForm((p) => ({ ...p, recommendations: e.target.value }))}
                placeholder="建议的维修方案或更换配件..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkOrders;
