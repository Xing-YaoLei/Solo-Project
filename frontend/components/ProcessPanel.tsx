import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { repairOrderApi } from '../services/api';
import {
  statusLabels,
  statusColors,
  delayReasonLabels,
  reviewTagLabels,
  reviewTagColors,
} from '../lib/utils';
import { OrderStatus, DelayReason, ReviewTag } from '../types';
import {
  Wrench,
  Package,
  AlertTriangle,
  FileCheck,
  UserPlus,
  CheckCircle,
  Clock,
  Tag,
  X,
  Plus,
  Minus,
  Send,
} from 'lucide-react';

export default function ProcessPanel() {
  const { selectedOrder, commonMaterials, repairPersons, refreshOrders, fetchOrderDetail } = useAppStore();
  const [activeSection, setActiveSection] = useState<'status' | 'assign' | 'materials' | 'delay' | 'signoff' | 'tags'>('status');

  if (!selectedOrder) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 items-center justify-center">
        <div className="text-center text-gray-400">
          <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">请选择派单</p>
          <p className="text-sm mt-2">从左侧列表选择派单进行处理</p>
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'status', label: '状态操作', icon: Clock },
    { key: 'assign', label: '分派人员', icon: UserPlus },
    { key: 'materials', label: '常用材料', icon: Package },
    { key: 'delay', label: '延误上报', icon: AlertTriangle },
    { key: 'signoff', label: '签收凭证', icon: FileCheck },
    { key: 'tags', label: '复盘标签', icon: Tag },
  ];

  const handleStatusUpdate = async (status: OrderStatus, remark?: string) => {
    try {
      await repairOrderApi.updateStatus(selectedOrder.id, {
        status,
        remark,
        operatorId: 'current-user',
      });
      await refreshOrders();
    } catch (error) {
      console.error('状态更新失败', error);
      alert('状态更新失败，请重试');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">处理区</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-500">当前状态：</span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
            {statusLabels[selectedOrder.status]}
          </span>
        </div>
      </div>

      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-thin">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeSection === section.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <section.icon className="w-3.5 h-3.5" />
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeSection === 'status' && (
          <StatusActions order={selectedOrder} onUpdate={handleStatusUpdate} />
        )}
        {activeSection === 'assign' && (
          <AssignSection order={selectedOrder} persons={repairPersons} onAssigned={refreshOrders} />
        )}
        {activeSection === 'materials' && (
          <MaterialsSection order={selectedOrder} materials={commonMaterials} onUpdated={refreshOrders} />
        )}
        {activeSection === 'delay' && (
          <DelaySection order={selectedOrder} onUpdated={refreshOrders} />
        )}
        {activeSection === 'signoff' && (
          <SignoffSection order={selectedOrder} onUpdated={refreshOrders} />
        )}
        {activeSection === 'tags' && (
          <TagsSection order={selectedOrder} onUpdated={refreshOrders} />
        )}
      </div>
    </div>
  );
}

