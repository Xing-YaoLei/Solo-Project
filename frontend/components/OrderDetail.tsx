import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import {
  statusLabels,
  statusColors,
  sourceLabels,
  delayReasonLabels,
  reviewTagLabels,
  reviewTagColors,
  formatDateTime,
  formatDuration,
  priorityLabels,
  priorityColors,
} from '../lib/utils';
import type { ReviewTag, DelayReason, OrderStatus } from '../types';
import {
  MapPin,
  Clock,
  AlertTriangle,
  FileCheck,
  Package,
  User,
  Phone,
  Home,
  History,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Wrench,
  UserCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function OrderDetail() {
  const { selectedOrder, fetchOrderDetail } = useAppStore();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetail(selectedOrder.id);
    }
  }, [selectedOrder?.id]);

  if (!selectedOrder) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 items-center justify-center">
        <div className="text-center text-gray-400">
          <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">请选择派单查看详情</p>
          <p className="text-sm mt-2">从左侧列表中选择一个派单</p>
        </div>
      </div>
    );
  }

  const routes = selectedOrder.routePlans || [];
  const delays = selectedOrder.delayRecords || [];
  const signoff = selectedOrder.signoffProof;
  const materials = selectedOrder.materials || [];
  const logs = selectedOrder.statusLogs || [];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 顶部头部 */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900">{selectedOrder.orderNo}</h2>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                {statusLabels[selectedOrder.status]}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[selectedOrder.priority]}`}>
                {priorityLabels[selectedOrder.priority]}
              </span>
              {delays.length > 0 && (
                <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  延误{delays.length}次
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1.5">
              <span className="font-medium text-gray-700">{selectedOrder.faultType}</span>
              <span className="mx-2 text-gray-300">·</span>
              来源：{sourceLabels[selectedOrder.source]}
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>创建：{formatDateTime(selectedOrder.createdAt)}</p>
            {selectedOrder.closeTime && <p className="mt-0.5">关闭：{formatDateTime(selectedOrder.closeTime)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Home className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{selectedOrder.apartmentNo}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{selectedOrder.tenantName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs">{selectedOrder.tenantPhone}</span>
          </div>
        </div>
      </div>

      {/* 可滚动内容区 - 所有信息同屏纵向排列 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* 第一行：故障 + 时间 + 维修人 */}
        <div className="grid grid-cols-5 gap-4">
          {/* 故障描述 */}
          <div className="col-span-2 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-800">故障描述</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{selectedOrder.faultDesc}</p>
          </div>

          {/* 时间计划 */}
          <div className="col-span-2 rounded-xl p-4 border border-gray-100 bg-gradient-to-br">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">时间计划</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 rounded-lg p-2.5">
                <p className="text-xs text-blue-500 mb-1">计划开始</p>
                <p className="font-medium text-blue-700 text-xs">{formatDateTime(selectedOrder.planStartTime)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5">
                <p className="text-xs text-blue-500 mb-1">计划结束</p>
                <p className="font-medium text-blue-700 text-xs">{formatDateTime(selectedOrder.planEndTime)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5">
                <p className="text-xs text-green-500 mb-1">实际开始</p>
                <p className="font-medium text-green-700 text-xs">{formatDateTime(selectedOrder.actualStartTime)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5">
                <p className="text-xs text-green-500 mb-1">实际结束</p>
                <p className="font-medium text-green-700 text-xs">{formatDateTime(selectedOrder.actualEndTime)}</p>
              </div>
            </div>
            {selectedOrder.isOnTime !== null && (
              <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                selectedOrder.isOnTime ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {selectedOrder.isOnTime ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> 准时完成</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> 存在延误</>
                )}
              </div>
            )}
          </div>

          {/* 维修人员 */}
          <div className="rounded-xl p-4 border border-gray-100 bg-gradient-to-br">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-800">负责人</h3>
            </div>
            {selectedOrder.assignPerson ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {selectedOrder.assignPerson.name.charAt(0)}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">{selectedOrder.assignPerson.name}</p>
                <p className="text-xs text-gray-500">{selectedOrder.assignPerson.skill}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                  <User className="w-7 h-7" />
                </div>
                <p className="mt-2 text-xs text-gray-400">尚未分派</p>
              </div>
            )}
          </div>
        </div>

        {/* 第二行：核心三要素同屏 - 路线计划 + 延误记录 + 签收凭证 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 路线计划 */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">路线计划</h3>
                </div>
                <span className="text-xs text-blue-600 font-medium bg-white/70 px-2 py-0.5 rounded">
                  {routes.length} 条
                </span>
              </div>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
              {routes.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">暂无路线</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {routes.map((route: any, index: number) => (
                    <div key={route.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            route.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            route.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {route.status === 'COMPLETED' ? '已完成' :
                             route.status === 'IN_PROGRESS' ? '进行中' : '计划中'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{route.distanceKm.toFixed(1)}km</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <span className="truncate">{route.fromLocation}</span>
                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium text-gray-800">{route.toLocation}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div>
                          <span className="text-gray-400">计划 </span>
                          <span className="text-gray-600">{formatDateTime(route.planDeparture).slice(5, 16)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">实到 </span>
                          <span className={route.actualArrival ? 'text-green-600' : 'text-gray-400'}>
                            {route.actualArrival ? formatDateTime(route.actualArrival).slice(5, 16) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 延误记录 */}
          <div className="rounded-xl border border-red-100 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-800">延误记录</h3>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  delays.length > 0 ? 'bg-red-100 text-red-700' : 'bg-white/70 text-gray-500'
                }`}>
                  {delays.length} 条
                </span>
              </div>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
              {delays.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <p className="text-xs">无延误记录</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {delays.map((delay: { id: string; reason: DelayReason; detail: string; duration: number; reportedAt: string }) => (
                    <div key={delay.id} className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                          {delayReasonLabels[delay.reason]}
                        </span>
                        <span className="text-xs font-bold text-red-600">
                          {formatDuration(delay.duration)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-2">{delay.detail}</p>
                      <p className="text-[10px] text-gray-400">{formatDateTime(delay.reportedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 签收凭证 */}
          <div className="rounded-xl border border-green-100 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">签收凭证</h3>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  signoff ? 'bg-green-100 text-green-700' : 'bg-white/70 text-gray-500'
                }`}>
                  {signoff ? '已签收' : '未签收'}
                </span>
              </div>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
              {!signoff ? (
                <div className="text-center py-6 text-gray-400">
                  <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">暂无签收凭证</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signoff.signature && (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">客户签名</p>
                      <div className="bg-white rounded-lg p-2.5 border border-green-200 text-center">
                        <p className="text-base font-medium text-gray-700">{signoff.signature}</p>
                      </div>
                    </div>
                  )}
                  {signoff.photoUrls && signoff.photoUrls.length > 0 && (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">现场照片 {signoff.photoUrls.length}张</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {signoff.photoUrls.map((url: string, idx: number) => (
                          <div key={idx} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center text-[10px] text-gray-400 border border-gray-200">
                            📷{idx + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {signoff.remark && (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">签收备注</p>
                      <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{signoff.remark}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-0.5">
                    <p>签收人：<span className="font-medium text-gray-700">{signoff.signedBy}</span></p>
                    <p>签收时间：{formatDateTime(signoff.signedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 第三行：使用材料 */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-800">使用材料</h3>
              <span className="text-xs text-amber-700 font-medium bg-white/70 px-2 py-0.5 rounded">
                {materials.length} 项
              </span>
            </div>
          </div>
          <div className="p-3">
            {materials.length === 0 ? (
              <div className="text-center py-3 text-gray-400">
                <p className="text-xs">暂无使用材料记录</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {materials.map((item: any) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.material.name}</p>
                      <p className="text-[11px] text-gray-400">{item.material.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-700">
                        {item.quantity}
                        <span className="text-[11px] font-normal text-gray-500 ml-0.5">{item.material.unit}</span>
                      </p>
                      <p className="text-[11px] text-gray-400">¥{item.material.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 复盘标签 & 状态历史（可展开） */}
        {selectedOrder.reviewTags && selectedOrder.reviewTags.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap px-4 py-3 bg-purple-50/50 rounded-xl border border-purple-100">
            <span className="text-xs font-medium text-purple-700">复盘标签：</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedOrder.reviewTags.map((tag: ReviewTag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${reviewTagColors[tag]}`}
                >
                  {reviewTagLabels[tag]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 状态历史（可折叠） */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center justify-between hover:from-gray-100 hover:to-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-800">状态历史</h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                {logs.length} 条
              </span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {showHistory && (
            <div className="p-4 bg-white max-h-72 overflow-y-auto scrollbar-thin">
              {logs.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-4">暂无状态记录</p>
              ) : (
                <div className="relative pl-3">
                  <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-gray-200" />
                  {logs.map((log: { id: string; fromStatus: OrderStatus; toStatus: OrderStatus; remark: string | null; createdAt: string }, index: number) => (
                    <div key={log.id} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        index === 0 ? 'bg-primary-500 ring-2 ring-primary-100' : 'bg-gray-300'
                      }`} />
                      <div className="ml-4 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`px-1.5 py-0.5 text-[11px] rounded ${statusColors[log.fromStatus]}`}>
                            {statusLabels[log.fromStatus]}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                          <span className={`px-1.5 py-0.5 text-[11px] rounded font-medium ${statusColors[log.toStatus]}`}>
                            {statusLabels[log.toStatus]}
                          </span>
                        </div>
                        {log.remark && <p className="text-xs text-gray-600">{log.remark}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedOrder.closeRemark && (
          <div className="rounded-xl p-4 bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">关闭备注</h3>
            </div>
            <p className="text-sm text-gray-600">{selectedOrder.closeRemark}</p>
          </div>
        )}
      </div>
    </div>
  );
}
