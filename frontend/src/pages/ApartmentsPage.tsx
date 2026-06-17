import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit3,
  Phone,
  MapPin,
  Ruler,
  KeyRound,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import type { Apartment } from '@/types';
import { apartmentsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils/format';

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const hasRole = useAuthStore((s) => s.hasRole);
  const [form, setForm] = useState({
    apartment_code: '',
    building: '',
    unit: '',
    room_number: '',
    floor: '' as string | number,
    area_sqm: '' as string | number,
    apartment_type: '',
    resident_name: '',
    resident_phone: '',
    door_lock_info: '',
    special_instructions: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apartmentsApi.list({
        search: search || undefined,
        building: buildingFilter || undefined,
      });
      setApartments(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, buildingFilter]);

  const buildings = Array.from(new Set(apartments.map((a) => a.building)));

  const handleCreate = () => {
    setEditingApt(null);
    setForm({
      apartment_code: '',
      building: '',
      unit: '',
      room_number: '',
      floor: '',
      area_sqm: '',
      apartment_type: '',
      resident_name: '',
      resident_phone: '',
      door_lock_info: '',
      special_instructions: '',
    });
    setShowModal(true);
  };

  const handleEdit = (apt: Apartment) => {
    setEditingApt(apt);
    setForm({
      apartment_code: apt.apartment_code,
      building: apt.building,
      unit: apt.unit,
      room_number: apt.room_number || '',
      floor: apt.floor || '',
      area_sqm: apt.area_sqm || '',
      apartment_type: apt.apartment_type || '',
      resident_name: apt.resident_name || '',
      resident_phone: apt.resident_phone || '',
      door_lock_info: apt.door_lock_info || '',
      special_instructions: apt.special_instructions || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingApt) {
        await apartmentsApi.update(editingApt.id, {
          building: form.building,
          unit: form.unit,
          room_number: form.room_number || undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined,
          apartment_type: form.apartment_type || undefined,
          resident_name: form.resident_name || undefined,
          resident_phone: form.resident_phone || undefined,
          door_lock_info: form.door_lock_info || undefined,
          special_instructions: form.special_instructions || undefined,
        });
      } else {
        await apartmentsApi.create({
          ...form,
          floor: form.floor ? Number(form.floor) : undefined,
          area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined,
          apartment_code: form.apartment_code,
          building: form.building,
          unit: form.unit,
          is_active: true,
        });
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || '操作失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={24} />
            公寓管理
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            管理长租公寓房源信息、租客信息和特殊说明
          </p>
        </div>
        {hasRole('admin', 'supervisor') && (
          <button onClick={handleCreate} className="btn-primary gap-2 self-start">
            <Plus size={16} />
            新增公寓
          </button>
        )}
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{apartments.length}</div>
              <div className="text-sm text-gray-500">公寓总数</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <Check size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {apartments.filter((a) => a.is_active).length}
              </div>
              <div className="text-sm text-gray-500">在租房源</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{buildings.length}</div>
              <div className="text-sm text-gray-500">楼栋数</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {apartments.filter((a) => a.special_instructions).length}
              </div>
              <div className="text-sm text-gray-500">特殊说明</div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索公寓编号、楼栋、租客..."
            className="input pl-10"
          />
        </div>
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">全部楼栋</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* 公寓卡片 */}
      {loading ? (
        <div className="flex items-center justify-center h-64 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : apartments.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">暂无公寓数据</h3>
          <p className="text-gray-500 text-sm mt-1">请先创建公寓信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apartments.map((apt) => (
            <div key={apt.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{apt.apartment_code}</span>
                    {!apt.is_active && (
                      <span className="badge bg-gray-100 text-gray-600 text-[10px]">空置</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} />
                    {apt.building} {apt.unit} {apt.room_number || ''}
                  </div>
                </div>
                {hasRole('admin', 'supervisor') && (
                  <button
                    onClick={() => handleEdit(apt)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Ruler size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    {apt.apartment_type || '未设置'} · {apt.area_sqm || '?'}㎡
                    {apt.floor ? ` · ${apt.floor}层` : ''}
                  </span>
                </div>
                {apt.resident_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-5">👤</span>
                    <span className="text-gray-600">{apt.resident_name}</span>
                  </div>
                )}
                {apt.resident_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                    <a
                      href={`tel:${apt.resident_phone}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {apt.resident_phone}
                    </a>
                  </div>
                )}
                {apt.door_lock_info && (
                  <div className="flex items-start gap-2 text-sm mt-2 p-2 rounded-lg bg-yellow-50 border border-yellow-100">
                    <KeyRound size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-yellow-800 text-xs">{apt.door_lock_info}</span>
                  </div>
                )}
                {apt.special_instructions && (
                  <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-blue-50 border border-blue-100">
                    <AlertCircle size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-800 text-xs">{apt.special_instructions}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingApt ? '编辑公寓' : '新增公寓'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">公寓编号 *</label>
                  <input
                    type="text"
                    value={form.apartment_code}
                    onChange={(e) => setForm({ ...form, apartment_code: e.target.value })}
                    className="input"
                    disabled={!!editingApt}
                  />
                </div>
                <div>
                  <label className="label">楼栋 *</label>
                  <input
                    type="text"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    className="input"
                    placeholder="如：A栋"
                  />
                </div>
                <div>
                  <label className="label">单元 *</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="input"
                    placeholder="如：1单元"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">房号</label>
                  <input
                    type="text"
                    value={form.room_number}
                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">楼层</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">面积 (㎡)</label>
                  <input
                    type="number"
                    value={form.area_sqm}
                    onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">户型</label>
                <select
                  value={form.apartment_type}
                  onChange={(e) => setForm({ ...form, apartment_type: e.target.value })}
                  className="input"
                >
                  <option value="">请选择</option>
                  <option value="单间">单间</option>
                  <option value="一居室">一居室</option>
                  <option value="两居室">两居室</option>
                  <option value="三居室">三居室</option>
                  <option value="复式">复式</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="text-sm font-medium text-gray-700">租客信息</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">租客姓名</label>
                    <input
                      type="text"
                      value={form.resident_name}
                      onChange={(e) => setForm({ ...form, resident_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">联系电话</label>
                    <input
                      type="tel"
                      value={form.resident_phone}
                      onChange={(e) => setForm({ ...form, resident_phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <KeyRound size={14} />
                  门锁信息
                </label>
                <input
                  type="text"
                  value={form.door_lock_info}
                  onChange={(e) => setForm({ ...form, door_lock_info: e.target.value })}
                  className="input"
                  placeholder="如：密码锁 123456"
                />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <AlertCircle size={14} />
                  特别说明
                </label>
                <textarea
                  value={form.special_instructions}
                  onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                  rows={3}
                  className="input resize-none"
                  placeholder="需要特殊注意的事项，如宠物、易碎品等"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                {editingApt ? '保存修改' : '创建公寓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
