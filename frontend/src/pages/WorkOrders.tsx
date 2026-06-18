import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { workOrderApi } from '@/api/workOrderApi';
import { authApi } from '@/api/authApi';
import type { WorkOrder, WorkOrderStatus } from '@/types';
import { WorkOrderStatusText } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface User {
  id: string;
  fullName: string;
}

const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: { date?: string; userId?: string } = { date: selectedDate };
      if (selectedTechnician) params.userId = selectedTechnician;
      const [ordersRes, techRes] = await Promise.all([
        workOrderApi.getWorkOrders(params),
        authApi.getTechnicians(),
      ]);
      setWorkOrders(ordersRes.data || []);
      setTechnicians(techRes.data || []);
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">工单管理</h2>
        <div className="flex items-center gap-4">
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
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + 创建工单
          </button>
        </div>
      </div>

      {workOrders.length === 0 ? (
        <EmptyState description="暂无工单记录" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleViewDetail(order.id)}
              className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
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
                  <span>{order.vehicleBrand} {order.vehicleModel}</span>
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
                  <span>计划时间：</span>
                  <span>{dayjs(order.scheduledDate).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedOrder && (
        <Modal
          title={`工单详情 - ${selectedOrder.orderNumber}`}
          onClose={() => setShowDetail(false)}
        >
          {selectedOrder && (
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
                <span>{selectedOrder.vehicleBrand} {selectedOrder.vehicleModel}</span>
              </div>
              <div>
                <span className="text-gray-500">分配技师：</span>
                <span>{selectedOrder.assignedToUserName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">计划时间：</span>
                <span>{dayjs(selectedOrder.scheduledDate).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">更新状态：</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as WorkOrderStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {Object.entries(WorkOrderStatusText).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            {selectedOrder.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">工单描述</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedOrder.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">诊断记录 ({selectedOrder.diagnoses?.length || 0})</h4>
              {selectedOrder.diagnoses?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无诊断记录</p>
              ) : (
                <div className="space-y-2">
                  {selectedOrder.diagnoses.map((d) => (
                    <div key={d.id} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{d.diagnosedByUserName}</span>
                        <span className="text-gray-500">{dayjs(d.diagnosedAt).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      <p><span className="text-gray-500">症状：</span>{d.symptomDescription}</p>
                      <p><span className="text-gray-500">结果：</span>{d.diagnosticResult}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">工单项目 ({selectedOrder.items?.length || 0})</h4>
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
                        <th className="px-3 py-2 text-right">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.itemName}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">¥{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">¥{item.laborCost.toFixed(2)}</td>
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
          )}
        </Modal>
      )}
    </div>
  );
};

export default WorkOrders;
