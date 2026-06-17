import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { repairOrderApi, routePlanApi } from '../services/api';
import {
  statusLabels,
  statusColors,
  delayReasonLabels,
  reviewTagLabels,
  reviewTagColors,
  formatDateTime,
} from '../lib/utils';
import { OrderStatus, DelayReason, ReviewTag } from '../types';
import type { RoutePlan } from '../types';
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
  ChevronDown,
  ChevronUp,
  Zap,
  UserCheck,
  Boxes,
  AlertCircle,
  PenLine,
  Tags,
  MapPin,
  Play,
  Flag,
  Trash2,
  Navigation,
} from 'lucide-react';

export default function ProcessPanel() {
  const { selectedOrder, commonMaterials, repairPersons, refreshOrders, fetchOrderDetail } = useAppStore();
  const [showAssign, setShowAssign] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [showSignoff, setShowSignoff] = useState(false);
  const [showTags, setShowTags] = useState(false);

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

  const handleRefresh = async () => {
    await Promise.all([refreshOrders(), fetchOrderDetail(selectedOrder.id)]);
  };

  const routes = selectedOrder.routePlans || [];
  const hasRoutes = routes.length > 0;
  const isCreated = selectedOrder.status === OrderStatus.CREATED;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 顶部头部 - 当前状态 */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-gray-50 to-slate-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-500" />
            处理工作台
          </h2>
          <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${statusColors[selectedOrder.status]}`}>
            {statusLabels[selectedOrder.status]}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          单号：{selectedOrder.orderNo} · 故障：{selectedOrder.faultType}
        </p>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {/* 核心处理区标题 */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-5 bg-gradient-to-b from-primary-500 to-primary-300 rounded-full" />
          <h3 className="text-sm font-bold text-gray-800">核心处理</h3>
          <span className="text-[10px] text-gray-400">状态流转 & 材料使用</span>
        </div>

        {/* 状态流转操作 - 始终可见 */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-3.5 border border-blue-100 shadow-sm">
          <StatusActions order={selectedOrder} onUpdated={handleRefresh} />
        </div>

        {/* 常用材料 - 始终可见，与状态操作同区域 */}
        <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-xl p-3.5 border border-amber-100 shadow-sm">
          <MaterialsSection order={selectedOrder} materials={commonMaterials} onUpdated={handleRefresh} />
        </div>

        {/* 折叠区标题 */}
        <div className="flex items-center gap-2 px-1 pt-2">
          <div className="w-1 h-5 bg-gradient-to-b from-gray-400 to-gray-200 rounded-full" />
          <h3 className="text-sm font-bold text-gray-800">辅助操作</h3>
          <span className="text-[10px] text-gray-400">点击展开</span>
        </div>

        {/* 人员分派（可折叠）- CREATED 状态高亮 */}
        <CollapsibleCard
          title="人员分派"
          desc="分配维修人员"
          icon={UserCheck}
          iconColor="text-purple-600"
          badgeBg="bg-purple-100"
          isOpen={showAssign}
          onToggle={() => setShowAssign(!showAssign)}
          highlight={isCreated || !selectedOrder.assignPerson}
          badge={selectedOrder.assignPerson ? '已分派' : '待分派'}
        >
          <AssignSection
            order={selectedOrder}
            persons={repairPersons}
            onAssigned={handleRefresh}
            onDone={() => setShowAssign(false)}
          />
        </CollapsibleCard>

        {/* 路线计划（可折叠）- 新功能 */}
        <CollapsibleCard
          title="路线计划"
          desc="新增及路线状态管理"
          icon={Navigation}
          iconColor="text-blue-600"
          badgeBg="bg-blue-100"
          isOpen={showRoutes}
          onToggle={() => setShowRoutes(!showRoutes)}
          badge={hasRoutes ? `${routes.length}条` : '未规划'}
        >
          <RoutePlansSection
            order={selectedOrder}
            routes={routes}
            onUpdated={handleRefresh}
          />
        </CollapsibleCard>

        {/* 延误上报（可折叠） */}
        <CollapsibleCard
          title="延误上报"
          desc="记录延误情况"
          icon={AlertCircle}
          iconColor="text-red-600"
          badgeBg="bg-red-100"
          isOpen={showDelay}
          onToggle={() => setShowDelay(!showDelay)}
          badge={selectedOrder.delayRecords?.length > 0 ? `${selectedOrder.delayRecords.length}条` : undefined}
        >
          <DelaySection
            order={selectedOrder}
            routes={routes}
            onUpdated={handleRefresh}
            onDone={() => setShowDelay(false)}
          />
        </CollapsibleCard>

        {/* 签收凭证（可折叠） */}
        <CollapsibleCard
          title="签收凭证"
          desc="创建客户签收"
          icon={PenLine}
          iconColor="text-green-600"
          badgeBg="bg-green-100"
          isOpen={showSignoff}
          onToggle={() => setShowSignoff(!showSignoff)}
          badge={selectedOrder.signoffProof ? '已完成' : '待处理'}
          highlight={!!selectedOrder.signoffProof}
        >
          <SignoffSection
            order={selectedOrder}
            onUpdated={handleRefresh}
            onDone={() => setShowSignoff(false)}
          />
        </CollapsibleCard>

        {/* 复盘标签（可折叠） */}
        <CollapsibleCard
          title="复盘标签"
          desc="标记复盘结论"
          icon={Tags}
          iconColor="text-indigo-600"
          badgeBg="bg-indigo-100"
          isOpen={showTags}
          onToggle={() => setShowTags(!showTags)}
          badge={selectedOrder.reviewTags?.length > 0 ? `${selectedOrder.reviewTags.length}个` : undefined}
        >
          <TagsSection
            order={selectedOrder}
            onUpdated={handleRefresh}
            onDone={() => setShowTags(false)}
          />
        </CollapsibleCard>

        {/* 底部空白 */}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ========================================================= */
/*  可折叠卡片组件                                            */
/* ========================================================= */
function CollapsibleCard({
  title,
  desc,
  icon: Icon,
  iconColor,
  badgeBg,
  isOpen,
  onToggle,
  children,
  badge,
  highlight,
}: {
  title: string;
  desc: string;
  icon: any;
  iconColor: string;
  badgeBg: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      highlight ? 'ring-2 ring-primary-200 border-primary-200' : 'border-gray-100'
    }`}>
      <button
        onClick={onToggle}
        className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 transition-colors ${
          isOpen ? 'bg-gray-50 border-b border-gray-100' : 'hover:bg-gray-50'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg ${badgeBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-800">{title}</span>
            {highlight && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary-100 text-primary-700">
                重要
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">{desc}</p>
        </div>
        {badge && (
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${badgeBg} text-gray-700`}>
            {badge}
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="p-3.5 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/*  状态流转操作组件（始终可见）                               */
/* ========================================================= */
function StatusActions({ order, onUpdated }: { order: any; onUpdated: () => void }) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const validTransitions = getValidTransitions(order.status);

  const statusButtons = [
    { status: OrderStatus.IN_PROGRESS, label: '开始处理', icon: Wrench, color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' },
    { status: OrderStatus.COMPLETED, label: '完成维修', icon: CheckCircle, color: 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700' },
    { status: OrderStatus.PENDING_SUPPLEMENT, label: '待补料', icon: Package, color: 'from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700' },
    { status: OrderStatus.UNDER_REVIEW, label: '提交复核', icon: FileCheck, color: 'from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700' },
    { status: OrderStatus.CLOSED, label: '关闭单据', icon: X, color: 'from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800' },
  ];

  const availableButtons = statusButtons.filter(btn => validTransitions.includes(btn.status));

  const handleClick = async (status: OrderStatus) => {
    setLoading(true);
    try {
      await repairOrderApi.updateStatus(order.id, {
        status,
        remark: remark || undefined,
        operatorId: 'current-user',
      });
      setRemark('');
      await onUpdated();
    } catch (error: any) {
      console.error('状态更新失败', error);
      alert(error?.response?.data?.message || '状态更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isCreated = order.status === OrderStatus.CREATED;

  return (
    <div className="space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-bold text-gray-800">状态流转</span>
        <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
          {isCreated ? '请先分派人员' : `${availableButtons.length}个可操作`}
        </span>
      </div>

      {/* CREATED 状态提示 */}
      {isCreated && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-2">
            <UserPlus className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-purple-700">待分派状态</p>
              <p className="text-[11px] text-purple-600 mt-0.5">
                请在下方「人员分派」中选择维修人员后完成分派
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 备注输入 */}
      {!isCreated && (
        <div>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="操作备注（可选，记录本次操作的说明）"
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none bg-white/80"
            rows={2}
          />
        </div>
      )}

      {/* 操作按钮 */}
      {order.status === OrderStatus.CLOSED ? (
        <div className="p-3 bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg text-center border border-slate-200">
          <p className="text-sm font-medium text-slate-600">✓ 单据已关闭</p>
          <p className="text-[11px] text-slate-400 mt-1">可在历史记录中查看详情</p>
        </div>
      ) : availableButtons.length === 0 && !isCreated ? (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-400">当前状态无可操作项</p>
        </div>
      ) : !isCreated ? (
        <div className="grid grid-cols-2 gap-2">
          {availableButtons.map((btn) => (
            <button
              key={btn.status}
              onClick={() => handleClick(btn.status)}
              disabled={loading}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-white text-xs font-bold rounded-lg shadow-md transition-all bg-gradient-to-r ${btn.color} active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <btn.icon className="w-4 h-4" />
              {btn.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ========================================================= */
/*  常用材料组件（始终可见）                                   */
/* ========================================================= */
function MaterialsSection({ order, materials, onUpdated }: { order: any; materials: any[]; onUpdated: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getQuantity = (materialId: string) => quantities[materialId] || 1;

  const updateQuantity = (materialId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [materialId]: Math.max(1, (prev[materialId] || 1) + delta),
    }));
  };

  const handleAddMaterial = async (material: any) => {
    setLoadingId(material.id);
    try {
      await repairOrderApi.addMaterial(order.id, {
        materialId: material.id,
        quantity: getQuantity(material.id),
      });
      setQuantities(prev => ({ ...prev, [material.id]: 1 }));
      await onUpdated();
    } catch (error) {
      console.error('添加材料失败', error);
      alert('添加材料失败，请重试');
    } finally {
      setLoadingId(null);
    }
  };

  const disabled = order.status === OrderStatus.CLOSED;

  return (
    <div className="space-y-2.5">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-gray-800">常用材料</span>
          <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
            即时添加
          </span>
        </div>
        <span className="text-[10px] text-gray-400">共 {materials.length} 种</span>
      </div>

      {disabled ? (
        <p className="text-xs text-center text-gray-400 py-3 bg-gray-50 rounded-lg">单据已关闭，不可添加材料</p>
      ) : materials.length === 0 ? (
        <p className="text-xs text-center text-gray-400 py-3 bg-gray-50 rounded-lg">暂无常用材料</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-0.5">
          {materials.map((material) => (
            <div
              key={material.id}
              className="p-2.5 bg-gradient-to-r from-white to-amber-50/50 rounded-lg border border-amber-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-semibold text-gray-800 truncate">{material.name}</p>
                  <p className="text-[10px] text-gray-400">
                    库存 {material.stock}{material.unit} · 单价 <span className="text-amber-700 font-bold">¥{material.price}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center border border-amber-200 rounded-md bg-white overflow-hidden">
                  <button
                    onClick={() => updateQuantity(material.id, -1)}
                    disabled={loadingId === material.id}
                    className="w-6 h-6 flex items-center justify-center text-amber-600 hover:bg-amber-50 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-gray-700 tabular-nums">
                    {getQuantity(material.id)}
                  </span>
                  <button
                    onClick={() => updateQuantity(material.id, 1)}
                    disabled={loadingId === material.id}
                    className="w-6 h-6 flex items-center justify-center text-amber-600 hover:bg-amber-50 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => handleAddMaterial(material)}
                  disabled={loadingId === material.id || disabled}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[11px] font-bold rounded-md shadow-sm hover:from-amber-600 hover:to-yellow-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingId === material.id ? (
                    <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      添加
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/*  路线计划操作面板（新功能）                                 */
/* ========================================================= */
function RoutePlansSection({ order, routes, onUpdated }: { order: any; routes: RoutePlan[]; onUpdated: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fromLocation: '',
    toLocation: '',
    planDeparture: '',
    planArrival: '',
    distanceKm: '1.0',
  });

  const handleCreate = async () => {
    if (!form.fromLocation || !form.toLocation || !form.planDeparture || !form.planArrival) {
      alert('请填写完整路线信息');
      return;
    }
    setLoading(true);
    try {
      await routePlanApi.create(order.id, {
        fromLocation: form.fromLocation,
        toLocation: form.toLocation,
        planDeparture: new Date(form.planDeparture).toISOString(),
        planArrival: new Date(form.planArrival).toISOString(),
        distanceKm: parseFloat(form.distanceKm) || 1.0,
      });
      setForm({
        fromLocation: '',
        toLocation: '',
        planDeparture: '',
        planArrival: '',
        distanceKm: '1.0',
      });
      setShowForm(false);
      await onUpdated();
    } catch (error: any) {
      console.error('创建路线失败', error);
      alert(error?.response?.data?.message || '创建路线失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (routeId: string) => {
    setActionLoadingId(routeId);
    try {
      await routePlanApi.start(routeId);
      await onUpdated();
    } catch (error: any) {
      console.error('开始路线失败', error);
      alert(error?.response?.data?.message || '开始路线失败');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArrive = async (routeId: string) => {
    setActionLoadingId(routeId);
    try {
      await routePlanApi.arrive(routeId);
      await onUpdated();
    } catch (error: any) {
      console.error('抵达失败', error);
      alert(error?.response?.data?.message || '抵达失败');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm('确定删除这条路线计划吗？')) return;
    setActionLoadingId(routeId);
    try {
      await routePlanApi.remove(routeId);
      await onUpdated();
    } catch (error: any) {
      console.error('删除路线失败', error);
      alert(error?.response?.data?.message || '删除失败');
    } finally {
      setActionLoadingId(null);
    }
  };

  const disabled = order.status === OrderStatus.CLOSED;
  const sortedRoutes = [...routes].sort((a, b) => a.sequence - b.sequence);

  const getRouteStatusInfo = (status: string) => {
    switch (status) {
      case 'PLANNED': return { label: '计划中', color: 'bg-gray-100 text-gray-600' };
      case 'IN_PROGRESS': return { label: '进行中', color: 'bg-blue-100 text-blue-700' };
      case 'COMPLETED': return { label: '已完成', color: 'bg-green-100 text-green-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="space-y-3">
      {/* 路线列表 */}
      {sortedRoutes.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs">暂无路线计划</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-0.5">
          {sortedRoutes.map((route) => {
            const statusInfo = getRouteStatusInfo(route.status);
            const isLoading = actionLoadingId === route.id;
            return (
              <div key={route.id} className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {route.sequence}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{route.distanceKm.toFixed(1)} km</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-gray-500">{route.fromLocation}</span>
                  <ChevronDown className="w-3 h-3 text-gray-300 flex-shrink-0 rotate-[-90deg]" />
                  <span className="truncate font-semibold text-gray-800">{route.toLocation}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2.5">
                  <div className="bg-white/70 rounded px-2 py-1">
                    <p className="text-gray-400">计划出发</p>
                    <p className="text-gray-700 font-medium">{formatDateTime(route.planDeparture).slice(5, 16)}</p>
                  </div>
                  <div className="bg-white/70 rounded px-2 py-1">
                    <p className="text-gray-400">计划到达</p>
                    <p className="text-gray-700 font-medium">{formatDateTime(route.planArrival).slice(5, 16)}</p>
                  </div>
                  <div className="bg-white/70 rounded px-2 py-1">
                    <p className="text-gray-400">实际出发</p>
                    <p className={route.actualDeparture ? 'text-blue-600 font-medium' : 'text-gray-300'}>
                      {route.actualDeparture ? formatDateTime(route.actualDeparture).slice(5, 16) : '-'}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded px-2 py-1">
                    <p className="text-gray-400">实际到达</p>
                    <p className={route.actualArrival ? 'text-green-600 font-medium' : 'text-gray-300'}>
                      {route.actualArrival ? formatDateTime(route.actualArrival).slice(5, 16) : '-'}
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1.5">
                  {route.status === 'PLANNED' && (
                    <button
                      onClick={() => handleStart(route.id)}
                      disabled={isLoading || disabled}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold rounded-md hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      开始出发
                    </button>
                  )}
                  {route.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleArrive(route.id)}
                      disabled={isLoading || disabled}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] font-bold rounded-md hover:from-emerald-600 hover:to-green-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Flag className="w-3 h-3" />
                      确认抵达
                    </button>
                  )}
                  {route.status === 'COMPLETED' && (
                    <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">
                      <CheckCircle className="w-3 h-3" />
                      已完成
                    </div>
                  )}
                  {route.status !== 'COMPLETED' && !disabled && (
                    <button
                      onClick={() => handleDelete(route.id)}
                      disabled={isLoading}
                      className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="删除路线"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新增路线表单 */}
      {!disabled && (
        showForm ? (
          <div className="space-y-2.5 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-800">新增路线计划</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">出发地</label>
                <input
                  type="text"
                  value={form.fromLocation}
                  onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                  placeholder="如：维修站"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">目的地</label>
                <input
                  type="text"
                  value={form.toLocation}
                  onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                  placeholder="如：A栋302"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">计划出发</label>
                <input
                  type="datetime-local"
                  value={form.planDeparture}
                  onChange={(e) => setForm({ ...form, planDeparture: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">计划到达</label>
                <input
                  type="datetime-local"
                  value={form.planArrival}
                  onChange={(e) => setForm({ ...form, planArrival: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">距离（公里）</label>
              <input
                type="number"
                step="0.1"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-3 py-2 text-gray-600 text-xs font-medium bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-md hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                创建路线
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-dashed border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增路线计划
          </button>
        )
      )}
    </div>
  );
}

/* ========================================================= */
/*  分派组件（可折叠内）                                       */
/* ========================================================= */
function AssignSection({ order, persons, onAssigned, onDone }: { order: any; persons: any[]; onAssigned: () => void; onDone: () => void }) {
  const [selectedPerson, setSelectedPerson] = useState(order.assignPersonId || '');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedPerson) {
      alert('请选择维修人员');
      return;
    }
    setLoading(true);
    try {
      await repairOrderApi.assign(order.id, {
        assignPersonId: selectedPerson,
      });
      await onAssigned();
      onDone();
    } catch (error: any) {
      console.error('分派失败', error);
      alert(error?.response?.data?.message || '分派失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const disabled = order.status === OrderStatus.CLOSED;
  const isCreated = order.status === OrderStatus.CREATED;

  return (
    <div className="space-y-3">
      {isCreated && (
        <div className="p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <p className="text-[11px] font-semibold text-purple-700">
            👆 请先选择维修人员，再点击确认分派
          </p>
        </div>
      )}
      {!isCreated && order.assignPerson && (
        <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
          <p className="text-[11px] text-green-700">
            当前负责人：<span className="font-bold">{order.assignPerson.name}</span>
          </p>
          <p className="text-[10px] text-green-600 mt-0.5">可重新选择其他人进行改派</p>
        </div>
      )}
      <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-0.5">
        {persons.map((person) => (
          <div
            key={person.id}
            onClick={() => !disabled && setSelectedPerson(person.id)}
            className={`p-2.5 border rounded-lg cursor-pointer transition-all ${
              selectedPerson === person.id
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedPerson === person.id ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {person.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900">{person.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{person.skill}</p>
              </div>
              {selectedPerson === person.id && (
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAssign}
        disabled={!selectedPerson || disabled || loading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {isCreated ? '确认分派' : '改派人员'}
      </button>
    </div>
  );
}

/* ========================================================= */
/*  延误组件（可折叠内） - 支持选择路线                         */
/* ========================================================= */
function DelaySection({ order, routes, onUpdated, onDone }: { order: any; routes: RoutePlan[]; onUpdated: () => void; onDone: () => void }) {
  const [reason, setReason] = useState<DelayReason | ''>('');
  const [duration, setDuration] = useState('');
  const [detail, setDetail] = useState('');
  const [routeId, setRouteId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !duration || !detail) {
      alert('请填写完整延误信息');
      return;
    }
    setLoading(true);
    try {
      await repairOrderApi.addDelayRecord(order.id, {
        reason: reason as DelayReason,
        detail,
        duration: parseInt(duration),
        reporterId: 'current-user',
        routeId: routeId || undefined,
      });
      setReason('');
      setDuration('');
      setDetail('');
      setRouteId('');
      await onUpdated();
      onDone();
    } catch (error: any) {
      console.error('上报延误失败', error);
      alert(error?.response?.data?.message || '上报失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const reasons = Object.values(DelayReason);
  const disabled = order.status === OrderStatus.CLOSED;
  const sortedRoutes = [...routes].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="space-y-2.5">
      {/* 选择关联路线 */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          关联路线 <span className="text-gray-400 font-normal">（可选，指定是哪条路线延误）</span>
        </label>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:bg-gray-50"
        >
          <option value="">不指定（单据级延误）</option>
          {sortedRoutes.map((route) => (
            <option key={route.id} value={route.id}>
              路线{route.sequence}：{route.fromLocation} → {route.toLocation}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">延误原因 *</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as DelayReason)}
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:bg-gray-50"
        >
          <option value="">请选择原因</option>
          {reasons.map((r) => (
            <option key={r} value={r}>{delayReasonLabels[r]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">延误时长（分钟）*</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="例如：30"
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">详细说明 *</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="请详细描述延误情况，便于后续复盘"
          rows={3}
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none disabled:bg-gray-50"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-lg shadow-md hover:from-red-600 hover:to-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        确认上报延误
      </button>
    </div>
  );
}

/* ========================================================= */
/*  签收组件（可折叠内）                                       */
/* ========================================================= */
function SignoffSection({ order, onUpdated, onDone }: { order: any; onUpdated: () => void; onDone: () => void }) {
  const [signature, setSignature] = useState(order.signoffProof?.signature || '');
  const [remark, setRemark] = useState(order.signoffProof?.remark || '');
  const [signedBy, setSignedBy] = useState(order.signoffProof?.signedBy || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!signedBy) {
      alert('请填写签收人');
      return;
    }
    setLoading(true);
    try {
      await repairOrderApi.createSignoff(order.id, {
        signature: signature || undefined,
        remark: remark || undefined,
        signedBy,
        photoUrls: [],
      });
      await onUpdated();
      onDone();
    } catch (error: any) {
      console.error('创建签收凭证失败', error);
      alert(error?.response?.data?.message || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const disabled = order.status === OrderStatus.CLOSED;

  return (
    <div className="space-y-2.5">
      {order.signoffProof && (
        <div className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <p className="text-xs font-bold text-green-700">✓ 已有签收记录</p>
          <p className="text-[10px] text-green-600 mt-0.5">签收人：{order.signoffProof.signedBy} · 可修改更新</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">客户签名</label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="输入客户姓名"
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">签收人 *</label>
        <input
          type="text"
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
          placeholder="执行签收的维修人员"
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">备注</label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="客户反馈、现场情况等"
          rows={2}
          disabled={disabled}
          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none disabled:bg-gray-50"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold rounded-lg shadow-md hover:from-emerald-600 hover:to-green-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <FileCheck className="w-4 h-4" />
        )}
        {order.signoffProof ? '更新签收凭证' : '创建签收凭证'}
      </button>
    </div>
  );
}

/* ========================================================= */
/*  复盘标签组件（可折叠内）                                   */
/* ========================================================= */
function TagsSection({ order, onUpdated, onDone }: { order: any; onUpdated: () => void; onDone: () => void }) {
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>(order.reviewTags || []);
  const [loading, setLoading] = useState(false);

  const tags = Object.values(ReviewTag);

  const toggleTag = (tag: ReviewTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await repairOrderApi.updateReviewTags(order.id, selectedTags);
      await onUpdated();
      onDone();
    } catch (error: any) {
      console.error('保存标签失败', error);
      alert(error?.response?.data?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">点击标签进行勾选/取消，用于后续统计分析</p>
      
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                isSelected
                  ? `${reviewTagColors[tag]} shadow-sm ring-1 ring-gray-900/5`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              {isSelected && '✓ '}
              {reviewTagLabels[tag]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-gray-400">
          已选 {selectedTags.length} 个标签
        </span>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-lg shadow-md hover:from-indigo-600 hover:to-violet-700 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Tag className="w-4 h-4" />
        )}
        保存复盘标签
      </button>
    </div>
  );
}

/* ========================================================= */
/*  状态流转校验逻辑                                           */
/* ========================================================= */
function getValidTransitions(current: OrderStatus): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CREATED]: [],
    [OrderStatus.ASSIGNED]: [OrderStatus.IN_PROGRESS, OrderStatus.CREATED],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.PENDING_SUPPLEMENT, OrderStatus.UNDER_REVIEW],
    [OrderStatus.COMPLETED]: [OrderStatus.CLOSED, OrderStatus.UNDER_REVIEW, OrderStatus.PENDING_SUPPLEMENT],
    [OrderStatus.PENDING_SUPPLEMENT]: [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED],
    [OrderStatus.UNDER_REVIEW]: [OrderStatus.COMPLETED, OrderStatus.PENDING_SUPPLEMENT, OrderStatus.CLOSED],
    [OrderStatus.CLOSED]: [],
  };
  return transitions[current] || [];
}
