import React, { useState, useEffect } from 'react';
import { partApi } from '@/api/partApi';
import type { Part, RiskLevel } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface PartFormData {
  partNumber: string;
  name: string;
  brand?: string;
  specification?: string;
  category?: string;
  unitPrice: number;
  quantityInStock: number;
  reservedQuantity: number;
  reorderLevel: number;
}

const emptyForm: PartFormData = {
  partNumber: '',
  name: '',
  brand: '',
  specification: '',
  category: '',
  unitPrice: 0,
  quantityInStock: 0,
  reservedQuantity: 0,
  reorderLevel: 0,
};

const Parts: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState<PartFormData>(emptyForm);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const params: { category?: string; lowStockOnly?: boolean } = {};
      if (category) params.category = category;
      if (lowStockOnly) params.lowStockOnly = true;
      const res = await partApi.getParts(params);
      setParts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [category, lowStockOnly]);

  useEffect(() => {
    const fetchAll = async () => {
      const res = await partApi.getParts();
      const cats = new Set((res.data || []).map((p: Part) => p.category).filter(Boolean));
      setCategories(Array.from(cats) as string[]);
    };
    fetchAll();
  }, []);

  const handleAdd = () => {
    setEditingPart(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      brand: part.brand,
      specification: part.specification,
      category: part.category,
      unitPrice: part.unitPrice,
      quantityInStock: part.quantityInStock,
      reservedQuantity: part.reservedQuantity,
      reorderLevel: part.reorderLevel,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定删除此配件？')) {
      await partApi.deletePart(id);
      fetchParts();
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPart) {
        await partApi.updatePart(editingPart.id, formData);
      } else {
        await partApi.createPart(formData);
      }
      setShowModal(false);
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">配件库存</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">分类：</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded"
            />
            仅显示低库存
          </label>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 添加配件
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {parts.length === 0 ? (
          <EmptyState description="暂无配件记录" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配件编号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品牌</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">在库</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预留</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">可用</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险等级</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.partNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.brand || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.specification || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{part.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.quantityInStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.reservedQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.availableQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={part.riskLevel} type="risk" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">查看</button>
                      <button onClick={() => handleEdit(part)} className="text-green-600 hover:text-green-800">编辑</button>
                      <button onClick={() => handleDelete(part.id)} className="text-red-600 hover:text-red-800">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title={editingPart ? '编辑配件' : '新增配件'}
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配件编号 *</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">规格</label>
            <input
              type="text"
              value={formData.specification}
              onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">单价 *</label>
            <input
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">在库数量 *</label>
            <input
              type="number"
              value={formData.quantityInStock}
              onChange={(e) => setFormData({ ...formData, quantityInStock: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预留数量</label>
            <input
              type="number"
              value={formData.reservedQuantity}
              onChange={(e) => setFormData({ ...formData, reservedQuantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">补货预警数量</label>
            <input
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Parts;