function StatusActions({ order, onUpdate }: { order: any; onUpdate: (status: OrderStatus, remark?: string) => void }) {
  const [remark, setRemark] = useState('');

  const validTransitions = getValidTransitions(order.status);

  const statusButtons = [
    { status: OrderStatus.IN_PROGRESS, label: '开始处理', icon: Wrench, color: 'bg-blue-500 hover:bg-blue-600' },
    { status: OrderStatus.COMPLETED, label: '完成维修', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600' },
    { status: OrderStatus.PENDING_SUPPLEMENT, label: '待补料', icon: Package, color: 'bg-orange-500 hover:bg-orange-600' },
    { status: OrderStatus.UNDER_REVIEW, label: '提交复核', icon: FileCheck, color: 'bg-purple-500 hover:bg-purple-600' },
    { status: OrderStatus.CLOSED, label: '关闭单据', icon: X, color: 'bg-gray-500 hover:bg-gray-600' },
  ];

  const availableButtons = statusButtons.filter(btn => validTransitions.includes(btn.status));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">操作备注</label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="输入操作备注（可选）"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        {availableButtons.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">当前状态无可操作项</p>
        ) : (
          availableButtons.map((btn) => (
            <button
              key={btn.status}
              onClick={() => onUpdate(btn.status, remark || undefined)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-medium rounded-lg transition-colors ${btn.color}`}
            >
              <btn.icon className="w-4 h-4" />
              {btn.label}
            </button>
          ))
        )}
      </div>

      {order.status === OrderStatus.CLOSED && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">单据已关闭，不可再操作</p>
          <p className="text-xs text-gray-400 text-center mt-1">可在历史记录中查看详情</p>
        </div>
      )}
    </div>
  );
}

function AssignSection({ order, persons, onAssigned }: { order: any; persons: any[]; onAssigned: () => void }) {
  const [selectedPerson, setSelectedPerson] = useState(order.assignPersonId || '');

  const handleAssign = async () => {
    if (!selectedPerson) {
      alert('请选择维修人员');
      return;
    }
    try {
      await repairOrderApi.assign(order.id, {
        assignPersonId: selectedPerson,
      });
      onAssigned();
      alert('分派成功');
    } catch (error) {
      console.error('分派失败', error);
      alert('分派失败，请重试');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">选择维修人员</label>
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          {persons.map((person) => (
            <div
              key={person.id}
              onClick={() => setSelectedPerson(person.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedPerson === person.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {person.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.skill}</p>
                </div>
                {selectedPerson === person.id && (
                  <CheckCircle className="w-5 h-5 text-primary-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleAssign}
        disabled={!selectedPerson || order.status === OrderStatus.CLOSED}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        确认分派
      </button>
    </div>
  );
}

function MaterialsSection({ order, materials, onUpdated }: { order: any; materials: any[]; onUpdated: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const getQuantity = (materialId: string) => quantities[materialId] || 1;

  const updateQuantity = (materialId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [materialId]: Math.max(1, (prev[materialId] || 1) + delta),
    }));
  };

  const handleAddMaterial = async (material: any) => {
    setLoading(true);
    try {
      await repairOrderApi.addMaterial(order.id, {
        materialId: material.id,
        quantity: getQuantity(material.id),
      });
      onUpdated();
      setQuantities(prev => ({ ...prev, [material.id]: 1 }));
    } catch (error) {
      console.error('添加材料失败', error);
      alert('添加材料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-2">点击添加常用材料到当前派单</p>
      {materials.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">暂无常用材料</p>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{material.name}</p>
                  <p className="text-xs text-gray-500">库存：{material.stock} {material.unit}</p>
                </div>
                <span className="text-sm text-gray-700">¥{material.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => updateQuantity(material.id, -1)}
                    className="p-1.5 text-gray-500 hover:text-gray-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm">{getQuantity(material.id)}</span>
                  <button
                    onClick={() => updateQuantity(material.id, 1)}
                    className="p-1.5 text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => handleAddMaterial(material)}
                  disabled={loading || order.status === OrderStatus.CLOSED}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DelaySection({ order, onUpdated }: { order: any; onUpdated: () => void }) {
  const [reason, setReason] = useState<DelayReason | ''>('');
  const [duration, setDuration] = useState('');
  const [detail, setDetail] = useState('');

  const handleSubmit = async () => {
    if (!reason || !duration || !detail) {
      alert('请填写完整延误信息');
      return;
    }
    try {
      await repairOrderApi.addDelayRecord(order.id, {
        reason: reason as DelayReason,
        detail,
        duration: parseInt(duration),
        reporterId: 'current-user',
      });
      onUpdated();
      setReason('');
      setDuration('');
      setDetail('');
      alert('延误记录已上报');
    } catch (error) {
      console.error('上报延误失败', error);
      alert('上报失败，请重试');
    }
  };

  const reasons = Object.values(DelayReason);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">延误原因</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as DelayReason)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">请选择原因</option>
          {reasons.map((r) => (
            <option key={r} value={r}>{delayReasonLabels[r]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">延误时长（分钟）</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="输入延误分钟数"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">详细说明</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="请详细描述延误情况"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={order.status === OrderStatus.CLOSED}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        <AlertTriangle className="w-4 h-4" />
        上报延误
      </button>
    </div>
  );
}

function SignoffSection({ order, onUpdated }: { order: any; onUpdated: () => void }) {
  const [signature, setSignature] = useState('');
  const [remark, setRemark] = useState('');
  const [signedBy, setSignedBy] = useState('');

  const handleSubmit = async () => {
    if (!signedBy) {
      alert('请填写签收人');
      return;
    }
    try {
      await repairOrderApi.createSignoff(order.id, {
        signature: signature || undefined,
        remark: remark || undefined,
        signedBy,
        photoUrls: [],
      });
      onUpdated();
      alert('签收凭证已创建');
    } catch (error) {
      console.error('创建签收凭证失败', error);
      alert('创建失败，请重试');
    }
  };

  return (
    <div className="space-y-4">
      {order.signoffProof && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">已有签收记录</p>
          <p className="text-xs text-green-600 mt-1">签收人：{order.signoffProof.signedBy}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">客户签名</label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="输入客户姓名"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">签收人</label>
        <input
          type="text"
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
          placeholder="输入维修人员姓名"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="签收备注信息"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={2}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={order.status === OrderStatus.CLOSED}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        <FileCheck className="w-4 h-4" />
        创建签收凭证
      </button>
    </div>
  );
}

function TagsSection({ order, onUpdated }: { order: any; onUpdated: () => void }) {
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>(order.reviewTags || []);

  const tags = Object.values(ReviewTag);

  const toggleTag = (tag: ReviewTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    try {
      await repairOrderApi.updateReviewTags(order.id, selectedTags);
      onUpdated();
      alert('复盘标签已保存');
    } catch (error) {
      console.error('保存标签失败', error);
      alert('保存失败，请重试');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">选择复盘标签，用于后续统计分析</p>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedTags.includes(tag)
                ? reviewTagColors[tag]
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {reviewTagLabels[tag]}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        <Tag className="w-4 h-4" />
        保存标签
      </button>
    </div>
  );
}

function getValidTransitions(current: OrderStatus): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CREATED]: [OrderStatus.ASSIGNED],
    [OrderStatus.ASSIGNED]: [OrderStatus.IN_PROGRESS],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.PENDING_SUPPLEMENT, OrderStatus.UNDER_REVIEW],
    [OrderStatus.COMPLETED]: [OrderStatus.CLOSED, OrderStatus.UNDER_REVIEW, OrderStatus.PENDING_SUPPLEMENT],
    [OrderStatus.PENDING_SUPPLEMENT]: [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED],
    [OrderStatus.UNDER_REVIEW]: [OrderStatus.COMPLETED, OrderStatus.PENDING_SUPPLEMENT, OrderStatus.CLOSED],
    [OrderStatus.CLOSED]: [],
  };
  return transitions[current] || [];
}
