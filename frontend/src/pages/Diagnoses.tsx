import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { diagnosisApi } from '@/api/diagnosisApi';
import { vehicleApi } from '@/api/vehicleApi';
import { workOrderApi } from '@/api/workOrderApi';
import type { Diagnosis, Vehicle, WorkOrder } from '@/types';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface DiagnosisFormData {
  vehicleId: string;
  workOrderId?: string;
  symptomDescription: string;
  diagnosticResult: string;
  faultCodes?: string;
  recommendations?: string;
}

const emptyForm: DiagnosisFormData = {
  vehicleId: '',
  workOrderId: '',
  symptomDescription: '',
  diagnosticResult: '',
  faultCodes: '',
  recommendations: '',
};

const Diagnoses: React.FC = () => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<DiagnosisFormData>(emptyForm);
  const [vehicleSearch, setVehicleSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, vRes, wRes] = await Promise.all([
        diagnosisApi.getDiagnoses(),
        vehicleApi.getAllVehicles(),
        workOrderApi.getWorkOrders(),
      ]);
      setDiagnoses(dRes.data || []);
      setVehicles(vRes.data || []);
      setWorkOrders(wRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.licensePlate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.brand.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredWorkOrders = workOrders.filter((w) => w.vehicleId === formData.vehicleId);

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.symptomDescription || !formData.diagnosticResult) {
      alert('请填写必填项');
      return;
    }
    try {
      await diagnosisApi.createDiagnosis(formData);
      setShowModal(false);
      setFormData(emptyForm);
      setVehicleSearch('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">诊断记录</h2>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setVehicleSearch('');
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加诊断记录
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {diagnoses.length === 0 ? (
          <EmptyState description="暂无诊断记录" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">车辆</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联工单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">诊断人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">症状描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">诊断结果</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">故障代码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">诊断时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {diagnoses.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.vehicleLicensePlate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.workOrderNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.diagnosedByUserName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{d.symptomDescription}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{d.diagnosticResult}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.faultCodes || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(d.diagnosedAt).format('YYYY-MM-DD HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title="添加诊断记录"
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索车辆 *</label>
            <input
              type="text"
              placeholder="输入车牌号或品牌搜索..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          {vehicleSearch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择车辆 *</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value, workOrderId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">请选择</option>
                {filteredVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          )}
          {formData.vehicleId && filteredWorkOrders.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联工单（可选）</label>
              <select
                value={formData.workOrderId}
                onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">不关联</option>
                {filteredWorkOrders.map((w) => (
                  <option key={w.id} value={w.id}>{w.orderNumber}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">症状描述 *</label>
            <textarea
              value={formData.symptomDescription}
              onChange={(e) => setFormData({ ...formData, symptomDescription: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">诊断结果 *</label>
            <textarea
              value={formData.diagnosticResult}
              onChange={(e) => setFormData({ ...formData, diagnosticResult: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">故障代码</label>
              <input
                type="text"
                value={formData.faultCodes}
                onChange={(e) => setFormData({ ...formData, faultCodes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修建议</label>
              <input
                type="text"
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Diagnoses;
